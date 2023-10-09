/**
 * The Event Processor is checking the editor for plugin specific codeblocks
 * marked with gEvent and replaces them with custom widgets 
 * from svelte components
 */

import type { CodeBlockOptions } from "../helper/types";
import * as chrono from 'chrono-node';
import { MarkdownPostProcessorContext, parseYaml, Platform } from "obsidian";
import WebView from "../svelte/views/WebView.svelte";
import MonthView from "../svelte/views/MonthView.svelte";
import ScheduleView from "../svelte/views/ScheduleView.svelte"
import TimeLineView from "../svelte/views/TimeLineView.svelte"
import YearView from "../svelte/views/YearView.svelte";
import { SvelteBuilder } from "../svelte/SvelteBuilder";

/**
 * This function converts the codeblock into a svelte widget
 * There are multiple settings a user can set
 *  
 * @param text the text of the codeblock
 * @param el the container element for the codeblock widget
 */
export async function checkEditorForCodeBlocks(
	text: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
): Promise<void> {
	el.style.padding = "10px"

	const parsedYaml = parseYaml(text) ?? {}

	const codeBlockOptions:CodeBlockOptions = parsedYaml

	// Allow the user to enter js as value for parameter
	for (let [key, value] of  Object.entries(parsedYaml)) {
		// Check if a parameter is using js
		if (typeof value === "string" && value.startsWith(";") && value.endsWith(";")) {
			// Remove the js tags
			let newValue = value.slice(1, -1);
			newValue = newValue.trim();
			// Evaluate the js code and set the value to the result
			// Eval is a security risk but the user can only execute code on his own machine
			codeBlockOptions[key] = eval(newValue);
		}
	}

	// Set default values for the codeblock options
	codeBlockOptions.type = codeBlockOptions.type ?? "day";
	codeBlockOptions.date = codeBlockOptions.date ?? "today";
	codeBlockOptions.exclude = codeBlockOptions.exclude ?? [];
	codeBlockOptions.include = codeBlockOptions.include ?? [];
	codeBlockOptions.hourRange = codeBlockOptions.hourRange ?? [0, 24];
	codeBlockOptions.timespan = codeBlockOptions.timespan ?? 7;
	codeBlockOptions.offset = codeBlockOptions.offset ?? 0;
	codeBlockOptions.navigation = codeBlockOptions.navigation ?? false;
	codeBlockOptions.showAllDay = codeBlockOptions.showAllDay ?? true;
	codeBlockOptions.size = codeBlockOptions.size ?? 10;

	codeBlockOptions.timespan = Math.floor(Math.abs(codeBlockOptions.timespan));


	if(codeBlockOptions.dayOffset){
		codeBlockOptions.offset = codeBlockOptions.dayOffset;
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
	// Check if the date is valid
	if(!window.moment(codeBlockOptions.date, momentFormatArray, true).isValid())
	{
		// Date is not valid check for special keywords
		const parseResult = chrono.parseDate(codeBlockOptions.date); 
		// Check if parsed keyword is a valid date
		if(parseResult == null || !window.moment(parseResult).isValid()){
			return;
		}
		codeBlockOptions.date = window.moment(parseResult).format("YYYY-MM-DD");
	}
		
	// Create the right widget based on the type

	if (codeBlockOptions.type == "web") {
		if (Platform.isDesktopApp) {
			ctx.addChild(
				new SvelteBuilder(WebView, el, {
					codeBlockOptions: codeBlockOptions
				})
			);
		}
	} else if (codeBlockOptions.type == "day") {
		codeBlockOptions.timespan = 1;
		ctx.addChild(
			new SvelteBuilder(TimeLineView, el, {
				codeBlockOptions: codeBlockOptions,
			})
		);

	} else if (codeBlockOptions.type == "month") {

		ctx.addChild(
			new SvelteBuilder(MonthView, el, {
				codeBlockOptions: codeBlockOptions,
			})
		);

	} else if (codeBlockOptions.type == "schedule") {
		ctx.addChild(
			new SvelteBuilder(ScheduleView, el, {
				codeBlockOptions: codeBlockOptions,
			})
		);
	} else if (codeBlockOptions.type == "week") {
		ctx.addChild(
			new SvelteBuilder(TimeLineView, el, {
				codeBlockOptions: codeBlockOptions,
			})
		);
	} else if (codeBlockOptions.type == "year") {
		ctx.addChild(
			new SvelteBuilder(YearView, el, {
				codeBlockOptions: codeBlockOptions,
			})
		);
	}
}
