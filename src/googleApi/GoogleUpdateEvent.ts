import type { GoogleEvent } from "../helper/types";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { createNotice } from "../helper/NoticeHelper";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";

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
	const plugin = GoogleCalendarPlugin.getInstance();

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken())
	);
	requestHeaders.append("Content-Type", "application/json");

	// Use the reacurance id to update all events from a reacuring task
	let id = event.recurringEventId ?? event.id;

	//Check if the user wants to update all events from a reacrung task
	if (updateSingle && event.recurringEventId) {
		id = event.id;
	}
 
	//clean the event object to send it to the api directly
	const calenderId = event.parent.id;
	delete event.parent;

	try {
		const updateResponse = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events/${id}?key=${plugin.settings.googleApiToken}`,
			{
				method: "PUT",
				headers: requestHeaders,
				body: JSON.stringify(event),
			}
		);

		const updatedEvent = await updateResponse.json();

		return updatedEvent;
	} catch (error) {
		createNotice("Could not delete google event");
		return;
	}
}
