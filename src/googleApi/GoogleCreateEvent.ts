import type { GoogleEvent } from "../helper/types";

import { createNotice } from "../helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";


/**
 * 	Function to create a simple event for recurrence events the browser is needed 
 * This could be changed TODO
 * @param event The event we want to create at the api
 * @returns The created Event
 */
export async function googleCreateEvent(event: GoogleEvent|any): Promise<GoogleEvent> {

	if(!settingsAreCompleteAndLoggedIn())return null;

	const calenderId = event.parent.id;

	event.start.timeZone = event.parent.timeZone;
	event.end.timeZone = event.parent.timeZone;

	delete event.parent;
	const createdEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events`, 'POST', event)

	if (!createdEvent) {
		createNotice("Could not create Google Event");
		return null;
	}
		
	createNotice(`Google Event ${createdEvent.summary} created`, true);

	return createdEvent;

}
