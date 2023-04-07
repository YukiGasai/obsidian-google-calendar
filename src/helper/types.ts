/**
 * This file contains all custom types defined to work with typescript
 * Most types come from the Calendar API 
 */

import type { SplitDirection, TFile } from "obsidian";


export interface GoogleCalendarPluginSettings {
    // Authentication settings
	useCustomClient: boolean;
    googleOAuthServer: string;
    googleClientId: string;
    googleClientSecret: string;
    googleRefreshToken: string;
	
    // Notification settings
    useNotification: boolean;
	showNotice: boolean;
	
    // Event note settings
    eventNoteNameFormat: string;
    optionalNotePrefix: string;
    defaultTemplate: string;
	defaultFolder: string;
    autoCreateEventNotes: boolean;
		autoCreateEventNotesMarker: string;
        autoCreateEventKeepOpen: boolean;
        importStartOffset: number;
        importEndOffset: number;

    // Calendar settings
    defaultCalendar: string;
    calendarBlackList: [string, string][];
    insertTemplates: Template[];
    useDefaultTemplate: boolean;
    
    // Daily note settings
    activateDailyNoteAddon: boolean;
    dailyNoteDotColor: string;
    useWeeklyNotes: boolean;
    
    // Hidden settings
    timelineHourFormat: number;
    usDateFormat: boolean;

    // General settings
    refreshInterval: number;
    atAnnotationEnabled: boolean;
    debugMode: boolean;

	viewSettings: { [type in string]: CodeBlockOptions };
    }

export interface Template {
	name: string,
	insertType: string,
	calendarList: string[], //Ids of calendars
	tableOptions: string[], //Object paths from event
}

export interface GoogleCalendar {
	kind: "calendar#calendarListEntry";
	etag: string;
	id: string;
	summary: string;
	description: string;
	location: string;
	timeZone: string;
	summaryOverride: string;
	colorId: string;
	backgroundColor: string;
	foregroundColor: string;
	hidden: boolean;
	selected: boolean;
	accessRole: string;
	defaultReminders: [
		{
			method: string;
			minutes: number;
		}
	];
	notificationSettings: {
		notifications: [
			{
				type: string;
				method: string;
			}
		];
	};
	primary: boolean;
	deleted: boolean;
	conferenceProperties: {
		allowedConferenceSolutionTypes: [string];
	};
}

export interface GoogleCalendarList {
	kind: "calendar#calendarList";
	etag: string;
	nextPageToken: string;
	nextSyncToken: string;
	items: [GoogleCalendar];
}

export interface GoogleEvent {
	parent?: GoogleCalendar;
	kind?: "calendar#event";
	etag?: string;
	id?: string;
	status?: string;
	htmlLink?: string;
	created?: string;
	updated?: string;
	summary?: string;
	description?: string;
	location?: string;
	colorId?: string;
	creator?: {
		id?: string;
		email?: string;
		displayName?: string;
		self?: boolean;
	};
	organizer?: {
		id?: string;
		email?: string;
		displayName?: string;
		self?: boolean;
	};
	start: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	end: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	endTimeUnspecified?: boolean;
	recurrence?: string[];
	recurringEventId?: string;
	originalStartTime?: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	};
	transparency?: string;
	visibility?: string;
	iCalUID?: string;
	sequence?: number;
	attendees?: [
		{
			id?: string;
			email?: string;
			displayName?: string;
			organizer?: boolean;
			self?: boolean;
			resource?: boolean;
			optional?: boolean;
			responseStatus?: string;
			comment?: string;
			additionalGuests?: number;
		}
	];
	attendeesOmitted?: boolean;
	extendedProperties?: {
		private?: {
			string?: string;
		};
		shared?: {
			string?: string;
		};
	};
	hangoutLink?: string;
	conferenceData?: {
		createRequest?: {
			requestId?: string;
			conferenceSolutionKey?: {
				type?: string;
			};
			status?: {
				statusCode?: string;
			};
		};
		entryPoints?: [
			{
				entryPointType?: string;
				uri?: string;
				label?: string;
				pin?: string;
				accessCode?: string;
				meetingCode?: string;
				passcode?: string;
				password?: string;
			}
		];
		conferenceSolution?: {
			key?: {
				type?: string;
			};
			name?: string;
			iconUri?: string;
		};
		conferenceId?: string;
		signature?: string;
		notes?: string;
	};
	gadget?: {
		type?: string;
		title?: string;
		link?: string;
		iconLink?: string;
		width?: number;
		height?: number;
		display?: string;
		preferences?: {
			string?: string;
		};
	};
	anyoneCanAddSelf?: boolean;
	guestsCanInviteOthers?: boolean;
	guestsCanModify?: boolean;
	guestsCanSeeOtherGuests?: boolean;
	privateCopy?: boolean;
	locked?: boolean;
	reminders?: {
		useDefault?: boolean;
		overrides?: [
			{
				method?: string;
				minutes?: number;
			}
		];
	};
	source?: {
		url?: string;
		title?: string;
	};
	attachments?: [
		{
			fileUrl?: string;
			title?: string;
			mimeType?: string;
			iconLink?: string;
			fileId?: string;
		}
	];
	eventType?: string;
}

export interface GoogleEventList {
	kind: "calendar#events";
	etag: string;
	summary: string;
	description: string;
	updated: string;
	timeZone: string;
	accessRole: string;
	defaultReminders: [
		{
			method: string;
			minutes: number;
		}
	];
	nextPageToken: string;
	nextSyncToken: string;
	items: GoogleEvent[];
}

export interface GoogleInstaces {
	kind: "calendar#events";
	etag: string;
	summary: string;
	description: string;
	updated: string;
	timeZone: string;
	accessRole: string;
	defaultReminders: [
		{
			method: string;
			minutes: number;
		}
	];
	nextPageToken: string;
	nextSyncToken: string;
	items: GoogleEvent[];
}

export interface TimeLineOptions {
	type: string;
	date: string;
	width: number;
	height: number;
}

export interface EventCacheKey {
	start: string;
	end: string;
	calendar: string;
}
export interface EventCacheValue {
	events: GoogleEvent[];
	updated: moment.Moment;
}

export interface ListOptions {
	startDate?: moment.Moment;
	endDate?: moment.Moment;
	exclude?: string[];
	include?: string[];
}

export interface IGoogleCalendarPluginApi {
	getEvent: (id: string, calendarId: string) => Promise<GoogleEvent>,
	getEvents: (input: ListOptions) => Promise<GoogleEvent[]>,
	getCalendars: () => Promise<GoogleCalendar[]>,
    createEvent: (input:GoogleEvent) => Promise<GoogleEvent>,
    deleteEvent: (event:GoogleEvent, deleteAll:boolean) => Promise<boolean>,
    updateEvent: (event:GoogleEvent, updateSingle: boolean) => Promise<GoogleEvent>,
	createEventNote: (event:GoogleEvent, eventDirectory: string, templatePath: string) => Promise<TFile>,
}
export interface CodeBlockOptions {
	type?: "web" | "month" | "day" | "schedule" | "week";
	date?: string;
	moment?: moment.Moment;
	width?: number;
	height?: number;
	navigation?: boolean;
	timespan?: number;
	include?: string[];
	exclude?: string[];
	view?: "day" | "week" | "month" | "agenda";
	theme?: string;
	hourRange?: number[];
	dayOffset?: number;
}



export type EventNoteQueryResult = {
	event: GoogleEvent;
	file: TFile | null;
	match: "id" | "title";
}


export type CustomTask = {
    event: GoogleEvent;
    steps: number;
    goal: number;
    current: number;
    done: boolean;
}

export interface OpenPeriodicNoteOptions {
	date?: moment.Moment;
	openToRight?: SplitDirection;
	openInNewTab?: boolean;
	type?: "daily" | "weekly" | "monthly" | "yearly";
}

export interface ApiRequestData {
	url: string;
	method: string;
	body?: any;
}