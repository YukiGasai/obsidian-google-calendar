import type { Editor, MarkdownView } from "obsidian";
import { createNotice } from "./NoticeHelper";
import { googleGetEvent } from "../googleApi/GoogleGetEvent";
import _ from "lodash";
import { googleDeleteEvent } from "../googleApi/GoogleDeleteEvent";

export const deleteEventFromFrontmatter = async (editor: Editor, view: MarkdownView) => {
    let fileContent = editor.getValue();

    //Use a copy to prevent problems when running the command multiple times
    const frontmatter: any = _.cloneDeep(app?.metadataCache?.getFileCache(view.file)?.frontmatter) ?? {};

    if(!frontmatter["event-id"]){
        createNotice("No event id found in note", true);
        return;
    }
    
    const event_id = frontmatter["event-id"];
    const event = await googleGetEvent(event_id);
    const gotDeleted = await googleDeleteEvent(event);

    if(gotDeleted) {
        const lineRegex = new RegExp(`event-id: ${event_id}(\r\n|\r|\n)`, "g");
        fileContent = fileContent.replace(lineRegex, "");
        editor.setValue(fileContent);
    }
}


