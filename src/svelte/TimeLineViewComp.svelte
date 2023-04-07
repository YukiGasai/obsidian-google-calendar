<script lang="ts" >

import TimeLine from "./TimeLineComp.svelte";
import TimeLineHourText from "./TimeLineHourText.svelte";
import {EventDetailsModal} from "../modal/EventDetailsModal"
import { googleClearCachedEvents } from "../googleApi/GoogleListEvents";
import type { CodeBlockOptions } from "../helper/types";
import ViewSettings from "./ViewSettings.svelte";


export let codeBlockOptions: CodeBlockOptions;
export let isObsidianView = false;
export let showSettings = false;

if(!codeBlockOptions.width) codeBlockOptions.width = 300;
if(!codeBlockOptions.height) codeBlockOptions.height = 700;


let startDate:moment.Moment = codeBlockOptions.date ? window.moment(codeBlockOptions.date ) : window.moment();
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

$: date = codeBlockOptions.navigation ? startDate.clone().local().add(dateOffset, "days") : startDate;

</script>
<div style="padding-left: 10px; position: relative;">
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}
    {#if codeBlockOptions.navigation && date}
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
                    <button class="gcal-new-event-button" aria-label="Create Event" on:click={openNewEventDialog}>+</button>
                </div>
            </div>    
        </div>
    {/if}
    
    <div class="gcal-day-container">
        <TimeLineHourText hourRange={codeBlockOptions.hourRange}/>
        <TimeLine 
            bind:date 
            height={codeBlockOptions.height} 
            width={codeBlockOptions.width} 
            include={codeBlockOptions.include} 
            exclude={codeBlockOptions.exclude} 
            hourRange={codeBlockOptions.hourRange} 
        />
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
        overflow: hidden;
    }
    
    .gcal-new-event-button {
        margin-left: 30px;
    }

    .gcal-nav-container {
        display: flex;
        margin-bottom: 1em;
    }
</style>
