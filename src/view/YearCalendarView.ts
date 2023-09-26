import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import YearView from "../svelte/views/YearView.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_YEAR = "google-calendar-view-year";
export class YearCalendarView extends ItemView {
	calendar: YearView;
	showSettings = false;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_YEAR;
	}
	getDisplayText(): string {
		return "GCal Year View";
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

	getIcon(): string {
		return "github";
	}

	async onOpen(): Promise<void> {

		const plugin = GoogleCalendarPlugin.getInstance();
		let options = plugin.settings.viewSettings["year"];
		if(!options) {
			plugin.settings.viewSettings['year'] = {
				type: "year",
				exclude: [],
				include: [],
				offset: 0,
				navigation: false,
				size: 15
			  };
			plugin.saveSettings();
			options = plugin.settings.viewSettings["year"];
		}
		this.calendar = new YearView({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings }
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
