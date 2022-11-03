<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type { GoogleEvent } from '../helper/types';
    
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { EventListModal } from "../modal/EventListModal";
    import { googleClearCachedEvents, googleListEvents } from "../googleApi/GoogleListEvents";
    import { onDestroy } from "svelte";
    import _ from "lodash"


    export let displayedMonth = window.moment();
    export let width:number = 0;
    export let height:number = 0;
    export let include;
    export let exclude;

    let interval;
    let events: GoogleEvent[];
    let loading: boolean = true;
    let sources:ICalendarSource[];
    let today = window.moment();
    
    async function getSource(month:moment.Moment) {

        today = window.moment();
        
        const prevMonthDate = month.clone().startOf("month").subtract(6, "days");
        const nextMonthDate = month.clone().endOf("month").add(12, "days");

        const eventsInMonth = await googleListEvents({
            startDate:prevMonthDate,
            endDate:nextMonthDate,
            include,
            exclude
        });    

        //Dont do anything when events are the same
        if(_.isEqual(eventsInMonth, events)){
            return;
        }

        
        let eventsByDay = _.groupBy(eventsInMonth, event =>
            window.moment(event.start.date ?? event.start.dateTime).startOf('day').format()
        );

        events = eventsInMonth;
        const customTagsSource: ICalendarSource = {
            getDailyMetadata: async (day: moment.Moment): Promise<IDayMetadata> => {
            
                const eventsOfTheDay = eventsByDay[day.startOf("day").format()]; 
                if (!eventsOfTheDay){
                    return {
                    dataAttributes: {"amount": "0"},
                    dots: [],
                };
                } 
                const dots:IDot[] = Array(eventsOfTheDay.length).fill(
                    {isFilled: true, className: "googleCalendarDot", color: "#FFFFFF"}
                );

                return {
                    dataAttributes: {"amount": eventsOfTheDay.length + ""},
                    dots: dots,
                };
            }
        }
        loading = false;
        sources = null
        sources = [customTagsSource]
    }


    const getEventsOfDay = (eventList: GoogleEvent[], date: moment.Moment):GoogleEvent[] => {
        return eventList.filter(event => {
            if(event.start.date){
                return window.moment(event.start.date).isSame(date, 'day');
            }else{
                return window.moment(event.start.dateTime).isSame(date, 'day');
            }    
        })
    }


    const onClickDay = (date: moment.Moment, isMenu:boolean) => {

        new EventListModal(getEventsOfDay(events, date),"details", date, false, () => {
            googleClearCachedEvents();
            displayedMonth = displayedMonth
        }).open();
    
    }


    $: {
        if(interval){
            clearInterval(interval);
        }
        interval = setInterval(() => getSource(displayedMonth), 10000)
        getSource(displayedMonth)

    }
    onDestroy(() => {
        clearInterval(interval);
    })

</script>

{#if width==0 || height == 0}
    <div class="calendarContainer" >
        {#if loading}
            <p>Loading...</p>
        {:else} 

            <div>
                <CalendarBase
                    showWeekNums={false}
                    {onClickDay}
                    bind:sources
                    bind:displayedMonth
                    bind:today
                />
            </div>
        {/if}
    </div>
{:else}
    <div 
        class="calendarContainer" 
        style:width="{width}px" 
        style:height="{height}px"
        >
        {#if loading}
            <p>Loading...</p>
        {:else} 
    
            <div>
                <CalendarBase
                    showWeekNums={false}
                    {onClickDay}
                    bind:sources
                    bind:displayedMonth
                    bind:today
                />
            </div>
        {/if}
    </div>
{/if}

<style>

</style>

