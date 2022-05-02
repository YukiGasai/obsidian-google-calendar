import { createNotice } from "src/helper/NoticeHelper";
import { Editor, MarkdownView, Plugin, moment } from "obsidian";

import { GoogleCalendarPluginSettings, GoogleEvent } from "./helper/types";
import {
	GoogleCalendarSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./view/GoogleCalendarSettingTab";
import { googleListCalendars } from "./googleApi/GoogleListCalendars";
import { CalendarsListModal } from "./modal/CalendarsListModal";
import { googleListTodayEvents } from "./googleApi/GoogleListTodayEvents";
import { GoogleEventProcessor } from "./helper/GoogleEventProcessor";

const DEFAULT_SETTINGS: GoogleCalendarPluginSettings = {
	googleClientId: "",
	googleClientSecret: "",
	googleApiToken: "",
	askConfirmation: true,
	refreshInterval: 60,
	showNotice: true,
};

export default class GoogleCalendarPlugin extends Plugin {
	settings: GoogleCalendarPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("gEvent", GoogleEventProcessor);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"calendar-with-checkmark",
			"Google Calendar",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				createNotice(this, "This is a notice!");
			}
		);

		//List events command
		this.addCommand({
			id: "list-google-calendars",
			name: "List Google Calendars",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn(this, false);

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				googleListCalendars(this).then((calendars) => {
					new CalendarsListModal(this, calendars).open();
				});
			},
		});

		const writeTodayEventsIntoFile = async (editor: Editor) => {
			const eventList = await googleListTodayEvents(this);

			let eventStringList = "";

			eventList.forEach((event) => {
				let dateString = "";
				if (event.start.dateTime) {
					const startTime = moment(event.start.dateTime).format(
						"HH:mm"
					);
					dateString = startTime;
					if (event.end.dateTime) {
						const endTime = moment(event.end.dateTime).format(
							"HH:mm"
						);

						dateString += `-${endTime}`;
					}
				}

				let nameString = `[${event.summary}](${event.htmlLink})`;

				eventStringList += `\n| ${dateString} | ${nameString} | ${
					event.description ?? ""
				} |`;
			});

			editor.replaceRange(
				"| Date | Name | Description |\n| ---- | ---- | ----------- |" +
					eventStringList,
				editor.getCursor()
			);
		};

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "insert-todays-google-events",
			name: "Insert todays Google events",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView
			): boolean => {
				const canRun = settingsAreCompleteAndLoggedIn(this, false);

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				writeTodayEventsIntoFile(editor);
			},
		});

		this.addSettingTab(new GoogleCalendarSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
