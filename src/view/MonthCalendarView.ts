import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import CalendarComp from "../svelte/CalendarComp.svelte";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR_MONTH = "google-calendar-view-month";
export class MonthCalendarView extends ItemView {
	calendar: CalendarComp;
	showSettings = false;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_MONTH;
	}

	getDisplayText(): string {
		return "Calendar Month View";
	}

	getIcon(): string {
		return "calendar-with-checkmark";
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
		const options = plugin.settings.viewSettings["month"];
		this.calendar = new CalendarComp({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings },
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
