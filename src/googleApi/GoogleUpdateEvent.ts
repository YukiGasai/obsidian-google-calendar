import type { GoogleEvent } from "../helper/types";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";
/**
 * This function can update simple properties of an event at the api.
 * If the event is recurrent is will update all it's instanced except if updateSingle is set
 * There can occur errors when updating an event. A more save version is to delete and re-create the event
 * @param event The event to update and its data
 * @param updateSingle If set to true and if the event is recurrent only one instance is updated
 * @returns the updated event
 */
export async function googleUpdateEvent(
	event: GoogleEvent,
	updateSingle = false
): Promise<GoogleEvent> {
	if(!settingsAreCompleteAndLoggedIn())return null;

	// Use the recurrence id to update all events from a recurring task
	let id = event.recurringEventId ?? event.id;

	//Check if the user wants to update all events from a recurring task
	if (updateSingle && event.recurringEventId) {
		id = event.id;
	}
 
	//clean the event object to send it to the api directly
	const calenderId = event.parent.id;
	delete event.parent;


	const updatedEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events/${id}`, "PUT", event)

	if (!updatedEvent) {
		createNotice("Could not create Google Event");
		return null;
	}

	createNotice("Updated Event", true);

	return updatedEvent;
	
}
