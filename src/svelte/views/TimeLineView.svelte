<script lang="ts">
	// Week view replaces the day view when the timespan is set to 1

	import TimeLine from '../components/TimeLine.svelte';
	import TimeLineHourText from '../components/TimeLineHourText.svelte';
	import type { CodeBlockOptions, GoogleEvent } from '../../helper/types';
	import ViewSettings from '../components/ViewSettings.svelte';
	import DayNavigation from '../components/DayNavigation.svelte';
	import { onDestroy } from 'svelte';
	import {
		googleClearCachedEvents,
		listEvents,
	} from '../../googleApi/GoogleListEvents';
	import { EventDetailsModal } from '../../modal/EventDetailsModal';
	import AllDayContainer from '../components/AllDayContainer.svelte';
	import GoogleCalendarPlugin from '../../GoogleCalendarPlugin';
	import { VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS } from '../../view/EventDetailsView';

	export let codeBlockOptions: CodeBlockOptions;
	export let isObsidianView = false;
	export let showSettings = false;

	let startDate: moment.Moment = codeBlockOptions.date
		? window.moment(codeBlockOptions.date)
		: window.moment();
	let dateOffset = 0;
	let date;
	let loading = false;
	let events: GoogleEvent[] = [];
	let interval;
	let plugin = GoogleCalendarPlugin.getInstance();

	const getEvents = async (date: moment.Moment) => {
		if (!date?.isValid()) {
			loading = false;
			return;
		}

		const newEvents = await listEvents({
			startDate: date,
			endDate: date.clone().add(codeBlockOptions.timespan, 'days'),
			include: codeBlockOptions.include,
			exclude: codeBlockOptions.exclude,
		});

		if (JSON.stringify(newEvents) != JSON.stringify(events)) {
			events = newEvents;
		}
	};

	const refreshData = async (date: moment.Moment) => {
		if (loading) return;
		loading = true;
		await getEvents(date);
		loading = false;
	};

	const goToEvent = (event: GoogleEvent, e: any) => {
		if (e?.shiftKey) {
			plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS, event, () => {
				googleClearCachedEvents();
				refreshData(date);
			})
		} else {
			new EventDetailsModal(event, () => {
				googleClearCachedEvents();
				refreshData(date);
			}).open();
		}
	};

	$: {
		startDate = codeBlockOptions.date
			? window
					.moment(codeBlockOptions.date)
					.add(codeBlockOptions.offset, 'days')
			: window.moment().add(codeBlockOptions.offset, 'days');
		date = codeBlockOptions.navigation
			? startDate.clone().local().add(dateOffset, 'days')
			: startDate;

		if (interval) clearInterval(interval);
		interval = setInterval(() => refreshData(date), 5000);
		refreshData(date);
	}

	const getDatesToDisplay = (date) => {
		let datesToDisplay = [];

		for (let i = 0; i < codeBlockOptions.timespan; i++) {
			datesToDisplay = [...datesToDisplay, date.clone().add(i, 'days')];
		}

		return datesToDisplay;
	};

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

{#if isObsidianView}
	<ViewSettings bind:codeBlockOptions bind:showSettings />
{/if}
<div style="padding-left: 10px;">
	{#if codeBlockOptions.navigation && date}
		<DayNavigation bind:dateOffset bind:date bind:startDate />
	{/if}

	<div
		class="gcal-week-container"
		style:grid-template-columns="auto repeat({codeBlockOptions.timespan},
		minmax(0, 1fr))"
	>
		{#if codeBlockOptions.timespan > 1}
			<div class="gcal-stop-overflow" />
			{#each getDatesToDisplay(date) as day, i}
				<div class="gcal-day-container">
					<span class="gcal-dayofweek">{day.format('ddd')}</span>
					<span class="gcal-day">{day.format('D')}</span>
				</div>
			{/each}
		{:else}
			<!-- Required if no header elements are displayed -->
			<div class="gcal-stop-overflow" />
			<div class="gcal-stop-overflow" />
		{/if}

		{#if codeBlockOptions.showAllDay}
			<div class="gcal-stop-overflow" />
			{#each getDatesToDisplay(date) as day, i}
				<div class="gcal-stop-overflow">
					<AllDayContainer
						{goToEvent}
						events={events.filter(
							(e) =>
								e.start.date && window.moment(e.start.date).isSame(day, 'day')
						)}
					/>
				</div>
			{/each}
		{/if}
		<div class="gcal-stop-overflow">
			<TimeLineHourText hourRange={codeBlockOptions.hourRange} />
		</div>
		{#each getDatesToDisplay(date) as day, i}
			<div class="gcal-stop-overflow">
				<TimeLine
					events={events.filter(
						(e) =>
							e.start.dateTime &&
							window.moment(e.start.dateTime).isSame(day, 'day')
					)}
					{day}
					hourRange={codeBlockOptions.hourRange}
					{goToEvent}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.gcal-stop-overflow {
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	.gcal-week-container {
		position: relative;
		display: inline-grid;
		gap: 16px;
		grid-auto-flow: row;
		overflow: hidden;
	}

	.gcal-week-container > * {
		min-width: 0px;
		min-height: 0px;
	}

	.gcal-day-container {
		width: 100%;
		display: grid;
		justify-content: center;
		align-items: center;
	}

	.gcal-day,
	.gcal-dayofweek {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: medium;
	}

	.gcal-day {
		font-weight: 700;
		font-size: x-large;
	}
</style>
