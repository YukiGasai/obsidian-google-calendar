/**
 * The Event Processor is checking the edior for plugin specific codeblocks
 * marked with gEvent and replaces them with custom widgets 
 * from svelte components
 */

import { MarkdownPostProcessorContext,  Platform } from "obsidian";
import TimeLineViewComp from "../svelte/TimeLineViewComp.svelte";
import WebFrameComp from "../svelte/WebFrameComp.svelte";
import CalendarComp from "../svelte/CalendarComp.svelte";
import ScheduleComp from "../svelte/ScheduleComp.svelte"
import { SvelteBuilder } from "../helper/SvelteBuilder";

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
 */
export async function checkEditorForCodeBlocks(
	text: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
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
		: undefined;

	const hasNavigation = options.has("navigation")
		? options.get("navigation")
		: undefined;

	const timeSpan = options.has("timespan")
		? parseInt(options.get("timespan"))
		: undefined;

	el.style.width = blockWidth + "px";
	el.style.height = blockHeight + "px";


	const momentFormatArray = [
		"YYYY-MM-DD",
		"YYYY.MM.DD",
		"YYYY/MM/DD",
		"MM-DD-YYYY",
		"MM.DD.YYYY",
		"MM/DD/YYYY",
		"DD-MM-YYYY",
		"DD.MM.YYYY",
		"DD/MM/YYYY"
	]

	if (
		blockDateString == undefined ||
		blockDateString == "today" ||
		blockDateString == "tomorrow" || 
		blockDateString == "yesterday" ||
		window.moment(blockDateString, momentFormatArray, true).isValid()
	) {
		let blockDate:moment.Moment;

		if(blockDateString == undefined){
			blockDate = undefined
		}else if(blockDateString == "today"){
			blockDate = window.moment();
		}else if (blockDateString == "tomorrow"){
			blockDate = window.moment().add(1, "day");
		}else if (blockDateString == "yesterday"){
			blockDate = window.moment().subtract(1, "day");
		}else{
			blockDate = window.moment(blockDateString);
		}


		el.style.padding = "10px"

		if (blockType == "web") {
			if (Platform.isDesktopApp) {
				ctx.addChild(
					new SvelteBuilder(WebFrameComp, el, {
						height: blockHeight ?? 500,
						width: blockWidth ?? 500,
						date: blockDate,
					})
				);
			}
		} else if (blockType == "day") {
			ctx.addChild(
				new SvelteBuilder(TimeLineViewComp, el, {
					height: blockHeight,
					width: blockWidth,
					date: blockDate,
					navigation: hasNavigation=="true"
				})
			);

		} else if (blockType == "month") {
			
			ctx.addChild(
				new SvelteBuilder(CalendarComp, el, {
						height: blockHeight,
						width: blockWidth,
						displayedMonth: blockDate,
				})
			);

		}else if (blockType == "schedule") {
			ctx.addChild(
				new SvelteBuilder(ScheduleComp, el, {
					timeSpan: timeSpan,
					date: blockDate,
				})
			);
		}
	}
}
