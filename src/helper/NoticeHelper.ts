import { Notice } from "obsidian";
import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";

export function createNotice(
	plugin: GoogleCalendarPlugin,
	text: string,
	showNotice = true
): void {
	if (plugin.settings.showNotice && showNotice) {
		new Notice(text);
	}
}
