import { ItemView, WorkspaceLeaf } from "obsidian";
import ScheduleComp from "../svelte/ScheduleComp.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE = "google-calendar-view-schedule";
export class ScheduleCalendarView extends ItemView {
	calendar: ScheduleComp;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE;
	}
	
	getDisplayText(): string {
		return "Schedule View";
	}

	getIcon(): string {
		return "calendar-with-checkmark";
	}

	async onOpen(): Promise<void> {
		this.calendar = new ScheduleComp({
			target: this.contentEl,
			props: {},
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
