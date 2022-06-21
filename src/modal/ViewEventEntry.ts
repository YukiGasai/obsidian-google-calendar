import { Modal } from "obsidian";
import type { GoogleCalander, GoogleEvent } from "../helper/types";
import type GoogleCalendarPlugin from "./../GoogleCalendarPlugin";
import EventDetailsComp from "../svelte/EventDetailsComp.svelte";

export class ViewEventEntry extends Modal {
	plugin: GoogleCalendarPlugin;
	selectedEvent: GoogleEvent;
	currentDate: moment.Moment;
	calendarList: GoogleCalander[];

	onSubmit: (event: GoogleEvent) => void;
	constructor(
		plugin: GoogleCalendarPlugin,
		selectedEvent: GoogleEvent,
		currentDate: moment.Moment
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.selectedEvent = selectedEvent;
		this.currentDate = currentDate;
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		new EventDetailsComp({
			target: contentEl,
			props: {
				plugin: this.plugin,
				event: this.selectedEvent,
				currentDate: this.currentDate,
				closeFunction: () => this.close(),
			},
		});
	}
	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
