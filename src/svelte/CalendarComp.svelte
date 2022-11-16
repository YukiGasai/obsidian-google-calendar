<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type { GoogleEvent } from '../helper/types';
    
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { EventListModal } from "../modal/EventListModal";
    import { googleClearCachedEvents, googleListEvents } from "../googleApi/GoogleListEvents";
    import { onDestroy } from "svelte";
    import _ from "lodash"
    import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import { getDailyNotes, getSingleDailyNote } from "../helper/DailyNoteHelper";


    export let displayedMonth = window.moment();
    export let width:number = 0;
    export let height:number = 0;
    export let include;
    export let exclude;

    let dailyNoteList = getDailyNotes();
    let interval;
    let newDayInterval;
    let events: GoogleEvent[];
    let loading: boolean = true;
    let sources:ICalendarSource[];
    let today = window.moment();
    let plugin = GoogleCalendarPlugin.getInstance();

    async function getSource(month:moment.Moment) {

        plugin.settings.dailyNoteDotColor = plugin.settings.dailyNoteDotColor;
        const prevMonthDate = month.clone().startOf("month").subtract(6, "days");
        const nextMonthDate = month.clone().endOf("month").add(12, "days");

        const eventsInMonth = await googleListEvents({
            startDate:prevMonthDate,
            endDate:nextMonthDate,
            include,
            exclude
        });    

        //Dont do anything when events are the same
        if(_.isEqual(eventsInMonth, events) && _.isEqual(dailyNoteList, getDailyNotes())){
            return;
        }
        dailyNoteList = getDailyNotes();
        
        let eventsByDay = _.groupBy(eventsInMonth, event =>
            window.moment(event.start.date ?? event.start.dateTime).startOf('day').format()
        );

        events = eventsInMonth;
        const customTagsSource: ICalendarSource = {
            getDailyMetadata: async (day: moment.Moment): Promise<IDayMetadata> => {

                let dots:IDot[] = [];
                if(plugin.settings.activateDailyNoteAddon){
                    const note = getSingleDailyNote(day);
                    if(note){
                        dots = [{isFilled: true, className: "googleCalendarDailyDot", color: "default"}]
                    }
                }
                const eventsOfTheDay = eventsByDay[day.startOf("day").format()]; 
                if (!eventsOfTheDay){
                    return {
                    dataAttributes: {"amount": dots.length + ""},
                    dots: dots,
                };
                } 
                dots = [
                    ...dots,
                    ...Array(eventsOfTheDay.length).fill(
                        {isFilled: true, className: "googleCalendarDot", color: "default"}
                    )
                ]

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
        interval = setInterval(() => getSource(displayedMonth), 1000)

        if(newDayInterval){
            clearInterval(newDayInterval);
        }
        newDayInterval = setInterval(() => today = window.moment(), 60000)

        getSource(displayedMonth)

    }
    onDestroy(() => {
        clearInterval(interval);
        clearInterval(newDayInterval);
    })

</script>

{#if width==0 || height == 0}
    <div class="calendarContainer">
        {#if loading}
            <p>Loading...</p>
        {:else} 

            <div style="--daily-dot-color: {plugin.settings.dailyNoteDotColor}">
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
        style="--theme-color: {plugin.settings.dailyNoteDotColor}"
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

