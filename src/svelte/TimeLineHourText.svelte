<script lang="ts">
    import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

    const plugin = GoogleCalendarPlugin.getInstance();
    let hourFormat = plugin.settings.timelineHourFormat;

    export let height = 700;

    const switchHourDisplay = () => {
        hourFormat += 1;
        if(hourFormat > 2){
            hourFormat = 0;
        }
        plugin.settings.timelineHourFormat = hourFormat;
        plugin.saveSettings();
    }

    const getHourText = (hour:number, hourFormat:number):string => {
        const hourMoment = window.moment(`${hour}:00:00`, "H:mm:ss");

        switch (hourFormat) {
            case 0: return hourMoment.format("HH"); 
            case 1: return hourMoment.format("hh");
            case 2: return hourMoment.format("hh A")
        }
    }
</script>

<div class="gcal-hour-text-container" style:margin-top="-{height/87}px">
    {#each {length: 24} as _, i }
        <span class=gcal-hour-text
        on:click={switchHourDisplay}
        style:height="{height/24}px"
        style:font-size="{height/50}px" 
        >{getHourText(i,hourFormat)}</span>
    {/each}
</div>

<style>
    .gcal-hour-text-container {
        display: flex;
        flex-direction: column;
    }

    .gcal-hour-text {
        font-family: "consolas";
        display: block;
    }
</style>