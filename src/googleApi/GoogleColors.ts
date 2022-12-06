/**
 * This file helps to find the right colors for each event
 * Google is using specific colors accessible by an api endpoint
 * To save request we keep the colors saved
 * There is a difference in calendar and event color
 * 		Changing a color of an event the color is stores as a event color 
 * 		Keeping the color the calendar color will be used
 */

import type { GoogleEvent } from "../helper/types";
import { requestUrl } from 'obsidian';
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { getGoogleAuthToken } from "../googleApi/GoogleAuth";

const calendarColors = new Map<string, string>();
const eventColors    = new Map<string, string>();

/**
 * Get all possible colors from the google API and store them 
 * Run once on plugin startup
 */
export async function getGoogleColors():Promise<void> {

	if(!settingsAreCompleteAndLoggedIn())return;

	const response = await requestUrl({
		url:`https://www.googleapis.com/calendar/v3/colors`,
		headers: {"Authorization": "Bearer " + (await getGoogleAuthToken())},
	})

	if (response.status !== 200) {
		createNotice("Could not load Google Colors");
		return;
	}

	const colorData = await response.json;

	for (let i = 1; ; i++) {
		const color = colorData.calendar[i+""]?.background;
		if(!color)break;
		
		calendarColors.set(i+"", color)
	}

	for (let i = 1; ; i++) {
		const color = colorData.event[i+""]?.background;
		if(!color)break;
		
		eventColors.set(i+"", color)
	}
} 

/**
 *  This function just returns the true color of an event
 * @param event  to get the color from
 * @returns a hex color string 
 */
export function getColorFromEvent(event: GoogleEvent): string {

	if(event.colorId && eventColors.has(event.colorId)) {
		return eventColors.get(event.colorId);
		
	}else if( event.parent.colorId && calendarColors.has(event.parent.colorId)){
		return calendarColors.get(event.parent.colorId);

	} else {
		//Default color for any errors
		return "#a4bdfc"
	}
}