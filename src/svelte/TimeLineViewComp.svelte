<script lang="ts" >

import TimeLine from "./TimeLineComp.svelte";
import {ViewEventEntry} from "../modal/ViewEventEntry"

export let height:number = undefined;
export let width:number = undefined;
export let date:moment.Moment = undefined;
export let navigation:boolean = false;

let dateOffset = 0;
const minusOneWeek = () => dateOffset-= 7;
const minusOneDay  = () => dateOffset-= 1;
const backToday    = () => dateOffset = 0;
const plusOneWeek  = () => dateOffset+= 7;
const plusOneDay   = () => dateOffset+= 1;

const openNewEventDialog = (event) => {  

    new ViewEventEntry({start:{}, end:{}}, window.moment(), () =>{
        date=date;
    }).open()
}

$: date = navigation ? window.moment().local().add(dateOffset, "days") : date;

</script>
<div style="padding-left: 10px;">
    {#if navigation}
    <div class="titleContainer">
        <button on:click={openNewEventDialog}>+</button>
        <h3>Google Calendar {date.format("YYYY-MM-DD")}</h3>
    </div>
    <div class="navigationContainer">
        <button class="fixedSizeButton" on:click={minusOneWeek}>&lt;&lt;</button>
        <button class="fixedSizeButton" on:click={minusOneDay}>&lt;</button>
        <button class="fixedSizeButton" on:click={backToday}>Today</button>
        <button class="fixedSizeButton" on:click={plusOneDay}>&gt;</button>
        <button class="fixedSizeButton" on:click={plusOneWeek}>&gt;&gt;</button>
    </div>
    {/if}
    <TimeLine bind:date height={height} width={width}/>
</div>

<style>

    .fixedSizeButton {
        
        text-align: center;
        padding: 10px 5%;
        margin: 0;
    }

    .titleContainer{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
    }

    .navigationContainer{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
        flex-wrap: wrap;
        padding-bottom: 30px;
    }

</style>
