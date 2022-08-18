/**
 * This file helps to find the right colors for each event
 * Google is using specific colors accessable by an api endpoint
 * To save request we keep the colors saved
 * There is a difference in calendar and event color
 * 		Changing a color of an event the color is stores as a event color 
 * 		Keeping the color the calendar color will be used
 */

import type { GoogleEvent } from "../helper/types";
import GoogleCalendarPlugin from './../GoogleCalendarPlugin';
import { requestUrl } from 'obsidian';

const calendarColors = new Map<string, string>();
const eventColors    = new Map<string, string>();

/**
 * Get all possible colors from the google API and store them 
 * Run once on plugin startup
 */
export async function getGoogleColors():Promise<void> {

	const plugin = GoogleCalendarPlugin.getInstance();

	const response = await requestUrl({
		url: `https://www.googleapis.com/calendar/v3/colors?key=${plugin.settings.googleApiToken}`,
		method: "GET",
		contentType: "application/json",
	})

	const colorData = response.json;

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