import {
	GoogleCalander,
	GoogleEvent,
	GoogleEventList,
} from "./../helper/types";
import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleAuthToken } from "./GoogleAuth";

import { moment } from "obsidian";
import { googleListCalendars } from "./GoogleListCalendars";

export async function googleListTodayEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	googleCalander: GoogleCalander
): Promise<GoogleEvent[]> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	const today = moment().format("YYYY-MM-DD");

	let requestUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
		googleCalander.id
	)}/events`;
	requestUrl += `?key=${plugin.settings.googleApiToken}`;
	requestUrl += `&timeMin=${today}T00%3A00%3A00Z`;
	requestUrl += `&timeMax=${today}T23%3A59%3A59Z`;

	try {
		const response = await fetch(requestUrl, {
			method: "GET",
			headers: requestHeaders,
		});
		const eventList: GoogleEventList = await response.json();
		eventList.items.forEach((event) => {
			event.parent = googleCalander;
		});
		return eventList.items;
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not load google events");
		return [];
	}
}

export async function googleListTodayEvents(
	plugin: GoogleCalendarPlugin
): Promise<GoogleEvent[]> {
	try {
		const calendarList = await googleListCalendars(plugin);

		let eventList: GoogleEvent[] = [];

		for (let i = 0; i < calendarList.length; i++) {
			const events = await googleListTodayEventsByCalendar(
				plugin,
				calendarList[i]
			);
			eventList = [...eventList, ...events];
		}

		const eventListNoDate = eventList.filter(
			(event) => event.start.dateTime == undefined
		);
		eventList = eventList.filter((event) => event.start.dateTime);

		const e = eventList.map((event) =>
			new Date(event.start.dateTime).getHours()
		);

		console.log(e);

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
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not load google events");
		return [];
	}
}
