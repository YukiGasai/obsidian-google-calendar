/**
 * This file helps to find the right colors for each event
 * Google is using specific colors accessible by an api endpoint
 * To save request we keep the colors saved
 * There is a difference in calendar and event color
 * 		Changing a color of an event the color is stores as a event color 
 * 		Keeping the color the calendar color will be used
 */

import type { GoogleEvent } from "../helper/types";

const calendarColors = {
   "1": {
		"hex": "#ac725e",
		name: "0"
   },
   "2": {
		"hex": "#d06b64",
		name: "0"
   },
   "3": {
		"hex": "#f83a22",
		name: "0"
   },
   "4": {
		"hex": "#fa573c",
		name: "0"
   },
   "5": {
		"hex": "#ff7537",
		name: "0"
   },
   "6": {
		"hex": "#ffad46",
		name: "0"
   },
   "7": {
		"hex": "#42d692",
		name: "0"
   },
   "8": {
		"hex": "#16a765",
		name: "0"
   },
   "9": {
		"hex": "#7bd148",
		name: "0"
   },
   "10": {
		"hex": "#b3dc6c",
		name: "0"
   },
   "11": {
		"hex": "#fbe983",
		name: "0"
   },
   "12": {
		"hex": "#fad165",
		name: "0"
   },
   "13": {
		"hex": "#92e1c0",
		name: "0"
   },
   "14": {
		"hex": "#9fe1e7",
		name: "0"
   },
   "15": {
		"hex": "#9fc6e7",
		name: "0"
   },
   "16": {
		"hex": "#4986e7",
		name: "0"
   },
   "17": {
		"hex": "#9a9cff",
		name: "0"
   },
   "18": {
		"hex": "#b99aff",
		name: "0"
   },
   "19": {
		"hex": "#c2c2c2",
		name: "0"
   },
   "20": {
		"hex": "#cabdbf",
		name: "0"
   },
   "21": {
		"hex": "#cca6ac",
		name: "0"
   },
   "22": {
		"hex": "#f691b2",
		name: "0"
   },
   "23": {
		"hex": "#cd74e6",
		name: "0"
   },
   "24": {
		hex: "#a47ae2",
		name: "0"
   }
};
const eventColors = {
	"1": {
		hex: "#a4bdfc",
		name: "Lavender"
	},
	"2": {
		hex: "#7ae7bf",
		name: "Sage"
	},
	"3": {
		hex: "#dbadff",
		name: "Grape"
	},
	"4": {
		hex: "#ff887c",
		name: "Flamingo"
	},
	"5": {
		hex: "#fbd75b",
		name: "Banana"
	},
	"6": {
		hex: "#ffb878",
		name: "Tangerine"
	},
	"7": {
		hex: "#46d6db",
		name: "Peacock"
	},
	"8": {
		hex: "#e1e1e1",
		name: "Graphite"
	},
	"9": {
		hex: "#5484ed",
		name: "Blueberry"
	},
	"10": {
		hex: "#51b749",
		name: "Basil"
	},
	"11": {
		hex: "#dc2127",
		name: "Tomato"
	}
}

export const allColorNames = [
	...new Set([
		...Object.values(eventColors).map(color => color.name),
		...Object.values(calendarColors).map(color => color.name)
	])
];

export const allEventColorsNames = [
	...Object.values(eventColors).map(color => color.name),
];

/**
 *  This function just returns the true color of an event
 * @param event  to get the color from
 * @returns a hex color string 
 */
export function getColorFromEvent(event: GoogleEvent): string {

	if (event.colorId) {
		return eventColors[event.colorId].hex;

	} else if (event.parent.colorId) {
		return calendarColors[event.parent.colorId].hex;

	} else {
		//Default color for any errors
		return "#a4bdfc"
	}
}

/**
 *  This function just returns the true color of an event
 * @param event  to get the color from
 * @returns a hex color string 
 */
export function getColorNameFromEvent(event: GoogleEvent): string {

	if (event.colorId) {
		return eventColors[event.colorId].name;

	} else if (event.parent.colorId) {
		return "NOT IMPLEMENTED"
		// Not implemented + custom colors will cause problems
		//return calendarColors[event.parent.colorId].name;

	} else {
		//Default name for any errors
		return "NO COLOR"
	}
}
