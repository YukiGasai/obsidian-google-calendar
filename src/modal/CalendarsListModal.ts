import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { FuzzySuggestModal } from "obsidian";
import { GoogleCalander } from "../helper/types";
import { googleListTodayEventsByCalendar } from "src/googleApi/GoogleListTodayEvents";

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

	async onChooseItem(item: GoogleCalander, _: MouseEvent | KeyboardEvent) {
		const events = await googleListTodayEventsByCalendar(
			this.plugin,
			item.id
		);
		console.log(events);
	}
}
