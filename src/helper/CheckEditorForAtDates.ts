/**
 * The editor checker is scanning the currently opened document and checks if a date is written
 * if there is a date with @ an dropdown will apear to select a event that is due to this date
 */

import type { Editor } from "obsidian";

import { EventSelectReplaceModal } from "../modal/EventSelectReplaceModal";
import { googleListEvents } from "../googleApi/GoogleListEvents";

export function checkEditorForAtDates(
	editor: Editor,
): void {
	// Run functions until one of the functions returns true to stop the chain.
	checkForWord("@today", editor) ||
	checkForWord("@tomorrow", editor) ||
	checkForWord("@yesterday", editor) ||
	checkForWord("@REGEX", editor) ||
	checkForWord("@YYYY-MM-DD", editor);
}

function checkForWord(
	word: string,
	editor: Editor
): boolean {

	const endPos = editor.getCursor();
	let startPos = editor.getCursor();
	let realWord = "";
	let date = window.moment();

	if (word === "@REGEX") {
		const realLine = editor.getLine(endPos.line);
		//Lag prevention
		if(realLine.length >50)return false;

		const match = realLine.match(/.*@([+,-])(\d+) /) ?? [];

		if (match.length != 3) return false;

		//Check that the final whitespace was just typed to trigger the modal
		if(editor.getCursor().ch != match.index + match[0].length){
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

		if(realWord.length != "@YYYY-MM-DD".length)return false;
		if (!realWord.startsWith("@")) return false;

		if(realWord.substring(1).length>100)return false;

		const tmpDate = window.moment(realWord.substring(1));
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

	googleListEvents(date).then((events) => {
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
