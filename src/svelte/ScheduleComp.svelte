<script lang="ts">
    import type { GoogleEvent } from "../helper/types";
    
    import { googleClearCachedEvents, googleListEvents } from "../googleApi/GoogleListEvents";
    import { getColorFromEvent } from "../googleApi/GoogleColors";
    import { EventDetailsModal } from "../modal/EventDetailsModal";
    import { EventListModal } from "../modal/EventListModal";
    
    
    export let timeSpan = 4;
    export let date = window.moment();
    let interval;
    let days: Map<string, GoogleEvent[]> = new Map();
    let loading = false;

    const getEvents = async () => {
        days.clear();
        loading = true;
        const events = await googleListEvents(date, date.clone().add(timeSpan, "day"));

        events.forEach(event => {
            const key = event.start.date ? 
                window.moment(event.start.date).format("DD MMM, ddd") :
                window.moment(event.start.dateTime).format("DD MMM, ddd")
        
            if(days.has(key)){
                days.get(key).push(event);
            }else{
                days.set(key, [event]);
            }
        })

        loading = false;
    }

    const getDateString = (event: GoogleEvent):string => {
        if(event.start.date){
            return "All day";
        }else{
            const start = window.moment(event.start.dateTime).format("hh:mma"); 
            const end = window.moment(event.end.dateTime).format("hh:mma"); 
            return `${start} - ${end}`
        }
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

    const goToDaySelect = async (event:GoogleEvent) => {
        const clickedDate = window.moment(event.start.date || event.start.dateTime);
        const events = await googleListEvents(clickedDate);
        new EventListModal(events, clickedDate, false, () => {
            googleClearCachedEvents();
            date = date;
        }).open();
    }

    const checkForSameDate = (event:GoogleEvent): boolean => {
        const clickedDate = window.moment(event.start.date || event.start.dateTime);
        return window.moment().local().isSame(clickedDate,"day");
    }

    $: {
        //needed to update if the prop date changes i dont know why
        date = date;
        if(interval){
            clearInterval(interval);
        }
        loading = true;
        interval = setInterval(getEvents, 5000);
        getEvents();
    }
    
    
    </script>
    <div class ="scheduleContainer">
        {#if loading}
            <span>LOADING</span>
        {:else}
            <div class="scheduleContent">
            {#each [...days] as [key, events]}
                <div class="dayContainer">
                    <div class="dateDisplay">
                        <div 
                        on:click="{()=>goToDaySelect(events[0])}"
                        class="{checkForSameDate(events[0]) ? "dayNumber today" : "dayNumber"}"
                        >
                            <span>{key.slice(0,2)}</span>
                        </div>
                        <span class="dayText">{key.slice(2)}</span>
                    </div>
                 
                    <div class="dayEvents">
                        {#each events as event}
                            <div class="dayEvent" on:click="{(e) => goToEvent(event,e)}">
                                <div class="{event.recurringEventId ? "recurringCircle" : "circle"}" style:background="{getColorFromEvent(event)}"></div>
                                <div class="timeContainer">
                                    {getDateString(event)}
                                </div>
                                <div class="eventTitleContainer">
                                    {event.summary}
                                </div>
                             
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
            </div>
        {/if}
    </div>
    
    <style>
    
        .scheduleContainer{
            padding: 10px;
        }

        .scheduleContent{
            display: flex;
            flex-direction: column;
            white-space: nowrap;
        }
    
        .dayContainer{
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            border-bottom: 1px solid white;
            margin: 2px 0px;
            padding: 2px 0px;
        }
        
        .dateDisplay{
            display: flex;
            flex-direction: row;
            align-items: flex-end;
            width: 130px;      
            min-width: 130px;         
        }
        .dayNumber {
            border-radius: 50%;
            -moz-border-radius: 50%;
            -webkit-border-radius: 50%;
            display: inline-block;
            font-weight: bold;
            line-height: 40px;
            text-align: center;
            width: 40px;
            min-width: 40px;
            cursor: pointer;
        }

        .today{
            color: white;
            background: #4285f4;
            text-decoration:none;
        }
    
        .dayText{
            font-size: 15px;
        }

        .dayEvents{
            display: flex;
            flex-direction: column;
            flex: 1;
        }
    
        .dayEvent{
            display: flex;
            flex: 1;
            flex-direction: row;
            align-items: center;
            padding: 5px;
            border-radius: 10px;
            cursor: pointer;
        }

        .dayEvent:hover{
            background-color: rgba(128, 128, 128, 0.129);
        }
    
        .circle{
            width: 10px;
            min-width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 10px;
        }

        .recurringCircle{
            position: relative;
            width: 10px;
            min-width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 10px;
        }

        .recurringCircle::after{
            content: "↺";
            position: absolute;
            width: 30px;
            height: 30px;
            left:-100%;
            line-height: 30px;
            font-size: 30px;
            top:-11px;
            color:white;
        }
    
        .timeContainer{
            width: 215px;
            min-width: 215px;
        }

        .eventTitleContainer{
            white-space: nowrap;
        }
    
    </style>