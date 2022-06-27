/**
 * This file helps to find the right colors for each event
 * Google is using specific colors accessable by an api endpoint
 * To save request we keep the colors saved
 * There is a difference in calendar and event color
 * 		Changing a color of an event the color is stores as a event color 
 * 		Keeping the color the calendar color will be used
 */

import type { GoogleEvent } from "../helper/types";

export function googleCalendarColors(): string[] {
	return [
		"#ac725e",
		"#d06b64",
		"#f83a22",
		"#fa573c",
		"#ff7537",
		"#ffad46",
		"#42d692",
		"#16a765",
		"#7bd148",
		"#b3dc6c",
		"#fbe983",
		"#fad165",
		"#92e1c0",
		"#9fe1e7",
		"#9fc6e7",
		"#4986e7",
		"#9a9cff",
		"#b99aff",
		"#c2c2c2",
		"#cabdbf",
		"#cca6ac",
		"#f691b2",
		"#cd74e6",
		"#a47ae2",
	];
}

export function googleEventColors(): string[] {
	return [
		"#a4bdfc",
		"#7ae7bf",
		"#dbadff",
		"#ff887c",
		"#fbd75b",
		"#ffb878",
		"#46d6db",
		"#e1e1e1",
		"#5484ed",
		"#51b749",
		"#dc2127",
	];
}


/**
 *  This function just returns the true color of an event
 * @param event  to get the color from
 * @returns a hex color string 
 */
export function getColorFromEvent(event: GoogleEvent): string {
	if(event.colorId) {
		return googleEventColors()[event.colorId]
	}else if( event.parent.colorId ){
		return googleCalendarColors()[event.parent.colorId]
	} else {
		return "#a4bdfc"
	}

}