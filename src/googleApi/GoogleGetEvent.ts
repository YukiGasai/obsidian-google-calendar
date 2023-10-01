import type { GoogleEvent } from "../helper/types";
import { callRequest } from "src/helper/RequestWrapper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { googleListCalendars } from "./GoogleListCalendars";
import { GoogleApiError } from "./GoogleApiError";
/**
 * Function to get information of a single event by id
 * @param eventId The id of the event
 * @param calendarId The id of the calendar the event is in
 * @returns The found Event
 */
export async function googleGetEvent(eventId: string, calendarId?: string): Promise<GoogleEvent> {

	if (!settingsAreCompleteAndLoggedIn()){
		throw new GoogleApiError("Not logged in", null, 401, {error: "Not logged in"})
	};
	
	const calendars = await googleListCalendars();
	if(calendarId){
		const foundEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, "GET", null)
		foundEvent.parent = calendars.find(calendar => calendar.id === calendarId);
		return foundEvent;
	}

	for (const calendar of calendars) {
		try {
			const foundEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendar.id}/events/${eventId}`, "GET", null)
			if(foundEvent && foundEvent.id === eventId){
				foundEvent.parent = calendar;
				return foundEvent;
			}
		} catch(err) {
			//Do nothing
		}
	}

}

export async function getEvent(eventId: string, calendarId?: string): Promise<GoogleEvent> {
	try {
		let foundEvent = await googleGetEvent(eventId, calendarId);
		return foundEvent;
	} catch (error) {
        if(!(error instanceof GoogleApiError)){
            return null;
        }

		switch (error.status) {
            case 401: break;
            case 999: 
                createNotice(error.message)
                break;
            default:
                createNotice(`Could not get Google Event.`);
                console.error('[GoogleCalendar]', error);
                break;
        }
		return null;
	}
}