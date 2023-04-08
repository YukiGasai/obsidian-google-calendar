<script lang="ts" >
import timerStore from './extra/timerStore'
import type { GoogleEvent } from "../helper/types";
import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';
import TreeMap from 'ts-treemap'
import { dateToPercent, getStartHeightOfHour, getEndHeightOfHour } from "../helper/Helper";
import {getEventStartPosition, getEventHeight} from "../helper/Helper";
import {getColorFromEvent} from '../googleApi/GoogleColors'
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

interface Location {
    event:GoogleEvent;
    x:number;
    y:number;
    width:number;
    height:number; 
    fullDay:boolean;
}

export let height = 700;
export let width = 300;
export let events: GoogleEvent[];
export let date;
export let hourRange;
export let goToEvent;

const getRedTimeLinePosition = (time) => {
    const dayPercentage = dateToPercent(time);
    return Math.floor(height * dayPercentage);
}

const plugin = GoogleCalendarPlugin.getInstance();
let hourFormat = plugin.settings.timelineHourFormat;
const currentTime = timerStore();

const getLocationArray = (events) => {
    let eventLocations:Location[] = [];
    const startMap = new TreeMap<string, GoogleEvent[]>();
    events.forEach((event) => {
        const start = event.start.date || event.start.dateTime;
        if(startMap.has(start)){
            startMap.get(start).push(event)
        }else{
            startMap.set(start, [event])
        }
    });

    let indentAmount = 0;
    let latestEndDate = null; 

    for (let events of startMap.values()) {

        if(events[0].start.dateTime){
            const startDate = window.moment(events[0].start.dateTime)
            
            if(latestEndDate && startDate.isBefore(latestEndDate, "minutes")){
                indentAmount++;
            }else{
                indentAmount = 0;
            }

            latestEndDate = window.moment(events[0].end.dateTime)
        }
        events.forEach((event, i) => {
                        
            const indent = indentAmount * 5;

            const elementWidth = (100-indent) / events.length;
            eventLocations = [...eventLocations, {
                event: event,
                x: indent + elementWidth*i,
                y: getEventStartPosition(event, height),
                width: elementWidth,
                height: getEventHeight(event, height),
                fullDay: event.start.date != undefined
            }]     
        })
    }
    return eventLocations;
}

const [send, receive] = crossfade({
    duration: d => Math.sqrt(d * 200),

    fallback(node, params) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;

        return {
            duration: 600,
            easing: quintOut,
            css: t => `
                transform: ${transform} scale(${t});
                opacity: ${t}
            `
        };
    }
});

</script>

<div 
    style:height="{height}px"
    style:width="{width}px"
    style:max-width="100%"
    style:margin=" -{getStartHeightOfHour(height, hourRange[0])}px 0px -{getEndHeightOfHour(height, hourRange[1])}px 0px"
    class="gcal-timeline"
    >
    <div class="gcal-timeline-container">
        <div class="gcal-hour-line-container">
            {#each {length: 24} as _, i }
                <div class={hourFormat > 3 ? "gcal-hour-line gcal-hour-line-large" : "gcal-hour-line"} style:height="{height/24}px" />
            {/each}
        </div>  
    </div>

{#if window.moment().isSame(date, 'day')}
    <div class="gcal-time-display" style:top="{getRedTimeLinePosition($currentTime)}px"/>
{/if}

    {#each getLocationArray(events) as location, i (i)}
        <div 
            in:receive="{{key: i}}"
            out:send="{{key: i}}"
            on:click={(e) => goToEvent(location.event,e)} 
            class="
                googleCalendarEvent
                googleCalendarEvent_Calendar_Color_{location.event.parent.colorId}
                googleCalendarEvent_Event_Color_{location.event.parent.colorId}
                googleCalendarEvent_Id_{location.event.parent.id}
                "
            id="{location.event.id}"
            style:top="{location.y}px"
            style:left="{location.x}%"
            style:width="{location.width}%"
            style:height="{location.height}px"
            style:background={getColorFromEvent(location.event)}
        >
        <span class="
            googleCalendarName
            googleCalendarName_Calendar_Color_{location.event.parent.colorId}
            googleCalendarName_Event_Color_{location.event.parent.colorId}
            googleCalendarName_Id_{location.event.parent.id}
            ">{location.event.summary}</span>
    </div>
    {/each}

</div>

<style>
    .googleCalendarEvent{
        display: flex;
        padding: 0 10px 10px;
        position: absolute;
        cursor: pointer;
        width: 150px;
        border-radius: 5px;
        color: black;
        font-size: small;
        box-shadow: 3px 2px 8px 4px rgba(0,0,0,0.36);
        overflow: hidden;
    }

    .gcal-timeline-container {
        display: flex;
        gap: 5px;
    }

    .gcal-hour-line::after{
        content: "";
        position: absolute;
        width: 100%;
        border-bottom: 1px solid grey;
    }

    .gcal-timeline, .hourText{
        overflow: hidden;
    }
            
    .gcal-time-display{
        position: absolute;
        width: 95%;
        height: 3px;
        background:red;
        overflow: visible;
    }

    .gcal-timeline{
        position:relative;
        display: flex;
        flex-direction: row;
        padding-top: 5px;
        flex-shrink: 1000;
        min-height: 0;
        overflow: hidden; 
    }

</style>