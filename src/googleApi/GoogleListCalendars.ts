import type { GoogleCalander, GoogleCalanderList } from "./../helper/types";
import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";

import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleAuthToken } from "./GoogleAuth";

export async function googleListCalendars(
	plugin: GoogleCalendarPlugin
): Promise<GoogleCalander[]> {
	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
	);
	requestHeaders.append("Content-Type", "application/json");

	try {
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/users/me/calendarList?key=${plugin.settings.googleApiToken}`,
			{
				method: "GET",
				headers: requestHeaders,
			}
		);
		const calendarList: GoogleCalanderList = await response.json();

		const calendars = calendarList.items.filter((calendar) => {
			const foundIndex = plugin.settings.calendarBlackList.findIndex(
				(c) => c[0] == calendar.id
			);

			return foundIndex == -1;
		});

		return calendars;
	} catch (error) {
		createNotice(plugin, "Could not load google calendars");
		return [];
	}
}
