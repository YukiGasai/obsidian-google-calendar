import type { GoogleEvent } from "../helper/types";

import { createNotice } from "../helper/NoticeHelper";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";
import { requestUrl } from 'obsidian';
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
	const updateResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events`,{
		//url: `https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events`,
		method: "POST",
		headers: {"Authorization": "Bearer " + (await getGoogleAuthToken())},
		body: JSON.stringify(event),
	});

	if (updateResponse.status !== 200) {
		createNotice("Could not create Google Event");
		return null;
	}

	const createdEvent = await updateResponse.json();
	
	createNotice(`Google Event ${createdEvent.summary} created`);

	return createdEvent;

}
