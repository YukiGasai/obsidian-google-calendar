import type { GoogleEvent } from "../helper/types";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";

export async function googleRemoveEvent(
	plugin: GoogleCalendarPlugin,
	event: GoogleEvent,
	deleteSingle = false
): Promise<boolean> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	// Use the reacurance id to delete all events from a reacuring task
	let id = event.recurringEventId ?? event.id;

	if (deleteSingle && event.recurringEventId) {
		id = event.id;
	}

	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${event.parent.id}/events/${id}?key=AIzaSyD3TpUOD5tMkhmv2SFFFGpL81D5pMJHTd8`,
		{
			method: "DELETE",
			headers: requestHeaders,
			redirect: "follow",
		}
	);
	return response.status == 204;
}
