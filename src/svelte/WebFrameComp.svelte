<script lang="ts">

export let date   = window.moment();
export let width  = 0;
export let height = 0;
let frame;
let webUrl:string = ""

//If date is not valid default to toady
if(!date.isValid()){
    webUrl = "https://calendar.google.com/calendar/u/0/r/day/"

}else{
    const dateString = date.format("yyyy/M/D");
    webUrl = `https://calendar.google.com/calendar/u/0/r/day/${dateString}`;
}

const domReady = () => {
  frame.insertCSS(`
    html body div div div div {
        margin-left: -256px;
    }
  `);
}

</script>

<div class="box">
    <div class="content">
    {#if width == 0}
    <webview 
        src={webUrl}
        allowpopups
        dom-ready="{domReady}"
        class="fullSize"
        bind:this={frame}
    />
    {:else}
    <webview 
        src={webUrl}
        allowpopups
        dom-ready="{domReady}"
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