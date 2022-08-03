<script lang="ts" >

import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import TimeLine from "./TimeLineComp.svelte";
import {ViewEventEntry} from "../modal/ViewEventEntry"
import { moment } from "obsidian";
export let plugin: GoogleCalendarPlugin;

let dateOffset = 0;
const minusOneWeek = () => dateOffset-= 7;
const minusOneDay  = () => dateOffset-= 1;
const backToday    = () => dateOffset = 0;
const plusOneWeek  = () => dateOffset+= 7;
const plusOneDay   = () => dateOffset+= 1;

const openNewEventDialog = (event) => {  

    new ViewEventEntry(plugin, {start:{}, end:{}}, window.moment()).open()
}


$: date =  moment().local().add(dateOffset, "days");

</script>
<div>
    <h3>Google Calendar {date.format("YYYY-MM-DD")}</h3>
    <button on:click={openNewEventDialog}>+</button>
    <button on:click={minusOneWeek}>&larr&larr</button>
    <button on:click={minusOneDay}>&larr</button>
    <button on:click={backToday}>Today</button>
    <button on:click={plusOneDay}>&rarr</button>
    <button on:click={plusOneWeek}>&rarr&rarr</button>
    <TimeLine plugin={plugin} bind:date/>
</div>
