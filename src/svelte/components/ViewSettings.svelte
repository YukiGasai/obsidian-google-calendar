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
    export let webViewUrl = '';
    let calendars = [];
    let plugin = GoogleCalendarPlugin.getInstance();

    onMount(async () => {
        calendars = await googleListCalendars();
        calendars = calendars.map(calendar => calendar.summary)
    })

    let hourRange = codeBlockOptions.hourRange;
    let navigation = codeBlockOptions.navigation;
    let timespan = [codeBlockOptions.timespan];
    let include = codeBlockOptions.include;
    let exclude = codeBlockOptions.exclude;
    let view = codeBlockOptions.view;
    let theme = codeBlockOptions.theme;
    let offset = [codeBlockOptions.offset];
    let showAllDay = codeBlockOptions.showAllDay;
    let size = [codeBlockOptions.size];
    $: {
        codeBlockOptions.hourRange = hourRange;
        codeBlockOptions.navigation = navigation;
        codeBlockOptions.timespan = timespan[0];
        codeBlockOptions.include = include;
        codeBlockOptions.exclude = exclude;
        codeBlockOptions.view = view;
        codeBlockOptions.theme = theme;
        codeBlockOptions.offset = offset[0]
        codeBlockOptions.size = size[0]
        codeBlockOptions.showAllDay = showAllDay;
        
        plugin.settings.viewSettings[codeBlockOptions.type] = {
            ...plugin.settings.viewSettings[codeBlockOptions.type],
            hourRange, navigation, timespan: timespan[0], include, exclude, view, theme, offset: offset[0], showAllDay, size: size[0]
        };
        plugin.saveSettings();
    }
    
    const copyCodeblock = () => {

        const settingsObject: CodeBlockOptions = plugin.settings.viewSettings[codeBlockOptions.type];
        delete settingsObject.width;
        delete settingsObject.height;
        if(settingsObject.type==='day') delete settingsObject.timespan;

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

        {#if ['day', 'week', 'year', 'schedule'].includes(codeBlockOptions.type)}
            <label for="navigation">Navigation</label>
            <div class="setting">
                <Switch bind:checked={navigation} />
            </div>
        {/if}

        {#if ['day', 'week', 'schedule'].includes(codeBlockOptions.type)}
            <label for="allDay">Show All Day</label>
            <div class="setting">
                <Switch bind:checked={showAllDay} />
            </div>
        {/if}

        {#if ['day', 'week', 'schedule'].includes(codeBlockOptions.type)}
            <label for="hourRange">Hour Range</label>
            <div class="setting rangeSettings">
                <RangeSlider pipstep={4} range bind:values={hourRange} min={0} max={24} step={1} all='label' pips float/>
            </div>
        {/if}

        {#if ['week', 'schedule'].includes(codeBlockOptions.type)}
            <label for="timespan">Timespan</label>
            <div class="setting rangeSettings">
                <RangeSlider pipstep={5} bind:values={timespan} min={0} max={15} step={1} all='label' pips float/>
            </div>
        {/if}

        {#if ['day', 'week', 'month', 'year', 'schedule', 'web'].includes(codeBlockOptions.type)}
            <label for="offset">Offset</label>
            <div class="setting rangeSettings">
                <RangeSlider pipstep={5} bind:values={offset} min={-15} max={15} step={1} all='label' pips float/>
            </div>
        {/if}

        {#if ['year'].includes(codeBlockOptions.type)}
        <label for="size">Size</label>
        <div class="setting rangeSettings">
            <RangeSlider pipstep={5} bind:values={size} min={5} max={30} step={1} all='label' pips float/>
        </div>
    {/if}

        {#if include !== undefined && ( exclude?.length === 0  || include?.length > 0) }
            <label for="include">Include</label>
            <div class="setting">
                <MultiSelect bind:selected={include} options={[...calendars, ...allEventColorsNames]} />
            </div>
        {/if}

        {#if exclude !== undefined && (include?.length === 0 || exclude?.length > 0)}
            <label for="exclude">Exclude</label>
            <div class="setting">
                <MultiSelect bind:selected={exclude} options={[...calendars, ...allEventColorsNames]} />
            </div>
        {/if}

        {#if ['web'].includes(codeBlockOptions.type)}
            <label for="defaultView<">Default view</label>
            <select name="view" bind:value={view}>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="agenda">Agenda</option>
            </select>
        {/if}
        {#if ['web'].includes(codeBlockOptions.type)}
            <label for="ColorTheme">Color theme</label>
            <select name="theme" bind:value={theme}>
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        {/if}
        {#if ['web'].includes(codeBlockOptions.type)}
        <button on:click={() => webViewUrl = `https://accounts.google.com`}>Open Login</button>
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
