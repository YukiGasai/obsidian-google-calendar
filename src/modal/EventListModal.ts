import type { GoogleEvent } from "../helper/types";

import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { FuzzySuggestModal } from "obsidian";
import { EventDetailsModal } from './EventDetailsModal';
import { googleListEvents } from "../googleApi/GoogleListEvents";

/**
 * This class is used to diplay a select modal in which the user can select an event
*/
export class EventListModal extends FuzzySuggestModal<GoogleEvent> {
	eventList: GoogleEvent[];
	eventsChanged: boolean;
	currentDate: moment.Moment;
	closeFunction?: () => void;

	constructor(
		eventList: GoogleEvent[], 
		currentDate:moment.Moment = window.moment(), 
		eventsChanged = false, 
		closeFunction?: () => void
		) {
		super(GoogleCalendarPlugin.getInstance().app);
		this.eventList = eventList;
		this.setPlaceholder(`${currentDate.format("MM/DD/YYYY")} Arrow left/right to switch day`);
		this.emptyStateText = "No events found enter to create a new one"
		this.eventsChanged = eventsChanged;
		this.currentDate = currentDate;
		if(closeFunction){
			this.closeFunction = closeFunction
		}

		this.inputEl.addEventListener("keyup", async(ev)=>{
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
				this.eventList = await googleListEvents(currentDate);
				this.inputEl.dispatchEvent(new Event('input'));
				this.setPlaceholder(`${currentDate.format("MM/DD/YYYY")} Arrow left and right to switch day`);
			}
		})
	}

	getItems(): GoogleEvent[] {
		return this.eventList;
	}

	getItemText(item: GoogleEvent): string {

		if(item.start.date) {
			return `${item.start.date}\t\t | ${item.summary}\t`;
		}else{

			const dateTime = window.moment(item.start.dateTime).format("YYYY-MM-DD HH:mm");

			return `${dateTime}\t | ${item.summary}\t`;
		}
	}

	async onChooseItem(item: GoogleEvent): Promise<void> {
		this.open();
		new EventDetailsModal(item, () => this.eventsChanged = true).open();
	}

	onClose(): void {
		if(this.closeFunction && this.eventsChanged){
			this.closeFunction();
		}
	}
}
