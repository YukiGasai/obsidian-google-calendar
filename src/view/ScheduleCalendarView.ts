import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import ScheduleComp from "../svelte/ScheduleComp.svelte";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE = "google-calendar-view-schedule";
export class ScheduleCalendarView extends ItemView {
	calendar: ScheduleComp;
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

	onPaneMenu(menu: Menu, source: string): void {
		menu.addItem((item) => {
			item.setTitle("Close");
			item.setIcon("cross");
			item.onClick(() => {
				this.leaf.detach();
			});
		})
		.addItem((item) => {
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
	
		this.calendar = new ScheduleComp({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings, },
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
