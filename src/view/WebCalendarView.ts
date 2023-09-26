import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import WebView from "../svelte/views/WebView.svelte";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR_WEB = "google-calendar-view-web";
export class WebCalendarView extends ItemView {
	calendar: WebView;
	showSettings = false;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_WEB;
	}
	getDisplayText(): string {
		return "GCal Web View";
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
		return "globe-2";
	}

	async onOpen(): Promise<void> {

		const plugin = GoogleCalendarPlugin.getInstance();
		const options = plugin.settings.viewSettings["web"];
		options.width = -1;


		this.calendar = new WebView({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings }
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
