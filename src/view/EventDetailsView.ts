import { ItemView, Menu, WorkspaceLeaf } from "obsidian";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import EventDetailsView from "../svelte/views/EventDetails.svelte";
import type { GoogleEvent } from "../helper/types";
import { googleClearCachedEvents } from "../googleApi/GoogleListEvents";

export const VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS = "google-calendar-view-event_details";
export class EventView extends ItemView {
	eventDetails: EventDetailsView;
	event: GoogleEvent;
	closeFunction: () => void;

	constructor(leaf: WorkspaceLeaf, event: GoogleEvent, closeFunction: () => void) {
		super(leaf);
		this.event = event;
		this.closeFunction = closeFunction
	}
	getViewType(): string {
		return VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS;
	}
	getDisplayText(): string {
		return "GCal EventDetails View";
	}

	getIcon(): string {
		return "calendar-plus";
	}

	setEvent = (event: GoogleEvent) => {
		this.event = event
		this.onClose();
		this.onOpen();
	}

	setCloseFunction = (closeFunction: () => void) => {
		this.closeFunction = closeFunction
		this.onClose();
		this.onOpen();
	}

	async onOpen(): Promise<void> {
		this.eventDetails = new EventDetailsView({
			target: this.contentEl,
			props: { event: this.event, closeFunction: this.closeFunction},
		});
	}
	async onClose(): Promise<void> {
		this.eventDetails.$destroy();
	}
}
