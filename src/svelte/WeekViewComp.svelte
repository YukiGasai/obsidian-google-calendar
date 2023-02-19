<script lang="ts" >

    import TimeLine from "./TimeLineComp.svelte";
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
        <div class="titleContainer">
            <button aria-label="Create Event" on:click={openNewEventDialog}>+</button>
            <h3>Google Calendar {date.format("YYYY-MM-DD")}</h3>
        </div>
        <div class="navigationContainer">
            <button class="fixedSizeButton" aria-label="Back 1 week"    on:click={minusOneWeek}>&lt;&lt;</button>
            <button class="fixedSizeButton" aria-label="Back 1 day"     on:click={minusOneDay}>&lt;</button>
            <button class="fixedSizeButton" aria-label="Jump to today"  on:click={backToday}>Today</button>
            <button class="fixedSizeButton" aria-label="Forward 1 day"  on:click={plusOneDay}>&gt;</button>
            <button class="fixedSizeButton" aria-label="Forward 1 week" on:click={plusOneWeek}>&gt;&gt;</button>
        </div>
        {/if}
        <div class="googleWeekContainer" style="overflow: hidden">
            {#each getDatesToDisplay(date) as day, i}
       
                    {#if i == 0}
                        <TimeLine date={day} height={height} width={width} include={include} exclude={exclude} hourRange={hourRange} /> 
                    {:else}
                        <TimeLine date={day} height={height} width={width} include={include} exclude={exclude} hourRange={hourRange} showTimeDisplay={false}/> 
                    {/if}
                    <span class="dayDisplay">{day.format('D')}</span>
            {/each}
        </div>
    </div>
    
    <style>

    .googleWeekContainer{
        position: relative;
        display: flex;
        flex-direction: row;
        overflow-x: scroll;
        overflow-y: hidden;
        height: 100%;
    }
    
    </style>
    