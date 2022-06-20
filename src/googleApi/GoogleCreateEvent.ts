import { createNotice } from "../helper/NoticeHelper";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import type { GoogleEvent } from "../helper/types";

export async function googleCreateEvent(
	plugin: GoogleCalendarPlugin,
	event: GoogleEvent
): Promise<GoogleEvent> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	const calenderId = event.parent.id;

	console.log(event);

	delete event.parent;

	try {
		const updateResponse = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events?key=${plugin.settings.googleApiToken}`,
			{
				method: "POST",
				headers: requestHeaders,
				body: JSON.stringify(event),
			}
		);

		const updatedEvent = await updateResponse.json();

		return updatedEvent;
	} catch (error) {
		createNotice(plugin, "Could not create google event");
		return;
	}
}
