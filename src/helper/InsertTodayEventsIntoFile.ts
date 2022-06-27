import type { Editor } from "obsidian";
import type GoogleCalendarPlugin from '../GoogleCalendarPlugin';

import { moment } from "obsidian";
import { googleListTodayEvents } from "../googleApi/GoogleListEvents";

/**
 * This function will list all events of today as a table and inset the table into the currently open editor using the markdown format
 * This functions is used to save your events into a static field creating a backup of the day independent from the API
 * @param plugin Refrence to the main plugin to acess the settings 
 * @param editor Refrence to the open editor the events will be inserted to
 */
export const insertTodayEventsIntoFile = async (plugin: GoogleCalendarPlugin,editor: Editor):Promise<void> => {
    const eventList = await googleListTodayEvents(plugin);

    let eventStringList = "";

    eventList.forEach((event) => {
        if (event.start) {
            let dateString = "";
            if (event.start.dateTime) {
                const startTime = moment(event.start.dateTime).format(
                    "HH:mm"
                );
                dateString = startTime;
                if (event.end.dateTime) {
                    const endTime = moment(event.end.dateTime).format(
                        "HH:mm"
                    );

                    dateString += `-${endTime}`;
                }
            }

            const nameString = `[${event.summary}](${event.htmlLink})`;

            eventStringList += `\n| ${dateString} | ${nameString} | ${
                event.description ?? ""
            } |`;
        }
    });

    editor.replaceRange(
        "| Date | Name | Description |\n| ---- | ---- | ----------- |" +
            eventStringList,
        editor.getCursor()
    );
};