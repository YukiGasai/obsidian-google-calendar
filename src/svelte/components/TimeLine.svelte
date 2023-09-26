<script lang="ts">
	import timerStore from '../extra/timerStore';
	import type { GoogleEvent, Location } from '../../helper/types';
	import TreeMap from 'ts-treemap';
	import {
		dateToPercent,
		getStartHeightOfHour,
		getEndHeightOfHour,
		getStartFromEventHeight,
		nearestMinutes,
	} from '../../helper/Helper';
	import { getEventStartPosition, getEventHeight } from '../../helper/Helper';
	import GoogleCalendarPlugin from '../../GoogleCalendarPlugin';
	import EventBox from './EventBox.svelte';

	export let height = 700;
	export let width = 300;
	export let events: GoogleEvent[];
	export let day;
	export let hourRange;
	export let goToEvent;
	let locations: Location[] = [];
	let realWidth = 0;

	const getRedTimeLinePosition = (time) => {
		const dayPercentage = dateToPercent(time);
		return Math.floor(height * dayPercentage);
	};

	const plugin = GoogleCalendarPlugin.getInstance();
	let hourFormat = plugin.settings.timelineHourFormat;
	const currentTime = timerStore();

	const getLocationArray = (events) => {
		let eventLocations: Location[] = [];
		const startMap = new TreeMap<string, GoogleEvent[]>();
		events.forEach((event) => {
			const start = event.start.date || event.start.dateTime;
			if (startMap.has(start)) {
				startMap.get(start).push(event);
			} else {
				startMap.set(start, [event]);
			}
		});

		let indentAmount = 0;
		let latestEndDate = null;

		for (let events of startMap.values()) {
			if (events[0].start.dateTime) {
				const startDate = window.moment(events[0].start.dateTime);

				if (latestEndDate && startDate.isBefore(latestEndDate, 'minutes')) {
					indentAmount++;
				} else {
					indentAmount = 0;
				}

				latestEndDate = window.moment(events[0].end.dateTime);
			}
			events.forEach((event, i) => {
				const indent = indentAmount * 5;

				const elementWidth = (100 - indent) / events.length;
				eventLocations = [
					...eventLocations,
					{
						event: event,
						x: indent + elementWidth * i,
						y: getEventStartPosition(event, height),
						width: elementWidth,
						height: getEventHeight(event, height),
						fullDay: event.start.date != undefined,
					},
				];
			});
		}
		return eventLocations;
	};

	let openCreateEventDialog = (e:MouseEvent) => {
		let y = e.clientY - timeline.getBoundingClientRect().top;
		const {start, end} = getStartFromEventHeight(height, y, y + 10, new Date(day));
		const startMoment = nearestMinutes(15, window.moment(start)); 
		const newEvent:GoogleEvent = {
			start: {
				dateTime: startMoment.format()
			},
			end: {
				dateTime: startMoment.clone().add(1, "hour").format()
			},
		}
		goToEvent(newEvent, e)
	}

	let timeline: HTMLDivElement;
	$: if (events) {
		locations = getLocationArray(events);
		if(timeline){
		timeline.parentElement.style.overflow = "hidden"
		}
	}
</script>

<div
	style:height="{height}px"
	style:width="{width}px"
	style:max-width="100%"
	style:margin=" -{getStartHeightOfHour(height, hourRange[0])}px 0px -{getEndHeightOfHour(
		height,
		hourRange[1]
	)}px 0px"
	class="gcal-timeline"
	bind:clientWidth={realWidth}
	bind:this={timeline}
	on:dblclick={openCreateEventDialog}
>
	<div class="gcal-timeline-container">
		<div class="gcal-hour-line-container">
			{#each { length: 24 } as _, i}
				<div
					class={hourFormat > 3
						? 'gcal-hour-line gcal-hour-line-large'
						: 'gcal-hour-line'}
					style:height="{height / 24}px"
				/>
			{/each}
		</div>
	</div>

	{#if window.moment().isSame(day, 'day')}
		<div
			class="gcal-time-display"
			style:top="{getRedTimeLinePosition($currentTime)}px"
		/>
	{/if}

	{#each locations as location, i (i)}

	<EventBox 
		location={location}
		goToEvent={goToEvent}
		timelineHeight={height}
		timelineWidth={realWidth}
	/>


	{/each}
</div>

<style>

	.gcal-timeline-container {
		display: flex;
		gap: 5px;
	}

	.gcal-hour-line::after {
		content: '';
		position: absolute;
		width: 100%;
		border-bottom: 1px solid grey;
	}

	.gcal-time-display {
		position: absolute;
		width: 95%;
		height: 3px;
		background: red;
		overflow: visible;
		z-index: 2;
	}

	.gcal-timeline {
		position: relative;
		display: flex;
		flex-direction: row;
		padding-top: 5px;
		flex-shrink: 1000;
		min-height: 0;
	}
</style>
