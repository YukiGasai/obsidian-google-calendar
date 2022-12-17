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
export async function googleRemoveEvent(
	event: GoogleEvent,
	deleteSingle = false
): Promise<boolean> {

	if(!settingsAreCompleteAndLoggedIn())return false;

	// Use the recurrence id to delete all events from a recurring task
	let id = event.recurringEventId ?? event.id;

	if (deleteSingle && event.recurringEventId) {
		id = event.id;
	}

	const response = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${event.parent.id}/events/${id}`, 'DELETE', null);
	if(response){
		return true;
	}else{
		return false
	}
}
