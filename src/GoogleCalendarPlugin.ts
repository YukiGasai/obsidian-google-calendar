import type { GoogleCalendarPluginSettings, IGoogleCalendarPluginApi } from "./helper/types";
import { Editor, EventRef, MarkdownView, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import {
	GoogleCalendarSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./view/GoogleCalendarSettingTab";
import { googleListCalendars } from "./googleApi/GoogleListCalendars";
import { CalendarsListModal } from "./modal/CalendarsListModal";
import { googleClearCachedEvents, googleListEvents } from "./googleApi/GoogleListEvents";
import { checkEditorForCodeBlocks } from "./helper/CheckEditorForCodeBlocks";
import { DayCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_DAY } from "./view/DayCalendarView";
import { MonthCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_MONTH } from "./view/MonthCalendarView";
import { WebCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_WEB } from "./view/WebCalendarView";
import { ScheduleCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE } from "./view/ScheduleCalendarView";
import { checkEditorForAtDates } from "./helper/CheckEditorForAtDates";
import { getRefreshToken, setAccessToken, setExpirationTime, setUserId } from "./helper/LocalStorage";
import { EventListModal } from './modal/EventListModal';
import { checkForEventNotes, createNoteFromEvent } from "./helper/AutoEventNoteCreator";
import { EventDetailsModal } from "./modal/EventDetailsModal";
import { checkEditorForInsertedEvents } from "./helper/CheckEditorForInsertedEvents";
import { TemplateSuggest } from "./suggest/TemplateSuggest";
import { InsertEventsModal } from "./modal/InsertEventsModal";
import { GoogleCalendarPluginApi } from "./api/GoogleCalendarPluginApi";
import { getCurrentTheme } from "./helper/Helper";
import { CreateNotePromptModal } from "./modal/CreateNotePromptModal";
import { checkForNewDailyNotes } from "./helper/DailyNoteHelper";
import { googleCreateEvent } from "../src/googleApi/GoogleCreateEvent";
import { getEventFromFrontMatter } from "./helper/FrontMatterParser";




const DEFAULT_SETTINGS: GoogleCalendarPluginSettings = {
	googleClientId: "",
	googleClientSecret: "",
	googleRefreshToken: "",
	useCustomClient: true,
	googleOAuthServer: "https://obsidian-google-calendar.vercel.app",
	refreshInterval: 10,
	showNotice: true,
	autoCreateEventNotes: true,
	autoCreateEventKeepOpen: false,
	importStartOffset: 1,
	importEndOffset: 1,
	defaultCalendar: "",
	calendarBlackList: [],
	insertTemplates: [],
	webViewDefaultColorMode: getCurrentTheme(),
	useDefaultTemplate: false,
	defaultTemplate: "",
	defaultFolder: (app.vault as any).config.newFileFolderPath,
	activateDailyNoteAddon: false,
	dailyNoteDotColor: "#6aa1d8",
	debugMode:false,
};

export default class GoogleCalendarPlugin extends Plugin {

	private static instance: GoogleCalendarPlugin;
	
	public static getInstance(): GoogleCalendarPlugin {
        return GoogleCalendarPlugin.instance;
    }

	api: IGoogleCalendarPluginApi;

	settings: GoogleCalendarPluginSettings;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	coreTemplatePlugin:any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	templaterPlugin:any;

	settingsTab: GoogleCalendarSettingTab;

	events: EventRef[] = [];

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
		checkForNewDailyNotes(this);

		//Get the template plugin to run their commands
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coreTemplatePlugin = (this.app as any).internalPlugins?.plugins["templates"];
		if(coreTemplatePlugin && coreTemplatePlugin.enabled){
			this.coreTemplatePlugin = coreTemplatePlugin;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const templaterPlugin = (this.app as any).plugins.plugins["templater-obsidian"];
		if(templaterPlugin && templaterPlugin._loaded){
			this.templaterPlugin = templaterPlugin;
		}

		checkForEventNotes(this);
	}

	async onload(): Promise<void> {

		GoogleCalendarPlugin.instance = this;
		this.api = new GoogleCalendarPluginApi().make();
		await this.loadSettings();

		this.app.workspace.onLayoutReady(this.onLayoutReady);


		this.events.push(this.app.vault.on("create", ()=>checkForNewDailyNotes(this)));
		this.events.push(this.app.vault.on("delete", ()=>checkForNewDailyNotes(this)));
		this.events.push(this.app.vault.on("rename", ()=>checkForNewDailyNotes(this)));
		this.events.forEach(event => {
			this.registerEvent(event);
		});
		
		this.registerMarkdownCodeBlockProcessor("gEvent", (text, el, ctx) => 
			checkEditorForCodeBlocks(text, el, ctx)
		);

		this.registerEditorSuggest(new TemplateSuggest(this.app));

		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_DAY,
			(leaf: WorkspaceLeaf) => new DayCalendarView(leaf)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_MONTH,
			(leaf: WorkspaceLeaf) => new MonthCalendarView(leaf)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_WEB,
			(leaf: WorkspaceLeaf) => new WebCalendarView(leaf)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE,
			(leaf: WorkspaceLeaf) => new ScheduleCalendarView(leaf)
		);


		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				(editor: Editor) => {
					checkEditorForAtDates(editor);
					checkEditorForInsertedEvents(editor)
				})
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

		//Open schedule view
		this.addCommand({
			id: "open-google-calendar-schedule-view",
			name: "Open Google Calendar schedule view",
			callback: () => 
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE)
		});

		//List events command
		this.addCommand({
			id: "list-google-calendars",
			name: "List Google Calendars",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				googleListCalendars().then((calendars) => {
					new CalendarsListModal(calendars).open();
				});
			},
		});

		//Create event command
		this.addCommand({
			id: "create-google-calendar-event",
			name: "Create Google Calendar Event",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}
	
				new EventDetailsModal({start:{}, end:{}}, () => {
					googleClearCachedEvents()
				}).open()
				
			},
		});


		//List calendar command
		this.addCommand({
			id: "list-google-calendars",
			name: "List Google Calendars",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				googleListCalendars().then((calendars) => {
					new CalendarsListModal(calendars).open();
				});
			},
		});

		//List events command
		this.addCommand({
			id: "list-google-events",
			name: "List Google Events",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				googleListEvents().then((events) => {
					new EventListModal(events, "details").open()
				});
			},
		});


		this.addCommand({
			id: "google-calendar-trigger-auto-import",
			name: "Google Calendar Trigger Auto Import",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				checkForEventNotes(this);
			},
		});

		this.addCommand({
			id: "google-calendar-create-event-note",
			name: "Create Event Note",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				googleListEvents().then((events) => {
					new EventListModal(events, "createNote").open()
				});
			},
		});

		this.addCommand({
			id: "google-calendar-create-event-note-current-event",
			name: "Create Event Note for current event",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				googleListEvents().then((events) => {
					let currentEvents = events.filter(event => {
						if(event.start.date) return false;
						const startMoment = window.moment(event.start.dateTime);
						const endMoment = window.moment(event.end.dateTime);
						const nowMoment = window.moment();
						if(nowMoment.isBefore(startMoment) || nowMoment.isAfter(endMoment)){
							return false;
						}
					
						return true;
					})
		
					if(currentEvents.length == 0) {
						currentEvents = events.filter(event => {
							if(event.start.date) return false;
							const startMoment = window.moment(event.start.dateTime).subtract(1,"hour");
							const endMoment = window.moment(event.end.dateTime);
							const nowMoment = window.moment();
							if(nowMoment.isBefore(startMoment) || nowMoment.isAfter(endMoment)){
								return false;
							}
							return true;
						})
					}

					if(currentEvents.length == 0){
						currentEvents = events.filter(event => {
							if(event.start.date) return true;
							return false
						})
					}

					if(currentEvents.length == 1){
						if(this.settings.useDefaultTemplate && this.settings.defaultFolder && this.settings.defaultFolder){
							createNoteFromEvent(currentEvents[0], this.settings.defaultFolder, this.settings.defaultTemplate)
						}else{
							new CreateNotePromptModal(currentEvents[0], ()=>{}).open();
						}
					}else{
						new EventListModal(currentEvents, "createNote").open();
					}
				});
			},
		});

		this.addCommand({
			id: "insert-google-event-codeblock",
			name: "Insert Google Event CodeBlock",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					"```gEvent\ndate: "+window.moment().format("YYYY-MM-DD")+"\ntype: day\n```",
					editor.getCursor()
				);
			},
		});

		this.addCommand({
			id: "insert-google-event-template",
			name: "Insert Google Event Template",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					"{{gEvent.}}",
					editor.getCursor()
				);

				//Move cursor behind .
				const cursor = editor.getCursor();
				cursor.ch += "{{gEvent.".length;
				editor.setCursor(cursor);

			},
		});
		
		/**
		* This function will list all events of a day you can choose events to insert and decide if you want a list or a table
		* as a table and inset the table into the currently open editor using the markdown format
		* This functions is used to save your events into a static field creating a backup of the day independent from the API
		*/	
		this.addCommand({
			id: "insert-google-events",
			name: "Insert Google events",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor
			): boolean => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}
			
				new InsertEventsModal(editor).open();
			
			},
		});


			
		/**
		 * This function will try to create a event from the yaml metadata of a file
		*/	
		this.addCommand({
			id: "create-google-calendar-event-from-frontmatter ",
			name: "Create Google Calendar Event from frontmatter",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView
			): boolean => {
				const canRun = settingsAreCompleteAndLoggedIn();
				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				if( !view.file) {
					return;
				}


				getEventFromFrontMatter(view).then(newEvent => {
					if(!newEvent)return;
					googleCreateEvent(newEvent)
				})
			},
		});

		//Copy Refresh token to clipboard
		this.addCommand({
			id: "copy-google-calendar-refresh-token",
			name: "Copy Google Calendar Refresh Token to Clipboard",

			callback: () => {
				const token = getRefreshToken();
				if(token == undefined || token == ''){
					new Notice("No Refresh Token. Please Login.")
					return;
				}

				navigator.clipboard.writeText(token);
				new Notice("Token copied")
			},
		});

		this.settingsTab = new GoogleCalendarSettingTab(this.app, this);

		this.addSettingTab(this.settingsTab);

		this.registerObsidianProtocolHandler("googleLogin", async (req) => {
			if(this.settings.useCustomClient) return;			
			setUserId(req['uid'])
			setAccessToken(req['at']);
			setExpirationTime(+new Date() + 3600000);
			new Notice("Login successful!");

			this.settingsTab.display();
		});
	}

	onunload(): void {
		
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_DAY);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_MONTH);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_WEB);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE);


		for(const event in this.events){
			this.app.vault.offref(event);
		}
		this.events = [];

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