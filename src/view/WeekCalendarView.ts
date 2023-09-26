import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import TimeLineView from "../svelte/views/TimeLineView.svelte";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR_WEEK = "google-calendar-view-week";
export class WeekCalendarView extends ItemView {
	calendar: TimeLineView;
	startDate: moment.Moment;
	showSettings = false;

	constructor(leaf: WorkspaceLeaf, startDate: moment.Moment = window.moment()) {
		super(leaf);
		this.startDate = startDate;
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_WEEK;
	}
	getDisplayText(): string {
		return "GCal Week View";
	}

	getIcon(): string {
		return "calendar-range";
	}

	setDate = (date: moment.Moment) => {
		this.startDate = date
		this.onClose();
		this.onOpen();
	}

	onPaneMenu(menu: Menu, source: string): void {
		super.onPaneMenu(menu, source)
		this.showSettings = this.calendar.$$.ctx[1];
		menu.addItem((item) => {
				item.setTitle("Refresh");
				item.setIcon("sync");
				item.onClick(() => {
					this.onClose();
					this.onOpen();
				});
			})
		.addSeparator()
		.addItem((item) => {
			item.setTitle(this.showSettings ? "Hide Settings" : "Settings");
			item.setIcon("gear");
			item.onClick(() => {
				this.showSettings = !this.showSettings;
				this.calendar.$set({ showSettings: this.showSettings });
			});

		});
	}

	async onOpen(): Promise<void> {

		const plugin = GoogleCalendarPlugin.getInstance();
		const options = plugin.settings.viewSettings["week"];

		this.calendar = new TimeLineView({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings, },
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
