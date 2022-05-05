import { createNotice } from "src/helper/NoticeHelper";
import { Editor, MarkdownView, Plugin, moment, WorkspaceLeaf } from "obsidian";

import type { GoogleCalendarPluginSettings } from "./helper/types";
import {
	GoogleCalendarSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./view/GoogleCalendarSettingTab";
import { googleListCalendars } from "./googleApi/GoogleListCalendars";
import { CalendarsListModal } from "./modal/CalendarsListModal";
import {
	googleListEvents,
	googleListTodayEvents,
} from "./googleApi/GoogleListEvents";
import { GoogleEventProcessor } from "./helper/GoogleEventProcessor";
import { TimeLineView, VIEW_TYPE_GOOGLE_CALENDAR } from "./view/TimeLineView";
import { EventListModal } from "./modal/EventListModal";
import { compute_slots } from "svelte/internal";

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

	initView = async () => {
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

	check4Word(word: string, editor: Editor): boolean {
		const endPos = editor.getCursor();
		const startPos = { ...endPos, ch: endPos.ch - word.length };

		if (startPos.ch >= 0) {
			const realWord = editor.getRange(startPos, endPos);
			let date = "";
			if (realWord == word) {
				switch (word) {
					case "@today":
						date = moment().format("YYYY-MM-DD");
						break;
					case "@tomorrow":
						date = moment().add(1, "day").format("YYYY-MM-DD");
						break;
					case "@yesterday":
						date = moment().add(-1, "day").format("YYYY-MM-DD");
						break;
					default:
						break;
				}
			} else {
				const tmpDate = moment(realWord.substring(1));
				if (tmpDate.isValid() && word.length == "@YYYY-MM-DD".length) {
					date = tmpDate.format("YYYY-MM-DD");
					console.log(realWord);
				} else {
					return false;
				}
			}

			googleListEvents(this, date).then((events) => {
				new EventListModal(
					this,
					events,
					editor,
					startPos,
					endPos,
					realWord
				).open();
			});
		}
		return false;
	}

	async onload() {
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
				(editor: Editor, markdownView: MarkdownView) => {
					this.check4Word("@today", editor);
					this.check4Word("@tomorrow", editor);
					this.check4Word("@yesterday", editor);
					this.check4Word("@YYYY-MM-DD", editor);
				}
			)
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
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

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR);
	}

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
