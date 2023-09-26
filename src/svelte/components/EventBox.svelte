<script lang="ts">
	import { getStartFromEventHeight, nearestMinutes, obsidianLinkToAnchor } from "../../helper/Helper";
	import { getColorFromEvent } from "../../googleApi/GoogleColors";
    import type { MouseControlData, Location, GoogleEvent } from "../../helper/types";
    import MouseControll from "./MouseControll.svelte";
	import { updateEvent } from "../../googleApi/GoogleUpdateEvent";
	import { googleClearCachedEvents } from "../../googleApi/GoogleListEvents";

    export let location: Location;
	export let goToEvent;
    export let timelineHeight: number
    export let timelineWidth: number
    let realWidth = 0;
    const updateEventWithPosition = async (drag: MouseControlData) => {
		const top = drag.endState.top;
		const bottom = top + drag.endState.height;
		let {start, end} = getStartFromEventHeight(timelineHeight, top, bottom, new Date(location.event.start.dateTime));
    
        location.event.start.dateTime = nearestMinutes(15, window.moment(start)).add(drag.endState.horizontal, "day").format();
        location.event.end.dateTime = nearestMinutes(15, window.moment(end)).add(drag.endState.horizontal, "day").format();

        const updatedEvent = await updateEvent(location.event, false)
        location.event = updatedEvent;
		googleClearCachedEvents();
	} 


    let onDrag = (data: MouseControlData) => {
        console.log("onDrag", data)
        updateEventWithPosition(data)
    };

    let onDragClick = (data: MouseControlData) => {
        goToEvent(location.event, data.e);
    };
    
    let onDragLongClick = (data: MouseControlData) => {
        console.log("onDragLongClick", data);
    };

    let getEventClassList = (width): string => {
        const baseList = [
            "googleCalendarEvent", 
            `googleCalendarEvent_Calendar_Color_${location.event.parent.colorId}`,
            `googleCalendarEvent_Event_Color_${location.event.parent.colorId}`,
            `googleCalendarEvent_Id_${location.event.parent.id}`
        ]
        if(width < 60) {
            baseList.push("textSmall")
        }
        if(window.moment(location.event.end.date ?? location.event.end.dateTime).isSameOrBefore(window.moment())) {
            baseList.push("googleCalendarEvent_Past")
        }
        return baseList.join(" ");
    }

</script>
<div
class="{getEventClassList(realWidth)}"
id={location.event.id}
style:top="{location.y}px"
style:left="calc({location.x}% + {location.x / 100} * 16px)"
style:width="{location.width}%"
style:height="{location.height}px"
style:background={getColorFromEvent(location.event)}
bind:clientWidth={realWidth}
>
<span
    class="
googleCalendarName
googleCalendarName_Calendar_Color_{location.event.parent.colorId}
googleCalendarName_Event_Color_{location.event.parent.colorId}
googleCalendarName_Id_{location.event.parent.id}
">{@html obsidianLinkToAnchor(location.event.summary)}</span>
<MouseControll 
        bind:left={location.x}
        bind:top={location.y}
        bind:height={location.height}
        bind:width={location.width}
        onDrag={onDrag}
        onDragClick={onDragClick}
        onDragLongClick={onDragLongClick}
        timelineWidth={timelineWidth}
/>
</div>
<style>
    .googleCalendarEvent {
		display: flex;
		padding: 0 10px 10px;
		position: absolute;
		cursor: pointer;
		width: 150px;
		border-radius: 5px;
		color: black;
		font-size: small;
		box-shadow: 3px 2px 8px 4px rgba(0, 0, 0, 0.36);
		overflow: hidden;
		user-select: none;
        z-index: 1;
	}
    
    .googleCalendarEvent_Past {
        opacity: 0.5;
    }

    .textSmall {
        padding: 0;
    }

	.googleCalendarName {
		pointer-events: none;
        max-width: 100%;
        word-break: break-word;
        hyphens: auto;
        z-index: 1;
	}

    .hourText {
		overflow: hidden;
	}
</style>