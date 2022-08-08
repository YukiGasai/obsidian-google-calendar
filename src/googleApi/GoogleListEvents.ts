import type {
	EventCacheValue,
	GoogleCalander,
	GoogleEvent,
	GoogleEventList,
} from "../helper/types";
import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";

import { createNotice } from "src/helper/NoticeHelper";
import { getGoogleAuthToken } from "./GoogleAuth";
import { moment } from "obsidian";
import { googleListCalendars } from "./GoogleListCalendars";
import ct from 'countries-and-timezones'


const cachedEvents = new Map<string, EventCacheValue>();


const dateToTimeParam = (date:string, tz:string) :string => {
	return encodeURIComponent(`${date}T00:00:00${tz}`);
}


/**
 * 
 * @param plugin  Refrence to the main plugin to acess the settings
 * @param googleCalander 
 * @param date 
 * @param endDate 
 * @returns 
 */
export async function googleListEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	googleCalander: GoogleCalander,
	date: moment.Moment,
	endDate?: moment.Moment
): Promise<GoogleEvent[]> {

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


	if(cachedEvents.has(cacheKey) && !plugin.overwriteCache){
		const {events, updated} = cachedEvents.get(cacheKey);
		if(updated.clone().add(plugin.settings.refreshInterval, "second").isAfter(moment())){
			return events;
		}
	}

	let totalEventList: GoogleEvent[] = [];
	let tmpRequestResult: GoogleEventList;
	const resultSizes = 2500;

	const requestHeaders: HeadersInit = new Headers();
	requestHeaders.append(
		"Authorization",
		"Bearer " + (await getGoogleAuthToken(plugin))
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

		cachedEvents.set(cacheKey, {events: totalEventList, updated:moment()})

		return totalEventList;
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not load google events");
		return [];
	}
}

export async function googleListEvents(
	plugin: GoogleCalendarPlugin,
	date:  moment.Moment,
	endDate?: moment.Moment
): Promise<GoogleEvent[]> {

	try {
		const calendarList = await googleListCalendars(plugin);
		let eventList: GoogleEvent[] = [];

		for (let i = 0; i < calendarList.length; i++) {
			const events = await googleListEventsByCalendar(
				plugin,
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

		if(plugin.overwriteCache){
			plugin.overwriteCache = false;
		}

		return eventList;
	} catch (error) {
		console.log(error);
		createNotice(plugin, "Could not load google events");
		return [];
	}
}

export async function googleListTodayEventsByCalendar(
	plugin: GoogleCalendarPlugin,
	googleCalander: GoogleCalander
): Promise<GoogleEvent[]> {
	const list = await googleListEventsByCalendar(
		plugin,
		googleCalander,
		window.moment()
	);
	return list;
}

export async function googleListTodayEvents(
	plugin: GoogleCalendarPlugin
): Promise<GoogleEvent[]> {
	const list = await googleListEvents(plugin, moment());
	return list;
}

export async function googleListEventsByMonth(
	plugin: GoogleCalendarPlugin,
	dateInMonth: moment.Moment
): Promise<GoogleEvent[]> {
	const monthStartDate = dateInMonth.clone().startOf("month")
	const monthEndDate   = dateInMonth.clone().endOf("month")

	const list = await googleListEvents(plugin, monthStartDate, monthEndDate);
	return list;
}
