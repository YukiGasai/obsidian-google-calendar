
import type { GoogleEvent } from "./types";

/**
 * @param date to convert
 * @returns time of day as a number between 0 and 1
 */
 export function DateToPercent(date: Date): number {
	return date.getHours() / 24 + date.getMinutes() / (60 * 24);
}

/**
 * This function calcultes the y position of a event in a timlineview
 * The height is the percentage the day has gone when the event starts
 * The start of the day is 0% the end is 100% this is maped to the height of th view 
 * 
 * If the event is full day the height is 0
 * 
 * @param event to calulate the poition from
 * @param timeLineHeight the max height of the timline 
 * @returns height where the events starts
 */
export function getEventStartPosition(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	if(event.start.date){
		return 0;
	}
	
	const startPercentage = DateToPercent(new Date(event.start.dateTime));
	return timeLineHeight * startPercentage;
}

/**
 * This function calulated the height of a event inside a timeline view
 * The height is determined by the start and end time of the event
 * 
 * TODO Error when stretches over more than a day
 * @param event to get the height of
 * @param timeLineHeight the max height of the timline  
 * @returns the height of the event
 */
export function getEventHeight(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	if(event.start.date){
		return 25;
	}

	const startPercentage = DateToPercent(new Date(event.start.dateTime));
	const endPercentage = DateToPercent(new Date(event.end.dateTime));
	return timeLineHeight * (endPercentage - startPercentage);
}
