<script lang="ts">
    import type GoogleCalendarPlugin from '../GoogleCalendarPlugin';
    import type { GoogleEvent, ICalendarSource, IDayMetadata, IDot } from '../helper/types';
    import { onMount } from 'svelte';
    import {
    	Calendar as CalendarBase
    } from "obsidian-calendar-ui";
    import {
    	googleListEvents
    } from "../googleApi/GoogleListEvents";

 

    export let date:string = window.moment().format();
    export let width:number = 400;
    export let height:number = 400;
    export let plugin:GoogleCalendarPlugin;

    let events:GoogleEvent[] = [];
    let loading: boolean = true;
    let sources;
    let momentDate;

    async function getEventsInMonth(date:moment.Moment):Promise<GoogleEvent[]>{
        let start = date.startOf("month").format("YYYY-MM-DD");
        let end   = date.endOf("month").format("YYYY-MM-DD");

  

        const googleList = await googleListEvents(plugin, start, end);

        return googleList;
    }


    onMount(async () => {
        momentDate = window.moment(date)
        events = await getEventsInMonth(momentDate);

        loading = false;
        
	});
  


    const getEventsOfDay = (date: moment.Moment):GoogleEvent[] => {
        return events.filter(event => {
            if(event.start.date){
                return window.moment(event.start.date).isSame(date, 'day');
            }else{
                return window.moment(event.start.dateTime).isSame(date, 'day');
            }    
        })
    }


    const onClickDay = (date: moment.Moment, isMenu:boolean) => {
        const eventsOfTheDay = getEventsOfDay(date);
   


        getEventsInMonth(momentDate).then(events => {
            const customTagsSource: ICalendarSource = {
                getDailyMetadata: async (_date: moment.Moment): Promise<IDayMetadata> => {
                    const eventsOfTheDay = getEventsOfDay(_date);
                    const dots:IDot[] = eventsOfTheDay.map(event => {
                        return {isFilled: true}
                    })
                    return {
                        dataAttributes: {"amount": eventsOfTheDay.length + ""},
                        dots: dots,
                    };
                }
            }
            sources = customTagsSource
            console.log(sources);
        })
 

  
    }

    $: {
        console.log(momentDate)
        getEventsInMonth(momentDate).then(events => {
            const customTagsSource: ICalendarSource = {
                getDailyMetadata: async (date: moment.Moment): Promise<IDayMetadata> => {
                    const eventsOfTheDay = getEventsOfDay(date);
                    const dots:IDot[] = eventsOfTheDay.map(event => {
                        return {isFilled: true}
                    })
                    return {
                        dataAttributes: {"amount": eventsOfTheDay.length + ""},
                        dots: dots,
                    };
                }
            }

            sources = [customTagsSource]
            console.log(events);
        })
    }

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
            bind:sources={sources}
            bind:displayedMonth={momentDate}
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

