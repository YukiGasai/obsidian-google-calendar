import type {
	EventCacheValue,
	GoogleCalander,
	GoogleEvent,
	GoogleEventList,
} from "../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleAuthToken } from "./GoogleAuth";
import { googleListCalendars } from "./GoogleListCalendars";
import ct from 'countries-and-timezones'


const cachedEvents = new Map<string, EventCacheValue>();

const dateToTimeParam = (date:string, tz:string) :string => {
	return encodeURIComponent(`${date}T00:00:00${tz}`);
}

/**
 * Function to clear the complete event cache to force new request
 */
export function googleClearCachedEvents():void{
	cachedEvents.clear()
}

/**
 * This funcion will return a list of evetn in a timespan from a specific calendar
 * The function will check for an equal function call in the cache if there is a stored result that is not to old it will return without api request
 * @param googleCalander  the calendar to get the events from
 * @param date the startdate of the checking time
 * @param endDate the endate of the checking time
 * @returns a list of Google Events
 */
export async function googleListEventsByCalendar(
	googleCalander: GoogleCalander,
	date: moment.Moment,
	endDate?: moment.Moment
): Promise<GoogleEvent[]> {
	
	const plugin = GoogleCalendarPlugin.getInstance();

	//Turn dates into strings for request and caching
	const timezone = ct.getTimezone(googleCalander.timeZone);

	const startString = dateToTimeParam(date.format('YYYY-MM-DD'),timezone.dstOffsetStr);
	let endString = "";
	if(endDate){

		endString = dateToTimeParam(endDate.format('YYYY-MM-DD'),timezone.dstOffsetStr);

	}else{
		endDate = date.clone().add(1, "day")
		endString = dateToTimeParam(endDate.format('YYYY-MM-DD'),timezone.dstOffsetStr)
	}

	const cacheKey:string = JSON.stringify({start: startString, end: endString, calendar: googleCalander.id});


	if(cachedEvents.has(cacheKey)){
		const {events, updated} = cachedEvents.get(cacheKey);
		if(updated.clone().add(plugin.settings.refreshInterval, "second").isAfter(window.moment())){
			return events;
		}
	}

	let totalEventList: GoogleEvent[] = [];
	let tmpRequestResult: GoogleEventList;
	const resultSizes = 2500;

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken())
	);
	requestHeaders.append("Content-Type", "application/json");



	try {
		do {
			let requestUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
				googleCalander.id
			)}/events`;
			requestUrl += `?key=${plugin.settings.googleApiToken}`;
			requestUrl += `&maxResults=${resultSizes}`;
			requestUrl += `&singleEvents=True`;
			requestUrl += `&orderBy=startTime`;
			requestUrl += `&timeMin=${startString}`
			requestUrl += `&timeMax=${endString}`;
			

			if (tmpRequestResult && tmpRequestResult.nextPageToken) {
				requestUrl += `&nextPageToken=${tmpRequestResult.nextPageToken}`;
			}

			const response = await fetch(requestUrl, {
				method: "GET",
				headers: requestHeaders,
			});

			tmpRequestResult = await response.json();
			tmpRequestResult.items.forEach((event) => {
				event.parent = googleCalander;
			});

			const newList = tmpRequestResult.items.filter(
				(event) => event.status != "cancelled"
			);

			totalEventList = [...totalEventList, ...newList];
		} while (tmpRequestResult.items.length == 2500);


		totalEventList = totalEventList.sort((a:GoogleEvent, b:GoogleEvent) : number => {
            const startA = window.moment((a.start.date || a.start.dateTime))
            const startB = window.moment((b.start.date || b.start.dateTime))

            return startA.isBefore(startB, "minute") ? -1 : 1;
        })

		cachedEvents.set(cacheKey, {events: totalEventList, updated: window.moment()})

		return totalEventList;
	} catch (error) {
		console.log(error);
		createNotice("Could not load google events");
		return [];
	}
}

export async function googleListEvents(
	date:  moment.Moment,
	endDate?: moment.Moment
): Promise<GoogleEvent[]> {

	try {
		const calendarList = await googleListCalendars();
		let eventList: GoogleEvent[] = [];

		for (let i = 0; i < calendarList.length; i++) {
			const events = await googleListEventsByCalendar(
				calendarList[i],
				date,
				endDate
			);

			eventList = [...eventList, ...events];
		}

		eventList = eventList.sort((a:GoogleEvent, b:GoogleEvent) : number => {
            const startA = window.moment((a.start.date || a.start.dateTime))
            const startB = window.moment((b.start.date || b.start.dateTime))

            return startA.isBefore(startB, "minute") ? -1 : 1;
        })

		return eventList;
	} catch (error) {
		console.log(error);
		createNotice("Could not load google events");
		return [];
	}
}

export async function googleListTodayEventsByCalendar(googleCalander: GoogleCalander): Promise<GoogleEvent[]> {
	const list = await googleListEventsByCalendar(
		googleCalander,
		window.moment()
	);
	return list;
}

export async function googleListTodayEvents(): Promise<GoogleEvent[]> {
	const list = await googleListEvents(window.moment());
	return list;
}

export async function googleListEventsByMonth(dateInMonth: moment.Moment): Promise<GoogleEvent[]> {
	const monthStartDate = dateInMonth.clone().startOf("month")
	const monthEndDate   = dateInMonth.clone().endOf("month")

	const list = await googleListEvents(monthStartDate, monthEndDate);
	return list;
}
