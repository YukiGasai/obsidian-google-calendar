<script lang="ts" >

    import TimeLine from "./TimeLineComp.svelte";
    import TimeLineHourText from "./TimeLineHourText.svelte";
	import type { CodeBlockOptions, GoogleEvent } from "../helper/types";
	import ViewSettings from "./ViewSettings.svelte";
	import DayNavigation from "./DayNavigation.svelte";
	import { onDestroy } from "svelte";
	import { googleClearCachedEvents, listEvents } from "../googleApi/GoogleListEvents";
	import { EventDetailsModal } from "../modal/EventDetailsModal";
	import AllDayContainer from "./AllDayContainer.svelte";
    

    export let codeBlockOptions: CodeBlockOptions;
    export let isObsidianView = false;
    export let showSettings = false;

    let startDate:moment.Moment = codeBlockOptions.date ? window.moment(codeBlockOptions.date) : window.moment();
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
            endDate: date.clone().add(codeBlockOptions.timespan, "days"),
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
    const getDatesToDisplay = (date) => {
        let datesToDisplay = [];

        for (let i = 0; i < codeBlockOptions.timespan; i++) {
            datesToDisplay = [...datesToDisplay, date.clone().add(i, "days")];
        }

        return datesToDisplay;
    }

    onDestroy(() => {
        clearInterval(interval);
    })

    </script>
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}
    <div style="padding-left: 10px;">
        {#if codeBlockOptions.navigation && date}
            <DayNavigation bind:dateOffset bind:date bind:startDate />
        {/if}


        <div 
            class="gcal-week-container"
            style:grid-template-columns="auto repeat({codeBlockOptions.timespan}, minmax(0, 1fr))"
        >
            <div class="gcal-stop-overflow" />
            {#each getDatesToDisplay(date) as day, i}
                <div class="gcal-day-container">
                    <span class="gcal-dayofweek">{day.format('ddd')}</span>
                    <span class="gcal-day">{day.format('D')}</span>
                </div>
            {/each}


            {#if codeBlockOptions.showAllDay}
                <div class="gcal-stop-overflow" />
                {#each getDatesToDisplay(date) as day, i}
                    <div class="gcal-stop-overflow">
                        <AllDayContainer 
                            {goToEvent}
                            events={events.filter(e => e.start.date && window.moment(e.start.date).isSame(day, "day"))}
                        />
                    </div>
                {/each}
            {/if}
            <div class="gcal-stop-overflow">
                <TimeLineHourText hourRange={codeBlockOptions.hourRange} />
            </div>
            {#each getDatesToDisplay(date) as day, i}
                <div class="gcal-stop-overflow">
                    <TimeLine 
                        events={events.filter(e => e.start.dateTime && window.moment(e.start.dateTime).isSame(day, "day"))}
                        bind:date 
                        hourRange={codeBlockOptions.hourRange} 
                        {goToEvent}
                    /> 
                </div>
            {/each}
        </div>
    </div>
    
<style>
    .gcal-stop-overflow {
        overflow: hidden;
        min-width: 0;
        min-height: 0;
    }

    .gcal-week-container {
        position: relative;
        display: grid;
        gap: 1em;
        grid-auto-flow: row;
        overflow: hidden;
        
    }

    .gcal-week-container > * {
        min-width: 0px;
        min-height: 0px;
    }

    .gcal-day-container {
        width: 100%;
        display: grid;
        justify-content: center;
        align-items: center;
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
