import { ItemView, WorkspaceLeaf } from "obsidian";
import TimeLineViewComp from "../svelte/TimeLineViewComp.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_DAY = "google-calendar-view-day";
export class DayCalendarView extends ItemView {
	timeline: TimeLineViewComp;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_DAY;
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
			props: { navigation: true },
		});
	}
	async onClose(): Promise<void> {
		this.timeline.$destroy();
	}
}
