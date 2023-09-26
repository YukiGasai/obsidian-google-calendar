import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import ScheduleView from "../svelte/views/ScheduleView.svelte";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE = "google-calendar-view-schedule";
export class ScheduleCalendarView extends ItemView {
	calendar: ScheduleView;
	startDate: moment.Moment;
	showSettings = false;

	constructor(leaf: WorkspaceLeaf, startDate: moment.Moment = window.moment()) {
		super(leaf);
		this.startDate = startDate;
	}

	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE;
	}

	getDisplayText(): string {
		return "GCal Schedule View";
	}

	getIcon(): string {
		return "layout-list";
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
		const options = plugin.settings.viewSettings["schedule"];
	
		this.calendar = new ScheduleView({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings, },
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
