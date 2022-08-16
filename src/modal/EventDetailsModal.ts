import type { GoogleCalander, GoogleEvent } from "../helper/types";

import { Modal } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import EventDetailsComp from "../svelte/EventDetailsComp.svelte";

/**
 * This Class is used to create a modal in which the user can see more informations about an event and can update and delte the event
 */
export class EventDetailsModal extends Modal {
	selectedEvent: GoogleEvent;
	calendarList: GoogleCalander[];
	closeFunction: () => void;

	onSubmit: () => void;
	constructor(
		selectedEvent: GoogleEvent,
		closeFunction?: () => void
	) {
		super(GoogleCalendarPlugin.getInstance().app);
		this.selectedEvent = selectedEvent;
		if(closeFunction){
			this.closeFunction = closeFunction;
		}
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		new EventDetailsComp({
			target: contentEl,
			props: {
				event: this.selectedEvent,
				closeFunction: () => {
					if(this.closeFunction){
						this.closeFunction();
					}
					this.close()
				} 
			},
		});
	}
	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
