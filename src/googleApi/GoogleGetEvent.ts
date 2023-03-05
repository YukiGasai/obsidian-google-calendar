import type { GoogleEvent } from "../helper/types";
import { callRequest } from "src/helper/RequestWrapper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { googleListCalendars } from "./GoogleListCalendars";
import { GoogleCacheHandler } from "./GoogleCacheHandler";
/**
 * Function to get information of a single event by id
 * @param eventId The id of the event
 * @param calendarId The id of the calendar the event is in
 * @returns The found Event
 */
export async function googleGetEvent(eventId: string, calendarId?: string): Promise<GoogleEvent> {

	if (!settingsAreCompleteAndLoggedIn()) return null;

	const createdEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, "GET", null)
	createdEvent.parent = (await googleListCalendars()).find(calendar => calendar.id === calendarId);
	if (!createdEvent) {
		createNotice("Could not get Google Event");
		return null;
	}

	//GoogleCacheHandler.getInstance().createEvent(createdEvent, false);

	return createdEvent;
}