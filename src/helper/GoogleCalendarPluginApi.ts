
import type { ListOptions, IGoogleCalendarPluginApi } from './types';
import { googleListEvents } from "../googleApi/GoogleListEvents";
import { googleGetEvent } from "../googleApi/GoogleGetEvent";
import { googleListCalendars } from '../googleApi/GoogleListCalendars';

export class GoogleCalendarPluginApi {

    constructor() {
    }

    public make(): IGoogleCalendarPluginApi {
        return {
            getCalendars: () => googleListCalendars(),
            getEvent: (id:string, calendarId:string) => googleGetEvent(id, calendarId),
            getEvents: (input:ListOptions) => googleListEvents(input)
        }
    }
}