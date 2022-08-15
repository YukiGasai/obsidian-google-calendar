import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { Notice } from "obsidian";

/**
 * A wrapper function around Notice to make them be able to turn of with a setting except if they are to important
 * @param text The text displayed inside the Notice
 * @param showNotice A boolean to check if notice should be displayed
 */
export function createNotice(
	text: string,
	showNotice = true
): void {
	const plugin = GoogleCalendarPlugin.getInstance();
	if (plugin.settings.showNotice && showNotice) {
		new Notice(text);
	}
}
