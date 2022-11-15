import type { GoogleEvent, ModalSelectMode } from "../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { FuzzySuggestModal, TFile } from "obsidian";
import { EventDetailsModal } from './EventDetailsModal';
import { googleListEvents } from "../googleApi/GoogleListEvents";
import { CreateNotePromptModal } from './CreateNotePromptModal';
import { createNoteFromEvent } from "../helper/AutoEventNoteCreator";
import { getDailyNote, createDailyNote, getAllDailyNotes } from 'obsidian-daily-notes-interface';
/**
 * This class is used to diplay a select modal in which the user can select an event
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
		currentDate:moment.Moment = window.moment(), 
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
		this.dailyNoteMap = getAllDailyNotes();
		if(closeFunction){
			this.closeFunction = closeFunction
		}

		this.inputEl.addEventListener("keydown", async(ev)=>{
			let dateUpdated = false;
			const list = this.getSuggestions(this.inputEl.value);
			if(!list.length && ev.key == "Enter"){
				new EventDetailsModal({
					summary: this.inputEl.value,
					start: {
						date:currentDate.format()
					}, 
					end:{}
				},  () => {this.eventsChanged = true; this.close()}).open()
			}
			
			if(ev.key == "ArrowRight") {
				if (ev.ctrlKey){
					this.currentDate = this.currentDate.add(1, "month");
				}else if(ev.shiftKey){
					this.currentDate = this.currentDate.add(1, "week");
				}else{
					this.currentDate = this.currentDate.add(1, "day");
				}
				dateUpdated = true;
			}else if(ev.key == "ArrowLeft") {
				if (ev.ctrlKey){
					this.currentDate = this.currentDate.subtract(1, "month");
				}else if(ev.shiftKey){
					this.currentDate = this.currentDate.subtract(1, "week");
				}else{
					this.currentDate = this.currentDate.subtract(1, "day");
				}
				dateUpdated = true;
			}

			if(dateUpdated){
				this.setPlaceholder("Loading");
				this.eventList = await googleListEvents({startDate:this.currentDate});
				this.inputEl.dispatchEvent(new Event('input'));
				this.setPlaceholder(`${this.currentDate.format("MM/DD/YYYY")} Arrow left and right to switch day`);
			}
		})
	}

	getItems(): GoogleEvent[] {
		if(this.plugin.settings.activateDailyNoteAddon){
			return [{id:"xxx", start:null, end:null},...this.eventList];
		}
		return this.eventList;
	}

	getItemText(item: GoogleEvent): string {
		if(item.id == "xxx"){
			if(getDailyNote(this.currentDate, this.dailyNoteMap)){
				return "Open daily note"
			}
			return "Create daily note"
		}
		if(item.start.date) {
			return `${item.start.date}\t\t | ${item.summary}\t`;
		}else{

			const dateTime = window.moment(item.start.dateTime).format("YYYY-MM-DD HH:mm");

			return `${dateTime}\t | ${item.summary}\t`;
		}
	}

	async onChooseItem(item: GoogleEvent): Promise<void> {
		if(item.id == "xxx"){
			let note = getDailyNote(this.currentDate, this.dailyNoteMap);
			if(!note){
				note = await createDailyNote(this.currentDate)
			}
			app.workspace.getLeaf(true).openFile(note);

			return;
		}
		if(this.modalSelectMode == "details"){
			this.open();
			new EventDetailsModal(item, () => this.eventsChanged = true).open();
		}else if(this.modalSelectMode == "createNote"){
			if(this.plugin.settings.useDefaultTemplate){
				createNoteFromEvent(item, this.plugin.settings.defaultFolder, this.plugin.settings.defaultTemplate)
			}else{
				new CreateNotePromptModal(item, ()=>{}).open();
			}
		}
	}

	onClose(): void {
		if(this.closeFunction && this.eventsChanged){
			this.closeFunction();
		}
	}
}
