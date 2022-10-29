import { requestUrl } from "obsidian";
import { getGoogleAuthToken } from "./GoogleAuth";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import type { GoogleEvent } from "../helper/types";
import { createNotice } from "../helper/NoticeHelper";
/**
 * Function to get information of a single event by id
 * @param eventId The id of the event
 * @param calendarId The id of the calendar the event is in
 * @returns The found Event
 */
 export async function googleGetEvent(eventId: string, calendarId?: string): Promise<GoogleEvent> {
	
	if(!settingsAreCompleteAndLoggedIn())return null;

	const updateResponse = await requestUrl({
		url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
		headers: {"Authorization": "Bearer " + (await getGoogleAuthToken())},
	});

	if (updateResponse.status !== 200) {
		createNotice("Could not get Google Event");
		return null;
	}


	const createdEvent = await updateResponse.json;
	return createdEvent;
}