/**
 * The Event Processor is checking the edior for plugin specific codeblocks
 * marked with gEvent and replaces them with custom widgets 
 * from svelte components
 */

import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { Platform, moment } from "obsidian";
import TimeLineViewComp from "../svelte/TimeLineViewComp.svelte";
import WebFrameComp from "../svelte/WebFrameComp.svelte";
import CalendarComp from "../svelte/CalendarComp.svelte";

/**
 * This functions turns the string of the codeblock into a settings object
 * @param codeBlock inpup string containing settings
 * @returns a Settingsobject
 */
function getKeyValueList(codeBlock: string): Map<string, string> {
	const options = codeBlock.split("\n");

	const result = new Map<string, string>();

	options.forEach((option) => {
		const parts = option.split(":");

		if (parts.length == 2) {
			result.set(
				parts[0].trim().toLowerCase(),
				parts[1].trim().toLowerCase()
			);
		}
	});

	return result;
}

/**
 * This function converts the codeblock into a svelte widget
 * There are multiple settings a user can set:
 * 
 * 	necessary:
 * 		   type: {day, month, web} selects which widget is displayed
 * 	 optional:
 * 		  date : The day that the widget should display / start at
 * 		  width: The width of the widget
 * 		  height The height of the widget
 *  
 * @param text the text of the codeblock
 * @param el the container element for the codeblock widget
 * @param plugin Refrence to the main plugin to acess the settings 
 */
export async function checkEditorForCodeBlocks(
	text: string,
	el: HTMLElement,
	plugin: GoogleCalendarPlugin
): Promise<void> {
	const options = getKeyValueList(text);

	const blockType = options.has("type")
		? options.get("type") 
		: "day";

	const blockWidth = options.has("width")
		? parseInt(options.get("width"))
		: undefined;

	const blockHeight:number = options.has("height")
		? parseInt(options.get("height"))
		: undefined;

	const blockDateString = options.has("date")
		? options.get("date")
		: undefined

	const hasNavigation = options.has("navigation")
	? options.get("navigation")
	: undefined

	el.style.width = blockWidth + "px";
	el.style.height = blockHeight + "px";

	if (
		blockDateString == undefined ||
		blockDateString == "today" ||
		blockDateString == "tomorrow" ||
		blockDateString == "yesterday" ||
		moment(blockDateString, "YYYY-MM-DD", true).isValid() ||
		moment(blockDateString, "YYYY.MM.DD", true).isValid() ||
		moment(blockDateString, "YYYY/MM/DD", true).isValid() ||
		moment(blockDateString, "MM-DD-YYYY", true).isValid() ||
		moment(blockDateString, "MM.DD.YYYY", true).isValid() ||
		moment(blockDateString, "MM/DD/YYYY", true).isValid() ||
		moment(blockDateString, "DD-MM-YYYY", true).isValid() ||
		moment(blockDateString, "DD.MM.YYYY", true).isValid() ||
		moment(blockDateString, "DD/MM/YYYY", true).isValid()
	) {
		let blockDate:moment.Moment;

		if(blockDateString == undefined){
			blockDate = undefined
		}else if(blockDateString == "today"){
			blockDate = moment();
		}else if (blockDateString == "tomorrow"){
			blockDate = moment().add(1, "day");
		}else if (blockDateString == "yesterday"){
			blockDate = moment().subtract(1, "day");
		}else{
			blockDate = moment(blockDateString);
		}


		el.style.padding = "10px"

		if (blockType == "web") {
			if (Platform.isDesktopApp) {
				new WebFrameComp({
					target: el,
					props: {
						height: blockHeight,
						width: blockWidth,
						date: blockDate,
					},
				});
			}
		} else if (blockType == "day") {
			new TimeLineViewComp({
				target: el,
				props: {
					plugin: plugin,
					height: blockHeight,
					width: blockWidth,
					date: blockDate,
					navigation: hasNavigation=="true"
				},
			});
		} else if (blockType == "month") {
			new CalendarComp({
				target: el,
				props: {
					plugin: plugin,
					height: blockHeight,
					width: blockWidth,
					displayedMonth: blockDate,
				},
			});
		}
	}
}
