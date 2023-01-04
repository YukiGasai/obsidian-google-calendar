import type { GoogleEvent } from "../helper/types";
import { Editor, Modal } from "obsidian";
import InsertEventsComp from "../svelte/InsertEventsComp.svelte";
import GoogleCalendarPlugin from './../GoogleCalendarPlugin';
import _ from "lodash";

/**
 * This Class is used to create a modal to select what and how information about a event should be imported into a file
 */


export class InsertEventsModal extends Modal {

    editor: Editor;

    constructor(editor: Editor) {
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

    onSubmit(printType: string, eventList: GoogleEvent[], tableOptions: string[], insertEventsModal: InsertEventsModal): void {

        let headerString = "";
        let headerDividerString = ""
        let eventStringList = "";

        if (printType == "bullet") {
            eventList.forEach((event) => {
                const nameString = `[${event.summary}](${event.htmlLink}&cal=${event.parent.id})`;
                eventStringList += `\n- ${nameString}`;
            });

            insertEventsModal.editor.replaceRange(
                eventStringList,
                insertEventsModal.editor.getCursor()
            );

        } else if (printType == "table") {

            tableOptions.forEach(objectPath => {
                objectPath = objectPath.split(".").join(" ").toLocaleUpperCase();
                headerString += `| ${objectPath} `;
                headerDividerString += `| --- `
            });

            headerString += "|\n";
            headerDividerString += "|\n";

            eventList.forEach((event) => {
                tableOptions.forEach(objectPath => {

                    let content = _.get(event, objectPath.substring(1), "");

                    //Using summary as link for {{gEvent}} syntax starter
                    if (objectPath == ".summary") {
                        content = `[${content}](${event.htmlLink}&cal=${event.parent.id})`;
                    }
                    if (objectPath.startsWith(".start") && !objectPath.contains("timeZone")) {
                        const startMoment = event.start.date ? window.moment(event.start.date) : window.moment(event.start.dateTime)
                        content = startMoment.format("YYYY-MM-DD HH:mm");
                    }
                    if (objectPath.startsWith(".end") && !objectPath.contains("timeZone")) {
                        const endMoment = event.start.date ? window.moment(event.end.date) : window.moment(event.end.dateTime)
                        content = endMoment.format("YYYY-MM-DD HH:mm");
                    }





                    eventStringList += `| ${content} `

                });
                eventStringList += "|\n";


                // if (event.start) {
                //     let dateString = "";
                //     if (event.start.dateTime) {
                //         const startTime = window.moment(event.start.dateTime).format("HH:mm");
                //         dateString = startTime;
                //         if (event.end.dateTime) {
                //             const endTime = window.moment(event.end.dateTime).format("HH:mm");

                //             dateString += `-${endTime}`;
                //         }
                //     }

                //     const nameString = `[${event.summary}](${event.htmlLink}&cal=${event.parent.id})`;

                //     eventStringList += `\n| ${dateString} | ${nameString} | ${
                //         event.description ?? ""
                //     } |`;
                //}
            });
            insertEventsModal.editor.replaceRange(
                headerString + headerDividerString + eventStringList,
                insertEventsModal.editor.getCursor()
            );
        }
        insertEventsModal.close();
    }
}
