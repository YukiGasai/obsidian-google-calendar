import { requestUrl } from "obsidian";
import { getGoogleAuthToken } from "./GoogleAuth";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import type { GoogleEvent } from "../helper/types";

/**
 * Function to get information of a single event by id
 * @param eventId The id of the event
 * @param calendarId The id of the calendar the event is in
 * @returns The found Event
 */
 export async function googleGetEvent(eventId: string, calendarId: string): Promise<GoogleEvent> {
	const plugin = GoogleCalendarPlugin.getInstance();

	const updateResponse = await requestUrl({
		url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}?key=${plugin.settings.googleApiToken}`,
		method: "GET",
		headers: {"Authorization": "Bearer " + (await getGoogleAuthToken())},
	});
	const createdEvent = await updateResponse.json;
	return createdEvent;
}