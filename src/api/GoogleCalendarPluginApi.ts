
import type { ListOptions, IGoogleCalendarPluginApi, GoogleEvent } from '../helper/types';
import { googleListEvents } from "../googleApi/GoogleListEvents";
import { googleGetEvent } from "../googleApi/GoogleGetEvent";
import { googleListCalendars } from '../googleApi/GoogleListCalendars';
import { googleCreateEvent } from '../googleApi/GoogleCreateEvent';
import { googleDeleteEvent } from '../googleApi/GoogleDeleteEvent';
import { googleUpdateEvent } from '../googleApi/GoogleUpdateEvent';
import { createNoteFromEvent } from "../helper/AutoEventNoteCreator";

export class GoogleCalendarPluginApi {

    constructor() {
    }

    public make(): IGoogleCalendarPluginApi {
        return {
            getCalendars: () => googleListCalendars(),
            getEvent: (id:string, calendarId:string) => googleGetEvent(id, calendarId),
            getEvents: (input:ListOptions) => googleListEvents(input),
            createEvent: (input:GoogleEvent) => googleCreateEvent(input),
            deleteEvent: (event:GoogleEvent, deleteAllOccurrences = false ) => googleDeleteEvent(event, deleteAllOccurrences),
            updateEvent: (event:GoogleEvent, updateAllOccurrences = false) => googleUpdateEvent(event, updateAllOccurrences),
            createEventNote: (event: GoogleEvent, eventDirectory: string, templatePath:string) => createNoteFromEvent(event, eventDirectory, templatePath),
        }
    }
}