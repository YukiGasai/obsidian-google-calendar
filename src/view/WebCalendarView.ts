import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import WebFrameComp from "../svelte/WebFrameComp.svelte";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const VIEW_TYPE_GOOGLE_CALENDAR_WEB = "google-calendar-view-web";
export class WebCalendarView extends ItemView {
	calendar: WebFrameComp;
	showSettings = false;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_WEB;
	}
	getDisplayText(): string {
		return "Calendar Web View";
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

	getIcon(): string {
		return "calendar-with-checkmark";
	}

	async onOpen(): Promise<void> {

		const plugin = GoogleCalendarPlugin.getInstance();
		const options = plugin.settings.viewSettings["web"];
		options.width = -1;


		this.calendar = new WebFrameComp({
			target: this.contentEl,
			props: { codeBlockOptions: options, isObsidianView: true, showSettings: this.showSettings }
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
