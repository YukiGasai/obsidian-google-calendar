/**
 * This file helps to find the right colors for each event
 * Google is using specific colors accessible by an api endpoint
 * To save request we keep the colors saved
 * There is a difference in calendar and event color
 * 		Changing a color of an event the color is stores as a event color 
 * 		Keeping the color the calendar color will be used
 */

import type { GoogleEvent } from "../helper/types";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";

const calendarColors = new Map<string, string>();
const eventColors = new Map<string, string>();

/**
 * Get all possible colors from the google API and store them 
 * Run once on plugin startup
 */
export async function getGoogleColors(): Promise<void> {

	if (!settingsAreCompleteAndLoggedIn()) return;
	if (calendarColors.size) return;

	const colorData = await callRequest(`https://www.googleapis.com/calendar/v3/colors`, "GET", null);

	if (!colorData) {
		createNotice("Error fetching color data from google");
		return;
	}

	Object.keys(colorData.calendar).forEach(key => {
		calendarColors.set(key, colorData.calendar[key].background);
	});

	Object.keys(colorData.event).forEach(key => {
		eventColors.set(key, colorData.event[key].background);
	});

}

/**
 *  This function just returns the true color of an event
 * @param event  to get the color from
 * @returns a hex color string 
 */
export function getColorFromEvent(event: GoogleEvent): string {

	if (event.colorId && eventColors.has(event.colorId)) {
		return eventColors.get(event.colorId);

	} else if (event.parent.colorId && calendarColors.has(event.parent.colorId)) {
		return calendarColors.get(event.parent.colorId);

	} else {
		//Default color for any errors
		return "#a4bdfc"
	}
}
