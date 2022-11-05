<script lang="ts">
	import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
	import { onMount } from "svelte";
	import { getCurrentTheme } from "../helper/Helper";

const plugin = GoogleCalendarPlugin.getInstance();

export let date   = window.moment();
export let width  = 0;
export let height = 0;
export let theme  = plugin.settings.webViewDefaultColorMode;
let frame;
let webUrl:string = ""

//If date is not valid default to toady
if(!date.isValid()){
    webUrl = "https://calendar.google.com/calendar/u/0/r/day/"

}else{
    const dateString = date.format("yyyy/M/D");
    webUrl = `https://calendar.google.com/calendar/u/0/r/day/${dateString}`;
}

onMount(() => {
    if(theme == "auto") {
        theme =  getCurrentTheme();
    }

    if(theme == "dark"){
        frame.addEventListener("dom-ready", () => {
            frame.insertCSS(`
                html {
                    filter: hue-rotate(180deg)invert(100)contrast(93%) !important;
                }
            
            `);
        });
    }
})

</script>

<div class="box">
    <div class="content">
    {#if width == 0}
    <webview 
        src={webUrl}
        allowpopups
        class="fullSize"
        bind:this={frame}
    />
    {:else}
    <webview 
        src={webUrl}
        allowpopups
        style:width="{width}px"
        style:height="{height}px"
        bind:this={frame}
    />
    {/if}
    </div>
</div>


<style>
    .fullSize,
    .content,
    .box{
        width:100%;
        height: 100%;
        overflow: scoll !important;
    }
</style>