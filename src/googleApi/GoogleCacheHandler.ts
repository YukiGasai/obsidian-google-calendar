import _ from "lodash";
import { normalizePath } from "obsidian";
import type { ExportCache, GoogleCache, GoogleCalendar, GoogleEvent, ListOptions, SyncCalendar } from "src/helper/types";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { callRequest } from "../helper/RequestWrapper";
import { googleListCalendars } from "./GoogleListCalendars";
import { requestEventsFromApi, resolveMultiDayEventsHelper } from "./GoogleListEvents";
import { checkForDefaultVariable } from "../helper/CheckForDefaultVariable";
import { CacheUpdateEmitter } from "../googleApi/CacheUpdateEmitter";

export class GoogleCacheHandler {

    private static instance: GoogleCacheHandler;

    private plugin: GoogleCalendarPlugin;

    private CACHE_FILE = "googleCalendarCache.json";

    private idCache = {};
    private dateCache = {};
    private interval: number;

    public cacheStart: moment.Moment ;
    public cacheEnd: moment.Moment;
    public cacheUpdateEmitter: CacheUpdateEmitter;

    private syncCalendars: {[key: string]: string} = {};

    // Singleton fun
    public static getInstance(): GoogleCacheHandler {
        if (!GoogleCacheHandler.instance) {
            GoogleCacheHandler.instance = new GoogleCacheHandler();
        }
        return GoogleCacheHandler.instance;
    }

    private constructor() {
        this.cacheUpdateEmitter = new CacheUpdateEmitter();
        this.cacheStart = window.moment().subtract(2, "years").startOf("year");
        this.cacheEnd = window.moment().add(2, "years").endOf("year");
        this.init();
    }

    private init = async () => {
        this.plugin = GoogleCalendarPlugin.getInstance();
        await this.loadCache()
        if(Object.entries(this.syncCalendars).length > 0) {
            console.log("Cache found")
        }else{
            this.getInitialSyncTokens();
        }

        this.interval = window.setInterval(async () => {
            await this.updateCache();
        }, this.plugin.settings.refreshInterval * 1000);
    }

    private loadCache = async () => {
        const { vault } = this.plugin.app;
        let cachePath = normalizePath(this.CACHE_FILE);
        if(!(await vault.adapter.exists(this.CACHE_FILE))) {
            return;
        }
        const fileContent = await vault.adapter.read(cachePath);
        let {idMap, syncCalendars} = JSON.parse(fileContent) as ExportCache;
        this.idCache = idMap;
        this.syncCalendars = syncCalendars;
        this.buildDateCache(idMap);
    }

    private buildDateCache = (idCache) => {
        const allEvents: GoogleEvent[] = Object.values(idCache);
        // Group events by Day
        const groupedEvents = _.groupBy(allEvents, (event: GoogleEvent) => {
            return window.moment(event.start.dateTime??event.start.date).format("YYYY-MM-DD");
        });

        let currentDate = this.cacheStart.clone();
        while(currentDate.isBefore(this.cacheEnd)) {
            const date = currentDate.format("YYYY-MM-DD");
            this.dateCache[date] = groupedEvents[date] ?? [];
            currentDate.add(1, "day");
        }
    }
    private saveCache = async () => {

        this.cacheUpdateEmitter.emit('cacheUpdate');

        const { vault } = this.plugin.app;
        let cachePath = normalizePath(this.CACHE_FILE);

        const exportCacheObject: ExportCache = {
            idMap: this.idCache,
            syncCalendars: this.syncCalendars
        }

        await vault.adapter.write(cachePath, JSON.stringify(exportCacheObject));
        
    }

    private updateCache = async () => {
        let cacheDidUpdate = false;
        for (let [calendarId, syncToken] of Object.entries(this.syncCalendars)) {
            
            const result = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?syncToken=${syncToken}`, "GET", null);
            this.syncCalendars[calendarId] = result.nextSyncToken;
            (result.items as GoogleEvent[])?.forEach((event: GoogleEvent) => {
                console.log("Updating cache for event: " + event.summary)
                cacheDidUpdate = true;
                const oldEvent = this.idCache[event.id] ;

                // If the event was deleted, we need to remove it from the cache
                if(!oldEvent) {
                    return;
                }
                if(event.status === "cancelled" && this.idCache[event.id]) {
                    delete this.idCache[event.id];
                }
                this.idCache[event.id] = event;
                if(!event.start) {
                    event.start = oldEvent.start;
                }
                const index = window.moment(event.start.dateTime??event.start.date).format("YYYY-MM-DD");

                let dateEvents = this.dateCache[index] ?? [];

                dateEvents = dateEvents.map(indexEvent => indexEvent.id === event.id ? event : indexEvent);
                if(dateEvents.some(indexEvent => indexEvent.id === event.id) === false) {
                    dateEvents.push(event);
                }

                dateEvents = dateEvents.filter(indexEvent => indexEvent.status !== "cancelled");
                this.dateCache[index] = dateEvents;
            });
        }
        if(cacheDidUpdate){
            await this.saveCache();
        }
    }


    private getInitialSyncTokens = async () => {
        const calendarList = await googleListCalendars();

        const requests = [];
        for (const calendar of calendarList) {
            requests.push(this.googleListEventsByCalendar(calendar, this.cacheStart, this.cacheEnd))
        }
        let allEvents = await Promise.all(requests) as GoogleEvent[][];
        [].concat.apply([], allEvents).forEach((event: GoogleEvent) => {
            this.idCache[event.id] = event;
        });
        this.buildDateCache(this.idCache);
        this.saveCache();
    }
    

    async googleListEventsByCalendar(
        googleCalendar: GoogleCalendar,
        startDate: moment.Moment,
        endDate: moment.Moment
    ): Promise<GoogleEvent[]> {
    
        //Get the events because cache was no option
        let [totalEventList, nextSyncToken] = await requestEventsFromApi(googleCalendar, startDate.toISOString(), endDate.toISOString());

        //Add the sync token to the cache
        this.syncCalendars[googleCalendar.id] = nextSyncToken;

        //Turn multi day events into multiple events
        totalEventList = resolveMultiDayEventsHelper(totalEventList, startDate, endDate);
    
        //Filter out original multi day event
        totalEventList = totalEventList.filter((indexEvent: GoogleEvent) => indexEvent.eventType !== "delete");
    
        return totalEventList
    }


    public getEventsForDate = (date: moment.Moment): GoogleEvent[] => {
        return this.dateCache[date.format("YYYY-MM-DD")] ?? [];
    }

    public getEventById = (id: string): GoogleEvent => {
        return this.idCache[id];
    }

    public getEventsForRange = ({startDate, endDate, include, exclude}:ListOptions): GoogleEvent[] => {    
        let events: GoogleEvent[] = [];
        let currentDate = startDate.clone();
        while(currentDate.isBefore(endDate)) {
            events = events.concat(this.getEventsForDate(currentDate));
            currentDate.add(1, "day");
        }

        if(include && include.length > 0) {
            return events.filter((event: GoogleEvent) => (include.contains(event.parent.id) || include.contains(event.parent.summary)));
        }else if(exclude) {
            return events.filter((event: GoogleEvent) => !(exclude.contains(event.parent.id) || exclude.contains(event.parent.summary)));
        }

        return events;
    }

    public removeEvent = (event: GoogleEvent) => {
        delete this.idCache[event.id];
        const index = window.moment(event.start.dateTime??event.start.date).format("YYYY-MM-DD");
        this.dateCache[index] = this.dateCache[index].filter((indexEvent: GoogleEvent) => indexEvent.id !== event.id);
        this.saveCache();
    }

    public updateEvent = (event: GoogleEvent) => {
        this.idCache[event.id] = event;
        const index = window.moment(event.start.dateTime??event.start.date).format("YYYY-MM-DD");
        this.dateCache[index] = this.dateCache[index].map((indexEvent: GoogleEvent) => indexEvent.id === event.id ? event : indexEvent);
        this.saveCache();
    }

    public createEvent = (event: GoogleEvent) => {
        this.idCache[event.id] = event;
        const index = window.moment(event.start.dateTime??event.start.date).format("YYYY-MM-DD");
        this.dateCache[index] = this.dateCache[index].concat(event);
        this.saveCache();
    }
}