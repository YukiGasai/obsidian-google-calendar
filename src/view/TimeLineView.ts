import { ItemView, WorkspaceLeaf } from "obsidian";
import TimeLineViewComp from "../svelte/TimeLineViewComp.svelte";

import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR = "google-calendar-view";
export class TimeLineView extends ItemView {
	timeline: TimeLineViewComp;
	plugin: GoogleCalendarPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: GoogleCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR;
	}
	getDisplayText(): string {
		return "Timeline View";
	}

	getIcon(): string {
		return "calendar-with-checkmark";
	}

	async onOpen(): Promise<void> {
		this.timeline = new TimeLineViewComp({
			target: this.contentEl,
			props: { plugin: this.plugin },
		});
	}
	async onClose(): Promise<void> {
		this.timeline.$destroy();
	}
}
