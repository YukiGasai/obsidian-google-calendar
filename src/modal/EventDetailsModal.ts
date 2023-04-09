import type { GoogleCalendar, GoogleEvent } from "../helper/types";

import { Modal } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import EventDetails from "../svelte/views/EventDetails.svelte";

/**
 * This Class is used to create a modal in which the user can see more information about an event and can update and delete the event
 */
export class EventDetailsModal extends Modal {

	selectedEvent: GoogleEvent;
	calendarList: GoogleCalendar[];
	closeFunction: () => void;

	onSubmit: () => void;
	constructor(
		selectedEvent: GoogleEvent,
		closeFunction?: () => void
	) {
		super(GoogleCalendarPlugin.getInstance().app);
		this.selectedEvent = selectedEvent;
		if (closeFunction) {
			this.closeFunction = closeFunction;
		}
	}


	async onOpen(): Promise<void> {
		const { contentEl } = this;
		new EventDetails({
			target: contentEl,
			props: {
				event: this.selectedEvent,
				closeFunction: () => {
					if (this.closeFunction) {
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
