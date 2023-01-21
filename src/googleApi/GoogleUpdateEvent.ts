import type { GoogleEvent } from "../helper/types";
import { settingsAreCompleteAndLoggedIn } from "../view/GoogleCalendarSettingTab";
import { createNotice } from "../helper/NoticeHelper";
import { callRequest } from "src/helper/RequestWrapper";
import { googleGetEvent } from "src/googleApi/GoogleGetEvent";
/**
 * This function can update simple properties of an event at the api.
 * If the event is recurrent is will update all it's instanced except if updateSingle is set
 * There can occur errors when updating an event. A more save version is to delete and re-create the event
 * @param event The event to update and its data
 * @param updateSingle If set to true and if the event is recurrent only one instance is updated
 * @returns the updated event
 */
export async function googleUpdateEvent(
	event: GoogleEvent,
	updateAllOccurrences = false
): Promise<GoogleEvent> {
	if (!settingsAreCompleteAndLoggedIn()) return null;

	//Check if the user wants to update all events from a recurring task
	if (updateAllOccurrences && event.recurringEventId) {
        console.log("REOCCURING")
        const recurringEvent = await googleGetEvent(event.recurringEventId, event.parent.id);
        console.log(recurringEvent)
   
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

        console.log(event)
    }


	//clean the event object to send it to the api directly
	const calenderId = event.parent.id;
	delete event.parent;


	const updatedEvent = await callRequest(`https://www.googleapis.com/calendar/v3/calendars/${calenderId}/events/${event.id}`, "PUT", event)

	if (!updatedEvent) {
		createNotice("Could not create Google Event");
		return null;
	}

	createNotice("Updated Event", true);

	return updatedEvent;

}
