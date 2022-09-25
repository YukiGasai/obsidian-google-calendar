<script lang="ts">
	import type { GoogleCalendar, GoogleEvent } from "../helper/types";
	import { googleListCalendars } from "../googleApi/GoogleListCalendars";
	import { googleListEvents, googleListTodayEvents } from "../googleApi/GoogleListEvents";
	import { onMount } from "svelte";
	import { GoogleEventSuggestionList } from "../helper/GoogleEventSuggestionList";
	import type { InsertEventsModal } from "../modal/InsertEventsModal";

    export let onSubmit :(printType:string, eventList: GoogleEvent[], tableOptions: string[], insertEventsModal: InsertEventsModal) => void;
    export let insertEventsModal: InsertEventsModal;

    let insertType; 
    let calendarList: [GoogleCalendar, boolean][];
    let eventList: [GoogleEvent, boolean][];

    let tableOptions: string[] = ["summery", "description"];
    
	onMount(async () => {
        const totalCalendarList = await googleListCalendars();
        calendarList = totalCalendarList.map(calendar => {return [calendar, true]});

        const totalEventList = await googleListTodayEvents();
        eventList = totalEventList.map(event => {return [event, true]});		
	});




    let handleSubmit = () => {
        const resultEventList = eventList
            .filter((eventTupel:[GoogleEvent, boolean]) => eventTupel[1])
            .map((eventTupel:[GoogleEvent, boolean]) => eventTupel[0]);
        onSubmit(insertType, resultEventList, tableOptions, insertEventsModal)
    }

    let changedCalendarList = (e) => {
        eventList.forEach((event:[GoogleEvent, boolean]) => {
            if(event[0].parent.id == e.target.id){
                event[1] = e.target.checked
            }
        });
        //Make sure svelt updates the content
        eventList = eventList;
    }

    let AddRemoveItem = (e) => {
        const selectedOption = e.target.value;
        if(tableOptions.contains(selectedOption)){
            tableOptions.remove(selectedOption)
        }else{
            tableOptions.push(selectedOption);
        }
        tableOptions = tableOptions;
    }

    let changedDate = async (e) => {
 
        const totalCalendarList = await googleListCalendars();
        calendarList = totalCalendarList.map(calendar => {return [calendar, true]});

        const totalEventList = await googleListEvents(window.moment(e.target.value).local());
        eventList = totalEventList.map(event => {return [event, true]});	
        eventList = eventList;
    }

</script>
<div>
    
    <h1>Insert Options</h1>

    <label for="insertType">Insert type</label>
    <select bind:value={insertType} class="dropdown">
        <option default value="bullet">Bullet</option>
        <option value="table">Table</option>
      
    </select>
    <br>
    <label for="date">Insert date</label>
    <input type="date" name="date" id="date" value={window.moment().format("YYYY-MM-DD")} on:change="{changedDate}">
    <hr>
    <h4>Calendars</h4>
    <div >
        {#if calendarList}
            {#each calendarList as calendar }
                <label for="{calendar[0].id}">{calendar[0].summary}</label>
                <input type="checkbox" id="{calendar[0].id}" bind:checked="{calendar[1]}" on:change="{changedCalendarList}">
            {/each}
        {/if}
    </div>
    <hr>
    <h4>Events</h4>

    <div>
        {#if eventList}
            {#each eventList as event }
                <label for="{event[0].id}">{event[0].summary}</label>
                <input type="checkbox" id="{event[0].id}" bind:checked="{event[1]}">
            {/each}
        {/if}
    </div> 
    {#if insertType == "todo"}
        <label for="tableOptions">Add Event</label>
        <select name="tableOptions" on:change="{AddRemoveItem}">
            {#each GoogleEventSuggestionList as option}
            <option value="{option}">{option}</option>
            {/each}
        </select>
        
        <div>
            {#each tableOptions as option}
                <span>{option}</span>
            {/each}
        </div>
    {/if}
    <hr>
    <button on:click="{handleSubmit}">Submit</button>
</div>
<style>

</style>