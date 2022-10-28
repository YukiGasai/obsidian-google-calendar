import type { GoogleEvent } from "../helper/types";

import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";
import { requestUrl } from 'obsidian';
import {getToken} from "../helper/LocalStorage"
/**
 * This function will remove the event from the google api
 * If the event is recurrent is will delete all it's instanced except if deleteSingle is set
 * @param event The event to delete
 * @param deleteSingle If set to true and if the event is recurrent only one instance is deleted
 * @returns a boolean if the deletion was successfull
 */
export async function googleRemoveEvent(
	event: GoogleEvent,
	deleteSingle = false
): Promise<boolean> {

	if(!settingsAreCompleteAndLoggedIn())return false;

	// Use the reacurance id to delete all events from a reacuring task
	let id = event.recurringEventId ?? event.id;

	if (deleteSingle && event.recurringEventId) {
		id = event.id;
	}

	const response = await requestUrl({
		url: `https://www.googleapis.com/calendar/v3/calendars/${event.parent.id}/events/${id}?key=${getToken()}`,
		method: "DELETE",
		contentType: "application/json",
		headers: {"Authorization": "Bearer " + (await getGoogleAuthToken())},
	});
	return response.status == 204;
}
