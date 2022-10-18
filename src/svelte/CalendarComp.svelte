<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type { GoogleEvent } from '../helper/types';
    
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { EventListModal } from "../modal/EventListModal";
    import { googleClearCachedEvents, googleListEvents } from "../googleApi/GoogleListEvents";
    import { onDestroy } from "svelte";

    export let displayedMonth = window.moment();
    export let width:number = 0;
    export let height:number = 0;
    export let include;
    export let exclude;

    let interval;
    let events: GoogleEvent[];
    let loading: boolean = true;
    let sources:ICalendarSource[];
    
    async function getSource(month:moment.Moment) {

        
        const prevMonthDate = month.clone().subtract(1, "month").startOf("month");
        const nextMonthDate = month.clone().add(1, "month").endOf("month");


        const eventsInMonth = await googleListEvents({
            startDate:prevMonthDate,
            endDate:nextMonthDate,
            include,
            exclude
        });    


        events = eventsInMonth;
        const customTagsSource: ICalendarSource = {
            getDailyMetadata: async (day: moment.Moment): Promise<IDayMetadata> => {
              
                const eventsOfTheDay = getEventsOfDay(eventsInMonth, day);
                const dots:IDot[] = eventsOfTheDay.map(event => {
                    return {isFilled: true, className: "googleCalendarDot", color: "#FFFFFF"}
                })
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

        new EventListModal(getEventsOfDay(events, date), date, false, () => {
            googleClearCachedEvents();
            displayedMonth = displayedMonth
        }).open();
    
    }


    $: {
        if(interval){
            clearInterval(interval);
        }
        interval = setInterval(() => getSource(displayedMonth), 5000)
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
                />
            </div>
        {/if}
    </div>
{/if}

<style>

</style>

