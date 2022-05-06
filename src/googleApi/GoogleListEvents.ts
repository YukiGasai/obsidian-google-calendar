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
		return (
			new Date(a.start.dateTime).getTime() -
			new Date(b.start.dateTime).getTime()
		);
	});

	eventList = [...eventListNoDate, ...eventList];
	return eventList;
}

export async function googleListEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	googleCalander: GoogleCalander,
	date: string,
	endDate?: string
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
	if (endDate) {
		requestUrl += `&timeMax=${endDate}T23%3A59%3A59Z`;
	} else {
		requestUrl += `&timeMax=${date}T23%3A59%3A59Z`;
	}

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
	date: string,
	endDate?: string
): Promise<GoogleEvent[]> {
	try {
		const calendarList = await googleListCalendars(plugin);

		let eventList: GoogleEvent[] = [];

		for (let i = 0; i < calendarList.length; i++) {
			const events = await googleListEventsByCalendar(
				plugin,
				calendarList[i],
				date,
				endDate
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

export async function googleListEventsByMonth(
	plugin: GoogleCalendarPlugin,
	dateInMonth: string
): Promise<GoogleEvent[]> {
	const monthStartDate = moment(dateInMonth)
		.startOf("month")
		.format("YYYY-MM-DD");
	const monthEndDate = moment(dateInMonth)
		.endOf("month")
		.format("YYYY-MM-DD");

	const list = await googleListEvents(plugin, monthStartDate, monthEndDate);
	console.log(list);
	return list;
}
