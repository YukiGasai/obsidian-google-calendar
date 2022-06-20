<script lang="ts" >

import {moment} from "obsidian";

import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import TimeLine from "./TimeLineComp.svelte";
import {ViewEventEntry} from "../modal/ViewEventEntry"
import type { GoogleEvent } from "../helper/types";


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


$: currentDate =  moment().add(dateOffset, "days").format("YYYY-MM-DD");

</script>
<div>
    <h3>Google Calendar {currentDate}</h3>
    <button on:click={openNewEventDialog}>+</button>
    <button on:click={minusOneWeek}>&larr&larr</button>
    <button on:click={minusOneDay}>&larr</button>
    <button on:click={backToday}>Today</button>
    <button on:click={plusOneDay}>&rarr</button>
    <button on:click={plusOneWeek}>&rarr&rarr</button>
    <TimeLine plugin={plugin} date={currentDate} />
</div>
