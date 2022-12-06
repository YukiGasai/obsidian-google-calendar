import type { GoogleEvent } from "../helper/types";

import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { googleListEvents } from "../googleApi/GoogleListEvents";
import { MarkdownView, normalizePath, TFile } from "obsidian";
import { createNotice } from "./NoticeHelper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import _ from "lodash";

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
export const checkForEventNotes = async (plugin: GoogleCalendarPlugin) :Promise<void> => {

    //Don't run if disabled in the settings
    if(!plugin.settings.autoCreateEventNotes || !settingsAreCompleteAndLoggedIn()){
        return;
    }

    //get the import time range from the settings
    const startOffset = Math.abs(plugin.settings.importStartOffset);
    const endOffset = Math.abs(plugin.settings.importEndOffset);

    const startDate = window.moment().local().subtract(startOffset, "day")
    const endDate = window.moment().local().add(endOffset, "day")

    //get all events in the import time range
    const events = await googleListEvents({startDate, endDate});

    // check every event from the trigger text :obsidian:

    for(let i = 0; i < events.length; i++){
        //regex will check for text and extract a template name if it exists
        const match = events[i].description?.match(/:(.*-)?obsidian-?(.*)?:/) ?? [];
           
        if(match.length == 3){
            //the trigger text was found and a new note will be created
            await createNoteFromEvent(events[i], match[1], match[2])
        }
    }
}

const injectEventDetails = (event: GoogleEvent, inputText:string):string => {
    const regexp = /{{gEvent\.([^}>]*)}}/gm;
    let matches;
    const output = [];
    do {
        matches = regexp.exec(inputText);
        output.push(matches);
    } while(matches);

    output.forEach(match => {
        if(match){
            let newContent:any = "";

            if(match[1] == "attendees"){
                let array = _.get(event, match[1], "");
                for(let i = 0; i < array.length; i++){
                    if(array[i].displayName){
                        newContent += `- [[@${array[i].displayName}]]\n`;
                    }else{
                        newContent += `- [[@${array[i].email}]]\n`;
                    }
                }
            } else if(match[1] == "attachments"){
                let array = _.get(event, match[1], "");
                for(let i = 0; i < array.length; i++){
                    if(array[i].title){
                        newContent += `- [${array[i].title}](${array[i].fileUrl})\n`;
                    }else{
                        newContent += `- [${array[i].fileUrl}](${array[i].fileUrl})\n`;
                    }
                }
            }else{
                newContent = _.get(event, match[1], "");
            }
        
            //Turn objects into json for a better display be more specific in the template
            if(newContent === Object(newContent)){
                newContent = JSON.stringify(newContent);
            }

            inputText = inputText.replace(match[0],newContent??"")
        }
    })
    return inputText;
}


/**
 * This function will create a new Note in the vault of the user if a template name is given the plugin will access the 
 * Templates plugin to try and include the selected Template into the newly created file
 * 
 * @param fileName The name of the new Note
 * @param templateName  The used Template to fill the file
 */
export const createNoteFromEvent = async (event: GoogleEvent, folderName?:string, templateName?:string): Promise<TFile> => {
    const plugin = GoogleCalendarPlugin.getInstance();
    const { vault } = app;
    const { adapter } = vault;

    //Destination folder path
    let folderPath = app.fileManager.getNewFileParent("").path;
    if(folderName){
        if(folderName.endsWith("-")){
            folderName = folderName.slice(0, -1);   
        }

        folderName = "/" + folderName.split(/[/\\]/).join("/");

        if(await adapter.exists(folderName)){
            folderPath = folderName;
        }
    }
    let cleanEventSummary = event.summary
        .trim()
        .replace('<', 'lt')
        .replace('>', 'gt')
        .replace('\"', '\'\'')
        .replace('\\', '-')
        .replace('/', '-')
        .replace(':', '-')
        .replace('|', '-')
        .replace('*', '')
        .replace('?', '');

    const filePath = normalizePath(`${folderPath}/${cleanEventSummary}.md`);

    //check if file already exists
    if(await adapter.exists(filePath)){
        return vault.getAbstractFileByPath(filePath) as TFile;
    }

    //Create file with no content
    const file = await vault.create(filePath, '');
    createNotice(`EventNote ${event.summary} created.`)

    //check if the template plugin is active
    if((!plugin.coreTemplatePlugin && !plugin.templaterPlugin) || !templateName){
        return vault.getAbstractFileByPath(filePath) as TFile;
    }

    //Check if the template name has a file extension
    if(!templateName.match(/.*\.md/)){
        templateName = templateName + ".md";
    }

    const editModeState = {
        state: { mode: "source" },
        active: true
    };

    //Open file in active panel needed to insert template
    const newLeaf = await app.workspace.getLeaf(true)
    await newLeaf.setViewState({type: "MarkdownView"})
    await app.workspace.setActiveLeaf(newLeaf, false, true)

    await newLeaf.openFile(file, editModeState);
    
    if(plugin.templaterPlugin && plugin.coreTemplatePlugin){
        const wasInserted = await insertTemplate(true);
        if(!wasInserted){
            const wasInsertedAgain = await insertTemplate(false);
            if(!wasInsertedAgain){
                createNotice("Template not compatable")
            }
        }       
    }else if(plugin.templaterPlugin){
        const wasInserted = await insertTemplate(true);
        if(!wasInserted){
            createNotice("Template not compatable")
        }
    }else if(plugin.coreTemplatePlugin){
        const wasInserted = await insertTemplate(false);
        if(!wasInserted){
            createNotice("Template not compatable")
        }
    }

    
    if(!plugin.settings.autoCreateEventKeepOpen){
        newLeaf.detach();
    }

    return vault.getAbstractFileByPath(filePath) as TFile;
   
    async function insertTemplate(useTemplater:boolean) : Promise<boolean> {
    
        //Get the default template path from the plugin settings
        let tempalteFolderPath;
        if(useTemplater){
            tempalteFolderPath = normalizePath(plugin?.templaterPlugin?.settings?.templates_folder);
        }else{
            tempalteFolderPath = normalizePath(plugin?.coreTemplatePlugin?.instance?.options?.folder);
        }
        
        //Chek if the template name or path exists
        let templateFilePath;
        if(await adapter.exists(templateName)){
            templateFilePath = templateName;
        }else{
            //Get Path to template file and check if it exists
            templateFilePath = `${tempalteFolderPath}/${templateName}`;
            if(tempalteFolderPath === "/"){
                templateFilePath = templateName;
            }
        }
    
        if(!await adapter.exists(templateFilePath)){
            createNotice(`Template: ${templateName} doesn't exit.`)
            return false;
        }
    
        //Get the file from the path
        const templateFile = vault.getAbstractFileByPath(templateFilePath);
    
        //Read in templatefile
        if(!(templateFile instanceof TFile))return false;
    
        const result = await vault.cachedRead(templateFile);

        //Get template with injected event data
        const newContent = injectEventDetails(event, result);
    
        if(useTemplater && newContent.contains("{{") && newContent.contains("}}")){
            return false;
        }else if(!useTemplater && newContent.contains("<%") && newContent.contains("%>")){
            return false;
        }

        const tmpTemplateFilePath = templateFile.path + ".tmp";
    
        await adapter.write(tmpTemplateFilePath, newContent);
        
        const tmpTemplateFile = app.vault.getAbstractFileByPath(tmpTemplateFilePath);

        if(!(tmpTemplateFile instanceof TFile))return false;

        //Insert the template by calling the command from the plugin
        try{
            if(useTemplater){
                await plugin.templaterPlugin.templater.append_template_to_active_file(tmpTemplateFile);
            }else{
                await plugin.coreTemplatePlugin.instance.insertTemplate(tmpTemplateFile);   
            }
            adapter.remove(tmpTemplateFilePath);
            return true; 
        }catch{
            adapter.remove(tmpTemplateFilePath);
            return false;
        }
    }
}
