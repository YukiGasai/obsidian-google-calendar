<script lang="ts">
    import type GoogleCalendarPlugin from '../GoogleCalendarPlugin';
    import {
    	Calendar as CalendarBase
    } from "obsidian-calendar-ui";

    import {
    	googleListEvents
    } from "../googleApi/GoogleListEvents";

    import type { GoogleEvent, ICalendarSource, IDayMetadata, IDot } from '../helper/types';
    import { onMount } from 'svelte';



    export let date:string = window.moment().format();
    export let width:number = 400;
    export let height:number = 400;
    export let plugin:GoogleCalendarPlugin;
    
    let events:GoogleEvent[] = [];
    let loading: boolean = true;



    async function getEventsInMonth(date:string):Promise<GoogleEvent[]>{
        let now = window.moment().startOf("month");
        let end = window.moment().endOf("month");

        let allEvents:GoogleEvent[] = []
        console.log(now.format("YYYY-MM-DD"));
        while (now.isSameOrBefore(end)) {

            const tmpEvents = await googleListEvents(plugin, now.format("YYYY-MM-DD"));
            allEvents = [...allEvents, ...tmpEvents]
        
            now.add(1, 'days');
        }
        
        return allEvents;
    }


    onMount(async () => {
        events = await getEventsInMonth(date);

        loading = false;
	});
  


    const isSameDay = (event:GoogleEvent, date: moment.Moment) => {
            if(!event.start)return false;

            const eventDate = event.start.dateTime ? window.moment(event.start.dateTime) : window.moment(event.start.date)

            if(event.recurrence && event.recurrence[0].contains("RRULE:FREQ=WEEKLY")){
        
                return (eventDate.day() == date.day())
            }else{
                return eventDate.isSame(date, 'day');
            }
    }


    const onClickDay = (date: moment.Moment, isMenu:boolean) => {
        const tmpEvents = events.filter(event => isSameDay(event, date));
        console.log(tmpEvents);
    }


    const customTagsSource: ICalendarSource = {
        getDailyMetadata: async (date: moment.Moment): Promise<IDayMetadata> => {
            const tmpEvents = events.filter(event => isSameDay(event, date));
            const dots:IDot[] = tmpEvents.map(event => {
                return {isFilled: true}
            })
            return {
                dataAttributes: {"amount": tmpEvents.length + ""},
                dots: dots,
            };
        }
    }


    const sources = [customTagsSource]


</script>


<div 
    class="calendarContainer" 
    style:width="{width}px" 
    style:height="{height}px">
    
    {#if loading}
        <p>Loading...</p>
    {:else} 
        <CalendarBase
            showWeekNums={false}
            onClickDay={onClickDay}
            sources={sources}
        />
    {/if}
</div>


<style>
    .calendarContainer{
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>

