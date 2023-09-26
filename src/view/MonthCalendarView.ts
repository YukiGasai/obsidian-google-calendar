import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import MonthView from "../svelte/views/MonthView.svelte";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR_MONTH = "google-calendar-view-month";
export class MonthCalendarView extends ItemView {
	calendar: MonthView;
	showSettings = false;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_MONTH;
	}

	getDisplayText(): string {
		return "GCal Month View";
	}

	getIcon(): string {
		return "calendar-days";
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
		const options = plugin.settings.viewSettings["month"];
		this.calendar = new MonthView({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings },
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
