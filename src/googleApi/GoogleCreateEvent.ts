import type { GoogleEvent } from "../helper/types";

import { createNotice } from "../helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { GoogleApiError } from "./GoogleApiError";


function dateToGoogleDate(date: string): string {
    return window.moment(date).format("YYYY-MM-DD")
}

function dateTimeToGoogleDateTime(date: string): string {
    return window.moment(date).format()
}


/**
 * 	Function to create a simple event for recurrence events the browser is needed 
 * This could be changed TODO
 * @param event The event we want to create at the api
 * @returns The created Event
 */
export async function googleCreateEvent(event: GoogleEvent | any): Promise<GoogleEvent> {

    const plugin = GoogleCalendarPlugin.getInstance();

    if(event.start.date){
        event.start.date = dateToGoogleDate(event.start.date); 
        event.end.date = dateToGoogleDate(event.end.date); 
    }else{
        event.start.dateTime = dateTimeToGoogleDateTime(event.start.dateTime); 
        event.end.dateTime = dateTimeToGoogleDateTime(event.end.dateTime); 
    }

	if (!settingsAreCompleteAndLoggedIn()){
        throw new GoogleApiError("Not logged in", null, 401, {error: "Not logged in"})
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

    const createdEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events?conferenceDataVersion=1`, 'POST', event)
    return createdEvent;
}


export async function createEvent(event: GoogleEvent | any): Promise<GoogleEvent> {
    try{
        const createdEvent = await googleCreateEvent(event);
        createNotice(`Google Event ${event.summary} created.`);
        return createdEvent;
    } catch (error) {
        if(!(error instanceof GoogleApiError)){
            return null;
        }

        switch (error.status) {
            case 401: break;
            case 999: 
                createNotice(error.message)
                break;
            default:
                createNotice(`Google Event ${event.summary} could not be created.`);
                console.error('[GoogleCalendar]', error);
                break;
        }

        return null;
    }
}