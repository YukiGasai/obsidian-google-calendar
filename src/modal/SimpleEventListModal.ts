import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { FuzzySuggestModal } from "obsidian";
import type { GoogleEvent } from "../helper/types";

export class SimpleEventListModal extends FuzzySuggestModal<GoogleEvent> {
	plugin: GoogleCalendarPlugin;
	eventList: GoogleEvent[];

	constructor(plugin: GoogleCalendarPlugin, eventList: GoogleEvent[]) {
		super(plugin.app);
		this.plugin = plugin;
		this.eventList = eventList;
		this.setPlaceholder("Select a event to view it");
	}

	getItems(): GoogleEvent[] {
		return this.eventList;
	}

	getItemText(item: GoogleEvent): string {
		return `${item.summary}\t`;
	}

	async onChooseItem(
		item: GoogleEvent,
		_: MouseEvent | KeyboardEvent
	): Promise<void> {
		console.log(item.summary);
	}
}
