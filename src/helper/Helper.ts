import type { TFile } from "obsidian";
import type { EventNoteQueryResult, GoogleEvent } from "./types";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";

/**
 * @param date to convert
 * @returns time of day as a number between 0 and 1
 */
export function dateToPercent(date: Date): number {
	return date.getHours() / 24 + date.getMinutes() / (60 * 24);
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
	if (event.start.date || event?.eventType == "multiDay") {
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
	if (event.start.date || event?.eventType == "multiDay") {
		return 25;
	}

	const startPercentage = dateToPercent(new Date(event.start.dateTime));
	const endPercentage = dateToPercent(new Date(event.end.dateTime));
	return timeLineHeight * (endPercentage - startPercentage);
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


export const sanitizeFileName = (name: string): string => {
    if(!name) return "";
	return name.trim()
		.replace('<', 'lt')
		.replace('>', 'gt')
		.replace('"', '\'\'')
		.replace('\\', '-')
		.replace('/', '-')
		.replace(':', '-')
		.replace('|', '-')
		.replace('*', '')
		.replace('?', '');
}



const checkNotesForEventId = (files, eventId: string): [TFile[], TFile[], TFile[]] => {
    return files.reduce(([withID, withOutID, withWrongID], file) => {
		const frontmatter = app.metadataCache.getFileCache(file).frontmatter;
		if (frontmatter?.['event-id'] === eventId) {
			return [[...withID, file], withOutID, withWrongID]
		} else if (frontmatter?.['event-id']) {
			return [withID, withOutID, [...withWrongID, file]]
		} else {
			return [withID, [...withOutID, file], withWrongID]
		}
	}, [[], [], []]);
}

const findEventNoteByTitle = (event: GoogleEvent): EventNoteQueryResult => {
	const filesWithName = app.vault.getFiles().filter(file =>
		file.basename == sanitizeFileName(event.summary)
	)
	
    const [filesWithId, filesWithOutId] = checkNotesForEventId(filesWithName, event.id)

	return {
		event: event,
		file: filesWithId[0] || filesWithOutId[0] || null,
		match: filesWithId.length > 0 ? "id" : "title"
	}
}

const findEventNoteForAllFiles = (event: GoogleEvent): EventNoteQueryResult => {
	const files = app.vault.getFiles();
	
    for (let index = 0; index < files.length; index++) {
        const frontmatter = app.metadataCache.getFileCache(files[index]).frontmatter;
        if(frontmatter?.['event-id'] === event.id) {
            return {
                event: event,
                file: files[index],
                match: "id"
            }
        }
    }

	return {
		event: event,
		file: null,
		match: "id"
	}
}


const findEventNoteForAllPrefixedFiles = (event: GoogleEvent, plugin: GoogleCalendarPlugin): EventNoteQueryResult => {
	const filesWithName = app.vault.getFiles().filter(file =>
    	file.basename.startsWith(plugin.settings.optionalNotePrefix)
	)
    const [filesWithId, filesWithOutId] = checkNotesForEventId(filesWithName, event.id)

	return {
		event: event,
		file: filesWithId[0] || filesWithOutId[0] || null,
		match: filesWithId.length > 0 ? "id" : "title"
	}
}

export const findEventNote = (event: GoogleEvent, plugin: GoogleCalendarPlugin): EventNoteQueryResult => {
    //First check with good performance for file title for the event note
    const titleResult = findEventNoteByTitle(event);
    if(titleResult.match == "id" && titleResult.file) return titleResult;

    //Bad performance, check every file for the event id
    const finalResult = findEventNoteForAllPrefixedFiles(event, plugin);

    return finalResult;
}