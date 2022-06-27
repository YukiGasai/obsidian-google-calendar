import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";

import { ItemView, WorkspaceLeaf } from "obsidian";
import CalendarComp from "../svelte/CalendarComp.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_MONTH = "google-calendar-view-month";
export class MonthCalendarView extends ItemView {
	calendar: CalendarComp;
	plugin: GoogleCalendarPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: GoogleCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_MONTH;
	}
	getDisplayText(): string {
		return "Calendar Month View";
	}

	getIcon(): string {
		return "calendar-with-checkmark";
	}

	async onOpen(): Promise<void> {
		this.calendar = new CalendarComp({
			target: this.contentEl,
			props: { plugin: this.plugin },
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
