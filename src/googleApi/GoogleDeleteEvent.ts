import { GoogleApiError } from "./GoogleApiError";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { createNotice } from "../helper/NoticeHelper";
import type { GoogleEvent } from "../helper/types";

import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { callRequest } from "src/helper/RequestWrapper";
/**
 * This function will remove the event from the google api
 * If the event is recurrent is will delete all it's instanced except if deleteSingle is set
 * @param event The event to delete
 * @param deleteSingle If set to true and if the event is recurrent only one instance is deleted
 * @returns a boolean if the deletion was successfully
 */
export async function googleDeleteEvent(
	event: GoogleEvent,
	deleteAllOccurrences = false
): Promise<boolean> {

    const plugin = GoogleCalendarPlugin.getInstance();

	if (!settingsAreCompleteAndLoggedIn()) {
        throw new GoogleApiError("Not logged in", null, 401, {error: "Not logged in"})
	}

    let calendarId = event.parent?.id;

    if(!calendarId) {
        calendarId = plugin.settings.defaultCalendar ?? "";
    }

    if(calendarId === ""){
		throw new GoogleApiError("Could not delete Google Event because no default calendar selected in Settings", null, 999, {error: "No calendar set"})    
    }

	// Use the recurrence id to delete all events from a recurring task
	let id = event.recurringEventId ?? event.id;

	if (!deleteAllOccurrences && event.recurringEventId) {
		id = event.id;
	}

	const response = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${id}`, 'DELETE', null);
	return response;
}


export async function deleteEvent(
	event: GoogleEvent,
	deleteAllOccurrences = false
): Promise<boolean> {
	try {
		const response = await googleDeleteEvent(event, deleteAllOccurrences);
		createNotice(`Google Event ${event.summary} deleted.`);
		return response;
	} catch (error) {
        if(!(error instanceof GoogleApiError)){
            return false;
        }

		switch (error.status) {
            case 401: break;
            case 999: 
                createNotice(error.message)
                break;
            default:
                createNotice(`Google Event ${event.summary} could not be deleted.`);
                console.error('[GoogleCalendar]', error);
                break;
        }

		return false;
	}
}
