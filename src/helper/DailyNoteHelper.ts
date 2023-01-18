import type { TFile } from 'obsidian';
import type moment from "moment";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { getAllDailyNotes, getAllWeeklyNotes, getDailyNote, getWeeklyNote, } from "obsidian-daily-notes-interface"
import _ from "lodash";

let allDailyNotes: Record<string, TFile> = {};
let allWeeklyNotes: Record<string, TFile> = {};

export const checkForNewDailyNotes = async (plugin: GoogleCalendarPlugin): Promise<void> => {
    if (!app.workspace.layoutReady || !plugin.settings.activateDailyNoteAddon) {
        return;
    }

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
}


export const checkForNewWeeklyNotes = async (plugin: GoogleCalendarPlugin): Promise<void> => {
    if (!app.workspace.layoutReady || !plugin.settings.activateDailyNoteAddon || !plugin.settings.useWeeklyNotes) {
        return;
    }

    let newNotes: Record<string, TFile> = {};
    try {
        newNotes = getAllWeeklyNotes();
    } catch (error) {
        console.log("Daily note folder not set. Deactivated Show Daily notes setting.");
        plugin.settings.activateDailyNoteAddon = false;
        plugin.saveSettings();
    }

    if (_.isEqual(allWeeklyNotes, newNotes) == false)
        allWeeklyNotes = newNotes;
}

export const getDailyNotes = (): Record<string, TFile> => {
    return allDailyNotes;
}

export const getSingleDailyNote = (day: moment.Moment): TFile => {
    return getDailyNote(day, allDailyNotes);
}

export const getWeeklyNotes = (): Record<string, TFile> => {
    return allWeeklyNotes;
}

export const getSingleWeeklyNote = (week: moment.Moment): TFile => {
    return getWeeklyNote(week, allWeeklyNotes);
}

