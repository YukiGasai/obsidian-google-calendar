<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type GoogleCalendarPlugin from '../GoogleCalendarPlugin';
    import type { GoogleEvent } from '../helper/types';
    import { onMount } from 'svelte';
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { googleListEvents } from "../googleApi/GoogleListEvents";
    import { ViewEventEntry } from "../modal/ViewEventEntry";
    import { getColorFromEvent } from "../googleApi/GoogleColors";

    export let displayedMonth = window.moment();
    export let width:number = 400;
    export let height:number = 400;
    export let plugin:GoogleCalendarPlugin;
    let interval;
    let events: GoogleEvent[];
    let loading: boolean = true;
    let sources:ICalendarSource[];

    let popUpSelectedDate: moment.Moment
    
    async function getEventsInMonth(month: moment.Moment):Promise<GoogleEvent[]>{
 
        let start = month.startOf("month").format("YYYY-MM-DD");
        let end   = month.endOf("month").format("YYYY-MM-DD");
        const googleList = await googleListEvents(plugin, start, end);
        events = googleList;
        return googleList;   
    }

    async function getSource(month:moment.Moment) {
          const veranstaltung = await getEventsInMonth(month);    
          const customTagsSource: ICalendarSource = {
            getDailyMetadata: async (day: moment.Moment): Promise<IDayMetadata> => {
              
                const eventsOfTheDay = getEventsOfDay(veranstaltung, day);
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
 
        popUpSelectedDate = date      
    
    }

    const onHoverDay = (date: moment.Moment, container: HTMLElement) => {
       
    }

    const closePopup = (e: MouseEvent)=>{
        
        if(e.target instanceof HTMLDivElement){
            popUpSelectedDate = null;
        }
    }

    const getEventTime = (event: GoogleEvent):string => {
        if (event.start.date){
            return "All day"
        }else {
            return window.moment(event.start.dateTime).format("HH:mm")
        }
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
   
    <div class={popUpSelectedDate&&"blured"}>
        <CalendarBase
           
            showWeekNums={false}
            {onClickDay}
            {onHoverDay}
            bind:sources
            bind:displayedMonth
        />
    </div>
    {/if}

    {#if popUpSelectedDate}
        <div class="popUpContainer" on:click={closePopup}>
            <span class="popUpTitle">{(window.moment(popUpSelectedDate).calendar().split(" at"))[0]}</span>
         
            {#each getEventsOfDay(events,popUpSelectedDate) as event}
                <div class="popUpEventContainer" on:click={() => new ViewEventEntry(plugin,event, popUpSelectedDate).open()}>
                    <span class="EventTime">{getEventTime(event)}</span>
                    <span class="EventTitle" style:color={getColorFromEvent(event)}>{event.summary}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>


<style>
    .blured{
        filter: blur(5px);
    }



    .popUpContainer {
	    position: absolute;
        top: 0;
        left: 0;
	    display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
	    padding: 10px;
	    width: 80%;
        height: 80%;
	    background-color: rgba(16, 16, 16, 0.2);
        box-shadow: 3px 2px 8px 4px rgba(0,0,0,0.36);
        border-radius: 10px;
  
    }
.popUpEventContainer{
    display: flex;
    flex-direction: row;
    cursor: pointer;

    padding: 5px 0px

}

.popUpTitle{
    align-self: center;
    justify-self: center;
    border-bottom: 2px solid white;
    margin-bottom: 5px;
}

.EventTime {
    text-align: center;
    width:100px;
    min-width: 100px;
}

</style>

