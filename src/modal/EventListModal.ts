import type { GoogleEvent } from "../helper/types";
import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { FuzzySuggestModal, TFile } from "obsidian";
import { EventDetailsModal } from './EventDetailsModal';
import { googleClearCachedEvents, listEvents } from "../googleApi/GoogleListEvents";
import { CreateNotePromptModal } from './CreateNotePromptModal';
import { createNoteFromEvent } from "../helper/AutoEventNoteCreator";
import { createDailyNote } from 'obsidian-daily-notes-interface';
import { getSingleDailyNote } from "../helper/DailyNoteHelper";
import { VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS } from "../view/EventDetailsView";
/**
 * This class is used to display a select modal in which the user can select an event
*/
export class EventListModal extends FuzzySuggestModal<GoogleEvent> {
    eventList: GoogleEvent[];
    eventsChanged: boolean;
    currentDate: moment.Moment;
    closeFunction?: () => void;
    modalSelectMode: ModalSelectMode;
    dailyNoteMap: Record<string, TFile>;
    plugin = GoogleCalendarPlugin.getInstance()
    constructor(
        eventList: GoogleEvent[],
        modalSelectMode: ModalSelectMode,
        currentDate: moment.Moment = window.moment(),
        eventsChanged = false,
        closeFunction?: () => void
    ) {
        super(window.app);
        this.eventList = [...eventList];
        this.modalSelectMode = modalSelectMode;
        this.setPlaceholder(`${currentDate.format("MM/DD/YYYY")} Arrow left/right to switch day`);
        this.emptyStateText = "No events found enter to create a new one"
        this.eventsChanged = eventsChanged;
        this.currentDate = currentDate.clone();
        if (closeFunction) {
            this.closeFunction = closeFunction
        }

        this.inputEl.addEventListener('keyup', async (ev) => {
            if (ev.key !== 'Enter') return;
            if (window.moment().diff(this.currentDate) < 300) return; // if less than 300ms from when modal was opened, ignore

            const list = this.getSuggestions(this.inputEl.value);
            const newEvent = {
                summary: this.inputEl.value,
                start: {
                    date: currentDate.format()
                },
                end: {}
            }
            if (!list.length && ev.key == "Enter") {
                if (ev.shiftKey) {
                    this.plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS, newEvent, () => {
                        googleClearCachedEvents();
                    })
                    this.onClose();
                } else {
                    new EventDetailsModal(newEvent, () => { this.eventsChanged = true; this.close() }).open()
                }
            }
        })

        this.inputEl.addEventListener("keydown", async (ev) => {
            let dateUpdated = false;

            if (ev.key == "ArrowRight") {
                if (ev.ctrlKey) {
                    this.currentDate = this.currentDate.add(1, "month");
                } else if (ev.shiftKey) {
                    this.currentDate = this.currentDate.add(1, "week");
                } else {
                    this.currentDate = this.currentDate.add(1, "day");
                }
                dateUpdated = true;
            } else if (ev.key == "ArrowLeft") {
                if (ev.ctrlKey) {
                    this.currentDate = this.currentDate.subtract(1, "month");
                } else if (ev.shiftKey) {
                    this.currentDate = this.currentDate.subtract(1, "week");
                } else {
                    this.currentDate = this.currentDate.subtract(1, "day");
                }
                dateUpdated = true;
            }

            if (dateUpdated) {
                this.setPlaceholder("Loading");
                this.eventList = await listEvents({ startDate: this.currentDate });
                this.inputEl.dispatchEvent(new Event('input'));
                this.setPlaceholder(`${this.currentDate.format("MM/DD/YYYY")} Arrow left and right to switch day`);
            }
        })
    }

    getItems(): GoogleEvent[] {
        if (this.plugin.settings.activateDailyNoteAddon) {
            return [{ id: "xxx", start: null, end: null }, ...this.eventList];
        }
        return this.eventList;
    }

    getItemText(item: GoogleEvent): string {
        if (item.id == "xxx") {
            if (getSingleDailyNote(this.currentDate)) {
                return "Open daily note"
            }
            return "Create daily note"
        }
        if (item.start.date) {
            return `${item.start.date}\t\t | ${item.summary}\t`;
        } else {

            const dateTime = window.moment(item.start.dateTime).format("YYYY-MM-DD HH:mm");

            return `${dateTime}\t | ${item.summary}\t`;
        }
    }

    async onChooseItem(item: GoogleEvent, e: MouseEvent | KeyboardEvent): Promise<void> {
        if (item.id == "xxx") {
            let note = getSingleDailyNote(this.currentDate);
            if (!note) {
                note = await createDailyNote(this.currentDate)
            }

            const leaf = app.workspace.getLeaf(false)

            await leaf.openFile(note, { active: true });

            return;
        }
        if (this.modalSelectMode == "details") {
            this.open();

            if (e.shiftKey) {
                this.plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS, item, () => {
                    googleClearCachedEvents();
                })
                this.onClose();
            } else {
                new EventDetailsModal(item, () => this.eventsChanged = true).open();
            }
        } else if (this.modalSelectMode == "createNote") {
            if (this.plugin.settings.useDefaultTemplate) {
                createNoteFromEvent(item, this.plugin.settings.defaultFolder, this.plugin.settings.defaultTemplate)
            } else {
                new CreateNotePromptModal(item, () => { }).open();
            }
        }
    }

    onClose(): void {
        if (this.closeFunction && this.eventsChanged) {
            this.closeFunction();
        }
    }
}
