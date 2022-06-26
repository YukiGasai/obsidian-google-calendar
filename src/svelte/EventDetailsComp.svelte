<script lang="ts">
    import type { GoogleCalander, GoogleEvent } from "../helper/types";
    import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import { onMount } from 'svelte';
    import { googleListCalendars } from "../googleApi/GoogleListCalendars";
    import { googleRemoveEvent } from "../googleApi/GoogleRemoveEvent";
    import {googleUpdateEvent} from '../googleApi/GoogleUpdateEvent'

    import { googleCreateEvent } from "../googleApi/GoogleCreateEvent";


    export let plugin: GoogleCalendarPlugin;
    export let event: GoogleEvent;
    export let currentDate: moment.Moment;
    export let closeFunction :() => void;

    let calendars: GoogleCalander[];
    let loading = true;
    let fullDay;

    onMount(async () => {
        calendars = await googleListCalendars(plugin);
        loading = false;

        fullDay = event?.start?.dateTime == undefined

        if(event.id == undefined){
            event.summary = ""
            event.description = ""
            event.start.date = currentDate.format("YYYY-MM-DD")
            event.end.date   = currentDate.format("YYYY-MM-DD")
            event.start.dateTime = currentDate.format()
            event.end.dateTime   = currentDate.add(1, "hour").format()
            event.parent = calendars[calendars.length - 1];
            fullDay = false
        }

	});

    const getDescription = () => {
        if(!loading && event.description){
		    return this.event.description.replace(/<\/?[^>]+(>|$)/g, "");
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

    const dateToLocal = (date:any) => {
        return window.moment(date).local().format("YYYY-MM-DDTHH:mm")
    }

    const dateToInput = (date:any) => {
        return window.moment(date).local().format("YYYY-MM-DD")
    }


    const changeStartDateTime = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
           event.start.dateTime = window.moment(e.target.value).format()
        } 
    }


    const changeEndDateTime = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
            event.end.dateTime = window.moment(e.target.value).format()
        } 
    }

    const changeDate = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
            const date = window.moment(e.target.value).format("YYYY-MM-DD")
            event.start.date = date
            event.end.date = date
        } 
    }

    const createEvent = () => {

        if(fullDay){
            delete event.start.dateTime;
            delete event.end.dateTime;

        }else{
            delete event.start.date;
            delete event.end.date;
        }

        const newEvent = googleCreateEvent(plugin, event);
    
        if(newEvent){
            closeFunction();
        }
    
    }

    const deleteEvent = async(e) => {
        let wasSucessfull = false;
        if(event.recurringEventId){
            wasSucessfull = await googleRemoveEvent(plugin, event , true)
        }else{
            wasSucessfull = await googleRemoveEvent(plugin, event)
        }
        if(wasSucessfull){
            closeFunction();
        }
    }

    const deleteAllEvents = async() => {
        
        const wasSucessfull = await googleRemoveEvent(plugin, event)
        if(wasSucessfull){
            closeFunction();
        }
        
    }


    const updateEvent = async () => {
        if(fullDay){
            delete event.start.dateTime;
            delete event.end.dateTime;

        }else{
            delete event.start.date;
            delete event.end.date;
        }

        let updatedEvent;
        if(event.recurringEventId){
            updatedEvent = await googleUpdateEvent(plugin, event , true)
        }else{
            updatedEvent = await googleUpdateEvent(plugin, event)
        }
        if(updatedEvent.id){
            closeFunction(); 
        }
    }

    const updateAllEvents = async () => {

        if(fullDay){
            delete event.start.dateTime;
            delete event.end.dateTime;

        }else{
            delete event.start.date;
            delete event.end.date;
        }
  
         const updatedEvent = await googleUpdateEvent(plugin, event)
        if(updatedEvent.id){
            closeFunction();
        }
    }


    $:{
        console.log(event)
    }

</script>


<div class="googleEventDetails">

    {#if event.recurringEventId }
    <h1>Google Calendar Recurring Event</h1>  
    {:else}
    <h1>Google Calendar Event</h1>  
    {/if}
   

    <label for="summary">Summary</label>
    <input name="summary" type="text" bind:value="{event.summary}">

    <label for="description">Description</label>
    <textarea name="description" on:change="{changeDescription}">{getDescription()}</textarea>

   

    {#if loading}
        <span>Loading</span>
    {:else}

    <label for="calendar">Calendar</label>
    
    <select name="calendar" class="dropdown" on:change="{changeCalendar}">
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
        <input type="date" name="eventDate" value="{dateToInput(event.start.date)}" on:change="{changeDate}">
    {:else}
        <label for="eventStartDate">Start Date</label>
        <input type="datetime-local" name="eventStartDate" value="{dateToLocal(event.start.dateTime)}" on:change="{changeStartDateTime}">

        <label for="eventEndDate">End Date</label>
        <input type="datetime-local" name="eventEndDate" value="{dateToLocal(event.end.dateTime)}"  on:change="{changeEndDateTime}" >
    {/if}

    <div class="googleEventButtonContainer">
        {#if event.id}
            <button class="danger" on:click="{updateEvent}">Update</button>
    
            <button class="danger" on:click="{deleteEvent}">Delete</button>
         
            {#if event.recurringEventId }
                <button class="danger" on:click="{updateAllEvents}">Update All</button>
    
                <button class="danger" on:click="{deleteAllEvents}">Delete All</button>
            {/if}
         
        {:else}
            <button on:click="{createEvent}">Create</button>
        {/if}
    </div>
</div>


<style>
    .danger{
        background-color: rgb(255, 114, 114) !important;
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
        flex-direction: row;
        justify-content: space-evenly;

    }

    .googleEventButtonContainer button {
        width: 40%;
    }

    .googleEventDetailsHeader{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding-right: 30px;
    }

</style>