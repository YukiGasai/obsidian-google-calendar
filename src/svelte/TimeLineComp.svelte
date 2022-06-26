<script lang="ts" >
    import TreeMap from 'ts-treemap'
    import { DateToPercent } from "../helper/DateToPercent";
    import {getEventStartPosition, getEventHeight} from "../helper/CanvasDrawHelper";
    
    import { googleListEvents, googleListTodayEvents } from "../googleApi/GoogleListEvents";
    import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import type { GoogleEvent } from "../helper/types";
    import {ViewEventEntry} from '../modal/ViewEventEntry'
    import {getColorFromEvent} from '../googleApi/GoogleColors'


    import {moment} from 'obsidian';
    import { onMount } from "svelte";


    
    interface Location {
        event:GoogleEvent;
        x:number;
        y:number;
        width:number;
        height:number;
        fullDay:boolean;
    }

    export let plugin: GoogleCalendarPlugin;
    export let height = 700;
    export let width = 300;
    export let date = 'today';

    let loading = true;
    let timeDisplayPosition = 0;
    let events:GoogleEvent[] = [];
    let eventLocations:Location[] = [];

    onMount(async () => {
        await getEvents()

        const dayPercentage = DateToPercent(new Date());
    
        timeDisplayPosition = Math.floor(height * dayPercentage);
	});

    $: {
        // This log is needed to tell svelte to redraw if date changes
        console.log(date)
        loading = true;
        eventLocations = [];
        getEvents()

        const dayPercentage = DateToPercent(new Date());

        timeDisplayPosition = Math.floor(height * dayPercentage);
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
        console.log(startMap)


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
                                
                const indent = 30 + indentAmount * 10;

                const elementWidth = (width-indent) / events.length;

                eventLocations.push({
                    event: event,
                    x: indent + elementWidth*i,
                    y: getEventStartPosition(event, height),
                    width: elementWidth,
                    height: getEventHeight(event, height),
                    fullDay: event.start.date != undefined
                })      
            })
        }
    }

    const getEvents = async() => {
 
        if(date == 'today'){
            events = await googleListTodayEvents(plugin);
            return;
        }
        
        if(date == 'tomorrow'){
            const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");
            events =  await googleListEvents(plugin, tomorrow);
            return;
        }
        
        let tmpDate = moment(date);
        if(!tmpDate.isValid()){
            tmpDate = moment(date, 'DD.MM.YYYY');
            if(!tmpDate.isValid()){
                tmpDate = moment(date, 'DD-MM-YYYY');
                 if(!tmpDate.isValid()){
                    tmpDate = moment(date, 'DD/MM/YYYY');
                    if(!tmpDate.isValid()){
                        return;
                    }
                }
            }
        }
        const dateString = tmpDate.format("YYYY-MM-DD");
        events = await googleListEvents(plugin, dateString);
        getLocationArray()
        loading = false;
    }

    const goToEvent = (event:GoogleEvent, e:any) => {
        if(e.shiftKey){
            window.open(event.htmlLink);
        }else{
            new ViewEventEntry(plugin, event, moment(date)).open();
        }
    }

    
    </script>

    {#if loading}
        <p>Loading</p>
    {:else} 
    
    <div 
        style:height="{height}px"
        style:width="{width}px"
        class="timeline">

        <div class="hourLineContainer">
        {#each {length: 24} as _, i }
            <div class=hourLine style:height="{height/24}px" />
        {/each}
        </div>  
    
    
        <div class="hourTextContainer" style:margin-top="-{height/52}px">
        {#each {length: 24} as _, i }
                <span class=hourText
                 style:height="{height/24}px"
                 style:font-size="{height/50}px" 
                >{i}</span>
        {/each}
        </div>
    
    
    {#if moment().isSame(date, 'day')}
        <div class="timeDisplay" style:top="{timeDisplayPosition}px" style:width="{width}px"/>
    {/if}


    
        {#each eventLocations as location, i}
            <div 
                on:click={(e) => goToEvent(location.event,e)} 
                class="event" 
                style:top="{location.y}px"
                style:left="{location.x}px"
                style:width="{location.width}px"
                style:height="{location.height}px"
                style:background={getColorFromEvent(location.event)}
            >{location.event.summary}</div>
        {/each}
      

        

    </div>
    {/if}




    <style>
    
        .event{
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
        }
    
        .hourLine::after{
            content: "";
            position: absolute;
            width:250px;
            left:50px;
        
        
            border-bottom: 1px solid white;
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
    
       }
    
    
       .timeline{
           position:relative;
           display: flex;
           flex-direction: row;
           /*border: 1px solid green;*/
       }
    
    
    </style>