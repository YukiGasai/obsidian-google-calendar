import type { GoogleCalander } from "./../helper/types";
import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import type { GoogleCalanderList } from "src/helper/types";
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
		console.log(calendarList.items, plugin.settings.calendarBlackList);
		let calendars = calendarList.items.filter(
			(calendar) =>
				plugin.settings.calendarBlackList.findIndex(
					(c) => c[0] == calendar.id
				) == -1
		);

		return calendars;
	} catch (error) {
		createNotice(plugin, "Could not load google calendars");
		return [];
	}
}
