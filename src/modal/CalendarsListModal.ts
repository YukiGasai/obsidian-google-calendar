import type { GoogleCalander } from "../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { FuzzySuggestModal } from "obsidian";
import { googleListTodayEventsByCalendar } from "../googleApi/GoogleListEvents";
import { EventListModal } from "./EventListModal";

export class CalendarsListModal extends FuzzySuggestModal<GoogleCalander> {
	calendarList: GoogleCalander[];

	constructor(calendarList: GoogleCalander[]) {
		super(GoogleCalendarPlugin.getInstance().app);
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
		item: GoogleCalander
	): Promise<void> {
		const events = await googleListTodayEventsByCalendar(item);
		new EventListModal(events).open();
	}
}
