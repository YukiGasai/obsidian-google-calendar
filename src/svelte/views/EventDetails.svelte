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
	import EventDescriptionInput from "../components/EventDescriptionInput.svelte";
	import { switchCalendar } from "../../googleApi/GoogleSwitchCalendar";
	import { googleClearCachedEvents } from "../../googleApi/GoogleListEvents";

    export let event: GoogleEvent;
    export let closeFunction :() => void;

    let calendars: GoogleCalendar[];
    let loading = true;
    let fullDay:boolean;
	let isBusy: boolean;
    let selectedCalendarId = "";
    let plugin = GoogleCalendarPlugin.getInstance();

    let inputStartDateTime:string;
    let inputEndDateTime:string;
    let inputStartDate:string;
    let inputEndDate:string;
    let recurringText = "";
    let eventNoteQueryResult = findEventNote(event, plugin);

    let endDateTimeElement:HTMLInputElement = null;
    let endDateElement:HTMLInputElement = null;

    // Make sure the date is always rounded to the next 15 minutes
    function getEmptyDate() {
        const minutes = 15;
        const ms = 1000 * 60 * minutes;

        return window.moment(new Date(Math.round(new Date().getTime() / ms) * ms));
    }

    
    function addEventDate(_event: GoogleEvent) : GoogleEvent {

        const event = _.cloneDeep(_event);
        event.parent = calendars.find(calendar => calendar.id === selectedCalendarId);

        if(fullDay){
            event.start.date = window.moment(inputStartDate).format("YYYY-MM-DD");
            event.end.date = window.moment(inputEndDate).add(1, "day").format("YYYY-MM-DD");
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

        if(event.eventType === "multiDay") {
            event = await getEvent(event.id, event.parent.id);
        }
        fullDay = event?.start?.dateTime == undefined && event?.start?.date !== undefined;

		if (!event?.transparency) {
            isBusy = true;
        } else {
            isBusy = event?.transparency == 'opaque';
        }

        calendars = await listCalendars();
        selectedCalendarId = event?.parent?.id ?? plugin?.settings?.defaultCalendar;
        if(!selectedCalendarId) {
            selectedCalendarId = calendars[0].id;
        }

        loading = false;

        //New event all blank
        if(event.id == undefined){
            event.summary = event.summary ?? "";
            event.description = event.description ?? "";
       
            recurringText = "";

            const startTime = getEmptyDate();
            inputStartDateTime = startTime.format("YYYY-MM-DDTHH:mm");
            inputEndDateTime = startTime.add(1, "hour").format("YYYY-MM-DDTHH:mm");
            inputStartDate = startTime.format("YYYY-MM-DD");
            inputEndDate = startTime.format("YYYY-MM-DD");


            if(event.start.date){
                inputStartDate = window.moment(event.start.date).format("YYYY-MM-DD");
            }

            if(event.end.date){
                inputEndDate = window.moment(event.end.date).subtract(1, "day").format("YYYY-MM-DD");
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
                inputEndDate        = window.moment(event.end.date).subtract(1).format("YYYY-MM-DD")

            }else{
                inputStartDateTime  = window.moment(event.start.dateTime).format("YYYY-MM-DDTHH:mm")
                inputEndDateTime    = window.moment(event.end.dateTime).format("YYYY-MM-DDTHH:mm")
                inputStartDate      = window.moment().format("YYYY-MM-DD")
                inputEndDate        = window.moment().format("YYYY-MM-DD")

            }
        }
	});

    const changeCalendar = async (e:Event) => {
        const selectElement = e.target;

        if(selectElement instanceof HTMLSelectElement){
            
            const value = selectElement.value;
            selectedCalendarId = value;
        }

        if(event.id){
            await switchCalendar(event, selectedCalendarId);
            event.parent = calendars.find(calendar => calendar.id === selectedCalendarId);
            googleClearCachedEvents()
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

    const checkIfEndDateIsValid = () => {
        if(fullDay) {
            const isValid = window.moment(inputStartDate).isSameOrBefore(window.moment(inputEndDate))
            if(!isValid && endDateElement instanceof HTMLInputElement) {
                endDateElement.setCustomValidity("End date must be after start date");
                endDateElement.reportValidity();
            }
            return isValid;
        }
        const isValid = window.moment(inputStartDateTime).isBefore(window.moment(inputEndDateTime))
        if(!isValid && endDateTimeElement instanceof HTMLInputElement) {
            endDateTimeElement.setCustomValidity("End date must be after start date");
            endDateTimeElement.reportValidity();
        }
        return isValid;
    }

    const updateEvent = async () => {
        if(!checkIfEndDateIsValid()) {
            return;
        }
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
        if(!checkIfEndDateIsValid()) {
            return;
        }
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
        if(!checkIfEndDateIsValid()) {
            return;
        }
        if (plugin.settings.useDefaultTemplate && plugin.settings.defaultFolder && plugin.settings.defaultFolder) {
            createNoteFromEvent(event, plugin.settings.defaultFolder, plugin.settings.defaultTemplate)
        } else {
            new CreateNotePromptModal(event, (newNote:TFile) => eventNoteQueryResult.file = newNote).open();
        }
    }
    
    const openInBrowser = () => {
        window.open(event.htmlLink);
    }
    
    const changeStartDateTime = (e) => {
        if(!e.target.value || !window.moment(e.target.value).isValid()){
            e.preventDefault();
            return;
        }
        inputStartDateTime = e.target.value
    }

    const changeEndDateTime = (e) => {
        if(!e.target.value || !window.moment(e.target.value).isValid()){
            e.preventDefault();
            return;
        }
        inputEndDateTime = e.target.value
    }


    const changeStartDate = (e) => {
        if(!e.target.value || !window.moment(e.target.value).isValid()){
            e.preventDefault();
            return;
        }
        inputStartDate = e.target.value
    }

    const changeEndDate = (e) => {
        if(!e.target.value || !window.moment(e.target.value).isValid()){
            e.preventDefault();
            return;
        }
        inputEndDate = e.target.value
    }

</script>


<div class="googleEventDetails">
   
    <input class="summaryInput" name="summary" type="text" placeholder="Summary" bind:value="{event.summary}">

    <EventDescriptionInput bind:event={event} />
   
    {#if loading}
        <span>Loading</span>
    {:else}

    <label for="calendar">Calendar</label>
    
    <select name="calendar" class="dropdown" on:change="{changeCalendar}">
        
        {#each calendars as calendar}
            <option id="{calendar.id}" value="{calendar.id}" selected="{calendar.id === selectedCalendarId}">{calendar.summary}</option>
        {/each}
    </select>
    
    {/if}

    <div class="googleFullDayContainer">
        <label for="fullDay">Full Day</label>
        <input type="checkbox" name="fullDay" bind:checked="{fullDay}" >
    </div>

    {#if fullDay}
        <label for="eventStartDate">Start Date</label>
        <input type="date" name="eventDate" value={inputStartDate} on:change={changeStartDate}>

        <label for="eventEndDate">End Date</label>
        <input type="date" name="eventDate" value={inputEndDate} on:change={changeEndDate} bind:this={endDateElement}>

    {:else}
        <label for="eventStartDate">Start Date</label>
        <input type="datetime-local" name="eventStartDate" value={inputStartDateTime} on:change={changeStartDateTime}>

        <label for="eventEndDate">End Date</label>
        <input type="datetime-local" name="eventEndDate" value={inputEndDateTime} on:change={changeEndDateTime} bind:this={endDateTimeElement}>
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

    input[type="text"],
    input[type="datetime-local"],
    input[type="date"] {
        background: var(--background);
    }

    input[type='date'],
    input[type='datetime-local'] {
        background: var(--background-modifier-form-field);
        border: 1px solid var(--background-modifier-border);
        color: var(--text-normal);
        font-family: inherit;
        padding: 5px 25px;
        font-size: 16px;
        border-radius: 4px;
        outline: none;
        height: 30px;
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