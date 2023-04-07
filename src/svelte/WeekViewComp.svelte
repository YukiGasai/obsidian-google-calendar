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
    let startDate:moment.Moment = codeBlockOptions.date ? window.moment(codeBlockOptions.date) : window.moment();

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

    $: date = codeBlockOptions.navigation ? startDate.clone().local().add(dateOffset, "days") : startDate;
    
    const getDatesToDisplay = (date) => {
        let datesToDisplay = [];

        for (let i = 0; i < codeBlockOptions.timespan; i++) {
            datesToDisplay = [...datesToDisplay, date.clone().add(i + codeBlockOptions.dayOffset, "days")];
        }

        return datesToDisplay;
    }

    </script>
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}
    <div style="padding-left: 10px;">
        {#if codeBlockOptions.navigation && date}
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
        <div class="gcal-week-numbers">
            {#each getDatesToDisplay(date) as day, i}
            <div class="gcal-day-container">
                <span class="gcal-dayofweek">{day.format('ddd')}</span>
                <span class="gcal-day">{day.format('D')}</span>
            </div>
            {/each}
        </div>

        <div 
            class="gcal-week-container"
            style:grid-template-columns="auto repeat({codeBlockOptions.timespan}, minmax(0,1fr))"
        >
            <div>
                <span class="invisible">Test</span>
            </div>
            <TimeLineHourText hourRange={codeBlockOptions.hourRange} />
            {#each getDatesToDisplay(date) as day, i}
                <div>
                    <span class="invisible">Test</span>
                </div>
                <TimeLine 
                    date={day} 
                    include={codeBlockOptions.include}
                    exclude={codeBlockOptions.exclude}
                    hourRange={codeBlockOptions.hourRange} 
                /> 
            {/each}
        </div>
    </div>
    
<style>

    .gcal-week-numbers {
        display: flex;
        justify-content: space-around;
        padding-left: 20px;
    }

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
        grid-template-rows: auto 1fr;
        column-gap: 1em;
        grid-auto-flow: column;
        overflow: hidden;
    }

    .gcal-day-container {
        width: 25px;
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
