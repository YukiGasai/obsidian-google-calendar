import type { GoogleCalendarPluginSettings } from "./helper/types";
import { Editor, MarkdownView, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import {
	GoogleCalendarSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./view/GoogleCalendarSettingTab";
import { googleListCalendars } from "./googleApi/GoogleListCalendars";
import { CalendarsListModal } from "./modal/CalendarsListModal";
import { googleListTodayEvents } from "./googleApi/GoogleListEvents";
import { checkEditorForCodeBlocks } from "./helper/CheckEditorForCodeBlocks";
import { TimeLineView, VIEW_TYPE_GOOGLE_CALENDAR_DAY } from "./view/TimeLineView";
import { MonthCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_MONTH } from "./view/MonthCalendarView";
import { WebCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_WEB } from "./view/WebCalendarView";
import { checkEditorForAtDates } from "./helper/CheckEditorForAtDates";
import { insertTodayEventsIntoFile } from "./helper/InsertTodayEventsIntoFile";
import { getRT } from "./helper/LocalStorage";

import { checkForEventNotes } from "./helper/AutoEventNoteCreator";

const DEFAULT_SETTINGS: GoogleCalendarPluginSettings = {
	googleClientId: "",
	googleClientSecret: "",
	googleApiToken: "",
	googleRefreshToken: "",
	askConfirmation: true,
	refreshInterval: 60,
	showNotice: true,
	autoCreateEventNotes: true,
	importStartOffset: -1,
	importEndOffset: 1,
	calendarBlackList: [],
};

export default class GoogleCalendarPlugin extends Plugin {
	settings: GoogleCalendarPluginSettings;

	templatePlugin:any;

	initView = async (viewId:string): Promise<void> => {
		if (
			this.app.workspace.getLeavesOfType(viewId)
				.length === 0
		) {
			await this.app.workspace.getRightLeaf(false).setViewState({
				type: viewId,
			});
		}
		this.app.workspace.revealLeaf(
			this.app.workspace
				.getLeavesOfType(viewId)
				.first()
		);
	};

	onLayoutReady = ():void => {
		//Get the template plugin to run their commands
		const templatePlugin = (this.app as any).internalPlugins?.plugins["templates"];
		if(templatePlugin && templatePlugin.enabled){
			this.templatePlugin = templatePlugin;
		}

		checkForEventNotes(this);
	}

	async onload(): Promise<void> {
		await this.loadSettings();

		this.app.workspace.onLayoutReady(this.onLayoutReady);


		this.registerMarkdownCodeBlockProcessor("gEvent", (text, el) =>
			checkEditorForCodeBlocks(text, el, this)
		);

		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_DAY,
			(leaf: WorkspaceLeaf) => new TimeLineView(leaf, this)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_MONTH,
			(leaf: WorkspaceLeaf) => new MonthCalendarView(leaf, this)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_WEB,
			(leaf: WorkspaceLeaf) => new WebCalendarView(leaf, this)
		);


		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				(editor: Editor, markdownView: MarkdownView) =>
					checkEditorForAtDates(editor, this)
			)
		);

		//Open Timeline view
		this.addCommand({
			id: "open-google-calendar-timline-view",
			name: "Open Google Calendar timeline view",
			callback: () => 
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_DAY)
		});

		//Open Month view
		this.addCommand({
			id: "open-google-calendar-month-view",
			name: "Open Google Calendar month view",
			callback: () => 
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_MONTH)
		});

		//Open web view
		this.addCommand({
			id: "open-google-calendar-web-view",
			name: "Open Google Calendar web view",
			callback: () => 
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_WEB)
		});

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

				insertTodayEventsIntoFile(this, editor);
			},
		});


		//Copy Refresh token to clipboard
		this.addCommand({
			id: "copy-google-calendar-refresh-token",
			name: "Copy Google Calendar Refresh Token to Clipboard",

			callback: () => {
				const token = getRT();
				if(token == undefined || token == ''){
					new Notice("No Refresh Token. Please Login.")
					return;
				}

				navigator.clipboard.writeText(token).then(function() {
					new Notice("Token copied")
				}, function(err) {
					new Notice("Could not copy token")
				});

			},
		});

		this.addSettingTab(new GoogleCalendarSettingTab(this.app, this));
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_DAY);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_MONTH);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_WEB);
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
