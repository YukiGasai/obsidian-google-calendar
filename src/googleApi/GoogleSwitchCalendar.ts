import type { GoogleEvent } from "../helper/types";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";
import { GoogleApiError } from "./GoogleApiError";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { googleListCalendars } from "../googleApi/GoogleListCalendars";

/**
 * This function will switch the calendar of an event at the google api
 * @param _event 
 * @returns 
 */
export async function googleSwitchCalendar(
    _event: GoogleEvent,
    newCalendarId: string,
): Promise<GoogleEvent> {

    let event = structuredClone(_event)

    const plugin = GoogleCalendarPlugin.getInstance();

	if (!settingsAreCompleteAndLoggedIn()){
        throw new GoogleApiError("Not logged in", null, 401, {error: "Not logged in"})
    }

    let calenderId = ""
    
    if(event?.parent?.id){
        calenderId = event.parent.id;
    }else{
        calenderId = plugin.settings.defaultCalendar;
    }

    if(calenderId === ""){
        throw new GoogleApiError("Could not switch Calendar for Event because no default calendar selected in Settings", null, 999, {error: "No calendar set"})    
    }

	let updatedEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events/${event.recurringEventId ?? event.id}/move?destination=${newCalendarId}`, "POST", event)
    let calendars = await googleListCalendars()
    _event.parent = calendars.find(calendar => calendar.id === newCalendarId);

	return _event;
}


export async function switchCalendar(
	event: GoogleEvent,
    newCalendarId: string,
): Promise<GoogleEvent> {
    try{
        const updatedEvent = await googleSwitchCalendar(
            event,
            newCalendarId
        );
        createNotice(`Google Event ${updatedEvent.summary} switched calendar.`);
	    return updatedEvent;
    }catch(error){
        switch (error.status) {
            case 401: break;
            case 999: 
                createNotice(error.message)
                break;
            default:
                createNotice(`Google Event ${event.summary} could not switch calendar.`);
                console.error('[GoogleCalendar]', error);
                break;
        }
		return null; 
    }
}


