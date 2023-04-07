/**
 * The Event Processor is checking the editor for plugin specific codeblocks
 * marked with gEvent and replaces them with custom widgets 
 * from svelte components
 */

import { CodeBlockOptions, CodeBlockTypes } from "../helper/types";
import { MarkdownPostProcessorContext, parseYaml, Platform } from "obsidian";
import TimeLineViewComp from "../svelte/TimeLineViewComp.svelte";
import WebFrameComp from "../svelte/WebFrameComp.svelte";
import CalendarComp from "../svelte/CalendarComp.svelte";
import ScheduleComp from "../svelte/ScheduleComp.svelte"
import WeekViewComp from "../svelte/WeekViewComp.svelte"
import { SvelteBuilder } from "../svelte/SvelteBuilder";


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
	const parsedYaml = parseYaml(text);
	const codeBlockOptions:CodeBlockOptions = parsedYaml

	// Id no type is set, default to day view
	if (!codeBlockOptions.type) {
		codeBlockOptions.type = CodeBlockTypes.day;
	}

	if(!codeBlockOptions.exclude) {
		codeBlockOptions.exclude = []
	}

	if(!codeBlockOptions.include) {
		codeBlockOptions.include = []
	}

	if(!codeBlockOptions.hourRange) {
		codeBlockOptions.hourRange = [0, 24]
	}

	if(!codeBlockOptions.timespan) {
		codeBlockOptions.timespan = 7
	}

	if(!codeBlockOptions.dayOffset) {
		codeBlockOptions.dayOffset = 0
	}

	if(!codeBlockOptions.navigation) {
		codeBlockOptions.navigation = false;
	}

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
		codeBlockOptions.date == undefined ||
		codeBlockOptions.date == "today" ||
		codeBlockOptions.date == "tomorrow" ||
		codeBlockOptions.date == "yesterday" ||
		window.moment(codeBlockOptions.date, momentFormatArray, true).isValid()
	) {
		let blockDate: moment.Moment;

		if (codeBlockOptions.date == undefined) {
			blockDate = undefined
		} else if (codeBlockOptions.date == "today") {
			blockDate = window.moment();
		} else if (codeBlockOptions.date == "tomorrow") {
			blockDate = window.moment().add(1, "day");
		} else if (codeBlockOptions.date == "yesterday") {
			blockDate = window.moment().subtract(1, "day");
		} else {
			blockDate = window.moment(codeBlockOptions.date);
		}
		codeBlockOptions.moment = blockDate;

		el.style.padding = "10px"

		if (codeBlockOptions.type == CodeBlockTypes.web) {
			if (Platform.isDesktopApp) {
				ctx.addChild(
					new SvelteBuilder(WebFrameComp, el, {
						codeBlockOptions: codeBlockOptions
					})
				);
			}
		} else if (codeBlockOptions.type == CodeBlockTypes.day) {
			ctx.addChild(
				new SvelteBuilder(TimeLineViewComp, el, {
					codeBlockOptions: codeBlockOptions,
				})
			);

		} else if (codeBlockOptions.type == CodeBlockTypes.month) {

			ctx.addChild(
				new SvelteBuilder(CalendarComp, el, {
					codeBlockOptions: codeBlockOptions,
				})
			);

		} else if (codeBlockOptions.type == CodeBlockTypes.schedule) {
			ctx.addChild(
				new SvelteBuilder(ScheduleComp, el, {
					codeBlockOptions: codeBlockOptions,
				})
			);
		} else if (codeBlockOptions.type == CodeBlockTypes.week) {
			ctx.addChild(
				new SvelteBuilder(WeekViewComp, el, {
					codeBlockOptions: codeBlockOptions,
				})
			);
		}
	}
}
