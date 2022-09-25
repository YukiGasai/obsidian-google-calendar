import { Editor, Modal } from "obsidian";
import type { GoogleEvent } from "../helper/types";
import InsertEventsComp from "../svelte/InsertEventsComp.svelte";
import GoogleCalendarPlugin from './../GoogleCalendarPlugin';

/**
 * This Class is used to create a modal to slect what and how information about a event should be importat into a file
 */


export class InsertEventsModal extends Modal {

    editor:Editor;

    constructor(editor:Editor){
        super(GoogleCalendarPlugin.getInstance().app);
        this.editor = editor;
    }

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		new InsertEventsComp({
			target: contentEl,
            props: {
                onSubmit: this.onSubmit,
                insertEventsModal: this
            }
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

    onSubmit(printType:string, eventList: GoogleEvent[], tableOptions:string[], insertEventsModal: InsertEventsModal):void {

        let eventStringList = "";

        if(printType == "bullet") {
            eventList.forEach((event) => {
                const nameString = `[${event.summary}](${event.htmlLink}&cal=${event.parent.id})`;
                eventStringList += `\n- ${nameString}`;
            });

            insertEventsModal.editor.replaceRange(
                eventStringList,
                insertEventsModal.editor.getCursor()
            );

        } else if(printType == "table") {

            eventList.forEach((event) => {
                if (event.start) {
                    let dateString = "";
                    if (event.start.dateTime) {
                        const startTime = window.moment(event.start.dateTime).format("HH:mm");
                        dateString = startTime;
                        if (event.end.dateTime) {
                            const endTime = window.moment(event.end.dateTime).format("HH:mm");

                            dateString += `-${endTime}`;
                        }
                    }

                    const nameString = `[${event.summary}](${event.htmlLink}&cal=${event.parent.id})`;

                    eventStringList += `\n| ${dateString} | ${nameString} | ${
                        event.description ?? ""
                    } |`;
                }
            });
            insertEventsModal.editor.replaceRange(
                "| Date | Name | Description |\n| ---- | ---- | ----------- |" +
                    eventStringList,
                    insertEventsModal.editor.getCursor()
            );
        }
        insertEventsModal.close();
    }
}
