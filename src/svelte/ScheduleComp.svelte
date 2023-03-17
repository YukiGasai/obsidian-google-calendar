<script lang="ts">
    import type { GoogleEvent } from "../helper/types";
    
    import { googleClearCachedEvents, googleListEvents } from "../googleApi/GoogleListEvents";
    import { getColorFromEvent } from "../googleApi/GoogleColors";
    import { EventDetailsModal } from "../modal/EventDetailsModal";
    import { EventListModal } from "../modal/EventListModal";
    import { onDestroy } from "svelte";
    
    
    export let timeSpan = 6;
    export let date = window.moment();
    export let include;
    export let exclude;
    
    let interval;
    let days: Map<string, GoogleEvent[]> = new Map();
    let loading = false;
    let events = [];

    const getEvents = async () => {
        const newEvents = await googleListEvents({
            startDate:date,
            endDate:date.clone().add(timeSpan, "day"),
            include,
            exclude
        });

        //only reload if events change
        if(JSON.stringify(newEvents) == JSON.stringify(events)){
            loading = false;
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

    const getDateString = (event: GoogleEvent):string => {
        if(event.start.date){
            return "All day";
        }else{
            const start = window.moment(event.start.dateTime).format("hh:mma"); 
            const end = window.moment(event.end.dateTime).format("hh:mma"); 
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
        const events = await googleListEvents({startDate:clickedDate});
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
    
    
    </script>
    <div class ="gcal-schedule-container">
        {#if loading}
            <span>LOADING</span>
        {:else}
            {#each [...days] as [key, events]}
                <div class="gcal-schedule-day-container">
                    <div class="gcal-schedule-date-display">
                        <div 
                        on:click="{()=>goToDaySelect(events[0])}"
                        class="{checkForSameDate(events[0]) ? "gcal-schedule-day-circle today" : "gcal-schedule-day-circle"}"
                        style="display: flex; flex-direction: column;"
                        >
                            <span class="gcal-schedule-month-text">{key.slice(3,6)}</span>
                            <span class="gcal-schedule-day-number">{key.slice(0,2)}</span>
                        </div>
                        <span class="gcal-schedule-day-text">{key.slice(7)}</span>
                    </div>
                 

                    <div class="gcal-schedule-event-container">
                        {#each events as event}
                        <div class="gcal-schedule-event" on:click="{(e) => goToEvent(event,e)}">
                            <div class="gcal-schedule-event-info">
                                    <div class="{event.recurringEventId ? "gcal-schedule-circle-container-recurring" : "gcal-schedule-circle-container"}">
                                        <div class="gcal-schedule-event-circle" style:background="{getColorFromEvent(event)}"></div>
                                    </div>
                                    <div class="gcal-schedule-time-container">
                                        <span>{getDateString(event)}</span>
                                    </div>
                            </div>
                            <div class="gcal-schedule-event-title-container">
                                <span class="gcal-schedule-event-title">{event.summary}</span>
                            </div>
                             
                        </div>
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
    
    <style>
    .gcal-schedule-container {
		display: flex;
		flex-direction: column;
        align-items: flex-start;
		white-space: nowrap;
	}

	.gcal-schedule-day-container {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
        justify-content: flex-start;
		border-bottom: 1px solid gray;
		margin: 2px 0px;
		padding: 2px 0px;
        flex-wrap: wrap;
	}

	.gcal-schedule-date-display {
		display: flex;
		flex-direction: row;
		align-items: center;
		min-width: 105px;
        gap: 5px;
        flex-grow: 1;
        /* background-color: rgba(128, 128, 128, 0.129); */
	}

	.gcal-schedule-day-circle {
		border-radius: 50%;
		-moz-border-radius: 50%;
		-webkit-border-radius: 50%;
		display: inline-block;
		/* font-weight: bold;
		line-height: 40px;
		text-align: center; */
        border: solid 1px gray;
        min-height: 40px;
		min-width: 40px;
        width: 50px;
        height: 50px;
		cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
	}

	.today {
		color: white;
		background: #4285f4;
		text-decoration: none;
	}

    .gcal-schedule-month-text {
        font-size: small;
    }

    .gcal-schedule-day-number {
        font-size: large;
        font-weight: 700;
    }

	.gcal-schedule-day-text {
		font-size: medium;
	}

	.gcal-schedule-event-container {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.gcal-schedule-event {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 5px;
		border-radius: 10px;
		cursor: pointer;
        flex-wrap: wrap;
	}

	.gcal-schedule-event:hover {
		background-color: rgba(128, 128, 128, 0.129);
	}

    .gcal-schedule-event-info{
        display: flex;
		min-width: 220px;
        align-items: center;
        flex-grow: 1;
    }

	.gcal-schedule-circle-container-recurring,
	.gcal-schedule-circle-container {
		position: relative;
		display: flex;
		min-width: 30px;
		height: 30px;
		align-items: center;
		justify-content: center;
	}

	.gcal-schedule-circle-container-recurring::after {
		content: "↺";
		position: absolute;
		width: 30px;
		height: 30px;
		text-align: center;
		line-height: 30px;
		font-size: 30px;
		color: rgb(164, 164, 164);
        top: 1.5px;
		white-space: nowrap;
	}

	.gcal-schedule-event-circle {
		width: 10px;
		min-width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.gcal-schedule-time-container {
		width: 150px;
		min-width: 150px;
	}

	.gcal-schedule-event-title-container {
		white-space: nowrap;
	}

    .gcal-schedule-event-title {
        font-size: medium;
        font-weight: 400;
    }
    
    </style>