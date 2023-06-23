<script lang="ts">
    import type { GoogleCalendar, GoogleEvent } from "../../helper/types";
    
    import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";
    import { onMount } from 'svelte';
    import { listCalendars } from "../../googleApi/GoogleListCalendars";
    import { deleteEvent } from "../../googleApi/GoogleDeleteEvent";
    import { googleUpdateEvent } from '../../googleApi/GoogleUpdateEvent'
    import { createEvent } from "../../googleApi/GoogleCreateEvent";
    import { RRule, RRuleSet, rrulestr } from "rrule";
    import _ from "lodash";
	import { CreateNotePromptModal } from "../../modal/CreateNotePromptModal";
    import type { TFile } from "obsidian";
    import { createNotice } from "../../helper/NoticeHelper";
    import { findEventNote } from "../../helper/Helper";
    import { getEvent } from "src/googleApi/GoogleGetEvent";
    import { createNoteFromEvent } from "src/helper/AutoEventNoteCreator";

    export let event: GoogleEvent;
    export let closeFunction :() => void;

    let calendars: GoogleCalendar[];
    let loading = true;
    let fullDay:boolean;
	let isBusy: boolean;


    
    let plugin = GoogleCalendarPlugin.getInstance();

    let inputStartDateTime:string;
    let inputEndDateTime:string;
    let inputStartDate:string;
    let recurringText = "";
    let eventNoteQueryResult = findEventNote(event, plugin);

    function getEmptyDate() {
        const minutes = 15;
        const ms = 1000 * 60 * minutes;

        return window.moment(new Date(Math.round(new Date().getTime() / ms) * ms));
    }


    function addEventDate(_event: GoogleEvent) : GoogleEvent {

        const event = _.cloneDeep(_event);

        if(fullDay){
            event.start.date = window.moment(inputStartDate).format("YYYY-MM-DD");
            event.end.date = window.moment(inputStartDate).format("YYYY-MM-DD");
            delete event.start.dateTime;
            delete event.end.dateTime;
        }else{
            event.start.dateTime = window.moment(inputStartDateTime).format();
            event.end.dateTime = window.moment(inputEndDateTime).format();
            delete event.start.date;
            delete event.end.date;
        }

		isBusy
			? (event.transparency = 'opaque')
			: (event.transparency = 'transparent');

        return event;
    }

    onMount(async () => {

        fullDay = event?.start?.dateTime == undefined && event?.start?.date !== undefined;

		if (!event?.transparency) {
            isBusy = true;
        } else {
            isBusy = event?.transparency == 'opaque';
        }

        calendars = await listCalendars();
        loading = false;

        //New event all blank
        if(event.id == undefined){
            event.summary = event.summary ?? "";
            event.description = event.description ?? "";

            event.parent = calendars.find(calendar => calendar.id === plugin.settings.defaultCalendar);
            if(!event.parent) {
                event.parent = calendars[calendars.length - 1];
            }
       
            recurringText = "";

            const startTime = getEmptyDate();
            inputStartDateTime = startTime.format("YYYY-MM-DDTHH:mm");
            inputEndDateTime = startTime.add(1, "hour").format("YYYY-MM-DDTHH:mm");
            inputStartDate = startTime.format("YYYY-MM-DD");

            

            if(event.start.date){
                inputStartDate = window.moment(event.start.date).format("YYYY-MM-DD");
            }

            if(event.start.dateTime && event.end.dateTime){
                inputStartDateTime  = window.moment(event.start.dateTime).format("YYYY-MM-DDTHH:mm")
                inputEndDateTime    = window.moment(event.end.dateTime).format("YYYY-MM-DDTHH:mm")
            }

        }else {

            const parentEvent = await getEvent(event.recurringEventId ?? event.id, event.parent.id);
   
            if(parentEvent?.recurrence){
                const rule = rrulestr(parentEvent.recurrence[0]);
                recurringText = rule.toText();
            }else {
                recurringText = "";
            }

            //Add the missing time to the object for a better user experience
            if(fullDay){
            
                const startTime     = getEmptyDate();
                inputStartDateTime  = startTime.format("YYYY-MM-DDTHH:mm");
                inputEndDateTime    = startTime.add(1, "hour").format("YYYY-MM-DDTHH:mm");
                inputStartDate      = window.moment(event.start.date).format("YYYY-MM-DD")

            }else{
                inputStartDateTime  = window.moment(event.start.dateTime).format("YYYY-MM-DDTHH:mm")
                inputEndDateTime    = window.moment(event.end.dateTime).format("YYYY-MM-DDTHH:mm")
                inputStartDate      = window.moment().format("YYYY-MM-DD")
            }
        }
	});

    const getDescription = () => {
        if(event.description){
		    return event.description.replace(/<\/?[^>]+(>|$)/g, "");
        }
        return ""
    }

    //Event Handler

    const changeDescription = (e:Event) => {
       if(e.target instanceof HTMLTextAreaElement){
           event.description = e.target.value;
       } 
    }

    const changeCalendar = (e:Event) => {
        const selectElement = e.target;

        if(selectElement instanceof HTMLSelectElement){

            const value = selectElement.value;
            event.parent.id = value;

        }
    }

    const handleCreateEvent = async () => {

        if(recurringText && recurringText != ""){
            try {
                const rule = RRule.fromText(recurringText);
                const ruleSet = new RRuleSet()
                ruleSet.rrule(rule);
                const ruleString = ruleSet.valueOf();
                if(recurringText && ruleString[0] == ""){
                    createNotice("Event not created. Error in recurrence text.", true)
                    return;
                }

                event.recurrence = ruleString;
                
            } catch (err) {
                createNotice("Event not created. Error in recurrence text.", true)
                return;
            }
        }
        const newEvent = await createEvent(addEventDate(event))
   
        if(newEvent?.id){
            closeFunction();
        }
    }

    const deleteSingleEvent = async(e) => {
        let wasSuccessful = false;
        if(event.recurringEventId){
            wasSuccessful = await deleteEvent(event)
        }else{
            wasSuccessful = await deleteEvent(event)
        }
        if(wasSuccessful){
            closeFunction();
        }
    }

    const deleteAllEvents = async() => {
        
        const wasSuccessful = await deleteEvent(addEventDate(event), true)
        if(wasSuccessful){
            closeFunction();
        }
    }

    const updateEvent = async () => {

        const cleanEvent = addEventDate(event);
        let updatedEvent;
        if(cleanEvent.recurringEventId){
            updatedEvent = await googleUpdateEvent(cleanEvent)
        }else{
            updatedEvent = await googleUpdateEvent(cleanEvent)
        }
        if(updatedEvent.id){
            closeFunction(); 
        }
    }

    const updateAllEvents = async () => {
        
        const updatedEvent = await googleUpdateEvent(addEventDate(event), true)
        if(updatedEvent.id){
            closeFunction();
        }
    }

    const openNote = async () => {
        app.workspace.getLeaf(true).openFile(eventNoteQueryResult.file);
        closeFunction();
    }

    const createNote = async () => {
        if (plugin.settings.useDefaultTemplate && plugin.settings.defaultFolder && plugin.settings.defaultFolder) {
            createNoteFromEvent(event, plugin.settings.defaultFolder, plugin.settings.defaultTemplate)
        } else {
            new CreateNotePromptModal(event, (newNote:TFile) => eventNoteQueryResult.file = newNote).open();
        }
    }
    
    const openInBrowser = () => {
        window.open(event.htmlLink);
    }

$: {

    //Update End Date if start date is before End Date
    const start = window.moment(inputStartDateTime);
    const end = window.moment(inputEndDateTime);

    if(end.isBefore(start)){
        inputEndDateTime = start.add(1, 'hour').format("YYYY-MM-DDTHH:mm");
    }
}

</script>


<div class="googleEventDetails">
   
    <input class="summaryInput" name="summary" type="text" placeholder="Summary" bind:value="{event.summary}">

    <label for="description">Description</label>
    <textarea name="description" on:change="{changeDescription}">{getDescription()}</textarea>

   
    {#if loading}
        <span>Loading</span>
    {:else}

    <label for="calendar">Calendar</label>
    
    <select name="calendar" class="dropdown" on:change="{changeCalendar}" disabled={event?.id !== undefined}>
        
        {#each calendars as calendar}
            <option id="{calendar.id}" value="{calendar.id}" selected="{calendar.id == event?.parent?.id}">{calendar.summary}</option>
        {/each}
    </select>
    
    {/if}

    <div class="googleFullDayContainer">
        <label for="fullDay">Full Day</label>
        <input type="checkbox" name="fullDay" bind:checked="{fullDay}" >
    </div>

    {#if fullDay}
        <label for="eventDate">Date</label>
        <input type="date" name="eventDate" bind:value="{inputStartDate}">
    {:else}
        <label for="eventStartDate">Start Date</label>
        <input type="datetime-local" name="eventStartDate" bind:value="{inputStartDateTime}">

        <label for="eventEndDate">End Date</label>
        <input type="datetime-local" name="eventEndDate" bind:value="{inputEndDateTime}" min="{window.moment(inputStartDateTime).format('YYYY-MM-DDThh:mm')}">
    {/if}

    <label for="reoccurring">Reoccurring</label>
    <input type="text" name="Reoccurring" bind:value="{recurringText}" disabled={event.id != null} >

	<div class="googleFullDayContainer">
		<label for="isBusy">Show me as Busy?</label>
		<input type="checkbox" name="isBusy" bind:checked={isBusy} />
	</div>

    <div class="googleEventButtonContainer">
        {#if event.id}

            <div class="buttonRow">
                {#if recurringText != "" }
                    <button on:click="{openInBrowser}">Show Recurring Event</button>
                {:else}
                    <button on:click="{openInBrowser}">Show Single Event</button>
                {/if}

                {#if eventNoteQueryResult.file}
                    {#if eventNoteQueryResult.match == "title"}
                        <button on:click="{createNote}">Create Event Note for this date</button>
                    {/if}
                    <button on:click="{openNote}">Open Event Note</button>
                {:else}
                    <button on:click="{createNote}">Create Event Note</button>
                {/if}
            </div>


            <div class="buttonRow">
                <button on:click="{updateEvent}">Update</button>
    
                <button on:click="{deleteSingleEvent}">Delete</button>
            </div>
            {#if recurringText != "" }
                <div class="buttonRow">
                    <button on:click="{updateAllEvents}">Update All</button>
                    
                    <button on:click="{deleteAllEvents}">Delete All</button>
                </div>
            {/if}    

        {:else}
            <div class="buttonRow">
                <button on:click="{handleCreateEvent}">Create</button>
            </div>
        {/if}
    </div>
</div>


<style>

    .buttonRow{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        padding: 5px;
    }

    .summaryInput {
        border: none;
        border-bottom: 2px solid;
        border-radius: 0px;

        height:40px;
        font-size: 35px;
        text-align: center;
    }

    label{
        margin-top: 5px;
    }

    .googleFullDayContainer{
        margin-top: 10px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .googleEventButtonContainer{
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;

    }

    .googleEventButtonContainer button {
        width: 40%;
    }

</style>