/**
 * The Event Processor is checking the edior for plugin specific codeblocks
 * marked with gEvent and replaces them with custom widgets 
 * from svelte components
 */

import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { Platform, moment } from "obsidian";
import TimeLineComp from "../svelte/TimeLineComp.svelte";
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
		: 300;

	const blockHeight = options.has("height")
		? parseInt(options.get("height"))
		: 500;

	let blockDate = options.has("date")
		? options.get("date")
		: window.moment().format("YYYY-MM-DD");

	el.style.width = blockWidth + "px";
	el.style.height = blockHeight + "px";

	if (
		blockDate == "today" ||
		blockDate == "tomorrow" ||
		blockDate == "yesterday" ||
		moment(blockDate, "YYYY-MM-DD", true).isValid() ||
		moment(blockDate, "YYYY.MM.DD", true).isValid() ||
		moment(blockDate, "YYYY/MM/DD", true).isValid() ||
		moment(blockDate, "MM-DD-YYYY", true).isValid() ||
		moment(blockDate, "MM.DD.YYYY", true).isValid() ||
		moment(blockDate, "MM/DD/YYYY", true).isValid() ||
		moment(blockDate, "DD-MM-YYYY", true).isValid() ||
		moment(blockDate, "DD.MM.YYYY", true).isValid() ||
		moment(blockDate, "DD/MM/YYYY", true).isValid()
	) {

		if(blockDate == "today"){
			blockDate = moment().format("YYYY-MM-DD");
		}else if (blockDate == "tomorrow"){
			blockDate = moment().add(1, "day").format("YYYY-MM-DD");
		}else if (blockDate == "yesterday"){
			blockDate = moment().subtract(1, "day").format("YYYY-MM-DD");
		}

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
			new TimeLineComp({
				target: el,
				props: {
					plugin: plugin,
					height: blockHeight,
					width: blockWidth,
					date: blockDate,
				},
			});
		} else if (blockType == "month") {
			new CalendarComp({
				target: el,
				props: {
					plugin: plugin,
					height: blockHeight,
					width: blockWidth,
					displayedMonth: window.moment(blockDate),
				},
			});
		}
	}
}
