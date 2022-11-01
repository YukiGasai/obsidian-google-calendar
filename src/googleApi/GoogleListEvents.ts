import type {
	EventCacheValue,
	GoogleCalendar,
	GoogleEvent,
	GoogleEventList,
	ListOptions
} from "../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleAuthToken } from "./GoogleAuth";
import { googleListCalendars } from "./GoogleListCalendars";
import { requestUrl } from 'obsidian';

import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";

const cachedEvents = new Map<string, EventCacheValue>();

/**
 * Function to clear the complete event cache to force new request
 */
export function googleClearCachedEvents():void{
	cachedEvents.clear()
}

/**
 * This function is the main function to get a list of events. The function uses named parameters to make it easy to use.
 * You can set a timespan with start-/enddate and ex-/include calendars 
 * @param Input Object for named parameters  
 * @returns A list of GoogelCalendarEvents
 */
export async function googleListEvents(
	{ 	startDate,
		endDate,
		exclude: excludedCalendars,
		include: includedCalendars,
	} : ListOptions = {}
): Promise<GoogleEvent[]> {

	const plugin = GoogleCalendarPlugin.getInstance();

	//Make sure there is a start date
	if(!startDate){
		startDate = window.moment();
	}
	startDate = startDate.startOf("day");

	//Make sure there is a end date
	if(!endDate) {
		endDate = startDate.clone();
	}
	endDate = endDate.endOf("day");

	//Get all calendars not on the black list
	let calendarList = await googleListCalendars();
	
	//Get the list of calendars that should be querried
	if(includedCalendars && includedCalendars.length){
		calendarList = calendarList.filter((calendar:GoogleCalendar) => 
			(includedCalendars.contains(calendar.id) || includedCalendars.contains(calendar.summary))
		);		
	}else if(excludedCalendars && excludedCalendars.length){
		calendarList = calendarList.filter((calendar:GoogleCalendar) => 
			!(excludedCalendars.contains(calendar.id) || excludedCalendars.contains(calendar.summary))
		);		
	}

	//Get Events from calendars
	let eventList:GoogleEvent[] = []
	for (let i = 0; i < calendarList.length; i++) {
		const events = await googleListEventsByCalendar(
			plugin,
			calendarList[i],
			startDate,
			endDate
		);

		eventList = [...eventList, ...events];
	}

	return eventList;
}







// ===============================================================================
// =================== HELPER Funcitons to make to list events ===================
// ===============================================================================

/**
 * This function is the core of the list event function. It makes the http requests to the api and handels the pagination and error handeling
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

	if(!settingsAreCompleteAndLoggedIn())return [];

	let tmpRequestResult: GoogleEventList;
	const resultSizes = 2500;
	let totalEventList: GoogleEvent[] = [];
	do {
		let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
			GoogleCalendar.id
		)}/events?`;
		url += `maxResults=${resultSizes}`;
		url += `&singleEvents=True`;
		url += `&orderBy=startTime`;
		url += `&timeMin=${startString}`;
		url += `&timeMax=${endString}`;

		if (tmpRequestResult && tmpRequestResult.nextPageToken) {
			url += `&nextPageToken=${tmpRequestResult.nextPageToken}`;
		}

		const response = await requestUrl({
			url:url,
			method: "GET",
			headers: {
				Authorization: "Bearer " + (await getGoogleAuthToken()),
			},
		});

		if (response.status !== 200) {
			createNotice("Could not list Google Events");
			continue;
		}


		tmpRequestResult = await response.json;

		tmpRequestResult.items.forEach((event) => {
			event.parent = GoogleCalendar;
		});

		const newList = tmpRequestResult.items.filter(
			(event) => event.status != "cancelled"
		);
		totalEventList = [...totalEventList, ...newList];
	} while (tmpRequestResult.items.length == resultSizes);
	
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
	totalEventList:GoogleEvent[],
	date?: moment.Moment,
	endDate?: moment.Moment
	):GoogleEvent[] {
	let extraEvents:GoogleEvent[] = [];
	
	totalEventList.forEach((tmp:GoogleEvent) => {
		if(tmp.start.dateTime && tmp.end.dateTime){
			const endMoment = window.moment(tmp.end.dateTime);
			let startMoment = window.moment(tmp.start.dateTime);
	
			if(!startMoment.isSame(endMoment, "day")) {
			
				let extraEventsTmp:GoogleEvent[] = [];
	
				let totalDays = endMoment.endOf("day").diff(startMoment.startOf("day"), "days") + 1;
					
				const title = tmp.summary;
	
				let dayCount = 1;
	
				do{
					tmp.summary =  `${title} (Day ${dayCount}/${totalDays})`
					tmp.eventType = "multiDay";
					extraEventsTmp = [...extraEventsTmp, structuredClone(tmp)];	
					dayCount++;
					startMoment = startMoment.add(1, "days");
					tmp.start.dateTime = startMoment.format("YYYY-MM-DD HH:mm");
				}while(!startMoment.isAfter(endMoment, "day"));
				
	
				extraEventsTmp = extraEventsTmp.filter(event => {
					const startMoment = window.moment(event.start.dateTime);
					if(date && startMoment.isBefore(date, "day"))return false;
					if(endDate && startMoment.isSameOrAfter(endDate, "day"))return false;
					return true;
				})
	
				tmp.eventType = "delete";
	
				extraEvents = [...extraEvents, ...extraEventsTmp];
	
			}
		}
	});

	totalEventList = [...totalEventList, ...extraEvents];

	return totalEventList;
}

/**
 * This funcion will return a list of evetn in a timespan from a specific calendar
 * The function will check for an equal function call in the cache if there is a stored result that is not to old it will return without api request
 * @param GoogleCalendar  the calendar to get the events from
 * @param date the startdate of the checking time
 * @param endDate the endate of the checking time
 * @returns a list of Google Events
 */
async function googleListEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	GoogleCalendar: GoogleCalendar,
	startDate: moment.Moment,
	endDate: moment.Moment
): Promise<GoogleEvent[]> {
	
	//Turn dates into strings for request and caching
	const startString = startDate.toISOString();
	const endString   = endDate.toISOString();

	//get the hashmap key from start end and calendar
	const cacheKey:string = JSON.stringify({start: startString, end: endString, calendar: GoogleCalendar.id});

	//Check if cache has request saved
	if(cachedEvents.has(cacheKey)){
		const {events, updated} = cachedEvents.get(cacheKey);
		if(updated.clone().add(plugin.settings.refreshInterval, "second").isAfter(window.moment())){
			return events;
		}
	}

	//Get the events because cache was no option
	let totalEventList: GoogleEvent[] = await requestEventsFromApi(GoogleCalendar, startString, endString);	

	//Turn multi day events into multiple events
	totalEventList = resolveMultiDayEventsHelper(totalEventList, startDate, endDate); 

	//Filter out original multi day event
	totalEventList = totalEventList.filter((indexEvent: GoogleEvent) => indexEvent.eventType!=="delete");

	//Cache result
	cachedEvents.set(cacheKey, {events: totalEventList, updated: window.moment()})

	return totalEventList;
}
