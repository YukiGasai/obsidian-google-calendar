import type { EventNoteQueryResult, GoogleEvent } from "./types";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

/**
 * @param date to convert
 * @returns time of day as a number between 0 and 1
 */
export function dateToPercent(date: Date): number {
	return date.getHours() / 24 + date.getMinutes() / (60 * 24);
}

export function percentToDate(percent: number, initDate: Date): Date {

	const minutes = percent * 24 * 60;
	const hours = Math.floor(minutes / 60);
	const minutesLeft = Math.floor(minutes - hours * 60);
	const date = new Date(initDate);
	date.setHours(hours);
	date.setMinutes(minutesLeft);
	return date;
}

/**
 * This function calculates the y position of a event in a timeline view
 * The height is the percentage the day has gone when the event starts
//  * The start of the day is 0% the end is 100% this is mapped to the height of th view 
 * 
 * If the event is full day the height is 0
 * 
 * @param event to calculate the position from
 * @param timeLineHeight the max height of the timeline 
 * @returns height where the events starts
 */
export function getEventStartPosition(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	if (event.start.date) {
		return 0;
	}

	const startPercentage = dateToPercent(new Date(event.start.dateTime));
	return timeLineHeight * startPercentage;
}

/**
 * This function calculated the height of a event inside a timeline view
 * The height is determined by the start and end time of the event
 * 
 * TODO Error when stretches over more than a day
 * @param event to get the height of
 * @param timeLineHeight the max height of the timeline  
 * @returns the height of the event
 */
export function getEventHeight(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	if (event.start.date ) {
		return 25;
	}

	const startPercentage = dateToPercent(new Date(event.start.dateTime));
	const endPercentage = dateToPercent(new Date(event.end.dateTime));
	return timeLineHeight * (endPercentage - startPercentage);
}

export function getStartFromEventHeight(timeLineHeight: number, eventStartPos: number, eventEndPos: number, initDate: Date): { start: Date, end: Date } {
	return {
		start: percentToDate(eventStartPos / timeLineHeight, initDate),
		end: percentToDate(eventEndPos / timeLineHeight, initDate),
	}
}

export function getStartHeightOfHour(timeLineHeight: number, hour: number): number {
	return (timeLineHeight / 24) * hour;
}

export function getEndHeightOfHour(timeLineHeight: number, hour: number): number {
	return timeLineHeight - (timeLineHeight / 24) * hour;
}

export const getCurrentTheme = (): string => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (app.vault as any).config.theme ? ((app.vault as any).config.theme == "obsidian" ? "dark" : "light") : "dark";
}

export function nearestMinutes(interval: number, someMoment: moment.Moment): moment.Moment {
	const roundedMinutes = Math.round(someMoment.clone().minute() / interval) * interval;
	return someMoment.clone().minute(roundedMinutes).second(0);
}


export const sanitizeFileName = (name: string): string => {
    if(!name) return "";
	return name.trim()
		.replaceAll('<', 'lt')
		.replaceAll('>', 'gt')
		.replaceAll('"', '\'\'')
		.replaceAll('\\', '-')
		.replaceAll('/', '-')
		.replaceAll(':', '-')
		.replaceAll('|', '-')
		.replaceAll('*', '')
		.replaceAll('?', '');
}

const findEventNoteForAllFiles = (event: GoogleEvent): EventNoteQueryResult => {
	const files = app.vault.getFiles();
	
    for (let index = 0; index < files.length; index++) {
        const frontmatter = app.metadataCache.getFileCache(files[index])?.frontmatter;
		if(!frontmatter) continue;
        if(frontmatter?.['event-id'] === event.id) {
            return {
                event: event,
                file: files[index],
            }
        }
    }

	return {
		event: event,
		file: null,
	}
}

export const findEventNote = (event: GoogleEvent, plugin: GoogleCalendarPlugin): EventNoteQueryResult => {
    return findEventNoteForAllFiles(event);
}

export const obsidianLinkToAnchor = (text:string): string => {
	const plugin = GoogleCalendarPlugin.getInstance();
	const vaultName = plugin.app.vault.getName();
	// Replace obsidian link with a anchor tag to open the file with the obsidian protocol

	const regexForLinks = /\[\[([^\|\]]*)\|?([^\]]*)\]\]/g;
	let matchesForLink;
	const outputForLink = [];
	do {
		matchesForLink = regexForLinks.exec(text);
		outputForLink.push(matchesForLink);
	} while (matchesForLink);


	outputForLink.forEach(match => {
		if (match) {
			if (match[2]) {
				text = text.replace(match[0], `<a href='obsidian://open?vault=${vaultName}&file=${match[1]}'>${match[2]}</a>`, );
			} else {
				text = text.replace(match[0], `<a href='obsidian://open?vault=${vaultName}&file=${match[1]}'>${match[1]}</a>`, );
			}
		}
	});

	return text;
}