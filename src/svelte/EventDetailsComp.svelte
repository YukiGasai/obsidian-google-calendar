<script lang="ts">
    import type { GoogleCalander, GoogleEvent } from "../helper/types";
    import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import { onMount } from 'svelte';
    import { googleListCalendars } from "../googleApi/GoogleListCalendars";
    import { googleRemoveEvent, googleRemoveEventOnce } from "../googleApi/GoogleRemoveEvent";
    import {googleUpdateEvent} from '../googleApi/GoogleUpdateEvent'


    export let plugin: GoogleCalendarPlugin;
    export let event: GoogleEvent;
    export let currentDate: moment.Moment;
    export let isBaseEvent: boolean = false;

    let calendars: GoogleCalander[];
    let loading = true;
    let fullDay;
   

    $: {
	    console.log(event);
    }

    onMount(async () => {
        calendars = await googleListCalendars(plugin);
        loading = false;
        fullDay = event.start.dateTime == undefined
        console.log(event);
	});

    const getDescription = () => {
        if(!loading){
            if(event.description){
		        return this.event.description.replace(/<\/?[^>]+(>|$)/g, "");
            }
            return ""
        }else{
            return ""
        }
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


    const changeStartDate = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
           event.start.dateTime = window.moment(e.target.value).format()
        } 
    }


    const changeEndDate = (e:Event) => {
        if(e.target instanceof HTMLInputElement){
            event.end.dateTime = window.moment(e.target.value).format()
        } 
    }

    const deleteEvent = () => {
        //googleRemoveEvent(plugin, event);
        googleRemoveEventOnce(plugin, event, currentDate)
    }

    const updateEvent = () => {
        googleUpdateEvent(plugin, event);
    }


</script>


<div class="googleEventDetails">

    {#if isBaseEvent}
    <h1>Google Calendar Event</h1>  
    {:else}
    <h1>Google Calendar Event Instace</h1>  
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
        <input type="date" name="eventDate" bind:value="{event.start.date}" >
    {:else}
        <label for="eventStartDate">Start Date</label>
        <input type="datetime-local" name="eventStartDate" value="{dateToLocal(event.start.dateTime)}" on:change="{changeStartDate}">

        <label for="eventEndDate">End Date</label>
        <input type="datetime-local" name="eventEndDate" value="{dateToLocal(event.end.dateTime)}"  on:change="{changeEndDate}" >
    {/if}

    <div class="googleEventButtonContainer">
        <button on:click="{updateEvent}" class="danger">{event.id ? "Update" : "Create"}</button>
        {#if event.id != ""}
            <button class="danger" on:click="{deleteEvent}">Delete</button>
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