<script lang="ts">
	import { getColorFromEvent } from "../../googleApi/GoogleColors";
	import type { GoogleEvent } from "../../helper/types";

    export let events: GoogleEvent[];
    export let goToEvent;
    export let width = 0;

</script>

<div class="eventContainer">
    {#each events as event}
        <div         class="
            googleCalendarEvent
            googleCalendarEvent_Calendar_Color_{event.parent.colorId}
            googleCalendarEvent_Event_Color_{event.parent.colorId}
            googleCalendarEvent_Id_{event.parent.id}
            googleCalendarEvent_AllDay
            "
        id="{event.id}"
        style:background={getColorFromEvent(event)}
        style:width={width > 0 ? width + 'px' : '100%'}
        on:click={(e) => goToEvent(event,e)} 
        on:keypress={(e) => goToEvent(event,e)}
    >
    <span class="
        googleCalendarName
        googleCalendarName_Calendar_Color_{event.parent.colorId}
        googleCalendarName_Event_Color_{event.parent.colorId}
        googleCalendarName_Id_{event.parent.id}
        googleCalendarName_AllDay
        ">{event.summary}</span>
</div>
    {/each}
</div>


<style>

    .googleCalendarEvent{
        display: flex;
        padding: 0 10px 10px;
        cursor: pointer;
        border-radius: 5px;
        color: black;
        font-size: small;
        box-shadow: 3px 2px 8px 4px rgba(0,0,0,0.36);
        overflow: hidden;
    }

    .eventContainer{
        grid-row: 1 ;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .googleCalendarEvent_AllDay{
        border-radius: 5px;
        width: 100%;
        height: 23px;
    }
</style>