import { ItemView, WorkspaceLeaf } from "obsidian";
import WeekViewComp from "../svelte/WeekViewComp.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_WEEK = "google-calendar-view-week";
export class WeekCalendarView extends ItemView {
	calendar: WeekViewComp;
	startDate: moment.Moment;

	constructor(leaf: WorkspaceLeaf, startDate: moment.Moment = window.moment()) {
		super(leaf);
		this.startDate = startDate;
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_WEEK;
	}
	getDisplayText(): string {
		return "Week View";
	}

	getIcon(): string {
		return "calendar-with-checkmark";
	}

	setDate = (date: moment.Moment) => {
		this.startDate = date
	}

	async onOpen(): Promise<void> {
		this.calendar = new WeekViewComp({
			target: this.contentEl,
			props: { navigation: true, date: this.startDate },
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
