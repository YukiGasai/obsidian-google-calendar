
import type { GoogleCalendar, IGoogleCalendarPluginApi } from './types';
import {googleListEvents, googleListEventsByCalendar} from "../googleApi/GoogleListEvents";
import {googleGetEvent} from "../googleApi/GoogleGetEvent";
import { googleListCalendars } from '../googleApi/GoogleListCalendars';

export class GoogleCalendarPluginApi {

    constructor() {
    }

    public make(): IGoogleCalendarPluginApi {
        return {
            getCalendars: () => googleListCalendars(),
            getEvents: (start?:moment.Moment, end?:moment.Moment) => googleListEvents(start, end),
            getEventsFromCalendar: (calendar:GoogleCalendar, start?:moment.Moment, end?:moment.Moment) => googleListEventsByCalendar(calendar, start, end),
            getEvent: (id:string, calendarId:string) => googleGetEvent(id, calendarId),
        }
    }
}