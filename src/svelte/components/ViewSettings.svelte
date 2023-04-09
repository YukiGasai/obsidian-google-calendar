<script lang="ts">
    import MultiSelect from 'svelte-multiselect';
    import Switch from "./Switch.svelte";
    import RangeSlider from 'svelte-range-slider-pips/src';
    import type { CodeBlockOptions } from "../../helper/types";
	import { googleListCalendars } from '../../googleApi/GoogleListCalendars';
	import { onMount } from 'svelte';
	import GoogleCalendarPlugin from '../../GoogleCalendarPlugin';
	import { stringifyYaml } from 'obsidian';
	import { allEventColorsNames } from '../../googleApi/GoogleColors';

    export let codeBlockOptions: CodeBlockOptions;
    export let showSettings = false;
    let calendars = [];
    let plugin = GoogleCalendarPlugin.getInstance();

    onMount(async () => {
        calendars = await googleListCalendars();
        calendars = calendars.map(calendar => calendar.summary)
    })

    let hourRange = codeBlockOptions.hourRange;
    let navigation = codeBlockOptions.navigation;
    let timespan = codeBlockOptions.timespan;
    let include = codeBlockOptions.include;
    let exclude = codeBlockOptions.exclude;
    let view = codeBlockOptions.view;
    let theme = codeBlockOptions.theme;
    let dayOffset = codeBlockOptions.dayOffset;
    let showAllDay = codeBlockOptions.showAllDay;
    $: {
        codeBlockOptions.hourRange = hourRange;
        codeBlockOptions.navigation = navigation;
        codeBlockOptions.timespan = timespan;
        codeBlockOptions.include = include;
        codeBlockOptions.exclude = exclude;
        codeBlockOptions.view = view;
        codeBlockOptions.theme = theme;
        codeBlockOptions.dayOffset = dayOffset
        codeBlockOptions.showAllDay = showAllDay;
        
        plugin.settings.viewSettings[codeBlockOptions.type] = {
            ...plugin.settings.viewSettings[codeBlockOptions.type],
            hourRange, navigation, timespan, include, exclude, view, theme, dayOffset, showAllDay
        };
        plugin.saveSettings();
    }
    
    const copyCodeblock = () => {
        const yaml = stringifyYaml(plugin.settings.viewSettings[codeBlockOptions.type]);
        const codeBlock = `\`\`\`gEvent\n${yaml}\n\`\`\``;
        navigator.clipboard.writeText(codeBlock)
    }
    const closeSettings = () => {
        showSettings = false;
    }


</script>
<div class={showSettings ? "settingsContainerOpen" : ""}>
    
    {#if showSettings}
    <div class="settingsWrapper">
        
        <label for="hourRange">Copy to Codeblock</label>
        <div class="setting">
            <button class="copyButton" on:click={copyCodeblock}>&#128203;</button>
            <button on:click={closeSettings}>x</button>
        </div>

        {#if ['day', 'week'].includes(codeBlockOptions.type)}
                <label for="navigation">Navigation</label>
                <div class="setting">
                    <Switch bind:checked={navigation} />
                </div>
        {/if}

        {#if ['day', 'week'].includes(codeBlockOptions.type)}
            <label for="navigation">Show All Day</label>
            <div class="setting">
                <Switch bind:checked={showAllDay} />
            </div>
        {/if}

        {#if ['day', 'week'].includes(codeBlockOptions.type)}
                <label for="hourRange">Hour Range</label>
                <div class="setting rangeSettings">
                    <RangeSlider pipstep={4} range bind:values={hourRange} min={0} max={24} step={1} all='label' pips float/>
                </div>
        {/if}

        {#if ['week', 'schedule'].includes(codeBlockOptions.type)}
                <label for="navigation">Timespan</label>
                <div class="setting rangeSettings">
                    <RangeSlider pipstep={5} bind:values={timespan} min={0} max={15} step={1} all='label' pips float/>
                </div>
        {/if}

        {#if ['day', 'week', 'schedule'].includes(codeBlockOptions.type)}
            <label for="navigation">DayOffset</label>
            <div class="setting rangeSettings">
                <RangeSlider pipstep={5} bind:values={dayOffset} min={-15} max={15} step={1} all='label' pips float/>
            </div>
        {/if}

        {#if include !== undefined && ( exclude?.length === 0  || include?.length > 0) }
                <label for="navigation">Include</label>
                <div class="setting">
                    <MultiSelect bind:selected={include} options={[...calendars, ...allEventColorsNames]} />
                </div>
        {/if}

        {#if exclude !== undefined && (include?.length === 0 || exclude?.length > 0)}
                <label for="navigation">Exclude</label>
                <div class="setting">
                    <MultiSelect bind:selected={exclude} options={[...calendars, ...allEventColorsNames]} />
                </div>
        {/if}

        {#if ['web'].includes(codeBlockOptions.type)}
            <label for="navigation">Default view</label>
            <select name="view" bind:value={view}>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="agenda">Agenda</option>
            </select>
        {/if}
        {#if ['web'].includes(codeBlockOptions.type)}
            <label for="navigation">Color theme</label>
            <select name="theme" bind:value={theme}>
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        {/if}
    </div>
    {/if}
</div>
<style>
    .settingsContainerOpen{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 5px;
        border-radius: 10px;
        padding: 10px;
        width: auto;
        margin-bottom: 10px;
        box-shadow: -5px 5px 3px 3px #161616;
    }

    .settingsWrapper{
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr auto;
    }
    
    label {
        display: flex;
        align-items: center;
        height: 30px;
        min-width: 80px;
    }

    .rangeSettings {
        width: 300px;
    }

    .setting {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 5px;
    }

    .copyButton{
        filter: saturate(0)
    }


</style>
