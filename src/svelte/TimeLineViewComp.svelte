<script lang="ts" >

import TimeLine from "./TimeLineComp.svelte";
import TimeLineHourText from "./TimeLineHourText.svelte";
import type { CodeBlockOptions, GoogleEvent } from "../helper/types";
import ViewSettings from "./ViewSettings.svelte";
import DayNavigation from "./DayNavigation.svelte";
import { googleClearCachedEvents, listEvents } from "../googleApi/GoogleListEvents";
import AllDayContainer from "./AllDayContainer.svelte";
import { onDestroy } from "svelte";
import { EventDetailsModal } from "../modal/EventDetailsModal";


export let codeBlockOptions: CodeBlockOptions;
export let isObsidianView = false;
export let showSettings = false;

if(!codeBlockOptions.width) codeBlockOptions.width = 300;
if(!codeBlockOptions.height) codeBlockOptions.height = 700;

let startDate: moment.Moment;
let dateOffset = 0;
let date;
let loading = false;
let events:GoogleEvent[] = [];
let interval;

const getEvents = async(date:moment.Moment) => {
        
    if(!date?.isValid()){
        loading = false;
        return;
    }

    const newEvents = await listEvents({
        startDate:date,
        include: codeBlockOptions.include,
        exclude: codeBlockOptions.exclude
    }); 

    if(JSON.stringify(newEvents) != JSON.stringify(events)){
        events = newEvents;
    }
}

const refreshData = async (date:moment.Moment) => {
    if(loading) return;
    loading = true;
    await getEvents(date)
    loading = false;
} 

const goToEvent = (event:GoogleEvent, e:any) => {
    if(e.shiftKey){
        window.open(event.htmlLink);
    }else{
        new EventDetailsModal(event, () => {
            googleClearCachedEvents();
                refreshData(date);
        }).open();
    }
}

$: {
    startDate = codeBlockOptions.date 
        ? window.moment(codeBlockOptions.date).add(codeBlockOptions.dayOffset, "days") 
        : window.moment().add(codeBlockOptions.dayOffset, "days");
    date = codeBlockOptions.navigation ? startDate.clone().local().add(dateOffset, "days") : startDate;

    if(interval) clearInterval(interval);
    interval = setInterval(() =>refreshData(date), 5000);
    refreshData(date);

}

onDestroy(() => {
    clearInterval(interval);
})

</script>
<div class="gcal-timline">
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}
    {#if codeBlockOptions.navigation && date}
        <DayNavigation bind:dateOffset bind:date bind:startDate/>
    {/if}

    <div class="gcal-day-container">
        {#if codeBlockOptions.showAllDay}
            <div class="gcal-stop-overflow" />
            <div class="gcal-day-container">
                <AllDayContainer 
                    {goToEvent}
                    events={events.filter(e => e.start.date)}
                    width={codeBlockOptions.width}
                />
            </div>
        {/if}
        <div class="gcal-stop-overflow">
            <TimeLineHourText hourRange={codeBlockOptions.hourRange}/>
        </div>
        <div class="gcal-stop-overflow">
            <TimeLine 
                events={events.filter(e => e.start.dateTime)}
                bind:date 
                height={codeBlockOptions.height} 
                width={codeBlockOptions.width} 
                hourRange={codeBlockOptions.hourRange} 
                {goToEvent}
            />
        </div>
    </div>
</div>

<style>

    .gcal-stop-overflow {
        overflow: hidden;
        min-width: 0;
        min-height: 0;
    }

    .gcal-timline{
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-left: 10px;
        position: relative;
    }
    .gcal-day-container {
        position: relative;
        display: grid;
        gap: 1em;
        grid-auto-flow: row;
        overflow: hidden;
        grid-template-columns: auto 1fr;
    }
</style>
