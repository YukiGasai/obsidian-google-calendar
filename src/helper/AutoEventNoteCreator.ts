import type { GoogleEvent } from "../helper/types";

import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { listEvents } from "../googleApi/GoogleListEvents";
import { normalizePath, Pos, TFile } from "obsidian";
import { createNotice } from "./NoticeHelper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import _ from "lodash";
import { findEventNote, sanitizeFileName } from "./Helper";

/**
 * This function implements the automatic creation of notes from a google calendar event
 * 
 * How it works:
 * If a google calendar events description contains :obsidian: a new note for this event is created
 * To also set a template for the file the text can be expanded with the template name :obsidian:TemplateName:
 * 
 * This feature can be toggled in the settings the import time range can be changed in the settings
 * 
 *  This function is called once the obsidian plugin is loaded
 * 
 * 
 * @param plugin Reference to the main plugin to access the settings
 */
export const checkForEventNotes = async (plugin: GoogleCalendarPlugin): Promise<void> => {

    //Don't run if disabled in the settings
    if (!plugin.settings.autoCreateEventNotes || !settingsAreCompleteAndLoggedIn()) {
        return;
    }

    //get the import time range from the settings
    const startOffset = Math.abs(plugin.settings.importStartOffset);
    const endOffset = Math.abs(plugin.settings.importEndOffset);

    const startDate = window.moment().local().subtract(startOffset, "day")
    const endDate = window.moment().local().add(endOffset, "day")

    //get all events in the import time range
    let events = await listEvents({ startDate, endDate });

    // Don't allow multi day events to be created automatically
    events = events.filter(event => event.eventType !== "multiDay")

    // check every event from the trigger text :obsidian:
    for (let i = 0; i < events.length; i++) {
        // Create a event note for all events if the trigger text is empty
        if (plugin.settings.autoCreateEventNotesMarker === "") {
            await createNoteFromEvent(events[i], plugin.settings.defaultFolder, plugin.settings.defaultTemplate, true)
        } else {

            const regex = new RegExp(`:([^:]*-)?${plugin.settings.autoCreateEventNotesMarker}-?([^:]*)?:`)

            //regex will check for text and extract a template name if it exists
            const match = events[i].description?.match(regex) ?? [];
            if (match.length == 3) {
                //the trigger text was found and a new note will be created
                await createNoteFromEvent(events[i], match[1], match[2], true)
            }
        }
    }
}

const insertEventIdInFrontmatter = (event: GoogleEvent, fileContent: string): string => {
    // If event id is already set do nothing
    if (fileContent.contains("event-id:")) {
        return fileContent;
    }

    // Frontmatter exists but no event-id so we add it
    if(fileContent.startsWith("---")) {
        return fileContent.replace("---", `---\nevent-id: ${event.id}`);
    }

    // Trying to handle templater insertions with frontmatter using something like this <% "---" %>
    fileContent.contains("---");
    const templaterRegex = /(<%[^%]*)---([^%]*%>)/
    const newFileContent = fileContent.replace(templaterRegex, "$1---$2\nevent-id: " + event.id)
    if(newFileContent !== fileContent) {
        return newFileContent;
    }

    //No frontmatter so we add it
    return `---\nevent-id: ${event.id}\n---\n${fileContent}`;
}

const injectEventDetails = (event: GoogleEvent, inputText: string): string => {
    const regexp = /{{gEvent\.([^}>]*)}}/gm;
    let matches;
    const output = [];
    do {
        matches = regexp.exec(inputText);
        output.push(matches);
    } while (matches);

    output.forEach(match => {
        if (match) {
            let newContent = "";

            if (match[1] == "attendees") {
                const array = _.get(event, match[1], "");
                for (let i = 0; i < array.length; i++) {
                    if (array[i].displayName) {
                        newContent += `- [[@${array[i].displayName}]]\n`;
                    } else {
                        newContent += `- [[@${array[i].email}]]\n`;
                    }
                }
            } else if (match[1] == "attachments") {
                const array = _.get(event, match[1], "");
                for (let i = 0; i < array.length; i++) {
                    if (array[i].title) {
                        newContent += `- [${array[i].title}](${array[i].fileUrl})\n`;
                    } else {
                        newContent += `- [${array[i].fileUrl}](${array[i].fileUrl})\n`;
                    }
                }
            } else {
                newContent = _.get(event, match[1], "");
            }

            //Turn objects into json for a better display be more specific in the template
            if (newContent === Object(newContent)) {
                newContent = JSON.stringify(newContent);
            }

            inputText = inputText.replace(match[0], newContent ?? "")
        }
    })
    return inputText;
}



function replacePathPlaceholders(plugin: GoogleCalendarPlugin, event: GoogleEvent, folderName: string): string {

    //check description for {{prefix}} string replace it with the prefix from the settings
    folderName = folderName.replace("{{prefix}}", plugin.settings.optionalNotePrefix);

    //check description for {{date}} string replace it with today's date
    folderName = folderName.replace("{{date}}", window.moment().format("YYYY-MM-DD"));

    //check description for {{date-year}} string replace it with the current year.
    folderName = folderName.replace("{{date-year}}", window.moment().format("YYYY"));

    //check description for {{date-month}} string replace it with the current month.
    folderName = folderName.replace("{{date-month}}", window.moment().format("MM"));

    //check description for {{date-day}} string replace it with the current numeric day.
    folderName = folderName.replace("{{date-day}}", window.moment().format("DD"));
    folderName = folderName.replace("{date-hour}}", window.moment().format("hh"));
    folderName = folderName.replace("{date-hour24}}", window.moment().format("HH"));
    folderName = folderName.replace("{date-minute}}", window.moment().format("mm"));


    //check description for {{event-date}} string replace with event start date
    folderName = folderName.replace("{{event-date}}", window.moment(event.start.date ?? event.start.dateTime).format("YYYY-MM-DD"));

    //check description for {{event-year}} string replace with event start date's year.
    folderName = folderName.replace("{{event-year}}", window.moment(event.start.date ?? event.start.dateTime).format("YYYY"));

    //check description for {{event-month}} string replace with event start date's month.
    folderName = folderName.replace("{{event-month}}", window.moment(event.start.date ?? event.start.dateTime).format("MM"));

    //check description for {{event-day}} string replace with event start date's numeric day.
    folderName = folderName.replace("{{event-day}}", window.moment(event.start.date ?? event.start.dateTime).format("DD"));

    //check description for {{event-title}} string replace with event title
    folderName = folderName.replace("{{event-title}}", event.summary ?? "event-title");

    folderName = folderName.replace("{{event-start-hour}}", event.start.dateTime ? window.moment(event.start.dateTime).format("hh") : "00");

    folderName = folderName.replace("{{event-start-hour24}}", event.start.dateTime ? window.moment(event.start.dateTime).format("HH") : "00");

    folderName = folderName.replace("{{event-start-minute}}", event.start.dateTime ? window.moment(event.start.dateTime).format("mm") : "00");

    folderName = folderName.replace("{{event-end-hour}}", event.end.dateTime ? window.moment(event.end.dateTime).format("hh") : "00");

    folderName = folderName.replace("{{event-end-hour24}}", event.end.dateTime ? window.moment(event.end.dateTime).format("HH") : "00");

    folderName = folderName.replace("{{event-end-minute}}", event.end.dateTime ? window.moment(event.end.dateTime).format("mm") : "00");

    return folderName;
}

async function getEventNoteFilePath(plugin: GoogleCalendarPlugin, event: GoogleEvent, folderPath: string) {
    const { adapter } = app.vault;

    if (folderPath) {
        //Remover he last - from :-obsidian-: if the new file uses a template
        if (folderPath.endsWith("-")) {
            folderPath = folderPath.slice(0, -1);
        }

        //Replace path backslashes with forward slashes to allow path to work on all OS
        folderPath = "/" + folderPath.split(/[/\\]/).join("/");

        //If the folder doesn't exist create it with all the parent folders
        if (! await adapter.exists(folderPath)) {
            await adapter.mkdir(folderPath);
        }
    } else {
        //Default to the root folder
        folderPath = app.fileManager.getNewFileParent("").path;
    }

    const fileName = replacePathPlaceholders(plugin, event, plugin.settings.eventNoteNameFormat);

    const sanitizedFileName = replacePathPlaceholders(plugin, event, sanitizeFileName(fileName))
    return normalizePath(`${folderPath}/${sanitizedFileName}.md`);
}

// Check if a file already exists.
// If the file does exist it will returns a number to append to the file name so a new file can be created
async function getFileSuffix(folderName: string, filePath: string): Promise<string> {
    const { vault } = app;
    const { adapter } = vault;

    const fileExists = await adapter.exists(filePath);
    // No suffix needed because the file doesn't exist
    if(!fileExists) {
        return filePath;
    }

    //Get Filename without extension
    const fileName = filePath.split(".").slice(0, -1).join(".");

    // Get all files in a folder
    let {files: filesInFolder} = await adapter.list(folderName);
    
    // Filter to only get files matching with the event name
    const fileIndex = filesInFolder
        .filter(file => file.startsWith(fileName))
        .reduce((max, file) => {
            file = file.replace(fileName, "");
            file = file.replace(".md", "");
            file = file.replace(/[\(\)\s]+/g, "");
            if(file === "" && max === 1) return 1;
            const fileNumber =  parseInt(file);
            return fileNumber > max ? fileNumber : max;
        }, 1);

    return `${fileName} (${fileIndex + 1}).md`;
}

/**
 * This function will create a new Note in the vault of the user if a template name is given the plugin will access the 
 * Templates plugin to try and include the selected Template into the newly created file
 * 
 * @param fileName The name of the new Note
 * @param templateName  The used Template to fill the file
 */
export const createNoteFromEvent = async (event: GoogleEvent, folderName?: string, templateName?: string, isAutoCreated = false): Promise<TFile> => {
    const plugin = GoogleCalendarPlugin.getInstance();
    
    const existingEventNote = findEventNote(event, plugin);
    if(existingEventNote.file) {
        if (!isAutoCreated) {
            createNotice(`EventNote ${event.summary} already exists.`);
        }
        return existingEventNote.file;
    }
    const { vault } = app;
    const { adapter } = vault;

    if (folderName) {
        folderName = replacePathPlaceholders(plugin, event, folderName);
    }

    let filePath = await getEventNoteFilePath(plugin, event, folderName);
    //check if file already exists
    filePath = await getFileSuffix(folderName, filePath);

    //Create file with no content
    let file;
    try {
        file = await vault.create(filePath, '');
        createNotice(`EventNote ${event.summary} created.`)
    } catch (err) {
        return null
    }

    //check if the template plugin is active and a template name is given
    if ((!plugin.coreTemplatePlugin && !plugin.templaterPlugin) || !templateName) {
        const fileContent = insertEventIdInFrontmatter(event, "");

        await adapter.write(filePath, fileContent);

        const newFile = vault.getAbstractFileByPath(filePath) as TFile;

        if (plugin.settings.autoCreateEventKeepOpen || !isAutoCreated) {
            await app.workspace.getLeaf(true).openFile(newFile)
        }

        return newFile
    }

    //Check if the template name has a file extension
    if (!templateName.match(/.*\.md/)) {
        templateName = templateName + ".md";
    }

    //Open file in active panel needed to insert template
    const newLeaf = await app.workspace.getLeaf(true)
    await newLeaf.setViewState({ type: "MarkdownView" })
    await app.workspace.setActiveLeaf(newLeaf, false, true)

    await newLeaf.openFile(file, {
        state: { mode: "source" },
        active: true
    });

    try {
        if (plugin.templaterPlugin && plugin.coreTemplatePlugin) {
            const wasInserted = await insertTemplate(true);
            if (!wasInserted) {
                const wasInsertedAgain = await insertTemplate(false);
                if (!wasInsertedAgain) {
                    createNotice("Template not compatible")
                    throw new Error("Template not compatible")
                }
            }
        } else if (plugin.templaterPlugin) {
            const wasInserted = await insertTemplate(true);
            if (!wasInserted) {
                createNotice("Template not compatible")
                throw new Error("Template not compatible")

            }
        } else if (plugin.coreTemplatePlugin) {
            const wasInserted = await insertTemplate(false);
            if (!wasInserted) {
                createNotice("Template not compatible")
                throw new Error("Template not compatible")
            }
        }
    } catch(err) {
        const fileContent = insertEventIdInFrontmatter(event, "");
        await adapter.write(filePath, fileContent);
    }


    if (!plugin.settings.autoCreateEventKeepOpen && isAutoCreated) {
        newLeaf.detach();
    }

    return vault.getAbstractFileByPath(filePath) as TFile;



    async function insertTemplate(useTemplater: boolean): Promise<boolean> {
        //Get the default template path from the plugin settings
        let templateFolderPath = useTemplater 
        ? normalizePath(plugin.templaterPlugin.settings.templates_folder)
        : normalizePath(plugin.coreTemplatePlugin.instance.options.folder);
  
        //Check if the template name or path exists
        let templateFilePath;
        // Check if template exists if the template name is the full path to the file
        if ((await adapter.exists(templateName))) {
            templateFilePath = templateName;
        } else {
            //Get Path to template file and check if it exists
            templateFilePath = `${templateFolderPath}/${templateName}`;
            if (templateFolderPath === "/") {
                templateFilePath = templateName;
            }
        }
        // Check if the template file exists after the path was generated
        if (!(await adapter.exists(templateFilePath))) {
            createNotice(`Template: ${templateName} doesn't exit.`)
            throw new Error(`Template: ${templateName} doesn't exit.`)
        }

        //Get the file from the path
        const templateFile = vault.getAbstractFileByPath(templateFilePath);

        //Read in template file
        if (!(templateFile instanceof TFile)) return false;

        const originalTemplateFileContent = await vault.cachedRead(templateFile);

        //Get template with injected event data
        let newContent = injectEventDetails(event, originalTemplateFileContent);
        newContent = insertEventIdInFrontmatter(event, newContent);

        // Check if the template contains templater or core template syntax after the custom {{ }} are removed by the injection
        if (useTemplater && newContent.contains("{{") && newContent.contains("}}")) {
            return false;
        } else if (!useTemplater && newContent.contains("<%") && newContent.contains("%>")) {
            return false;
        }

        //Write the new content to a temporary file to use as a temporary template
        const tmpTemplateFilePath = templateFile.path + ".tmp";

        await adapter.write(tmpTemplateFilePath, newContent);

        const tmpTemplateFile = app.vault.getAbstractFileByPath(tmpTemplateFilePath);

        if (!(tmpTemplateFile instanceof TFile)) return false;

        //Insert the template by calling the command from the plugin
        try {
            if (useTemplater) {
                await plugin.templaterPlugin.templater.append_template_to_active_file(tmpTemplateFile);
            } else {
                await plugin.coreTemplatePlugin.instance.insertTemplate(tmpTemplateFile);
            }

            adapter.remove(tmpTemplateFilePath);
            return true;
        } catch {
            adapter.remove(tmpTemplateFilePath);
            return false;
        }
    }
}
