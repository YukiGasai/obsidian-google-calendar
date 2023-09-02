import type { GoogleEvent } from "../helper/types";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";
import { getEvent } from "src/googleApi/GoogleGetEvent";
import { GoogleApiError } from "./GoogleApiError";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { googleListCalendars } from "../googleApi/GoogleListCalendars";

/**
 * This function can update simple properties of an event at the api.
 * If the event is recurrent is will update all it's instanced except if updateSingle is set
 * There can occur errors when updating an event. A more save version is to delete and re-create the event
 * @param event The event to update and its data
 * @param updateSingle If set to true and if the event is recurrent only one instance is updated
 * @returns the updated event
 */
export async function googleUpdateEvent(
    _event: GoogleEvent,
	updateAllOccurrences = false
): Promise<GoogleEvent> {

    let event = structuredClone(_event)

    const plugin = GoogleCalendarPlugin.getInstance();

	if (!settingsAreCompleteAndLoggedIn()){
        throw new GoogleApiError("Not logged in", null, 401, {error: "Not logged in"})
    }

	//Check if the user wants to update all events from a recurring task
	if (updateAllOccurrences && event.recurringEventId) {
        const recurringEvent = await getEvent(event.recurringEventId, event.parent.id);
   
        event = {
            ...recurringEvent,
            ...event,
        };

        if(event.start.dateTime){
            event.start.dateTime = window.moment(event.start.dateTime).date(window.moment(recurringEvent.start.dateTime).date()).format()
            event.end.dateTime = window.moment(event.end.dateTime).date(window.moment(recurringEvent.end.dateTime).date()).format()
        }else{
            event.start.date = window.moment(recurringEvent.start.date).format("YYYY-MM-DD")
            event.end.date = window.moment(recurringEvent.end.date).format("YYYY-MM-DD")
        }

        event.id = recurringEvent.id;
        event.recurrence = recurringEvent.recurrence;
        event.id = recurringEvent.id;
        delete event.recurringEventId;
        delete event.originalStartTime

    }

    let calenderId = ""
    
    if(event?.parent?.id){
        calenderId = event.parent.id;
        event.start.timeZone = event.parent.timeZone;
        event.end.timeZone = event.parent.timeZone;
        delete event.parent;
    }else{
        calenderId = plugin.settings.defaultCalendar;
    }

    if(calenderId === ""){
        throw new GoogleApiError("Could not create Google Event because no default calendar selected in Settings", null, 999, {error: "No calendar set"})    
    }

	let updatedEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events/${event.id}`, "PUT", event)
    let calendars = await googleListCalendars()
    updatedEvent.parent = calendars.find(calendar => calendar.id === calenderId);

	return updatedEvent;
}


export async function updateEvent(
	event: GoogleEvent,
	updateAllOccurrences = false
): Promise<GoogleEvent> {
    try{
        const updatedEvent = await googleUpdateEvent(
            event,
            updateAllOccurrences
        );
        createNotice(`Google Event ${updatedEvent.summary} updated.`);
	    return updatedEvent;
    }catch(error){
        switch (error.status) {
            case 401: break;
            case 999: 
                createNotice(error.message)
                break;
            default:
                createNotice(`Google Event ${event.summary} could not be updated.`);
                console.error('[GoogleCalendar]', error);
                break;
        }
		return null; 
    }
}


