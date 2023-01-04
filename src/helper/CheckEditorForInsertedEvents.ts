import type { Editor, EditorPosition } from "obsidian";
import type { GoogleEvent } from "./types";
import { googleGetEvent } from "../googleApi/GoogleGetEvent";
import _ from "lodash";

async function getEventsInFile(fileContent: string): Promise<GoogleEvent[]> {
    const regexForLinks = /\[.*]\(https:\/\/www\.google\.com\/calendar\/event\?eid=(.*)&cal=(.*)\)/g;

    let matchesForLink;
    const outputForLink = [];

    do {
        matchesForLink = regexForLinks.exec(fileContent);
        if (matchesForLink) {
            outputForLink.push(matchesForLink);
        }
    } while (matchesForLink);

    if (!outputForLink.length) return [];

    const events = await Promise.all(outputForLink.map(async (match) => {
        if (match) {
            const eventId = atob(match[1]).split(" ")[0];
            const event = await googleGetEvent(eventId, match[2]);
            return event;
        }
    }));

    return events;
}

export async function checkEditorForInsertedEvents(
    editor: Editor,
): Promise<void> {
    const cursorPosition = editor.getCursor();
    let fileContent = editor.getValue();

    const regexForTemplates = /{{gEvent(\d?).(.*)}} /g;

    let matchesForTemplate;
    const outputForTemplate = [];

    do {
        matchesForTemplate = regexForTemplates.exec(fileContent);
        if (matchesForTemplate) {
            outputForTemplate.push(matchesForTemplate);
        }
    } while (matchesForTemplate);

    if (!outputForTemplate.length) return;

    const events = await getEventsInFile(fileContent);
    if (!events.length) return;

    outputForTemplate.forEach(async (match) => {

        const index = match[1] ? parseInt(match[1]) : 0;

        const startCursor: EditorPosition = editor.getCursor();
        startCursor.ch -= 3;

        //Check that the final whitespace was just typed to trigger the insert
        if (editor.getRange(startCursor, editor.getCursor()) != "}} ") {
            return false;
        }

        let newContent = _.get(events[index], match[2], "");
        //Turn objects into json for a better display be more specific in the template
        if (newContent === Object(newContent)) {
            newContent = JSON.stringify(newContent);
        }

        fileContent = fileContent.replace(match[0], newContent ?? "");

        editor.setValue(fileContent);

        cursorPosition.ch += (newContent.length - match[0].length);

        editor.setCursor(cursorPosition);
    });
}
