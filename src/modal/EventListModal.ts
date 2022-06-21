import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { Editor, EditorPosition, FuzzySuggestModal } from "obsidian";
import type { GoogleEvent } from "../helper/types";

export class EventListModal extends FuzzySuggestModal<GoogleEvent> {
	plugin: GoogleCalendarPlugin;
	eventList: GoogleEvent[];
	editor: Editor;
	start: EditorPosition;
	end: EditorPosition;
	word: string;

	constructor(
		plugin: GoogleCalendarPlugin,
		eventList: GoogleEvent[],
		editor: Editor,
		start: EditorPosition,
		end: EditorPosition,
		word: string
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.eventList = eventList;
		this.setPlaceholder("Select an event to insert it");
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

	async onChooseItem(
		item: GoogleEvent,
		_: MouseEvent | KeyboardEvent
	): Promise<void> {
		const replacementString = `[${item.summary}](${item.htmlLink})`;

		this.editor.replaceRange(
			replacementString,
			this.start,
			this.end,
			this.word
		);
	}
}
