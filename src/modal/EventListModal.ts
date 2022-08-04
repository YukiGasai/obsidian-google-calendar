import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import type { GoogleEvent } from "../helper/types";

import { FuzzySuggestModal } from "obsidian";
import { ViewEventEntry } from './ViewEventEntry';

export class EventListModal extends FuzzySuggestModal<GoogleEvent> {
	plugin: GoogleCalendarPlugin;
	eventList: GoogleEvent[];
	eventsChanged: boolean;
	closeFunction?: () => void;

	constructor(plugin: GoogleCalendarPlugin, eventList: GoogleEvent[], eventsChanged = false, closeFunction?: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.eventList = eventList;
		this.setPlaceholder("Select a event to view it");
		this.emptyStateText = "No events found enter to create a new one"
		this.eventsChanged = eventsChanged;
		if(closeFunction){
			this.closeFunction = closeFunction
		}
	}


	getItems(): GoogleEvent[] {
		return this.eventList;
	}

	getItemText(item: GoogleEvent): string {

		if(item.start.date) {
			return `${item.start.date}\t\t | ${item.summary}\t`;
		}else{

			const dateTime = window.moment(item.start.dateTime).format("YYYY-MM-DD HH:mm");

			return `${dateTime}\t | ${item.summary}\t`;
		}
	}

	async onChooseItem(
		item: GoogleEvent,
		_: MouseEvent | KeyboardEvent
	): Promise<void> {
		this.open();
		new ViewEventEntry(this.plugin, item, window.moment(), () => this.eventsChanged = true).open();
	}

	onClose(): void {
		if(this.closeFunction && this.eventsChanged){
			this.closeFunction();
		}
	}


}
