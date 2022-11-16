import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface"
import type { TFile } from 'obsidian';
import type moment from "moment";
import _ from "lodash";

let allDailyNotes:Record<string,TFile> = getAllDailyNotes()

export const dailyNotesUpdated = new Event('dailyNoteUpdate', {
    bubbles: true,
    cancelable: false,
    composed: false,

  })

export const checkForNewDailyNotes = ():void => {
    if(app.workspace.layoutReady){
        const newEvents = getAllDailyNotes();
        if(!_.equals(allDailyNotes,newEvents))
        allDailyNotes = newEvents;
        document.dispatchEvent(dailyNotesUpdated);
    }
}

export const getDailyNotes = (): Record<string,TFile> => {
    return allDailyNotes;
}

export const getSingleDailyNote = (day:moment.Moment): TFile => {
    return getDailyNote(day, allDailyNotes);
}