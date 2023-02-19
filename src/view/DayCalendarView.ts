import { ItemView, WorkspaceLeaf } from "obsidian";
import TimeLineViewComp from "../svelte/TimeLineViewComp.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_DAY = "google-calendar-view-day";
export class DayCalendarView extends ItemView {
	timeline: TimeLineViewComp;
	startDate: moment.Moment;

	constructor(leaf: WorkspaceLeaf, startDate: moment.Moment = window.moment()) {
		super(leaf);
		this.startDate = startDate;
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

	setDate = (date: moment.Moment) => {
		this.startDate = date
		this.onClose();
		this.onOpen();
	}

	async onOpen(): Promise<void> {
		this.timeline = new TimeLineViewComp({
			target: this.contentEl,
			props: { navigation: true, startDate: this.startDate },
		});
	}
	async onClose(): Promise<void> {
		this.timeline.$destroy();
	}
}
