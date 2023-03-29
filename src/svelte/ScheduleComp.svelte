<script lang="ts">
    import type { GoogleEvent } from "../helper/types";
    
    import { googleClearCachedEvents, listEvents } from "../googleApi/GoogleListEvents";
    import { getColorFromEvent } from "../googleApi/GoogleColors";
    import { EventDetailsModal } from "../modal/EventDetailsModal";
    import { EventListModal } from "../modal/EventListModal";
    import { onDestroy } from "svelte";
	import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    
    
    export let timeSpan = 6;
    export let date = window.moment();
    export let include;
    export let exclude;
    
    let interval;
    let days: Map<string, GoogleEvent[]> = new Map();
    let loading = false;
    let events = [];
    let plugin = GoogleCalendarPlugin.getInstance();
    let hourFormat = plugin.settings.timelineHourFormat;


    const getEvents = async () => {
        hourFormat = plugin.settings.timelineHourFormat;
        const newEvents = await listEvents({
            startDate:date,
            endDate:date.clone().add(timeSpan, "day"),
            include,
            exclude
        });

        //only reload if events change
        if(JSON.stringify(newEvents) == JSON.stringify(events)){
            return;
        }
        days.clear();
        events = newEvents;
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

    const getDateText = ( date:moment.Moment, hourFormat: number):string => {
        switch (hourFormat) {
            case 0:
                return date.format("H:mm"); 
            case 1:
                return date.format("HH:mm"); 
            case 2:
                return date.format("h:mm");
            case 3:
                return date.format("hh:mm");   
            case 4:
                return date.format("h:mm A")
            case 5:
                return date.format("hh:mm A")
        }
    }

    const getDateString = (event: GoogleEvent, hourFormat: number):string => {
        if(event.start.date){
            return "All day";
        }else{
            const start = getDateText(window.moment(event.start.dateTime), hourFormat)
            const end = getDateText(window.moment(event.end.dateTime), hourFormat)
            return `${start}-${end}`
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
        const events = await listEvents({startDate:clickedDate});
        new EventListModal(events,'details', clickedDate, false, () => {
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

    onDestroy(() => {
        clearInterval(interval);
    })
    
    const switchHourDisplay = () => {
        hourFormat += 1;
        if(hourFormat > 5){
            hourFormat = 0;
        }
        plugin.settings.timelineHourFormat = hourFormat;
        plugin.saveSettings();
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
                        <span class="dayText" on:click={switchHourDisplay}>{key.slice(2)}</span>
                    </div>
                 

                    <div class="dayEvents">
                        {#each events as event}
                        <div class="dayEvent" on:click="{(e) => goToEvent(event,e)}">
                            <div class="circleTime">
                                    <div class="{event.recurringEventId ? "recurringCircleContainer" : "circleContainer"}">
                                        <div  class="circle" style:background="{getColorFromEvent(event)}"></div>
                                    </div>
                                    <div class="timeContainer">
                                        <span>{getDateString(event,hourFormat)}</span>
                                    </div>
                            </div>
                            <div class="eventTitleContainer">
                                <span>{event.summary}</span>
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
    .scheduleContainer {
		padding: 10px;
	}

	.scheduleContent {
		display: flex;
		flex-direction: column;
        align-items: flex-start;
		white-space: nowrap;
	}

	.dayContainer {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
        justify-content: flex-start;
		border-bottom: 1px solid white;
		margin: 2px 0px;
		padding: 2px 0px;
        flex-wrap: wrap;
	}

	.dateDisplay {
		display: flex;
		flex-direction: row;
		align-items: flex-end;
		width: 105px;
		min-width: 105px;
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

	.today {
		color: white;
		background: #4285f4;
		text-decoration: none;
	}

	.dayText {
		font-size: 15px;
	}

	.dayEvents {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.dayEvent {
		display: flex;
		flex: 1;
		flex-direction: row;
		align-items: center;
		padding: 5px;
		border-radius: 10px;
		cursor: pointer;
        flex-wrap: wrap;
	}

	.dayEvent:hover {
		background-color: rgba(128, 128, 128, 0.129);
	}

    .circleTime{
        display: flex;
        flex-direction: row;
        width: 220px;
		min-width: 220px;
    }

	.recurringCircleContainer,
	.circleContainer {
		position: relative;
		display: flex;
		width: 30px;
		min-width: 30px;
		height: 30px;
		align-items: center;
		justify-content: center;
	}

	.recurringCircleContainer::after {
		content: "↺";
		position: absolute;
		width: 30px;
		height: 30px;
		text-align: center;
		line-height: 30px;
		font-size: 30px;
		color: rgb(164, 164, 164);
		white-space: nowrap;
	}

	.circle {
		width: 10px;
		min-width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.timeContainer {
		width: 150px;
		min-width: 150px;
	}

	.eventTitleContainer {
		white-space: nowrap;
	}
    
    </style>