import type { Editor } from "obsidian";
import { EventListModal } from "../modal/EventListModal";
import { googleListEvents } from "../googleApi/GoogleListEvents";
import type GoogleCalendarPlugin from "./../GoogleCalendarPlugin";

export function editorCheckForDate(
	editor: Editor,
	markdownView: MarkdownView,
	plugin: GoogleCalendarPlugin
) {
	// Run functions until one of the functions returns true to stop the chain.
	check4Word("@today", editor, plugin) ||
		check4Word("@tomorrow", editor, plugin) ||
		check4Word("@yesterday", editor, plugin) ||
		check4Word("@REGEX", editor, plugin) ||
		check4Word("@YYYY-MM-DD", editor, plugin);
}

function check4Word(
	word: string,
	editor: Editor,
	plugin: GoogleCalendarPlugin
): boolean {
	const endPos = editor.getCursor();
	let startPos = editor.getCursor();
	let realWord = "";
	let date = "";

	if (word === "@REGEX") {
		const realLine = editor.getLine(endPos.line);
		const match = realLine.match(/.*@([+,-])(\d+).*/) ?? [];

		if (match.length != 3) return false;

		startPos = { ...endPos, ch: endPos.ch - match[0].length };

		if (startPos.ch < 0) return;

		realWord = editor.getRange(startPos, endPos);

		if (match[1] == "+") {
			date = window.moment().add(match[2], "day").format("YYYY-MM-DD");
		} else {
			date = window
				.moment()
				.subtract(match[2], "day")
				.format("YYYY-MM-DD");
		}

		console.log("REGEX");
	} else if (word === "@YYYY-MM-DD") {
		startPos = { ...endPos, ch: endPos.ch - word.length };
		realWord = editor.getRange(startPos, endPos);

		if (!realWord.startsWith("@")) return false;

		const tmpDate = window.moment(realWord.substring(1));
		if (tmpDate.isValid()) {
			date = tmpDate.format("YYYY-MM-DD");
		} else {
			return false;
		}

		console.log("@YYYY-MM-DD");
	} else {
		startPos = { ...endPos, ch: endPos.ch - word.length };

		if (startPos.ch < 0) return false;
		const realWord = editor.getRange(startPos, endPos);

		if (realWord != word) return false;

		switch (word) {
			case "@today":
				date = window.moment().format("YYYY-MM-DD");
				break;
			case "@tomorrow":
				date = window.moment().add(1, "day").format("YYYY-MM-DD");
				break;
			case "@yesterday":
				date = window.moment().add(-1, "day").format("YYYY-MM-DD");
				break;
			default:
				return false;
		}

		console.log("OTHER");
	}

	googleListEvents(plugin, date).then((events) => {
		new EventListModal(
			plugin,
			events,
			editor,
			startPos,
			endPos,
			realWord
		).open();
	});

	return true;
}
