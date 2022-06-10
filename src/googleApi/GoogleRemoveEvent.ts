import type { GoogleEvent } from "../helper/types";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";
import { createNotice } from "../helper/NoticeHelper";

export async function googleRemoveEvent(
	plugin: GoogleCalendarPlugin,
	event: GoogleEvent
) {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	try {
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${event.parent.id}/events/${event.id}?key=${plugin.settings.googleApiToken}`,
			{
				method: "REMOVE",
				headers: requestHeaders,
			}
		);
	} catch (error) {
		createNotice(plugin, "Could not delete google event");
		return [];
	}
}

export async function googleRemoveEventOnce(
	plugin: GoogleCalendarPlugin,
	event: GoogleEvent,
	currentDate: moment.Moment
) {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	try {
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${event.parent.id}/events/${event.id}/instances?key=${plugin.settings.googleApiToken}`,
			{
				method: "GET",
				headers: requestHeaders,
			}
		);

		const instaces = await response.json();

		let instance: GoogleEvent;

		for (let i = 0; i < instaces.items.length; i++) {
			let tmpEvent: GoogleEvent = instaces.items[i];
			const tmpDate = tmpEvent.start.dateTime
				? window.moment(tmpEvent.start.dateTime)
				: window.moment(tmpEvent.start.date);

			console.log(
				tmpEvent.start.dateTime == event.start.dateTime,
				tmpEvent.start.dateTime,
				event.start.dateTime
			);

			if (tmpDate.isSame(currentDate, "day")) {
				instance = instaces.items[i];
				break;
			}
		}

		if (!instance) {
			googleRemoveEvent(plugin, event);
		}
		console.log(instance);
		instance.status = "cancelled";

		const deleteResponse = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/${event.parent.id}/events/${instance.id}?key=${plugin.settings.googleApiToken}`,
			{
				method: "PUT",
				headers: requestHeaders,
				body: JSON.stringify(instance),
			}
		);
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not delete google event");
		return [];
	}
}
