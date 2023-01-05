<script lang="ts" >

    import type { GoogleEvent } from "../helper/types";

    import TreeMap from 'ts-treemap'
    import { dateToPercent } from "../helper/Helper";
    import {getEventStartPosition, getEventHeight} from "../helper/Helper";
    
    import { googleClearCachedEvents, googleListEvents } from "../googleApi/GoogleListEvents";
    import {EventDetailsModal} from '../modal/EventDetailsModal'
    import {getColorFromEvent} from '../googleApi/GoogleColors'
    import { onDestroy } from "svelte";
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
    export let date = window.moment();
    export let include;
    export let exclude;

    let loading = true;
    let timeDisplayPosition = 0;
    let events:GoogleEvent[] = [];
    let eventLocations:Location[] = [];
    let interval;
    const plugin = GoogleCalendarPlugin.getInstance();
    let hourFormat = plugin.settings.timelineHourFormat;

    const refeshData = async () => {
        hourFormat = plugin.settings.timelineHourFormat;
        await getEvents()
        const dayPercentage = dateToPercent(new Date());
        timeDisplayPosition = Math.floor(height * dayPercentage);
    } 

    $: {
        //needed to update if the prop date changes i dont know why
        date = date;
        
        if(interval){
            clearInterval(interval);
        }
        loading = true;
        interval = setInterval(refeshData, 5000);
        refeshData();
    }

   

    const getLocationArray = () => {
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
                           
                let spaceToHours = 30;

                if(hourFormat == 2){
                    spaceToHours = 50
                }
                
                const indent = spaceToHours + indentAmount * 10;

                const elementWidth = (width-indent) / events.length;

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
    }

    const getEvents = async() => {
        
        if(!date.isValid()){
            return;
        }
   
        const newEvents = await googleListEvents({
            startDate:date,
            include,
            exclude
        }); 

        if(JSON.stringify(newEvents) != JSON.stringify(events)){
            events = newEvents;
            eventLocations = [];
            getLocationArray()
        }
        loading = false;
    }

    const goToEvent = (event:GoogleEvent, e:any) => {
        if(e.shiftKey){
            window.open(event.htmlLink);
        }else{
            new EventDetailsModal(event, () => {
                googleClearCachedEvents();
                date = date
            }).open();
        }
    }

    onDestroy(() => {
        clearInterval(interval);
    })

    const switchHourDisplay = () => {
        hourFormat += 1;
        if(hourFormat > 2){
            hourFormat = 0;
        }
        plugin.settings.timelineHourFormat = hourFormat;
        plugin.saveSettings();
    }

    const getHourText = (hour:number, hourFormat:number):string => {
        const hourMoment = window.moment(`${hour}:00:00`, "H:mm:ss");

        switch (hourFormat) {
            case 0:
                return hourMoment.format("HH"); 
                
            case 1:
                return hourMoment.format("hh");
            
            case 2:
                return hourMoment.format("hh A")
        }
    }
    
    </script>

 

    {#if loading}
        <p>Loading</p>
    {:else} 
    
    <div 
        style:height="{height}px"
        style:width="{width}px"
        class="timeline"
        >

        <div class="hourLineContainer">
        {#each {length: 24} as _, i }
            <div class={hourFormat == 2 ? "hourLine hourLineLarge" : "hourLine"} style:height="{height/24}px" />
        {/each}
        </div>  
    
    
        <div class="hourTextContainer" style:margin-top="-{height/52}px">
        {#each {length: 24} as _, i }
                <span class=hourText
                 on:click={switchHourDisplay}
                 style:height="{height/24}px"
                 style:font-size="{height/50}px" 
                >{getHourText(i,hourFormat)}</span>
        {/each}
        </div>
    
    
    {#if window.moment().isSame(date, 'day')}
        <div class="timeDisplay" style:top="{timeDisplayPosition}px" style:width="{width}px"/>
    {/if}

        {#each eventLocations as location, i}
            <div 
                on:click={(e) => goToEvent(location.event,e)} 
                class="
                    googleCalendarEvent
                    googleCalendarEvent_Calendar_Color_{location.event.parent.colorId}
                    googleCalendarEvent_Event_Color_{location.event.parent.colorId}
                    googleCalendarEvent_Id_{location.event.parent.id}
                    "
                id="{location.event.id}"
                style:top="{location.y}px"
                style:left="{location.x}px"
                style:width="{location.width}px"
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
    {/if}

    <style>
        .googleCalendarEvent{
            display: flex;
            padding:10px;
            padding-top: 0;
            position: absolute;
         
            width:150px;
            left:40px;
            border-radius: 5px;
            color:black;
            font-size: 0.5em;
            box-shadow: 3px 2px 8px 4px rgba(0,0,0,0.36);
            overflow: hidden;
        }
    
        .hourLine::after{
            content: "";
            position: absolute;
            width: 90%;
            left: 25px;
            border-bottom: 1px solid white;
        }
        .hourLineLarge::after{
            width: 80%;
            left: 50px;
        }
    
       .hourText{
        display:block;
        font-family: "consolas";
       }

       .timeline, .hourText, .hourTextContainer{
           overflow: hidden;
       }
              
       .timeDisplay{
           position: absolute;
           height:3px;
           background:red;
           overflow: visible;
    
       }
    
       .timeline{
           position:relative;
           display: flex;
           flex-direction: row;
           overflow: visible;
       
           /*border: 1px solid green;*/
       }
    
    </style>