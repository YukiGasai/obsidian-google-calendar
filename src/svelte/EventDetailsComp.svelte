<script lang="ts">
    //TODO clean up date dateTime 
    import type { GoogleCalander, GoogleEvent } from "../helper/types";
    
    import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import { onMount } from 'svelte';
    import { googleListCalendars } from "../googleApi/GoogleListCalendars";
    import { googleRemoveEvent } from "../googleApi/GoogleRemoveEvent";
    import { googleUpdateEvent } from '../googleApi/GoogleUpdateEvent'
    import { googleCreateEvent } from "../googleApi/GoogleCreateEvent";
    import { manuallyCreateNoteFromEvent } from "../helper/AutoEventNoteCreator";

    export let event: GoogleEvent;
    export let currentDate: moment.Moment;
    export let closeFunction :() => void;

    let calendars: GoogleCalander[];
    let loading = true;
    let fullDay;

    let plugin = GoogleCalendarPlugin.getInstance();
    let startDateTime;
    let endDateTime;
    let startDate;


    function roundToNearest15(date = new Date()) {
        const minutes = 15;
        const ms = 1000 * 60 * minutes;

        return window.moment(new Date(Math.round(date.getTime() / ms) * ms));
    }

    onMount(async () => {
        calendars = await googleListCalendars();
        loading = false;

        fullDay = event?.start?.dateTime == undefined


        if(event.id == undefined){
            event.summary = ""
            event.description = ""

            event.parent = calendars.find(calendar => calendar.id === plugin.settings.defaultCalendar);
            if(!event.parent) {
                event.parent = calendars[calendars.length - 1];
            }
       
            fullDay = false

            const startTime = roundToNearest15();

            event.start.dateTime = startTime.format();
          
            event.end.dateTime = startTime.add(1, "hour").format();
        }

        //Add the missing time to the object for a better user expirince
        if(fullDay){
            startDate = window.moment(event.start.date).format()
            startDateTime = currentDate.format()
            endDateTime   = currentDate.add(1, "hour").format()
 
            const startTime = roundToNearest15();

            startDateTime = startTime.format();
          
            endDateTime = startTime.add(1, "hour").format();


        }else{
            startDate = currentDate.format("YYYY-MM-DD")
            startDateTime = window.moment(event.start.dateTime).format()
            endDateTime = window.moment(event.end.dateTime).format()
        }

	});

    const getDescription = () => {
        if(event.description){
		    return event.description.replace(/<\/?[^>]+(>|$)/g, "");
        }
        return ""
    }


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

    const dateToLocalStart = (date:any) => {
        return window.moment(date).local().format("YYYY-MM-DDTHH:mm")
    }

    const dateToLocalEnd = (date:any) => {
        return window.moment(date).local().format("YYYY-MM-DDTHH:mm")
    }

    const dateToInput = (date:any) => {
        return window.moment(date).local().format("YYYY-MM-DD")
    }


    const changeStartDateTime = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
           startDateTime = window.moment(e.target.value).format()
        } 
    }


    const changeEndDateTime = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
            endDateTime = window.moment(e.target.value).format()
        } 
    }

    const changeDate = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
            startDate = window.moment(e.target.value).format("YYYY-MM-DD")
        } 
    }

    const createEvent = async () => {

        if(fullDay){
            event.start.date = startDate;
            event.end.date = startDate;
        }else{
            event.start.dateTime = startDateTime;
            event.end.dateTime = endDateTime;
        }

        if(fullDay){
            delete event.start.dateTime;
            delete event.end.dateTime;

        }else{
            delete event.start.date;
            delete event.end.date;
        }

        googleCreateEvent(event).then(newEvent =>{
            closeFunction();
        });
    

    
    }

    const deleteEvent = async(e) => {
        let wasSucessfull = false;
        if(event.recurringEventId){
            wasSucessfull = await googleRemoveEvent(event , true)
        }else{
            wasSucessfull = await googleRemoveEvent(event)
        }
        if(wasSucessfull){
            closeFunction();
        }
    }

    const deleteAllEvents = async() => {
        
        const wasSucessfull = await googleRemoveEvent(event)
        if(wasSucessfull){
            closeFunction();
        }
        
    }


    const updateEvent = async () => {

        if(fullDay){
            event.start.date = startDate;
            event.end.date = startDate;
        }else{
            event.start.dateTime = startDateTime;
            event.end.dateTime = endDateTime;
        }

        if(fullDay){
            delete event.start.dateTime;
            delete event.end.dateTime;

        }else{
            delete event.start.date;
            delete event.end.date;
        }


        let updatedEvent;
        if(event.recurringEventId){
            updatedEvent = await googleUpdateEvent(event , true)
        }else{
            updatedEvent = await googleUpdateEvent(event)
        }
        if(updatedEvent.id){
            closeFunction(); 
        }
    }

    const updateAllEvents = async () => {
        if(fullDay){
            event.start.date = startDate;
            event.end.date = startDate;
        }else{
            event.start.dateTime = startDateTime;
            event.end.dateTime = endDateTime;
        }

        if(fullDay){
            delete event.start.dateTime;
            delete event.end.dateTime;

        }else{
            delete event.start.date;
            delete event.end.date;
        }

        const updatedEvent = await googleUpdateEvent(event)
        if(updatedEvent.id){
            closeFunction();
        }
    }

    const openCreateNote = async () => {
        const file = plugin.app.vault.getFiles().find(file => file.basename == event.summary)
        
        if(file){
            plugin.app.workspace.getLeaf(true).openFile(file);
            closeFunction();
        }else{
            await manuallyCreateNoteFromEvent(event);
        }
    }

    const openInBrowser = () => {
        window.open(event.htmlLink);
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
    
    <select name="calendar" class="dropdown" on:change="{changeCalendar}" disabled={event.id !== undefined}>
        
        {#each calendars as calendar}
            <option id="{calendar.id}" value="{calendar.id}" selected="{calendar.id == event.parent.id}">{calendar.summary}</option>
        {/each}
    </select>
    
    {/if}

    <div class="googleFullDayContainer">
        <label for="fullDay">Full Day</label>
        <input type="checkbox" name="fullDay" bind:checked="{fullDay}" >
    </div>


    {#if fullDay}
        <label for="eventDate">Date</label>
        <input type="date" name="eventDate" value="{dateToInput(startDate)}" on:change="{changeDate}">
    {:else}
        <label for="eventStartDate">Start Date</label>
        <input type="datetime-local" name="eventStartDate" value="{dateToLocalStart(startDateTime)}" on:change="{changeStartDateTime}">

        <label for="eventEndDate">End Date</label>
        <input type="datetime-local" name="eventEndDate" value="{dateToLocalEnd(endDateTime)}"  on:change="{changeEndDateTime}" >
    {/if}

    <div class="googleEventButtonContainer">
        {#if event.id}

            <div class="buttonRow">
                {#if event.recurringEventId }
                    <button on:click="{openInBrowser}">Recurring Event</button>
                {:else}
                    <button on:click="{openInBrowser}">Single Event</button>
                {/if}

                <button on:click="{openCreateNote}">Open/Create</button>
            </div>


            <div class="buttonRow">
                <button on:click="{updateEvent}">Update</button>
    
                <button on:click="{deleteEvent}">Delete</button>
            </div>
            {#if event.recurringEventId }
                <div class="buttonRow">
                    <button disabled class="disabled" on:click="{updateAllEvents}">Update All</button>
                    
                    <button on:click="{deleteAllEvents}">Delete All</button>
                </div>
            {/if}    

        {:else}
            <div class="buttonRow">
                <button on:click="{createEvent}">Create</button>
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

    .disabled{
        opacity: 0.2;
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