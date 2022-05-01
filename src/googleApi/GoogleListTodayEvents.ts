import { GoogleEvent, GoogleEventList } from "./../helper/types";
import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleAuthToken } from "./GoogleAuth";

import { moment } from "obsidian";

export async function googleListTodayEvents(
	plugin: GoogleCalendarPlugin,
	calendarId: string
): Promise<GoogleEvent[]> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	const today = moment().format("YYYY-MM-DD");

	let requestUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
	requestUrl += `?key=${plugin.settings.googleApiToken}`;
	requestUrl += `&timeMin=${today}T00%3A00%3A00Z`;
	requestUrl += `&timeMax=${today}T23%3A59%3A59Z`;

	console.log(requestUrl);
	try {
		const response = await fetch(requestUrl, {
			method: "GET",
			headers: requestHeaders,
		});
		const eventList: GoogleEventList = await response.json();

		return eventList.items;
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not load google events");
		return [];
	}
}
