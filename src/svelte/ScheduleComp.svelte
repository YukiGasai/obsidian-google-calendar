<script lang="ts">
    import type { CodeBlockOptions, GoogleEvent } from "../helper/types";
    
    import { googleClearCachedEvents, listEvents } from "../googleApi/GoogleListEvents";
    import { getColorFromEvent } from "../googleApi/GoogleColors";
    import { EventDetailsModal } from "../modal/EventDetailsModal";
    import { EventListModal } from "../modal/EventListModal";
    import { onDestroy } from "svelte";
	import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
	import ViewSettings from "./ViewSettings.svelte";
    

    export let codeBlockOptions: CodeBlockOptions;
    export let isObsidianView = false;
    export let showSettings = false;

    let date = codeBlockOptions.date ? window.moment(codeBlockOptions.date) : window.moment();
    
    let interval;
    let days: Map<string, GoogleEvent[]> = new Map();
    let loading = false;
    let events = [];
    let plugin = GoogleCalendarPlugin.getInstance();
    let hourFormat = plugin.settings.timelineHourFormat;
    let containerWidth;

    const getEvents = async () => {
        hourFormat = plugin.settings.timelineHourFormat;
        const newEvents = await listEvents({
            startDate:date,
            endDate:date.clone().add(codeBlockOptions.timespan - 1, "day"),
            include: codeBlockOptions.include,
            exclude: codeBlockOptions.exclude
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
        codeBlockOptions = codeBlockOptions
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
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}
    <div class ="gcal-schedule-container" bind:clientWidth={containerWidth}>
        {#if loading}
            <span>LOADING</span>
        {:else}
            {#each [...days] as [key, events]}
                <div class={containerWidth < 550 ? "gcal-schedule-day-container breakLine" : "gcal-schedule-day-container"}>
                    <div class="gcal-schedule-date-display">
                        <div 
                        on:click="{()=>goToDaySelect(events[0])}"
                        class="{checkForSameDate(events[0]) ? "gcal-schedule-day-circle today" : "gcal-schedule-day-circle"}"
                        style="display: flex; flex-direction: column;"
                        >
                            <span class="gcal-schedule-month-text">{key.slice(3,6)}</span>
                            <span class="gcal-schedule-day-number">{key.slice(0,2)}</span>
                        </div>
                        <span class="gcal-schedule-day-text" on:click={switchHourDisplay}>{key.slice(7)}</span>
                    </div>
                 

                    <div class="gcal-schedule-event-container">
                        {#each events as event}
                        <div class={containerWidth < 200 ? "gcal-schedule-event breakLine" : "gcal-schedule-event"} on:click="{(e) => goToEvent(event,e)}">
                            <div class="gcal-schedule-event-info">
                                    <div class="{event.recurringEventId ? "gcal-schedule-circle-container-recurring" : "gcal-schedule-circle-container"}">
                                        <div class="gcal-schedule-event-circle" style:background="{getColorFromEvent(event)}"></div>
                                    </div>
                                    <div class="gcal-schedule-time-container">
                                        <span>{getDateString(event,hourFormat)}</span>
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

	.gcal-schedule-day-container {
		display: flex;
        flex-direction: row;
		align-items: flex-start;
		border-bottom: 1px solid gray;
		margin: 2px 0px;
		padding: 2px 0px;
        width: 100%
	}

	.gcal-schedule-date-display {
		display: flex;
		flex-direction: row;
		align-items: center;
        gap: 5px;
        flex: 0 0 100px;
        padding: 0px;
	}

	.gcal-schedule-day-circle {
		border-radius: 50%;
		-moz-border-radius: 50%;
		-webkit-border-radius: 50%;
		display: inline-block;
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
        overflow: hidden;
        width: 100%;
	}
 
	.gcal-schedule-event {
		display: flex;
		padding: 5px;
		border-radius: 10px;
		cursor: pointer;
	}

	.gcal-schedule-event:hover {
		background-color: rgba(128, 128, 128, 0.129);
	}

    .gcal-schedule-event-info{
        display: flex;
        align-items: center;
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
        min-width: 150px;
        padding-right: 1em;
	}

	.gcal-schedule-event-title-container {
        display: flex;
        align-items: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
	}

    .gcal-schedule-event-title {
        font-size: medium;
        font-weight: 400;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .breakLine {
        flex-direction: column;
        margin-bottom:10px;
    }
    
    </style>