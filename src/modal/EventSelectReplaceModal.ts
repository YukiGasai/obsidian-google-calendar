import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import type { GoogleEvent } from "../helper/types";

import { Editor, EditorPosition, FuzzySuggestModal } from "obsidian";

/**
 * This class is used to create a selection modal. When the user selects an event the event will be inserted into the active document
 */
export class EventSelectReplaceModal extends FuzzySuggestModal<GoogleEvent> {
	eventList: GoogleEvent[];
	editor: Editor;
	start: EditorPosition;
	end: EditorPosition;
	word: string;

	constructor(
		eventList: GoogleEvent[],
		editor: Editor,
		start: EditorPosition,
		end: EditorPosition,
		word: string
	) {
		super(GoogleCalendarPlugin.getInstance().app);
		this.eventList = eventList;
		this.setPlaceholder("Select an event to insert");
		this.editor = editor;
		this.start = start;
		this.end = end;
		this.word = word;
	}

	getItems(): GoogleEvent[] {
		return this.eventList;
	}

	getItemText(item: GoogleEvent): string {
		return `${item.summary}\t`;
	}

	async onChooseItem(item: GoogleEvent): Promise<void> {

		const replacementString = `[${item.summary}](${item.htmlLink}&cal=${item.parent.id})`;

		this.editor.replaceRange(
			replacementString,
			this.start,
			this.end,
			this.word
		);
	}
}
