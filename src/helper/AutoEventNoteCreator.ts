import type { GoogleEvent } from "../helper/types";

import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { googleListEvents } from "../googleApi/GoogleListEvents";
import { normalizePath, Pos, TFile } from "obsidian";
import { createNotice } from "./NoticeHelper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import _ from "lodash";
import { sanitizeFileName } from "./Helper";
import { CreateNotePromptModal } from "../modal/CreateNotePromptModal";

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
    const events = await googleListEvents({ startDate, endDate });

    // check every event from the trigger text :obsidian:
    for (let i = 0; i < events.length; i++) {
        console.log(events[i])
        // Create a event note for all events if the trigger text is empty
        if(plugin.settings.autoCreateEventNotesMarker === "") {
            await createNoteFromEvent(events[i], plugin.settings.defaultFolder, plugin.settings.defaultTemplate, true)
        }else{
            
            const regex = new RegExp(`:([^:]*-)?${plugin.settings.autoCreateEventNotesMarker}-?([^:]*)?:`)
        
            //regex will check for text and extract a template name if it exists
            const match = events[i].description?.match(regex) ?? [];
            console.log(match)
            if (match.length == 3) {
                //the trigger text was found and a new note will be created
                await createNoteFromEvent(events[i], match[1], match[2], true)
            }
        }
    }
}

const insertEventIdInFrontmatter = (event: GoogleEvent, fileContent: string, position: Pos): string => {

    const start = position?.start?.offset ?? 0;
    const end = position?.end?.offset ?? 0;

    let frontmatterText = fileContent.substring(start, end);

    //event-id is already in the frontmatter
    if (frontmatterText.contains("event-id:")) {
        return fileContent;
    }
    //no frontmatter exists yet so we create one with the event-id
    if (!frontmatterText.contains("---")) {
        frontmatterText = `---\nevent-id: ${event.id}\n---\n`;
    } else {
        //frontmatter exists but no event-id so we add it
        frontmatterText = frontmatterText.replace("---", `---\nevent-id: ${event.id}`);
    }

    //replace the old frontmatter with the new one
    fileContent = fileContent.substring(0, start) + frontmatterText + fileContent.substring(end);

    return fileContent;
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

async function checkIfFileExists(event: GoogleEvent, filePath: string, isAutoCreated: boolean): Promise<TFile> | null {
    const { vault } = app;
    const { adapter } = vault;

    if (await adapter.exists(filePath)) {
        let existingFile = vault.getAbstractFileByPath(filePath) as TFile;
        if(!isAutoCreated) {
            createNotice(`EventNote ${event.summary} already exists.`)
            new CreateNotePromptModal(event, (newNote: TFile) => existingFile = newNote).open();
        }
        return existingFile
    }
    return;
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
    const { vault } = app;
    const { adapter } = vault;

    if (folderName) {
        folderName = replacePathPlaceholders(plugin, event, folderName);
    }
    console.log("folderName", folderName)
    const filePath = await getEventNoteFilePath(plugin, event, folderName);
    console.log("folderName", filePath)
    //check if file already exists
    const existingFile = await checkIfFileExists(event, filePath, isAutoCreated);
    if (existingFile) return existingFile;

    //Create file with no content
    const file = await vault.create(filePath, '');
    createNotice(`EventNote ${event.summary} created.`)


    //check if the template plugin is active and a template name is given
    if ((!plugin.coreTemplatePlugin && !plugin.templaterPlugin) || !templateName) {

        const fileContent = insertEventIdInFrontmatter(event, "", null);

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

    if (plugin.templaterPlugin && plugin.coreTemplatePlugin) {
        const wasInserted = await insertTemplate(true);
        if (!wasInserted) {
            const wasInsertedAgain = await insertTemplate(false);
            if (!wasInsertedAgain) {
                createNotice("Template not compatible")
            }
        }
    } else if (plugin.templaterPlugin) {
        const wasInserted = await insertTemplate(true);
        if (!wasInserted) {
            createNotice("Template not compatible")
        }
    } else if (plugin.coreTemplatePlugin) {
        const wasInserted = await insertTemplate(false);
        if (!wasInserted) {
            createNotice("Template not compatible")
        }
    }


    if (!plugin.settings.autoCreateEventKeepOpen && isAutoCreated) {
        newLeaf.detach();
    }

    return vault.getAbstractFileByPath(filePath) as TFile;



    async function insertTemplate(useTemplater: boolean): Promise<boolean> {

        //Get the default template path from the plugin settings
        let tempalteFolderPath;
        if (useTemplater) {
            tempalteFolderPath = normalizePath(plugin?.templaterPlugin?.settings?.templates_folder);
        } else {
            tempalteFolderPath = normalizePath(plugin?.coreTemplatePlugin?.instance?.options?.folder);
        }

        //Chek if the template name or path exists
        let templateFilePath;
        if (await adapter.exists(templateName)) {
            templateFilePath = templateName;
        } else {
            //Get Path to template file and check if it exists
            templateFilePath = `${tempalteFolderPath}/${templateName}`;
            if (tempalteFolderPath === "/") {
                templateFilePath = templateName;
            }
        }

        if (!await adapter.exists(templateFilePath)) {
            createNotice(`Template: ${templateName} doesn't exit.`)
            return false;
        }

        //Get the file from the path
        const templateFile = vault.getAbstractFileByPath(templateFilePath);

        //Read in templatefile
        if (!(templateFile instanceof TFile)) return false;

        const originalTemplateFileContent = await vault.cachedRead(templateFile);

        //Get template with injected event data
        let newContent = insertEventIdInFrontmatter(event, originalTemplateFileContent, app.metadataCache.getFileCache(templateFile).frontmatter?.position);
        newContent = injectEventDetails(event, newContent);

        if (useTemplater && newContent.contains("{{") && newContent.contains("}}")) {
            return false;
        } else if (!useTemplater && newContent.contains("<%") && newContent.contains("%>")) {
            return false;
        }

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
