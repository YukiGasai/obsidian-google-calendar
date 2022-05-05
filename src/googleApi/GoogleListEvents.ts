import type {
	GoogleCalander,
	GoogleEvent,
	GoogleEventList,
} from "../helper/types";
import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleAuthToken } from "./GoogleAuth";

import { moment } from "obsidian";
import { googleListCalendars } from "./GoogleListCalendars";

export function sortEventsRecentFirst(eventList: GoogleEvent[]): GoogleEvent[] {
	const eventListNoDate = eventList.filter((event) => !event.start.dateTime);

	eventList = eventList.filter((event) => event.start.dateTime);

	eventList = eventList.sort((a, b) => {
		const dateA = new Date(a.start.dateTime);
		const dateB = new Date(b.start.dateTime);

		if (dateA.getHours() == dateB.getHours()) {
			return dateA.getMinutes() - dateB.getMinutes();
		} else {
			return dateA.getHours() - dateB.getHours();
		}
	});

	eventList = [...eventListNoDate, ...eventList];
	return eventList;
}

export async function googleListEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	googleCalander: GoogleCalander,
	date: string
) {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	let requestUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
		googleCalander.id
	)}/events`;
	requestUrl += `?key=${plugin.settings.googleApiToken}`;
	requestUrl += `&timeMin=${date}T00%3A00%3A00Z`;
	requestUrl += `&timeMax=${date}T23%3A59%3A59Z`;

	try {
		const response = await fetch(requestUrl, {
			method: "GET",
			headers: requestHeaders,
		});
		const eventList: GoogleEventList = await response.json();
		eventList.items.forEach((event) => {
			event.parent = googleCalander;
		});

		return sortEventsRecentFirst(eventList.items);
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not load google events");
		return [];
	}
}

export async function googleListEvents(
	plugin: GoogleCalendarPlugin,
	date: string
): Promise<GoogleEvent[]> {
	try {
		const calendarList = await googleListCalendars(plugin);

		let eventList: GoogleEvent[] = [];

		for (let i = 0; i < calendarList.length; i++) {
			const events = await googleListEventsByCalendar(
				plugin,
				calendarList[i],
				date
			);
			eventList = [...eventList, ...events];
		}

		return sortEventsRecentFirst(eventList);
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not load google events");
		return [];
	}
}

export async function googleListTodayEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	googleCalander: GoogleCalander
): Promise<GoogleEvent[]> {
	const today = moment().format("YYYY-MM-DD");
	const list = await googleListEventsByCalendar(
		plugin,
		googleCalander,
		today
	);
	return list;
}

export async function googleListTodayEvents(
	plugin: GoogleCalendarPlugin
): Promise<GoogleEvent[]> {
	const today = moment().format("YYYY-MM-DD");
	const list = await googleListEvents(plugin, today);
	return list;
}
