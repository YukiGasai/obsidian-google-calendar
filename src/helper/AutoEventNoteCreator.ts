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
 * @param plugin Refrence to the main plugin to acess the settings
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
    const events = await googleListEvents(startDate, endDate);

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


export const manuallyCreateNoteFromEvent = async (event: GoogleEvent) :Promise<void> => {

    if(!settingsAreCompleteAndLoggedIn()){
        return;
    }

    //regex will check for text and extract a template name if it exists
    const match = event.description?.match(/:(.*-)?obsidian-?(.*)?:/) ?? [];
    

    //the trigger text was found and a new note will be created
    await createNoteFromEvent(event, match?.[1], match?.[2]);
      
}

/**
 * This function will create a new Note in the vault of the user if a template name is given the plugin will access the 
 * Templates plugin to try and include the selected Template into the newly created file
 * 
 * @param fileName The name of the new Note
 * @param templateName  The used Template to fill the file
 */
export const createNoteFromEvent = async (event: GoogleEvent, folderName?:string, templateName?:string): Promise<void> => {
    const plugin = GoogleCalendarPlugin.getInstance();
    const { vault } = plugin.app;
    const { adapter } = vault;

    
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

    const filePath = normalizePath(`${folderPath}/${event.summary}.md`);

    //check if file already exists
    if(await adapter.exists(filePath)){
        return;
    }

    //Create file with no content
    const File = await vault.create(filePath, '');
    createNotice(`EventNote ${event.summary} created.`)

    //check if the template plugin is active
    if((!plugin.coreTemplatePlugin && !plugin.templaterPlugin) || !templateName){
        return;
    }

    //Check if the template name has a file extension
    if(!templateName.match(/.*\.md/)){
        templateName = templateName + ".md";
    }

    //Open file in active panel needed to insert template
    await app.workspace.getLeaf(true).setViewState({type: "MarkdownView", active: true})
    const allLeaves = app.workspace.getLeavesOfType("MarkdownView");
    await allLeaves[0].openFile(File);

    
    if(plugin.templaterPlugin && plugin.coreTemplatePlugin){
        const wasInserted = await insertTemplaterTemplate();
        if(!wasInserted){
            const wasInsertedAgain = await insertCoreTemplate()
            if(!wasInsertedAgain){
                createNotice("Template not compatable")
            }
        }       
    }else if(plugin.templaterPlugin){
        const wasInserted = await insertTemplaterTemplate();
        if(!wasInserted){
            createNotice("Template not compatable")
        }
    }else if(plugin.coreTemplatePlugin){
        const wasInserted = await insertCoreTemplate();
        if(!wasInserted){
            createNotice("Template not compatable")
        }
    }


    if(allLeaves[0].view instanceof MarkdownView){

        let fileContent = allLeaves[0].view.editor.getValue()
  
        const oldContent = fileContent;
        const regexp = /({{|<%)gEvent\.([^}>]*)(}}|%>)/gm;
        let matches;
        const output = [];
        do {
            matches = regexp.exec(fileContent);
            output.push(matches);
        } while(matches);
   
        output.forEach(match => {
            if(match){

                console.log(match)
                let newContent = _.get(event, match[2], "");
                
                //Turn objects into json for a better display be more specific in the template
                if(newContent === Object(newContent)){
                    newContent = JSON.stringify(newContent);
                }

                fileContent = fileContent.replace(match[0],newContent??"")
            }
        })

        if(fileContent !== oldContent) {
            allLeaves[0].view.editor.setValue(fileContent)
        }

    }
    
    if(!plugin.settings.autoCreateEventKeepOpen){
        allLeaves[0].detach();
    }
    

    async function insertCoreTemplate() : Promise<boolean>{
        //Get the folder where the templates are stored from the template plugin
        const coreTemplateFolderPath = normalizePath(plugin.coreTemplatePlugin.instance.options.folder);

        //Get Path to template file and check if it exists
        const templateFilePath = `${coreTemplateFolderPath}/${templateName}`;
        if(!await adapter.exists(templateFilePath)){
            createNotice(`Template ${templateName} doesn't exit.`)
            return false;
        }

        //Get the file from the path
        const templateFile = vault.getAbstractFileByPath((templateFilePath));

        if(!(templateFile instanceof TFile))return false;

        const result = await vault.read(templateFile);

        if(result.contains("<%") && result.contains("%>")){
            return false;
        }

        //Insert the template by calling the command from the plugin
        try{
            await plugin.coreTemplatePlugin.instance.insertTemplate(templateFile);    
    
        }catch{
            return false
        }

        return true;
    }

    async function insertTemplaterTemplate(){
        const templaterFolderPath = normalizePath(plugin.templaterPlugin.settings.templates_folder);
    
        //Get Path to template file and check if it exists
        const templateFilePath = `${templaterFolderPath}/${templateName}`;
        if(!await adapter.exists(templateFilePath)){
            createNotice(`Template ${templateName} doesn't exit.`)
            return false;
        }
    
        const templateFile = plugin.app.vault.getAbstractFileByPath(templateFilePath);

        if(!(templateFile instanceof TFile))return false;

        const result = await vault.read(templateFile);

        if(result.contains("{{") && result.contains("}}")){
            return false;
        }

        if (templateFile instanceof TFile) {
            try{
            await plugin.templaterPlugin.templater.append_template_to_active_file(templateFile);
            }catch{
                return false;
            }
        }
        return true;
    }
}


