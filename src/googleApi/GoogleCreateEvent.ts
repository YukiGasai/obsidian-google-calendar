import type { GoogleEvent } from "../helper/types";

import { createNotice } from "../helper/NoticeHelper";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";



/**
 * 	Function to create a simple event for recurrence events the browser is needed 
 * This could be changed TODO
 * @param event The event we want to create at the api
 * @returns The created Event
 */
export async function googleCreateEvent(event: GoogleEvent): Promise<GoogleEvent> {
	const plugin = GoogleCalendarPlugin.getInstance();

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken())
	);
	requestHeaders.append("Content-Type", "application/json");

	const calenderId = event.parent.id;


	event.start.timeZone = event.parent.timeZone;
	event.end.timeZone = event.parent.timeZone;

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

		const createdEvent = await updateResponse.json();

		return createdEvent;
	} catch (error) {
		createNotice("Could not create google event");
		return null;
	}
}
