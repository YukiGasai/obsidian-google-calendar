import { ItemView, WorkspaceLeaf } from "obsidian";
import WebFrameComp from "../svelte/WebFrameComp.svelte";

export const VIEW_TYPE_GOOGLE_CALENDAR_WEB = "google-calendar-view-web";
export class WebCalendarView extends ItemView {
	calendar: WebFrameComp;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_WEB;
	}
	getDisplayText(): string {
		return "Calendar Web View";
	}

	getIcon(): string {
		return "calendar-with-checkmark";
	}

	async onOpen(): Promise<void> {
		this.calendar = new WebFrameComp({
			target: this.contentEl,
		});
	}
	async onClose(): Promise<void> {
		this.calendar.$destroy();
	}
}
