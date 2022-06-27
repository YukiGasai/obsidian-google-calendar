/**
 * This file contains all custom types defined to work with typescript
 * Most types come from the Calendar API 
 */


export interface GoogleCalendarPluginSettings {
	googleClientId: string;
	googleClientSecret: string;
	googleApiToken: string;
	googleRefreshToken: string;
	askConfirmation: boolean;
	refreshInterval: number;
	showNotice: boolean;
	calendarBlackList: [string, string][];
}

export interface GoogleCalander {
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

export interface GoogleCalanderList {
	kind: "calendar#calendarList";
	etag: string;
	nextPageToken: string;
	nextSyncToken: string;
	items: [GoogleCalander];
}

export interface GoogleEvent {
	parent?: GoogleCalander;
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

