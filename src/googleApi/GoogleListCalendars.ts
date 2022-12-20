import type { GoogleCalendar, GoogleCalendarList } from "./../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleColors } from "./GoogleColors";
import { callRequest } from "src/helper/RequestWrapper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";

let cachedCalendars:GoogleCalendar[] = []

/**
 * This function is used to filter out all calendars that are on the users blacklist
 * @param plugin a reference to the main plugin object
 * @param calendars The list of all possible calendars
 * @returns The filtered list of calendars
 */
function filterCalendarsByBlackList(plugin:GoogleCalendarPlugin, calendars:GoogleCalendar[]):GoogleCalendar[]{
	//Remove the calendars contained in the blacklist
	const filteredCalendars = calendars.filter((calendar) => {
		return !plugin.settings.calendarBlackList.some(
			(c) => c[0] == calendar.id
		);
	});
	return filteredCalendars;
}


/**
 * This functions get all google calendars from the user that were not Black listed by him
 * The function will check if there are already saved calendars if not it will request them from the google API
 * @returns A List of Google Calendars
 */
export async function googleListCalendars(): Promise<GoogleCalendar[]> {

	if(!settingsAreCompleteAndLoggedIn())return [];

	const plugin = GoogleCalendarPlugin.getInstance();

	if(cachedCalendars.length){
		//Filter for every request instead of caching the filtered result to allow hot swap settings
		return filterCalendarsByBlackList(plugin,cachedCalendars);
	}

	//Make sure the colors for calendar and events are loaded before getting the first calendar
	await getGoogleColors();

	const calendarList: GoogleCalendarList = await callRequest(`https://www.googleapis.com/calendar/v3/users/me/calendarList`, "GET", null)

	if (!calendarList) {
		createNotice("Could not list Google Calendars");
		return [];
	}

	cachedCalendars = calendarList.items;

	const calendars = filterCalendarsByBlackList(plugin, calendarList.items);

	return calendars;
}
