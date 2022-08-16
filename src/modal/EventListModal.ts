import type { GoogleEvent } from "../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { FuzzySuggestModal } from "obsidian";
import { EventDetailsModal } from './EventDetailsModal';

/**
 * This class is used to diplay a select modal in which the user can select an event
*/
export class EventListModal extends FuzzySuggestModal<GoogleEvent> {
	eventList: GoogleEvent[];
	eventsChanged: boolean;
	closeFunction?: () => void;

	constructor(eventList: GoogleEvent[], eventsChanged = false, closeFunction?: () => void) {
		super(GoogleCalendarPlugin.getInstance().app);
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

	async onChooseItem(item: GoogleEvent): Promise<void> {
		this.open();
		new EventDetailsModal(item, () => this.eventsChanged = true).open();
	}

	onClose(): void {
		if(this.closeFunction && this.eventsChanged){
			this.closeFunction();
		}
	}


}
