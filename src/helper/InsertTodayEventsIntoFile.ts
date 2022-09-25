import type { Editor } from "obsidian";

import { InsertEventsModal } from './../modal/InsertEventsModal';

/**
 * This function will list all events of today as a table and inset the table into the currently open editor using the markdown format
 * This functions is used to save your events into a static field creating a backup of the day independent from the API
 * @param editor Refrence to the open editor the events will be inserted to
 */
export const insertTodayEventsIntoFile = async (editor: Editor):Promise<void> => {    
    new InsertEventsModal(editor).open();
};