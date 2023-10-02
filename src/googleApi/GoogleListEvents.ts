import type {
	EventCacheValue,
	GoogleCalendar,
	GoogleEvent,
	GoogleEventList,
	ListOptions
} from "../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { googleListCalendars } from "./GoogleListCalendars";
import { callRequest } from "src/helper/RequestWrapper";
import _ from "lodash"
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { allColorNames, getColorNameFromEvent } from "../googleApi/GoogleColors";
import { GoogleApiError } from "./GoogleApiError";

const cachedEvents = new Map<string, EventCacheValue>();

/**
 * Function to clear the complete event cache to force new request
 */
export function googleClearCachedEvents(): void {
	cachedEvents.clear()
}

/**
 * This function is the main function to get a list of events. The function uses named parameters to make it easy to use.
 * You can set a timespan with start-/enddate and ex-/include calendars 
 * @param Input Object for named parameters  
 * @returns A list of GoogleCalendarEvents
 */
export async function googleListEvents(
	{ startDate,
		endDate,
		exclude,
		include,
	}: ListOptions = {}
): Promise<GoogleEvent[]> {

	const plugin = GoogleCalendarPlugin.getInstance();

	//Make sure there is a start date
	if (!startDate) {
		startDate = window.moment();
	}
	startDate = startDate.startOf("day");

	//Make sure there is a end date
	if (!endDate) {
		endDate = startDate.clone();
	}
	endDate = endDate.endOf("day");

	//Get all calendars not on the black list
	let calendarList = await googleListCalendars();


	const [includeCalendars, includeColors] = (include ?? []).reduce(([pass, fail], elem) => {
		  return !allColorNames.includes(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
		}, [[], []]);
	

	const [excludeCalendars, excludeColors] = (exclude ?? []).reduce(([pass, fail], elem) => {
		return !allColorNames.includes(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
	  }, [[], []]);
  	


	//Get the list of calendars that should be queried
	if (includeCalendars.length) {
		calendarList = calendarList.filter((calendar: GoogleCalendar) =>
			(includeCalendars.contains(calendar.id) || includeCalendars.contains(calendar.summary))
		);
	} else if (excludeCalendars.length) {
		calendarList = calendarList.filter((calendar: GoogleCalendar) =>
			!(excludeCalendars.contains(calendar.id) || excludeCalendars.contains(calendar.summary))
		);
	}

	//Get Events from calendars
	let eventList: GoogleEvent[] = []
	for (let i = 0; i < calendarList.length; i++) {
		const events = await googleListEventsByCalendar(
			plugin,
			calendarList[i],
			startDate,
			endDate,
			includeColors,
			excludeColors
		);

		eventList = [...eventList, ...events];
	}

	//Sort because multi day requests will only sort by date
	eventList = _.orderBy(eventList, [(event: GoogleEvent) => new Date(event.start.date ?? event.start.dateTime)], "asc")

	return eventList;
}

export async function listEvents(listOptions = {}): Promise<GoogleEvent[]> {
	try {
		const response = await googleListEvents(listOptions);
		return response;
	} catch (error) {
        if(!(error instanceof GoogleApiError)){
            return [];
        }

		switch (error.status) {
            case 401: break;
            case 999: 
                createNotice(error.message)
                break;
            default:
                createNotice(`Google Events could not be loaded.`);
                console.error('[GoogleCalendar]', error);
                break;
        }

		return [];
	}
}

















// ===============================================================================
// =================== HELPER Functions to make to list events ===================
// ===============================================================================

/**
 * This function is the core of the list event function. It makes the http requests to the api and handles the pagination and error handling
 * @param plugin 
 * @param GoogleCalendar 
 * @param startString 
 * @param endString 
 * @returns 
 */
async function requestEventsFromApi(
	GoogleCalendar: GoogleCalendar,
	startString: string,
	endString: string
): Promise<GoogleEvent[]> {

	if (!settingsAreCompleteAndLoggedIn()){
		throw new GoogleApiError("Not logged in", null, 401, {error: "Not logged in"})
	};

	let tmpRequestResult: GoogleEventList;
	const resultSizes = 2500;
	let totalEventList: GoogleEvent[] = [];
	do {
		let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
			GoogleCalendar.id
		)}/events?`;
		url += `maxResults=${resultSizes}`;
		url += `&futureevents=true`
		url += `&singleEvents=true`;
		url += `&orderby=starttime`;
		url += `&sortorder=ascending`;
		url += `&timeMin=${startString}`;
		url += `&timeMax=${endString}`;

		if (tmpRequestResult && tmpRequestResult.nextPageToken) {
			url += `&pageToken=${tmpRequestResult.nextPageToken}`;
		}

		tmpRequestResult = await callRequest(url, "GET", null);
		
		const newList = tmpRequestResult.items.filter((event) => {
			event.parent = GoogleCalendar;
			return event.status != "cancelled"
		});

		totalEventList = [...totalEventList, ...newList];
	} while (tmpRequestResult.items.length == resultSizes && tmpRequestResult.nextPageToken);

	return totalEventList;
}

/**
 * This function checks for multi day events and resolves them to multiple events
 * @param totalEventList 
 * @param date 
 * @param endDate 
 * @returns 
 */
function resolveMultiDayEventsHelper(
	totalEventList: GoogleEvent[],
	date?: moment.Moment,
	endDate?: moment.Moment
): GoogleEvent[] {

	return totalEventList.reduce((allEvents, currentEvent: GoogleEvent):GoogleEvent[] => {
		const isAllDayEvent = currentEvent.start.date && !currentEvent.start.dateTime;

		const endMoment = window.moment(currentEvent.end.dateTime || currentEvent.end.date);
		let startMoment = window.moment(currentEvent.start.dateTime || currentEvent.start.date);

		// Ignore non multi day events
		if (startMoment.isSame(endMoment, "day") || endMoment.isSame(startMoment.clone().add(1, "day").startOf("day"), "minute")) {
			return [...allEvents, currentEvent];
		}

		let singleDayEventList: GoogleEvent[] = [];

		// Amount of days the event spans
		let totalDays = endMoment.clone().endOf("day").diff(startMoment.clone().startOf("day"), "days") + 1;
		if(isAllDayEvent) totalDays--;
		const title = currentEvent.summary;

		// Create the events for all the days except the last one
		for (let dayCount = 1; dayCount <= totalDays; dayCount++) {
			const newEvent =  _.cloneDeep(currentEvent);
			if(isAllDayEvent){
				newEvent.start.date = startMoment.format("YYYY-MM-DD");
			} else {
				newEvent.start.dateTime = startMoment.toISOString();
			}
			if (dayCount == totalDays) {

				if(isAllDayEvent){
					newEvent.end.date = endMoment.format("YYYY-MM-DD");
				} else {
					newEvent.end.dateTime = endMoment.toISOString();
				}

			}else {

				if(isAllDayEvent){
					newEvent.end.date = startMoment.endOf("day").format("YYYY-MM-DD");
				} else {
					newEvent.end.dateTime = startMoment.endOf("day").toISOString();
				}

			}
			newEvent.summary = `${title} (${dayCount}/${totalDays})`;
			newEvent.eventType = "multiDay";
			singleDayEventList.push(newEvent);
			startMoment.add(1, "days").startOf("day");
		}


		//Limit the events to the requested time span
		if (date && endDate) {
			singleDayEventList = singleDayEventList.filter((event) => {
				const eventStart = window.moment(event.start.dateTime ?? event.start.date);
				return eventStart.isBetween(date, endDate, "day", "[]");
			});
		}


		return [...allEvents, ...singleDayEventList];

	}, []);

}

// Check if the range if events is already cached
function checkForCachedEvents (
	plugin: GoogleCalendarPlugin,
	GoogleCalendar: GoogleCalendar,
	startDate: moment.Moment,
	endDate: moment.Moment
) : GoogleEvent[] | null {
	
	let currentDate = startDate.clone();
	let cachedEventList: GoogleEvent[] = [];

	// Loop through all days and check if there is a cached result
	while (currentDate <= endDate) {
		
		const cacheKey: string = JSON.stringify({
			day: currentDate.format("YYYY-MM-DD"),
			calendar: GoogleCalendar.id
		});
		
		// Check if there is a day missing in the cache
		if(!cachedEvents.has(cacheKey)) {
			return null;
		}
		
		if(!plugin.settings.useCustomClient && plugin.settings.refreshInterval < 60){
			plugin.settings.refreshInterval = 60;
		}
		
		// Get the cached events and check if they are still valid
		const { events, updated } = cachedEvents.get(cacheKey);	
		if (updated.clone().add(plugin.settings.refreshInterval, "second").isBefore(window.moment())) {
			return null
		}
		
		// Add the events to the list
		cachedEventList = [...cachedEventList, ...events];
		
		// Check the next day
		currentDate.add(1, "day");
		
	}
	
	return cachedEventList;
}


/**
 * This function will return a list of event in a timespan from a specific calendar
 * The function will check for an equal function call in the cache if there is a stored result that is not to old it will return without api request
 * @param GoogleCalendar  the calendar to get the events from
 * @param date the startdate of the checking time
 * @param endDate the enddate of the checking time
 * @returns a list of Google Events
 */
async function googleListEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	GoogleCalendar: GoogleCalendar,
	startDate: moment.Moment,
	endDate: moment.Moment,
	includeColors: string[] = [],
	excludeColors: string[] = []
): Promise<GoogleEvent[]> {

	//Check if the events are already cached and return them if they are
	const alreadyCachedEvents = checkForCachedEvents(plugin, GoogleCalendar, startDate, endDate)
	if(alreadyCachedEvents) {
		return alreadyCachedEvents.filter((indexEvent: GoogleEvent) => {
			if ( includeColors.length > 0) {
				return includeColors.includes(getColorNameFromEvent(indexEvent));
			} 
			if ( excludeColors.length > 0) {
				return !excludeColors.includes(getColorNameFromEvent(indexEvent));
			}
			return true;
		});
	}
	
	//Get the events because cache was no option
	let totalEventList: GoogleEvent[] = await requestEventsFromApi(GoogleCalendar, startDate.toISOString(), endDate.toISOString());

	//Filter out events with ignore pattern
	// Ignore this if no ignore list is set
	if(plugin.settings.ignorePatternList.length > 0) {
		totalEventList = totalEventList.filter(event => 
		!plugin.settings.ignorePatternList.some(ignoreText => {
			// Check if the ignore text is a regex pattern
			if(ignoreText.startsWith("/") && ignoreText.endsWith("/")) {
				const regex = new RegExp(ignoreText.slice(1, -1));
				return regex.test(event.summary) || regex.test(event.description);
			}
			return event.description?.includes(ignoreText) || event.summary?.includes(ignoreText)
		}))
	}

	//Turn multi day events into multiple events
	totalEventList = resolveMultiDayEventsHelper(totalEventList, startDate, endDate);

	// Group events by Day
	const groupedEvents = _.groupBy(totalEventList, (event: GoogleEvent) => {
		const startMoment = window.moment(event.start.dateTime ?? event.start.date);
		return startMoment.format("YYYY-MM-DD");
	});

	const currentDate = startDate.clone();
	while (currentDate <= endDate) {
		const formattedDate = currentDate.format("YYYY-MM-DD");

		const cacheKey: string = JSON.stringify({ day: formattedDate, calendar: GoogleCalendar.id });
		cachedEvents.set(cacheKey, { events: groupedEvents[formattedDate] || [], updated: window.moment() })
		
		currentDate.add(1, "day");
	}

	return totalEventList.filter((indexEvent: GoogleEvent) => {
		if ( indexEvent.eventType === "delete") return false;
		if ( includeColors.length > 0) {
			return includeColors.includes(getColorNameFromEvent(indexEvent));
		} 
		if ( excludeColors.length > 0) {
			return !excludeColors.includes(getColorNameFromEvent(indexEvent));
		}
		return true;
	});
}
