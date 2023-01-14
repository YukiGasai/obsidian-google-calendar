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
	const { height, width, date, navigation, timespan, exclude, include, theme, hourRange }: CodeBlockOptions = parsedYaml
	let { type }: CodeBlockOptions = parsedYaml;

	if (!type) {
		type = CodeBlockTypes.day;
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
		date == undefined ||
		date == "today" ||
		date == "tomorrow" ||
		date == "yesterday" ||
		window.moment(date, momentFormatArray, true).isValid()
	) {
		let blockDate: moment.Moment;

		if (date == undefined) {
			blockDate = undefined
		} else if (date == "today") {
			blockDate = window.moment();
		} else if (date == "tomorrow") {
			blockDate = window.moment().add(1, "day");
		} else if (date == "yesterday") {
			blockDate = window.moment().subtract(1, "day");
		} else {
			blockDate = window.moment(date);
		}


		el.style.padding = "10px"

		if (type == CodeBlockTypes.web) {
			if (Platform.isDesktopApp) {
				ctx.addChild(
					new SvelteBuilder(WebFrameComp, el, {
						height: height ?? 500,
						width: width ?? 500,
						date: blockDate,
						theme: theme ?? "auto"
					})
				);
			}
		} else if (type == CodeBlockTypes.day) {
			ctx.addChild(
				new SvelteBuilder(TimeLineViewComp, el, {
					height: height,
					width: width,
					date: blockDate,
					navigation: navigation,
					include: include,
					exclude: exclude,
					hourRange: hourRange
				})
			);

		} else if (type == CodeBlockTypes.month) {

			ctx.addChild(
				new SvelteBuilder(CalendarComp, el, {
					height: height,
					width: width,
					displayedMonth: blockDate,
					include: include,
					exclude: exclude,
				})
			);

		} else if (type == CodeBlockTypes.schedule) {
			ctx.addChild(
				new SvelteBuilder(ScheduleComp, el, {
					timeSpan: timespan,
					date: blockDate,
					include: include,
					exclude: exclude,
				})
			);
		}
	}
}
