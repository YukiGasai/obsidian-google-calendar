<script lang="ts">

export let date   = window.moment();
export let width  = 400;
export let height = 400;

let webUrl:string = ""

//If date is not valid default to toady
if(!date.isValid()){
    webUrl = "https://calendar.google.com/calendar/u/0/r/day/"

}else{
    const dateString = date.format("yyyy/M/D");
    webUrl = `https://calendar.google.com/calendar/u/0/r/day/${dateString}`;
}

const domReady = () => {

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
    />
    {:else}
    <webview 
        src={webUrl}
        allowpopups
        dom-ready="{domReady}"
        style:width="{width}px"
        style:height="{height}px"
    />
    {/if}
    </div>
</div>


<style>
    .box {
        position: relative;
        width:    100%;
    }

    .box:before {
        content:     "";
        display:     block;
        padding-top: 100%;
    }

    .content {
        position: absolute;
        top:      0;
        left:     0;
        bottom:   0;
        right:    0;
    }

    .fullSize{
        width:100%;
        height: 100%;
        overflow: scoll !important;
    }
</style>