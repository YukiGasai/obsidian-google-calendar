<script lang="ts">
    import MultiSelect from 'svelte-multiselect'
    import type { CodeBlockOptions } from "../helper/types";
	import { googleListCalendars } from '../googleApi/GoogleListCalendars';
	import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
	import GoogleCalendarPlugin from '../GoogleCalendarPlugin';
	import { stringifyYaml } from 'obsidian';
	import { allEventColorsNames } from '../googleApi/GoogleColors';

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

    $: {
        codeBlockOptions.hourRange = hourRange;
        codeBlockOptions.navigation = navigation;
        codeBlockOptions.timespan = timespan;
        codeBlockOptions.include = include;
        codeBlockOptions.exclude = exclude;
        codeBlockOptions.view = view;
        codeBlockOptions.theme = theme;
        
        plugin.settings.viewSettings[codeBlockOptions.type] = {
            ...plugin.settings.viewSettings[codeBlockOptions.type],
            hourRange, navigation, timespan, include, exclude, view, theme
        };
        plugin.saveSettings();
    }
    
    const copyCodeblock = () => {
        const yaml = stringifyYaml(plugin.settings.viewSettings[codeBlockOptions.type]);
        const codeBlock = `\`\`\`gEvent\n${yaml}\n\`\`\``;
        navigator.clipboard.writeText(codeBlock)
    }

</script>
<div class={showSettings ? "settingsContainerOpen" : ""}>
    
    {#if showSettings}
    <div class="settingsWrapper" transition:slide|local>

            <label for="hourRange">Copy to Codeblock</label>
            <div class="setting">
                <button class="copyButton" on:click={copyCodeblock}>&#128203;</button>
            </div>


        {#if hourRange !== undefined}
                <label for="hourRange">Hour Range</label>
                <div class="setting">
                    <input type="number" name="hourRangeMin" min=0 max={hourRange[0]}  bind:value={hourRange[0]}>
                    <input type="number" name="hourRangeMax" min={hourRange[0]} max=24 bind:value={hourRange[1]}>
                </div>
        {/if}

        {#if navigation !== undefined}
                <label for="navigation">Navigation</label>
                <div class="setting">
                    <input type="checkbox" name="navigation" bind:checked={navigation}>
                </div>
        {/if}

        {#if timespan !== undefined}
                <label for="navigation">Timespan</label>
                <div class="setting">
                    <input type="number" name="timespan" bind:value={timespan} min=1>
                </div>
        {/if}

        {#if include !== undefined && calendars.length > 0}
                <label for="navigation">Include</label>
                <div class="setting">
                    <MultiSelect bind:selected={include} options={[...calendars, ...allEventColorsNames]} />
                </div>
        {/if}

        {#if exclude !== undefined && calendars.length > 0}
                <label for="navigation">Exclude</label>
                <div class="setting">
                    <MultiSelect bind:selected={exclude} options={[...calendars, ...allEventColorsNames]} />
                </div>
        {/if}

        {#if view !== undefined}
            <label for="navigation">Default view</label>
            <select name="view" bind:value={view}>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="agenda">Agenda</option>
            </select>
        {/if}
        {#if theme !== undefined}
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

    .setting {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 5px;
    }

    .setting input[type="number"] {
        width: 50px;
    }

    .copyButton{
        filter: saturate(0)
    }

</style>
