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
import { GoogleCacheHandler } from "../googleApi/GoogleCacheHandler";
import { checkForDefaultVariable } from "../helper/CheckForDefaultVariable";

/**
 * This function is the main function to get a list of events. The function uses named parameters to make it easy to use.
 * You can set a timespan with start-/enddate and ex-/include calendars 
 * @param Input Object for named parameters  
 * @returns A list of GoogleCalendarEvents
 */
export async function googleListEvents( listOptions: ListOptions = {} ): Promise<GoogleEvent[]> {

	const plugin = GoogleCalendarPlugin.getInstance();
	const googleCache = GoogleCacheHandler.getInstance();

	const { startDate,
			endDate,
			exclude: excludedCalendars,
			include: includedCalendars,
	}:ListOptions = checkForDefaultVariable(listOptions);

	// Use the cache if the request is in the cache date range of default 4 years
	if(startDate.isAfter(googleCache.cacheStart) && endDate.isBefore(googleCache.cacheEnd)){
		return googleCache.getEventsForRange({ 
			startDate,
			endDate,
			exclude: excludedCalendars,
			include: includedCalendars,
		})
	}

	// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	// NOT USING THE CACHE FOR SOME OCCASIONS
	// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	//Get all calendars not on the black list
	let calendarList = await googleListCalendars();

	//Get the list of calendars that should be queried
	if (includedCalendars && includedCalendars.length) {
		calendarList = calendarList.filter((calendar: GoogleCalendar) =>
			(includedCalendars.contains(calendar.id) || includedCalendars.contains(calendar.summary))
		);
	} else if (excludedCalendars && excludedCalendars.length) {
		calendarList = calendarList.filter((calendar: GoogleCalendar) =>
			!(excludedCalendars.contains(calendar.id) || excludedCalendars.contains(calendar.summary))
		);
	}

	const requests = [];
	for (const calendar of calendarList) {
		requests.push(googleListEventsByCalendar(
			plugin,
			calendar,
			startDate,
			endDate
		));
	}
	//Get Events from calendars
	let allEvents = await Promise.all(requests);
	allEvents = [].concat.apply([], allEvents)
	//Sort because multi day requests will only sort by date
	allEvents = _.orderBy(allEvents, [(event: GoogleEvent) => new Date(event.start.date ?? event.start.dateTime)], "asc")
	
	return allEvents;
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
export async function requestEventsFromApi(
	GoogleCalendar: GoogleCalendar,
	startString: string,
	endString: string
): Promise<[GoogleEvent[], string]> {
	if (!settingsAreCompleteAndLoggedIn()) return [[], ""];

	let nextPageToken = "";
	const resultSizes = 2500;
	let totalEventList: GoogleEvent[] = [];

	while(true){
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

		if (nextPageToken) {
			url += `&pageToken=${nextPageToken}`;
		}
		console.log(url)
		const tmpRequestResult = await callRequest(url, "GET", null);
		if (!tmpRequestResult) {
			createNotice("Could not list Google Events");
			continue;
		}
		console.log(tmpRequestResult)
		//Set next page token for next request to query the next page of events
		if(tmpRequestResult?.nextPageToken){
			nextPageToken = tmpRequestResult.nextPageToken;
			console.log("SET NEW TOKEN")
		}else {
			nextPageToken = "";
		}
		const newList = tmpRequestResult.items.filter((event) => {
			event.parent = GoogleCalendar;
			return event.status !== "cancelled"
		});

		totalEventList = [...totalEventList, ...newList];

		// Break out of loop if there are no more events to fetch
		if(tmpRequestResult?.nextSyncToken || tmpRequestResult?.items?.length < resultSizes){
			return [totalEventList, tmpRequestResult.nextSyncToken];
		}
	}
	//while (tmpRequestResult.items.length == resultSizes);
}

/**
 * This function checks for multi day events and resolves them to multiple events
 * @param totalEventList 
 * @param date 
 * @param endDate 
 * @returns 
 */
export function resolveMultiDayEventsHelper(
	totalEventList: GoogleEvent[],
	date?: moment.Moment,
	endDate?: moment.Moment
): GoogleEvent[] {
	if(!totalEventList) return [];

	let extraEvents: GoogleEvent[] = [];
	totalEventList.forEach((tmp: GoogleEvent) => {
		if (!tmp.start.dateTime || !tmp.end.dateTime) return;

		const endMoment = window.moment(tmp.end.dateTime);
		let startMoment = window.moment(tmp.start.dateTime);

		if (startMoment.isSame(endMoment, "day")) return;

		let extraEventsTmp: GoogleEvent[] = [];

		const totalDays = endMoment.endOf("day").diff(startMoment.startOf("day"), "days") + 1;

		const title = tmp.summary;

		let dayCount = 1;

		do {
			tmp.summary = `${title} (Day ${dayCount}/${totalDays})`
			tmp.eventType = "multiDay";
			extraEventsTmp = [...extraEventsTmp, structuredClone(tmp)];
			dayCount++;
			startMoment = startMoment.add(1, "days");
			tmp.start.dateTime = startMoment.format("YYYY-MM-DD HH:mm");
		} while (!startMoment.isAfter(endMoment, "day"));


		extraEventsTmp = extraEventsTmp.filter(event => {
			const startMoment = window.moment(event.start.dateTime);
			if (date && startMoment.isBefore(date, "day")) return false;
			if (endDate && startMoment.isSameOrAfter(endDate, "day")) return false;
			return true;
		})

		tmp.eventType = "delete";

		extraEvents = [...extraEvents, ...extraEventsTmp];

	});

	totalEventList = [...totalEventList, ...extraEvents];

	return totalEventList;
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
	endDate: moment.Moment
): Promise<GoogleEvent[]> {
	
	//Get the events because cache was no option
	let [totalEventList, ] = await requestEventsFromApi(GoogleCalendar, startDate.toISOString(), endDate.toISOString());

	//Turn multi day events into multiple events
	totalEventList = resolveMultiDayEventsHelper(totalEventList, startDate, endDate);

	//Filter out original multi day event
	totalEventList = totalEventList.filter((indexEvent: GoogleEvent) => indexEvent.eventType !== "delete");

	return totalEventList;
}
