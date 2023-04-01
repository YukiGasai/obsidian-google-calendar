<script lang="ts" >

    import TimeLine from "./TimeLineComp.svelte";
    import TimeLineHourText from "./TimeLineHourText.svelte";
    import {EventDetailsModal} from "../modal/EventDetailsModal"
    import { googleClearCachedEvents } from "../googleApi/GoogleListEvents";
    import { onMount } from "svelte";
    
    export let height:number = undefined;
    export let width:number = undefined;
    export let startDate:moment.Moment = window.moment();
    export let navigation:boolean = false;
    export let include;
    export let exclude;
    export let hourRange: number[] = undefined;
    export let dayOffset = 0; 
    export let timespan = 7; 

    let dateOffset = 0;
    const minusOneWeek = () => dateOffset-= 7;
    const minusOneDay  = () => dateOffset-= 1;
    const backToday    = () => dateOffset = 0;
    const plusOneWeek  = () => dateOffset+= 7;
    const plusOneDay   = () => dateOffset+= 1;

    const openNewEventDialog = (event) => {  

        new EventDetailsModal({start:{}, end:{}}, () =>{
            googleClearCachedEvents()
            date=date;
        }).open()
    }

    $: date = navigation ? startDate.clone().local().add(dateOffset, "days") : startDate;
    
    const getDatesToDisplay = (date) => {
        let datesToDisplay = [];

        for (let i = 0; i < timespan; i++) {
            datesToDisplay = [...datesToDisplay, date.clone().add(i + dayOffset, "days")];
        }

        return datesToDisplay;
    }

    </script>
    <div style="padding-left: 10px;">
        {#if navigation && date}
        <div class="gcal-title-container">
            <h3 class="gcal-view-description">gCal Week View</h3>
            <div class="gcal-date-container">
                <h3 class="gcal-date-dayofweek">{date.format("dddd")}</h3>
                <h1 class="gcal-date-main">{date.format("MMMM DD, YYYY")}</h1>
                <div class="gcal-nav-container">
                    <button class="gcal-nav-button" aria-label="Back 1 week"    on:click={minusOneWeek}>&lt;&lt;</button>
                    <button class="gcal-nav-button" aria-label="Back 1 day"     on:click={minusOneDay}>&lt;</button>
                    <button class="gcal-nav-button" aria-label="Jump to today"  on:click={backToday}>Today</button>
                    <button class="gcal-nav-button" aria-label="Forward 1 day"  on:click={plusOneDay}>&gt;</button>
                    <button class="gcal-nav-button" aria-label="Forward 1 week" on:click={plusOneWeek}>&gt;&gt;</button>
                </div>
            </div>
            <button class="gcal-new-event-button" aria-label="Create Event" on:click={openNewEventDialog}>+ New Event</button>
        </div>
        
        {/if}
        <div class="gcal-week-container">
            <div>
                <span class="invisible">Test</span>
            </div>
            <TimeLineHourText />
            {#each getDatesToDisplay(date) as day, i}
                <div class="gcal-day-container">
                    <span class="gcal-dayofweek">{day.format('ddd')}</span>
                    <span class="gcal-day">{day.format('D')}</span>
                </div>
                <TimeLine date={day} {height} {width} {include} {exclude} {hourRange} showTimeDisplay={false}/> 
            {/each}
        </div>
    </div>
    
<style>

    .gcal-title-container {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        grid-column-gap: 1em;
        margin-bottom: 1em;
    }

    .gcal-view-description {
        margin: 0px;
    }

    .gcal-date-dayofweek, .gcal-date-main {
        margin: 0px;
    }
    
    .gcal-new-event-button {
        margin-left: auto;
    }

    .gcal-nav-container {
        display: flex;
        justify-content: center;
        margin-bottom: 1em;
    }

    .invisible {
        display: none;
    }

    .gcal-week-container{
        position: relative;
        display: grid;
        grid-template-columns: auto repeat(7, minmax(0,1fr));
        grid-template-rows: auto 1fr;
        column-gap: 1em;
        grid-auto-flow: column;
    }

    .gcal-day-container {
        display: grid;
        justify-content: center;
    }

    .gcal-day, .gcal-dayofweek {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: medium;
    }

    .gcal-day {
        font-weight: 700;
        font-size: x-large;
    }
    
</style>
