import type { GoogleEvent } from "../helper/types";

import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";

/**
 * This function will remove the event from the google api
 * If the event is recurrent is will delete all it's instanced except if deleteSingle is set
 * @param event The event to delete
 * @param deleteSingle If set to true and if the event is recurrent only one instance is deleted
 * @returns a boolean if the deletion was successfull
 */
export async function googleRemoveEvent(
	event: GoogleEvent,
	deleteSingle = false
): Promise<boolean> {

	const plugin = GoogleCalendarPlugin.getInstance();

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken())
	);
	requestHeaders.append("Content-Type", "application/json");

	// Use the reacurance id to delete all events from a reacuring task
	let id = event.recurringEventId ?? event.id;

	if (deleteSingle && event.recurringEventId) {
		id = event.id;
	}

	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${event.parent.id}/events/${id}?key=${plugin.settings.googleApiToken}`,
		{
			method: "DELETE",
			headers: requestHeaders,
			redirect: "follow",
		}
	);
	return response.status == 204;
}
