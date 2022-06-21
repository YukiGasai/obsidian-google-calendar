import { Editor, MarkdownView, Plugin, moment, WorkspaceLeaf } from "obsidian";
import type { GoogleCalendarPluginSettings } from "./helper/types";
import {
	GoogleCalendarSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./view/GoogleCalendarSettingTab";
import { googleListCalendars } from "./googleApi/GoogleListCalendars";
import { CalendarsListModal } from "./modal/CalendarsListModal";
import { googleListTodayEvents } from "./googleApi/GoogleListEvents";
import { GoogleEventProcessor } from "./helper/GoogleEventProcessor";
import { TimeLineView, VIEW_TYPE_GOOGLE_CALENDAR } from "./view/TimeLineView";
import { editorCheckForDate } from "./helper/EditorChecker";

const DEFAULT_SETTINGS: GoogleCalendarPluginSettings = {
	googleClientId: "",
	googleClientSecret: "",
	googleApiToken: "",
	askConfirmation: true,
	refreshInterval: 60,
	showNotice: true,
	calendarBlackList: [],
};

export default class GoogleCalendarPlugin extends Plugin {
	settings: GoogleCalendarPluginSettings;

	initView = async (): Promise<void> => {
		if (
			this.app.workspace.getLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR)
				.length === 0
		) {
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: VIEW_TYPE_GOOGLE_CALENDAR,
			});
		}
		this.app.workspace.revealLeaf(
			this.app.workspace
				.getLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR)
				.first()
		);
	};

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("gEvent", (text, el) =>
			GoogleEventProcessor(text, el, this)
		);

		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR,
			(leaf: WorkspaceLeaf) => new TimeLineView(leaf, this)
		);

		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				(editor: Editor, markdownView: MarkdownView) =>
					editorCheckForDate(editor, this)
			)
		);

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"calendar-with-checkmark",
			"Google Calendar",
			(evt: MouseEvent) => {
				this.initView();
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

		//List events command
		this.addCommand({
			id: "list-google-events",
			name: "List Google Events",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn(this, false);

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				googleListTodayEvents(this).then((events) => {
					console.log(events);
				});
			},
		});

		this.addCommand({
			id: "insert-google-event-codeblock",
			name: "Insert Google Event CodeBlock",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					"```gEvent\ndate:today\ntype:self\n```",
					editor.getCursor()
				);
			},
		});

		const writeTodayEventsIntoFile = async (editor: Editor) => {
			const eventList = await googleListTodayEvents(this);

			let eventStringList = "";

			eventList.forEach((event) => {
				if (event.start) {
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

					const nameString = `[${event.summary}](${event.htmlLink})`;

					eventStringList += `\n| ${dateString} | ${nameString} | ${
						event.description ?? ""
					} |`;
				}
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

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
