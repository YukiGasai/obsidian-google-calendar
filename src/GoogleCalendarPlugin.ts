import type { GoogleCalendarPluginSettings, GoogleEvent, IGoogleCalendarPluginApi } from "./helper/types";
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
import { YearCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_YEAR } from "./view/YearCalendarView";
import { WebCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_WEB } from "./view/WebCalendarView";
import { EventView, VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS } from "./view/EventDetailsView";
import { ScheduleCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE } from "./view/ScheduleCalendarView";
import { checkEditorForAtDates } from "./helper/CheckEditorForAtDates";
import { setAccessToken, setExpirationTime, setRefreshToken } from "./helper/LocalStorage";
import { EventListModal } from './modal/EventListModal';
import { checkForEventNotes, createNoteFromEvent } from "./helper/AutoEventNoteCreator";
import { EventDetailsModal } from "./modal/EventDetailsModal";
import { checkEditorForInsertedEvents } from "./helper/CheckEditorForInsertedEvents";
import { TemplateSuggest } from "./suggest/TemplateSuggest";
import { InsertEventsModal } from "./modal/InsertEventsModal";
import { GoogleCalendarPluginApi } from "./api/GoogleCalendarPluginApi";
import { findEventNote } from "./helper/Helper";
import { CreateNotePromptModal } from "./modal/CreateNotePromptModal";
import { checkForNewDailyNotes, checkForNewWeeklyNotes } from "./helper/DailyNoteHelper";
import { createEvent } from "../src/googleApi/GoogleCreateEvent";
import { getEventFromFrontMatter } from "./helper/FrontMatterParser";
import { getEvent, googleGetEvent } from "src/googleApi/GoogleGetEvent";
import { createNotification } from "src/helper/NotificationHelper";
import { getTodaysCustomTasks } from "src/helper/customTask/GetCustomTask";
import { FinishLoginGoogleMobile } from "src/googleApi/GoogleAuth";
import { deleteEventFromFrontmatter } from "./helper/FrontMatterDelete";
import { updateEvent } from "./googleApi/GoogleUpdateEvent";
import { createNotice } from "./helper/NoticeHelper";


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
	ignorePatternList: [],
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
			offset: 0,
			timespan: 1,
			showAllDay: true,
			navigation: true,
		},
		week: {
			type: "week",
			exclude: [],
			include: [],
			hourRange: [0, 24],
			offset: 0,
			timespan: 7,
			showAllDay: true,
			navigation: true,
		},
		schedule: {
			type: "schedule",
			exclude: [],
			include: [],
			hourRange: [0, 24],
			offset: 0,
			timespan: 7,
			showAllDay: true,
			navigation: true,
		},
		month: {
			type: "month",
			exclude: [],
			include: [],
			offset: 0,
		},
		year: {
			type: "year",
			exclude: [],
			include: [],
			offset: 0,
			size: 15,
		},
		web: {
			type: "web",
			theme: "auto",
			view: "day",	
			offset: 0,		
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


	initView = async (viewId: string, event?: GoogleEvent, closeFunction?: () => void): Promise<WorkspaceLeaf> => {
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

		if (viewId === VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS &&
			leaf.view instanceof EventView ) {
			leaf.view.setEvent(event);
			leaf.view.setCloseFunction(closeFunction);
		}

		this.app.workspace.revealLeaf(leaf);

		return leaf 
	};

	onLayoutReady = async (): Promise<void> => {
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

		
		await checkForEventNotes(this);

	}

	async onload(): Promise<void> {

		GoogleCalendarPlugin.instance = this;
		this.api = new GoogleCalendarPluginApi().make();
		await this.loadSettings();

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
			VIEW_TYPE_GOOGLE_CALENDAR_YEAR,
			(leaf: WorkspaceLeaf) => new YearCalendarView(leaf)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_WEB,
			(leaf: WorkspaceLeaf) => new WebCalendarView(leaf)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE,
			(leaf: WorkspaceLeaf) => new ScheduleCalendarView(leaf)
		);
		this.registerView(
			VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS,
			(leaf: WorkspaceLeaf) => new EventView(leaf, { start: {}, end: {}}, () => {})
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

		//Open Year view
		this.addCommand({
			id: "open-google-calendar-year-view",
			name: "Open gCal year view",
			callback: () =>
				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_YEAR)
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
			name: "Create gCal Event inside Popup",

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

		//Create event command
		this.addCommand({
			id: "create-google-calendar-event-view",
			name: "Create gCal Event inside View",

			checkCallback: (checking: boolean) => {
				const canRun = settingsAreCompleteAndLoggedIn();

				if (checking) {
					return canRun;
				}

				if (!canRun) {
					return;
				}

				this.initView(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS, ({ start: {}, end: {} }), () => { 
					googleClearCachedEvents();
				});
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
			name: "Create gCal Event from Frontmatter",
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
					if (newEvent.id) return;
					createEvent(newEvent).then(createdEvent => {
						let fileContent = editor.getValue();
						fileContent = fileContent.replace("---", `---\nevent-id: ${createdEvent.id}`);
						editor.setValue(fileContent);
					})
				})
			},
		});


		
		/**
		 * This function will try to update a event from the yaml metadata of a file
		*/
		this.addCommand({
			id: "update-google-calendar-event-from-frontmatter ",
			name: "Update gCal Event from Frontmatter",
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
				getEventFromFrontMatter(view).then(async (newEvent:any) => {
					if (!newEvent || !newEvent.id) {
						createNotice("No event id found in note", true);
						return;						
					}
					const foundEvent = await googleGetEvent(newEvent.id);
					newEvent.parent = foundEvent.parent;
					updateEvent(newEvent);
				})
			},
		});

		/**
		 * This function will try to delete a event from the yaml metadata of a file
		*/
		this.addCommand({
			id: "delete-google-calendar-event-from-frontmatter ",
			name: "Delete gCal Event from Frontmatter",
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
				deleteEventFromFrontmatter(editor, view)
			},
		});

		/**
		 * Open the event of the current event note
		*/
		this.addCommand({
			id: "open-google-calendar-event-from-frontmatter",
			name: "Open gCal Event from Frontmatter",
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
				const eventId = app?.metadataCache?.getFileCache(view.file).frontmatter?.['event-id'];
				if(!eventId) {
					createNotice("No event id found in note", true);
					return;
				}
				getEvent(eventId).then(event => {
					new EventDetailsModal(event, () => { }).open();
				});

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
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_YEAR);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_WEB);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS);

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