import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import type { GoogleCalander } from "../helper/types";
import { FuzzySuggestModal } from "obsidian";
import { googleListTodayEventsByCalendar } from "../googleApi/GoogleListEvents";
import { EventListModal } from "./EventListModal";

export class CalendarsListModal extends FuzzySuggestModal<GoogleCalander> {
	plugin: GoogleCalendarPlugin;
	calendarList: GoogleCalander[];

	constructor(plugin: GoogleCalendarPlugin, calendarList: GoogleCalander[]) {
		super(plugin.app);
		this.plugin = plugin;
		this.calendarList = calendarList;
		this.setPlaceholder("Select a calendar to view it");
	}

	getItems(): GoogleCalander[] {
		return this.calendarList;
	}

	getItemText(item: GoogleCalander): string {
		return `${item.summary}\t`;
	}

	async onChooseItem(
		item: GoogleCalander,
		_: MouseEvent | KeyboardEvent
	): Promise<void> {
		const events = await googleListTodayEventsByCalendar(this.plugin, item);
		new EventListModal(this.plugin, events).open();
	}
}
