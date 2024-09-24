import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import TimeLineView from "../svelte/views/TimeLineView.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_DAY = "google-calendar-view-day";
export class DayCalendarView extends ItemView {
	timeline: TimeLineView;
	startDate: moment.Moment;
	showSettings = false;

	constructor(leaf: WorkspaceLeaf, startDate: moment.Moment = window.moment()) {
		super(leaf);
		this.startDate = startDate;
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_DAY;
	}
	getDisplayText(): string {
		return "GCal Timeline View";
	}

	getIcon(): string {
		return "layout-template";
	}

	setDate = (date: moment.Moment) => {
		this.startDate = date
		this.onClose();
		this.onOpen();
	}

	onPaneMenu(menu: Menu, source: string): void {
		super.onPaneMenu(menu, source)
		this.showSettings = this.timeline.$$.ctx[1];
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
				this.timeline.$set({ showSettings: this.showSettings });
			});

		});
	}

	async onOpen(): Promise<void> {

		const plugin = GoogleCalendarPlugin.getInstance();
		const options = plugin.settings.viewSettings["day"];
		options.timespan = 1;
		options.date = this.startDate.format()
		this.timeline = new TimeLineView({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings },
		});
	}
	async onClose(): Promise<void> {
		this.timeline.$destroy();
	}
}
