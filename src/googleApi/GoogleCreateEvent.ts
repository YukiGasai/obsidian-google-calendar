import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import type { GoogleEvent } from "../helper/types";

import { createNotice } from "../helper/NoticeHelper";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";


/**
 * 	Function to create a simple event for recurrence events the browser is needed 
 * This could be changed TODO
 * @param plugin Refrence to the main plugin to acess the settings
 * @param event The event we want to create at the api
 * @returns The created Event
 */
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
		createNotice(plugin, "Could not create google event");
		return null;
	}
}
