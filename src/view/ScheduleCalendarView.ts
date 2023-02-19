import { ItemView, WorkspaceLeaf } from "obsidian";
import ScheduleComp from "../svelte/ScheduleComp.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE = "google-calendar-view-schedule";
export class ScheduleCalendarView extends ItemView {
	calendar: ScheduleComp;
	startDate: moment.Moment;

	constructor(leaf: WorkspaceLeaf, startDate: moment.Moment = window.moment()) {
		super(leaf);
		this.startDate = startDate;
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

	setDate = (date: moment.Moment) => {
		this.startDate = date
		this.onClose();
		this.onOpen();
	}

	async onOpen(): Promise<void> {
		this.calendar = new ScheduleComp({
			target: this.contentEl,
			props: {date: this.startDate},
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
