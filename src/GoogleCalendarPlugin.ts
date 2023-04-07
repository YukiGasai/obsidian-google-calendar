import type { GoogleCalendarPluginSettings, IGoogleCalendarPluginApi } from "./helper/types";
import { Editor, EventRef, MarkdownView, Notice, Platform, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import {
	GoogleCalendarSettingTab,
	settingsAreCompleteAndLoggedIn,
} from "./view/GoogleCalendarSettingTab";
import { listCalendars } from "./googleApi/GoogleListCalendars";
import { CalendarsListModal } from "./modal/CalendarsListModal";
import { googleClearCachedEvents, listEvents } from "./googleApi/GoogleListEvents";
import { checkEditorForCodeBlocks } from "./helper/CheckEditorForCodeBlocks";
import { DayCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_DAY } from "./view/DayCalendarView";
import { WeekCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_WEEK } from "./view/WeekCalendarView";
import { MonthCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_MONTH } from "./view/MonthCalendarView";
import { WebCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_WEB } from "./view/WebCalendarView";
import { ScheduleCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE } from "./view/ScheduleCalendarView";
import { checkEditorForAtDates } from "./helper/CheckEditorForAtDates";
import { getRefreshToken, setAccessToken, setExpirationTime, setRefreshToken } from "./helper/LocalStorage";
import { EventListModal } from './modal/EventListModal';
import { checkForEventNotes, createNoteFromEvent } from "./helper/AutoEventNoteCreator";
import { EventDetailsModal } from "./modal/EventDetailsModal";
import { checkEditorForInsertedEvents } from "./helper/CheckEditorForInsertedEvents";
import { TemplateSuggest } from "./suggest/TemplateSuggest";
import { InsertEventsModal } from "./modal/InsertEventsModal";
import { GoogleCalendarPluginApi } from "./api/GoogleCalendarPluginApi";
import { findEventNote, getCurrentTheme } from "./helper/Helper";
import { CreateNotePromptModal } from "./modal/CreateNotePromptModal";
import { checkForNewDailyNotes, checkForNewWeeklyNotes } from "./helper/DailyNoteHelper";
import { createEvent } from "../src/googleApi/GoogleCreateEvent";
import { getEventFromFrontMatter } from "./helper/FrontMatterParser";
import { getEvent } from "src/googleApi/GoogleGetEvent";
import { createNotification } from "src/helper/NotificationHelper";
import { getTodaysCustomTasks } from "src/helper/customTask/GetCustomTask";
import { FinishLoginGoogleMobile } from "src/googleApi/GoogleAuth";

const DEFAULT_SETTINGS: GoogleCalendarPluginSettings = {
	googleClientId: "",
	googleClientSecret: "",
	googleRefreshToken: "",
	useCustomClient: true,
	googleOAuthServer: "https://obsidian-google-calendar.vercel.app",
	refreshInterval: 10,
	useNotification: false,
	showNotice: true,
	autoCreateEventNotes: true,
	autoCreateEventNotesMarker: "obsidian",
	autoCreateEventKeepOpen: false,
	importStartOffset: 1,
	importEndOffset: 1,
    optionalNotePrefix: "",
    eventNoteNameFormat: "{{prefix}}{{event-title}}",
	defaultCalendar: "",
	calendarBlackList: [],
	insertTemplates: [],
	useDefaultTemplate: false,
	defaultTemplate: "",
	defaultFolder: (app.vault as any).config.newFileFolderPath,
	activateDailyNoteAddon: false,
	dailyNoteDotColor: "#6aa1d8",
	useWeeklyNotes: false,
	debugMode: false,
	timelineHourFormat: 0,
	atAnnotationEnabled: true,
	usDateFormat: true,
	viewSettings: {
		day: {
			type: "day",
			exclude: [],
			include: [],
			hourRange: [0, 24],
			navigation: true,
		},
		week: {
			type: "week",
			exclude: [],
			include: [],
			hourRange: [0, 24],
			navigation: true,
			dayOffset: 0,
			timespan: 7,
		},
		month: {
			type: "month",
			exclude: [],
			include: [],
		},
		schedule: {
			type: "schedule",
			exclude: [],
			include: [],
			timespan: 7,
		},
		web: {
			type: "web",
			theme: "auto",
			view: "day",			
		}
	}
};

export default class GoogleCalendarPlugin extends Plugin {

	private static instance: GoogleCalendarPlugin;

	public static getInstance(): GoogleCalendarPlugin {
		return GoogleCalendarPlugin.instance;
	}

	api: IGoogleCalendarPluginApi;

	settings: GoogleCalendarPluginSettings;

	coreTemplatePlugin: any;

	templaterPlugin: any;

	settingsTab: GoogleCalendarSettingTab;

	events: EventRef[] = [];


	initView = async (viewId: string): Promise<WorkspaceLeaf> => {
		if (
			this.app.workspace.getLeavesOfType(viewId)
				.length === 0
		) {
			if(Platform.isMobile || viewId === VIEW_TYPE_GOOGLE_CALENDAR_WEB || viewId === VIEW_TYPE_GOOGLE_CALENDAR_WEEK) {
				await this.app.workspace.getLeaf(true).setViewState({
					type: viewId
				});
			}else{
				await this.app.workspace.getRightLeaf(false).setViewState({
					type: viewId,
				});
			}
		}

		const leaf = this.app.workspace
			.getLeavesOfType(viewId)
			.first()

		this.app.workspace.revealLeaf(leaf);

		return leaf 
	};

	onLayoutReady = (): void => {
		checkForNewDailyNotes(this);
		checkForNewWeeklyNotes(this);
		//Get the template plugin to run their commands
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const coreTemplatePlugin = (this.app as any).internalPlugins?.plugins["templates"];
		if (coreTemplatePlugin && coreTemplatePlugin.enabled) {
			this.coreTemplatePlugin = coreTemplatePlugin;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const templaterPlugin = (this.app as any).plugins.plugins["templater-obsidian"];
		if (templaterPlugin && templaterPlugin._loaded) {
			this.templaterPlugin = templaterPlugin;
		}
	}

	async onload(): Promise<void> {

		GoogleCalendarPlugin.instance = this;
		this.api = new GoogleCalendarPluginApi().make();
		await this.loadSettings();
		await checkForEventNotes(this);


		this.app.workspace.onLayoutReady(this.onLayoutReady);


		this.events.push(this.app.vault.on("create", () => {
			checkForNewDailyNotes(this);
			checkForNewWeeklyNotes(this)
		}));
		this.events.push(this.app.vault.on("delete", () => {
			checkForNewDailyNotes(this);
			checkForNewWeeklyNotes(this)
		}));
		this.events.push(this.app.vault.on("rename", () => {
			checkForNewDailyNotes(this);
			checkForNewWeeklyNotes(this)
		}));
		this.events.forEach(event => {
			this.registerEvent(event);
		});


		if (this.settings.useNotification) {
			const notificationInterval = window.setInterval(async () => {

				const events = await listEvents();

				const currentMoment = window.moment()

				const currentEvents = events.filter(event => {
					if (event.start.date) return false;

					const startMoment = window.moment(event.start.dateTime);

					return startMoment.isSame(currentMoment, "minute");
				});
				currentEvents.forEach(event => {
					createNotification(event);
				})
			}, 1000 * 60)
			this.registerInterval(notificationInterval)
		}

		this.registerMarkdownCodeBlockProcessor("gEvent", (text, el, ctx) =>
			checkEditorForCodeBlocks(text, el, ctx)
		);

		this.registerEditorSuggest(new TemplateSuggest(this.app));

		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_DAY,
			(leaf: WorkspaceLeaf) => new DayCalendarView(leaf)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_WEEK,
			(leaf: WorkspaceLeaf) => new WeekCalendarView(leaf)
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
					checkEditorForAtDates(editor, this);
					checkEditorForInsertedEvents(editor)
				})
		);

		//Open Timeline view
		this.addCommand({
			id: "open-google-calendar-timline-view",
			name: "Open gCal Timeline View",
			callback: () =>
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_DAY)
		});

		//Open Week view
		this.addCommand({
			id: "open-google-calendar-week-view",
			name: "Open gCal week view",
			callback: () =>
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_WEEK)
		});

		//Open Month view
		this.addCommand({
			id: "open-google-calendar-month-view",
			name: "Open gCal month view",
			callback: () =>
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_MONTH)
		});

		//Open web view
		this.addCommand({
			id: "open-google-calendar-web-view",
			name: "Open gCal Web View",
			callback: () =>
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_WEB)
		});

		//Open schedule view
		this.addCommand({
			id: "open-google-calendar-schedule-view",
			name: "Open gCal Schedule View",
			callback: () =>
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE)
		});

		//Create event command
		this.addCommand({
			id: "create-google-calendar-event",
			name: "Create gCal Event",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				new EventDetailsModal({ start: {}, end: {} }, () => {
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

				listCalendars().then((calendars) => {
					new CalendarsListModal(calendars).open();
				});
			},
		});

		//List events command
		this.addCommand({
			id: "list-google-events",
			name: "List gCal Events",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				listEvents().then((events) => {
					new EventListModal(events, "details").open()
				});
			},
		});


		this.addCommand({
			id: "google-calendar-trigger-auto-import",
			name: "gCal Trigger Auto Import",

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

				listEvents().then((events) => {
					new EventListModal(events, "createNote").open()
				});
			},
		});


        this.addCommand({
			id: "google-calendar-get-todays-tasks",
			name: "Get Today's gCal Tasks",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				getTodaysCustomTasks().then((tasks) => {
					console.log(tasks)
				});
			},
		});

		this.addCommand({
			id: "google-calendar-create-event-note-current-event",
			name: "Create Event Note for Current gCal Event",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				listEvents().then((events) => {
					let currentEvents = events.filter(event => {
						if (event.start.date) return false;
						const startMoment = window.moment(event.start.dateTime);
						const endMoment = window.moment(event.end.dateTime);
						const nowMoment = window.moment();
						if (nowMoment.isBefore(startMoment) || nowMoment.isAfter(endMoment)) {
							return false;
						}

						return true;
					})

					if (currentEvents.length == 0) {
						currentEvents = events.filter(event => {
							if (event.start.date) return false;
							const startMoment = window.moment(event.start.dateTime).subtract(1, "hour");
							const endMoment = window.moment(event.end.dateTime);
							const nowMoment = window.moment();
							if (nowMoment.isBefore(startMoment) || nowMoment.isAfter(endMoment)) {
								return false;
							}
							return true;
						})
					}

					if (currentEvents.length == 0) {
						currentEvents = events.filter(event => {
							if (event.start.date) return true;
							return false
						})
					}

					if (currentEvents.length == 1) {
						if (this.settings.useDefaultTemplate && this.settings.defaultFolder && this.settings.defaultFolder) {
							createNoteFromEvent(currentEvents[0], this.settings.defaultFolder, this.settings.defaultTemplate)
						} else {
							new CreateNotePromptModal(currentEvents[0], () => { }).open();
						}
					} else {
						new EventListModal(currentEvents, "createNote").open();
					}
				});
			},
		});

		this.addCommand({
			id: "insert-google-event-codeblock",
			name: "Insert gCal Event CodeBlock",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					"```gEvent\ndate: " + window.moment().format("YYYY-MM-DD") + "\ntype: day\n```",
					editor.getCursor()
				);
			},
		});

		this.addCommand({
			id: "insert-google-event-template",
			name: "Insert gCal Event Template",
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
			name: "Insert gCal Events",
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
			name: "Create gCal Event From Frontmatter",
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

				if (!view.file) {
					return;
				}


				getEventFromFrontMatter(view).then((newEvent) => {
					if (!newEvent) return;
					createEvent(newEvent)
				})
			},
		});

		this.settingsTab = new GoogleCalendarSettingTab(this.app, this);

		this.addSettingTab(this.settingsTab);

		this.registerObsidianProtocolHandler("googleLogin", async (req) => {
			// Login for mobile custom client
			if(!Platform.isDesktop && req.code) {
				FinishLoginGoogleMobile(req.code, req.state)
				return
			}

			// Login for Mobile client with public client
			if(Platform.isMobile && req.at){
				setAccessToken(req['at']);
				setRefreshToken(req['rt']);
				setExpirationTime(+new Date() + 3600000);
				new Notice("Login successful!");
				this.settingsTab.display();
			}
		});

		this.registerObsidianProtocolHandler("googleOpenNote", async (req) => {
			if (!req['event']) return;

			const [event_id, calendar_id] = req['event'].split("::");

			const event = await getEvent(event_id, calendar_id);
			let { file: eventNote } = findEventNote(event, this);
			if (eventNote) {
				app.workspace.getLeaf(true).openFile(eventNote);
			} else {
				if (this.settings.useDefaultTemplate && this.settings.defaultFolder && this.settings.defaultFolder) {
					createNoteFromEvent(event, this.settings.defaultFolder, this.settings.defaultTemplate)
				} else {
					new CreateNotePromptModal(event, (newNote: TFile) => eventNote = newNote).open();
				}
			}
		});
	}

	onunload(): void {

		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_DAY);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_WEEK);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_MONTH);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_WEB);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE);


		for (const event in this.events) {
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