import type { TFile } from 'obsidian';
import type moment from "moment";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { getAllDailyNotes, getDailyNote, } from "obsidian-daily-notes-interface"
import _ from "lodash";

let allDailyNotes: Record<string, TFile> = {};

export const dailyNotesUpdated = new Event('dailyNoteUpdate', {
    bubbles: true,
    cancelable: false,
    composed: false,
})


export const checkForNewDailyNotes = async (plugin: GoogleCalendarPlugin): Promise<void> => {

    if (app.workspace.layoutReady && plugin.settings.activateDailyNoteAddon) {
        let newNotes: Record<string, TFile> = {};
        try {
            newNotes = getAllDailyNotes();
        } catch (error) {
            console.log("Daily note folder not set. Deactivated Show Daily notes setting.");
            plugin.settings.activateDailyNoteAddon = false;
            plugin.saveSettings();
        }

        if (_.isEqual(allDailyNotes, newNotes) == false)
            allDailyNotes = newNotes;
        document.dispatchEvent(dailyNotesUpdated);
    }
}

export const getDailyNotes = (): Record<string, TFile> => {
    return allDailyNotes;
}

export const getSingleDailyNote = (day: moment.Moment): TFile => {
    return getDailyNote(day, allDailyNotes);
}