<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type GoogleCalendarPlugin from '../GoogleCalendarPlugin';
    import type { GoogleEvent } from '../helper/types';
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { EventListModal } from "../modal/EventListModal";
    import { googleListEventsByMonth } from "../googleApi/GoogleListEvents";

    export let displayedMonth = window.moment();
    export let width:number = 400;
    export let height:number = 400;
    export let plugin:GoogleCalendarPlugin;

    let interval;
    let events: GoogleEvent[];
    let loading: boolean = true;
    let sources:ICalendarSource[];
    
    async function getSource(month:moment.Moment) {
          const eventsInMonth = await googleListEventsByMonth(plugin, month);    
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
        new EventListModal(plugin, getEventsOfDay(events, date)).open();
    }


    $: {
        if(interval){
            clearInterval(interval);
        }
        interval = setInterval(() => getSource(displayedMonth), plugin.settings.refreshInterval * 1000)
        getSource(displayedMonth)

    }

</script>


<div 
    class="calendarContainer" 
    style:width="{width}px" 
    style:height="{height}px">
    
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


<style>

</style>

