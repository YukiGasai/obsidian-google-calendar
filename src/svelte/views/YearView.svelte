<script lang="ts">
	import { listEvents } from "../../googleApi/GoogleListEvents";
	import type { CodeBlockOptions, GoogleEvent } from "../../helper/types";
	import { EventListModal } from "../../modal/EventListModal";
    import { quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import ViewSettings from "../components/ViewSettings.svelte";

    export let codeBlockOptions: CodeBlockOptions;
    export let isObsidianView = false;
    export let showSettings = false;

    let startDate:moment.Moment = codeBlockOptions.date ? window.moment(codeBlockOptions.date) : window.moment();
    let dateOffset = 0;
    let date;
    let loading = false;
    let events:GoogleEvent[] = [];
    let dayEventMap = new Map<string, GoogleEvent[]>();
    let maxEvents = 0;

    const [send, receive] = crossfade({
		duration: d => Math.sqrt(d * 200),

		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});


    const getEvents = async(date:moment.Moment) => {
        
        if(!date?.isValid()){
            loading = false;
            return;
        }
    
        const newEvents = await listEvents({
            startDate: date.clone().startOf("year"),
            endDate: date.clone().endOf("year"),
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

        fillDayEventMapWithDays(date);

        await getEvents(date)

        fillDayEventMapWithEvents(events);

        dayEventMap = dayEventMap;
        maxEvents = Array.from(dayEventMap.values()).reduce((max, arr) => Math.max(max, arr.length), 0);
        loading = false;
    } 

    $: {
        startDate = codeBlockOptions.date 
        ? window.moment(codeBlockOptions.date).add(codeBlockOptions.offset, "years") 
        : window.moment().add(codeBlockOptions.offset, "years");
        date = codeBlockOptions.navigation ? startDate.clone().local().add(dateOffset, "years") : startDate;

    
        //ONLY GET  EVENTS ONCE
        refreshData(date);
    }

    const fillDayEventMapWithDays = (year) => {
        dayEventMap.clear();
        const start = window.moment(year).startOf('year');
        const end = window.moment(year).endOf('year');
        
        while(start.isSameOrBefore(end)){
            dayEventMap.set(start.format("YYYY-MM-DD"), []);
            start.add(1, "days");
        }
    }

    const fillDayEventMapWithEvents = (events:GoogleEvent[]) => {
        events.forEach(event => {
            const start = window.moment(event.start.dateTime || event.start.date);
            const day = start.format("YYYY-MM-DD");
            if(dayEventMap.has(day)){
                dayEventMap.get(day).push(event);
            }else {
                dayEventMap.set(day, [event]);
            }
        })
    };


function getColor(num) {
    const min = 0;
    const max = maxEvents;
    if(num == 0) return "rgb(22, 27, 34)";
    if(num == max) return "rgb(57, 211, 83)";
    const percent = (num - min) / (max - min);
    const colors = [
        { percent: 0,    color: { r: 22, g: 27, b: 34 } },
        { percent: 0.25, color: { r: 14, g: 68, b: 41 } },
        { percent: 0.5,  color: { r: 0, g: 109, b: 50 } },
        { percent: 0.75, color: { r: 38, g: 166, b: 65 } },
        { percent: 1,    color: { r: 57, g: 211, b: 83 } },
    ];

    let lowerColorIndex = null;
    let upperColorIndex = null;
    
    for (let i = colors.length - 1; i >= 0; i--) {
        if (percent >= colors[i].percent) {
        lowerColorIndex = i;
        break;
        }
        upperColorIndex = i;
    }

    if (lowerColorIndex === null) {
        lowerColorIndex = upperColorIndex;
    }

    const lowerColor = colors[lowerColorIndex].color;
    const upperColor = colors[upperColorIndex].color;

    const range = colors[lowerColorIndex].percent - colors[upperColorIndex].percent;
    
    const fractionBetweenColors = (percent - colors[upperColorIndex].percent) / range;

    const r = Math.floor(lowerColor.r * (1 - fractionBetweenColors) + upperColor.r * fractionBetweenColors);
    const g = Math.floor(lowerColor.g * (1 - fractionBetweenColors) + upperColor.g * fractionBetweenColors);
    const b = Math.floor(lowerColor.b * (1 - fractionBetweenColors) + upperColor.b * fractionBetweenColors);
    return `rgb(${r}, ${g}, ${b})`;
}

const openDayModal = (day) => {
    new EventListModal(dayEventMap.get(day),"details", window.moment(day), false, () => {}).open(); 
}

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isFirstDayOfMonth(date) {
  const day = date.split('-')[2];
  return day === '01';
}

</script>
<div style:overflow="scroll visible">
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}
    {#if codeBlockOptions.navigation}
        <div class="yearNav">
            <button class="yearNavButton" on:click={() => dateOffset--}>&lt;</button>
            <button class="yearNavButton" on:click={() => dateOffset=0}>START</button>
            <button class="yearNavButton" on:click={() => dateOffset++}>&gt;</button>
        </div>
    {/if}
    <div class="yearContainer">
 
        <div class="monthLabelContainer">
            <span class="monthLabel" style:font-size="{codeBlockOptions.size}px">{window.moment(date).year()}</span>
            {#each months as month, i}
                <span class="monthLabel" style:font-size="{codeBlockOptions.size}px">{month}</span>
            {/each}
            <!-- End Item for alignment -->
            <span class="monthLabel" style:font-size="{codeBlockOptions.size}px" />
        </div>
        <div class="dayContainer" title="{dayEventMap.size.toString()}">
            <div />
            <span class="weekDayName" style:font-size="{codeBlockOptions.size}px">MON</span>
            <span class="weekDayName" style:font-size="{codeBlockOptions.size}px">WED</span>
            <span class="weekDayName" style:font-size="{codeBlockOptions.size}px">FRI</span>
            {#each [...dayEventMap] as [day, events], i (i)}
                {#if i == 0 && window.moment(day).day() != 0}
                    {#each Array.from({length: 7 - window.moment(day).day()}) as _, i}
                        <div 
                        style:width="{codeBlockOptions.size}px"
                        style:height="{codeBlockOptions.size}px"
                        class="square" />
                    {/each}
                {/if}
                <div 
                in:receive="{{key: i}}"
                out:send="{{key: i}}"
                on:click={() => openDayModal(day)} 
                on:keypress={() => openDayModal(day)}
                class={isFirstDayOfMonth(day) ? "square fistDayOfMonth" : "square"}
                title="{day}" 
                style:background-color="{getColor(events.length.toString())}"
                style:width="{codeBlockOptions.size}px"
                style:height="{codeBlockOptions.size}px"
                />
            {/each}
        </div> 
    </div>
</div> 
<style>
    .yearNav{
        margin-bottom: 10px;
    }
    .yearContainer{
        overflow-x: scroll;
        width: fit-content;
    }

    .monthLabelContainer{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .dayContainer{
        display: grid;
        grid-template-rows: repeat(7, minmax(0, 1fr));
        gap: 2px 2px;
        grid-auto-flow: column dense;
        overflow-x: scroll;
        cursor: pointer;
    }

    .square{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        min-height: 0;
        display: inline-block;
        border-radius: 2px;
    }

    .square:hover {
        filter: drop-shadow(0 0 5px #00e1ff);
    }

    .fistDayOfMonth{
        outline: 2px solid #ff000080;
    }

    .weekDayName{
        display: flex;
        grid-row: span 2;
        line-height: 1;
        justify-self: flex-end;
    }
</style>