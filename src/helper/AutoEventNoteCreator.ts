import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";

import { googleListEvents } from "../googleApi/GoogleListEvents";
import { normalizePath } from "obsidian";
import { createNotice } from "./NoticeHelper";
import path from "path";


export const checkForEventNotes = async (plugin: GoogleCalendarPlugin) :Promise<void> => {

    if(!plugin.settings.autoCreateEventNotes){
        return;
    }

    const startOffset = Math.abs(plugin.settings.importStartOffset);
    const endOffset = Math.abs(plugin.settings.importEndOffset);

    const startDate = window.moment().local().subtract(startOffset, "day").format("YYYY-MM-DD");
    const endDate = window.moment().local().add(endOffset, "day").format("YYYY-MM-DD");
    const events = await googleListEvents(plugin, startDate, endDate);

    events.forEach(event => {
        const match = event.description.match(/:obsidian-?(.*)?:/) ?? [];
        
        if(match.length == 2){
            const filename = event.summary;
            createNoteFromEvent(plugin, filename, match[1]);
        }
    })
}

const createNoteFromEvent = async (plugin:GoogleCalendarPlugin, fileName: string, templateName?:string): Promise<void> => {
    const { vault } = plugin.app;
    const { adapter } = vault;

    const newFileFolderPath = app.fileManager.getNewFileParent("").path;
    const filePath = path.join(newFileFolderPath, `${fileName}.md`);


    //check if file already exists
    if(await adapter.exists(normalizePath(filePath))){
        return;
    }

    //Create file with no content
    const File = await vault.create(filePath, '');
    createNotice(plugin, `EventNote ${fileName} created.`)

    //check if the template plugin is active
    if(!plugin.templatePlugin || !templateName){
        return;
    }
    
    //Get the folder where the templates are stored from the template plugin
    const coreTemplateFolderPath = normalizePath(plugin.templatePlugin.instance.options.folder);

    //Check if the template name has a file extension
    if(!templateName.match(/.*\.md/)){
        templateName = templateName + ".md";
    
    }

    //Get Path to template file and check if it exists
    const templateFilePath = path.join(coreTemplateFolderPath, templateName);
    if(!await adapter.exists(templateFilePath)){
        createNotice(plugin, `Template ${templateName} doesn't exit.`)
        return;
    }

    //Get the file from the path
    const templateFile = vault.getAbstractFileByPath(normalizePath(templateFilePath));

    //Open file in active panel needed to insert template
    await plugin.app.workspace.activeLeaf.openFile(File);
    //Insert the template by calling the command from the plugin
    await plugin.templatePlugin.instance.insertTemplate(templateFile);
    //Close the file to allow multiples inserts
    await plugin.app.workspace.activeLeaf.detach();
}