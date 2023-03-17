<script lang="ts" >

import TimeLine from "./TimeLineComp.svelte";
import TimeLineHourText from "./TimeLineHourText.svelte";
import {EventDetailsModal} from "../modal/EventDetailsModal"
import { googleClearCachedEvents } from "../googleApi/GoogleListEvents";


export let height:number = undefined;
export let width:number = undefined;
export let startDate:moment.Moment = window.moment();
export let navigation:boolean = false;
export let include;
export let exclude;
export let hourRange: number[] = undefined; 

let dateOffset = 0;
const minusOneWeek = () => dateOffset-= 7;
const minusOneDay  = () => dateOffset-= 1;
const backToday    = () => dateOffset = 0;
const plusOneWeek  = () => dateOffset+= 7;
const plusOneDay   = () => dateOffset+= 1;
let date;

const openNewEventDialog = (event) => {  

    new EventDetailsModal({start:{}, end:{}}, () =>{
        googleClearCachedEvents()
        date=date;
    }).open()
}

$: date = navigation ? startDate.clone().local().add(dateOffset, "days") : startDate;

</script>
<div style="padding-left: 10px; position: relative;">
    {#if navigation && date}
        <div class="gcal-title-container">
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
            <button class="gcal-new-event-button" aria-label="Create Event" on:click={openNewEventDialog}>+</button>
        </div>
    {/if}
    
    <div class="gcal-day-container">
        <TimeLineHourText />
        <TimeLine bind:date height={height} width={width} include={include} exclude={exclude} hourRange={hourRange} showTimeDisplay={false} />
    </div>
</div>

<style>

    .gcal-title-container {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-column-gap: 1em;
        margin-bottom: 1em;
    }

    .gcal-date-dayofweek, .gcal-date-main {
        margin: 0px;
    }

    .gcal-day-container {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .gcal-new-event-button {
        position: absolute;
        top: 0;
        right: 0;
    }

    .gcal-nav-container {
        display: flex;
        justify-content: center;
        margin-bottom: 1em;
    }
</style>
