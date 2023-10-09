/**
 * The editor checker is scanning the currently opened document and checks if a date is written
 * if there is a date with @ an dropdown will appear to select a event that is due to this date
 */

import type { Editor } from "obsidian";
import * as chrono from 'chrono-node';
import { EventSelectReplaceModal } from "../modal/EventSelectReplaceModal";
import { listEvents } from "../googleApi/GoogleListEvents";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export function checkEditorForAtDates(
	editor: Editor,
	plugin: GoogleCalendarPlugin
): void {
	if (plugin.settings.atAnnotationEnabled == false) return;
	const realLine = editor.getLine(editor.getCursor().line);
	
	//Check if the line ends with a whitespace
	if(realLine[realLine.length - 1] !== " ") return;

	//Check if line is to long (Lag prevention)
	if (realLine.length > 2000) return;

	//Check if the line is empty
	if (realLine.length == 0) return;

	checkForPlusMinus(editor) || checkForChrono(editor, plugin) 
}

function checkForPlusMinus(editor: Editor): boolean {
	const endPos = editor.getCursor();
	let startPos = editor.getCursor();
	let realLine = editor.getLine(endPos.line);
	let date = null;

	const regexForPlusMinus = /@([+-])(\d+)\s$/m;

	const plusMinusMatch = regexForPlusMinus.exec(realLine);
	if (!plusMinusMatch || !plusMinusMatch[1] || !plusMinusMatch[2]) {
		return false;
	}

	//Check that the final whitespace was just typed to trigger the modal
	if (editor.getCursor().ch != plusMinusMatch.index + plusMinusMatch[0].length) {
		return;
	}

	startPos = { ...endPos, ch: endPos.ch - plusMinusMatch[0].length};

	if (startPos.ch < 0) return false;

	const realWord = editor.getRange(startPos, endPos);

	if (plusMinusMatch[1] == "+") {
		date = window.moment().add(plusMinusMatch[2], "day");
	} else {
		date = window.moment().subtract(plusMinusMatch[2], "day");
	}

	listEvents({ startDate: date }).then((events) => {
		new EventSelectReplaceModal(
			events,
			editor,
			startPos,
			endPos,
			realWord
		).open();
	});
	return true;
}


function checkForChrono(editor: Editor, plugin: GoogleCalendarPlugin): boolean {
	const endPos = editor.getCursor();
	let startPos = editor.getCursor();
	let realLine = editor.getLine(endPos.line);
	let date = null;

	const regexForChrono = /@([^\s]+)\s$/m

	const chronoMatch = regexForChrono.exec(realLine);
	console.log(chronoMatch)
	if(!chronoMatch || !chronoMatch[1]) return false;

	let chronoDate = null;
	if(plugin.settings.usDateFormat) {
		chronoDate = chrono.parseDate(chronoMatch[1]);
	} else {
		chronoDate = chrono.de.parseDate(chronoMatch[1]);
	}
	if(!chronoDate) return false;
	
	date = window.moment(chronoDate);
	startPos = {line: endPos.line, ch: endPos.ch - chronoMatch[0].length};
	const realWord = editor.getRange(startPos, endPos);
		
	listEvents({ startDate: date }).then((events) => {
		new EventSelectReplaceModal(
			events,
			editor,
			startPos,
			endPos,
			realWord
		).open();
	});

	return true;
}
