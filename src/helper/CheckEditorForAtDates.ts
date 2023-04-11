/**
 * The editor checker is scanning the currently opened document and checks if a date is written
 * if there is a date with @ an dropdown will appear to select a event that is due to this date
 */

import type { Editor } from "obsidian";

import { EventSelectReplaceModal } from "../modal/EventSelectReplaceModal";
import { listEvents } from "../googleApi/GoogleListEvents";
import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export function checkEditorForAtDates(
	editor: Editor,
	plugin: GoogleCalendarPlugin
): void {
	if (plugin.settings.atAnnotationEnabled == false) return;
	//TODO add chonos date parser to add more date options here
	// Run functions until one of the functions returns true to stop the chain.
	checkForWord("@today", editor, plugin) ||
		checkForWord("@tomorrow", editor, plugin) ||
		checkForWord("@yesterday", editor, plugin) ||
		checkForWord("@REGEX", editor, plugin) ||
		checkForWord("@YYYY-MM-DD", editor, plugin);
}

function checkForWord(
	word: string,
	editor: Editor,
	plugin: GoogleCalendarPlugin
): boolean {

	const endPos = editor.getCursor();
	let startPos = editor.getCursor();
	let realWord = "";
	let date = window.moment();

	if (word === "@REGEX") {
		const realLine = editor.getLine(endPos.line);
		//Lag prevention
		if (realLine.length > 2000) return false;

		const match = realLine.match(/.*@([+,-])(\d+) /) ?? [];

		if (match.length != 3) return false;

		//Check that the final whitespace was just typed to trigger the modal
		if (editor.getCursor().ch != match.index + match[0].length) {
			return false;
		}

		startPos = { ...endPos, ch: endPos.ch - match[1].length - match[2].length - 1 };

		if (startPos.ch < 0) return;

		realWord = editor.getRange(startPos, endPos);

		if (match[1] == "+") {
			date = window.moment().add(match[2], "day");
		} else {
			date = window.moment().subtract(match[2], "day");
		}

	} else if (word === "@YYYY-MM-DD") {
		startPos = { ...endPos, ch: endPos.ch - word.length };
		realWord = editor.getRange(startPos, endPos);

		if (!realWord.startsWith("@") || realWord.length != "@YYYY-MM-DD".length) return false;

		const usFormatArray = ["YYYY-MM-DD", "YYYY/MM/DD", "YYYY.MM.DD", "YYYY MM DD", "MM-DD-YYYY", "MM/DD/YYYY", "MM.DD.YYYY", "MM DD YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MM.YYYY", "DD MM YYYY"];
		const euFormatArray = ["DD-MM-YYYY", "DD/MM/YYYY", "DD.MM.YYYY", "DD MM YYYY", "YYYY-MM-DD", "YYYY/MM/DD", "YYYY.MM.DD", "YYYY MM DD", "MM-DD-YYYY", "MM/DD/YYYY", "MM.DD.YYYY", "MM DD YYYY"];

		const tmpDate = window.moment(
			realWord.substring(1),
			plugin.settings.usDateFormat ? usFormatArray : euFormatArray,
			true
		);

		if (tmpDate.isValid()) {
			date = tmpDate;
		} else {
			return false;
		}

	} else {
		startPos = { ...endPos, ch: endPos.ch - word.length };

		if (startPos.ch < 0) return false;
		const realWord = editor.getRange(startPos, endPos);

		if (realWord != word) return false;

		switch (word) {
			case "@today":
				date = window.moment()
				break;
			case "@tomorrow":
				date = window.moment().add(1, "day")
				break;
			case "@yesterday":
				date = window.moment().add(-1, "day")
				break;
			default:
				return false;
		}

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
