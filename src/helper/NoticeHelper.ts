
import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { Notice } from "obsidian";

/**
 * A wrapper function around Notice to make them be able to turn of with a setting except if they are to important
 * @param plugin  Refrence to the main plugin to acess the settings
 * @param text The text displayed inside the Notice
 * @param showNotice A boolean to check if notice should be displayed
 */
export function createNotice(
	plugin: GoogleCalendarPlugin,
	text: string,
	showNotice = true
): void {
	if (plugin.settings.showNotice && showNotice) {
		new Notice(text);
	}
}
