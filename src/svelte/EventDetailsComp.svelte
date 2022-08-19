<script lang="ts">
    import type { GoogleCalendar, GoogleEvent } from "../helper/types";
    
    import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import { onMount } from 'svelte';
    import { googleListCalendars } from "../googleApi/GoogleListCalendars";
    import { googleRemoveEvent } from "../googleApi/GoogleRemoveEvent";
    import { googleUpdateEvent } from '../googleApi/GoogleUpdateEvent'
    import { googleCreateEvent } from "../googleApi/GoogleCreateEvent";
    import { manuallyCreateNoteFromEvent } from "../helper/AutoEventNoteCreator";
    import { Frequency, RRule, RRuleSet, Weekday } from "rrule";
    import type { Options } from "rrule"
    export let event: GoogleEvent;
    export let closeFunction :() => void;

    let calendars: GoogleCalendar[];
    let loading = true;
    let fullDay:boolean;
    let recurring: boolean;
    let recurringType: Frequency;
    let recurringInterval = 1;
    let recurringEndType: string;
    let recurringCount:number;
    let recurringEndDate: string;

    let plugin = GoogleCalendarPlugin.getInstance();

    let inputStartDateTime:string;
    let inputEndDateTime:string;
    let inputStartDate:string;

    let listofWeekState:[Weekday,boolean][] = [[RRule.MO, true],[RRule.TU, true],[RRule.WE, true],[RRule.TH, true],[RRule.FR, true],[RRule.SA, true],[RRule.SU, true]]

   

    function getEmptyDate() {
        const minutes = 15;
        const ms = 1000 * 60 * minutes;

        return window.moment(new Date(Math.round(new Date().getTime() / ms) * ms));
    }


    function addEventDate(event: GoogleEvent) : GoogleEvent {

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

        return event;
    }

    onMount(async () => {
        calendars = await googleListCalendars();
        loading = false;

        fullDay = event?.start?.dateTime == undefined
        recurring = event?.recurringEventId !== undefined; 

        //New event all blank
        if(event.id == undefined){
            event.summary = event.summary ?? "";
            event.description = event.description ?? "";

            event.parent = calendars.find(calendar => calendar.id === plugin.settings.defaultCalendar);
            if(!event.parent) {
                event.parent = calendars[calendars.length - 1];
            }
       
            fullDay = false;
            recurring = false;

            const startTime = getEmptyDate();
            inputStartDateTime = startTime.format("YYYY-MM-DDTHH:mm");
            inputEndDateTime = startTime.add(1, "hour").format("YYYY-MM-DDTHH:mm");
            inputStartDate = startTime.format("YYYY-MM-DD");

        }else {
            //Add the missing time to the object for a better user expirince
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

    const createEvent = async () => {

        if(recurring){

        let weekDays = listofWeekState.map((state) => {
            if(state[1]){
                return state[0]
            }
        })

        weekDays = weekDays.filter(day => day !== undefined)

	    const rruleSet = new RRuleSet();


        let options:Partial<Options>= {
            freq: recurringType,
            interval: recurringInterval,
        }

        if(recurringEndType === "For"){
            options.count = recurringCount;
        }else if(recurringEndType === "Until"){
            options.until = new Date(recurringEndDate);
        }


        if(recurringType === RRule.WEEKLY && weekDays.length){
            options.byweekday = weekDays;
        }

        const rule = new RRule(options);

        rruleSet.rrule(rule);

        event.recurrence = rruleSet.valueOf()



        }

        const newEvent = await googleCreateEvent(addEventDate(event))
            
        if(newEvent.id){
            closeFunction();
        }
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
        
        const wasSucessfull = await googleRemoveEvent(addEventDate(event))
        if(wasSucessfull){
            closeFunction();
        }
    }

    const updateEvent = async () => {

        const cleanEvent = addEventDate(event);
        let updatedEvent;
        if(cleanEvent.recurringEventId){
            updatedEvent = await googleUpdateEvent(cleanEvent , true)
        }else{
            updatedEvent = await googleUpdateEvent(cleanEvent)
        }
        if(updatedEvent.id){
            closeFunction(); 
        }
    }

    const updateAllEvents = async () => {
        
        const updatedEvent = await googleUpdateEvent(addEventDate(event))
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
        <input type="date" name="eventDate" bind:value="{inputStartDate}">
    {:else}
        <label for="eventStartDate">Start Date</label>
        <input type="datetime-local" name="eventStartDate" bind:value="{inputStartDateTime}">

        <label for="eventEndDate">End Date</label>
        <input type="datetime-local" name="eventEndDate" bind:value="{inputEndDateTime}" min="{window.moment(inputStartDateTime).format('YYYY-MM-DDThh:mm')}">
    {/if}


    {#if !event.id}

    <div class="googleFullDayContainer">
        <label for="reaccuring">Reccuring</label>
        <input type="checkbox" name="reaccuring" bind:checked="{recurring}" >
    </div>



    {#if recurring}

        <div>
            <span>Repeat every</span>
            <input type="number" name="recurringInterval" step="1" min="1" bind:value="{recurringInterval}">
            <select bind:value={recurringType}>
                <option value="{Frequency.DAILY}">Days</option>
                <option default value="{Frequency.WEEKLY}">Weeks</option>
                <option value="{Frequency.MONTHLY}">Months</option>
                <option value="{Frequency.YEARLY}">Years</option>
            </select>
            
            <select bind:value={recurringEndType}>
                <option default value="Forever">Forever</option>
                <option value="Until">Until</option>
                <option value="For">For</option>
            </select>

            {#if recurringEndType == 'Until'}

                <input type="date" name="recurringEndDate" required bind:value="{recurringEndDate}">
            {:else if recurringEndType == 'For'}

                <input type="number" name="recurringCount" step="1" min="1" required bind:value="{recurringCount}">
                <span>times</span>
            {/if}
            <br>
            {#if recurringType === Frequency.WEEKLY}

                {#each listofWeekState as state}
                    <button 
                    
                    class="{state[1] ? 'weekActive' : 'weekInActive'}"
                    on:click="{() => {
                        state[1] = !state[1];
                        }
                    }"
                    >
                        {state[0].toString()}
                    </button>
                {/each}

            {/if}
     

        </div>

    {/if}
    {/if}

    <div class="googleEventButtonContainer">
        {#if event.id}

            <div class="buttonRow">
                {#if recurring }
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
            {#if recurring }
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

    .weekActive{
        background-color: rgb(61, 102, 214) !important;
    }

    .weekInActive {
        background-color: #2a2a2a !important;
    }

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