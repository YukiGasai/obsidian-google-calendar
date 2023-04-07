<script lang="ts">
import ViewSettings from "./ViewSettings.svelte";
import { getCurrentTheme } from "../helper/Helper";
import type { CodeBlockOptions } from "../helper/types";

export let codeBlockOptions: CodeBlockOptions;
export let isObsidianView = false;
export let showSettings = false;
let container;
let date = codeBlockOptions.date ? window.moment(codeBlockOptions.date) : window.moment();
if(!codeBlockOptions.height) codeBlockOptions.height = 500;

let frame;

const getWebUrl = (view) => {
    if(!date.isValid()) {
        return `https://calendar.google.com/calendar/u/0/r/${view}/`
    }

    const dateString = date.format("yyyy/M/D");
    return`https://calendar.google.com/calendar/u/0/r/${view}/${dateString}`;
}

function updateCssAndJs(theme) {
    if(frame) {
        if(theme == "dark" || (theme == "auto" && getCurrentTheme() == "dark")){

            try{
                frame.removeEventListener("dom-ready", (e) => {
                    frame.executeJavaScript(`
                        const menu = document.querySelectorAll('[aria-label][aria-expanded]')[0]
                        if(menu.getAttribute("aria-expanded") == "true"){
                            menu.click();
                        }
                    `)
                    frame.insertCSS(`html { filter: hue-rotate(180deg)invert(100)contrast(93%) !important; }`);
                });
            }catch(e){}
            try{
                frame.removeEventListener("dom-ready", (e) => {
                    frame.executeJavaScript(`
                        const menu = document.querySelectorAll('[aria-label][aria-expanded]')[0]
                        if(menu.getAttribute("aria-expanded") == "true"){
                            menu.click();
                        }
                    `)
                });
            }catch(e){}

            frame.addEventListener("dom-ready", (e) => {
                frame.executeJavaScript(`
                    const menu = document.querySelectorAll('[aria-label][aria-expanded]')[0]
                    if(menu.getAttribute("aria-expanded") == "true"){
                        menu.click();
                    }
                `)
                frame.insertCSS(`html { filter: hue-rotate(180deg)invert(100)contrast(93%) !important; }`);
            });
        }else{
            frame.addEventListener("dom-ready", (e) => {
                frame.executeJavaScript(`
                    const menu = document.querySelectorAll('[aria-label][aria-expanded]')[0]
                    if(menu.getAttribute("aria-expanded") == "true"){
                        menu.click();
                    }
                `)
            });
        }
    }
}

$: updateCssAndJs(codeBlockOptions.theme);

</script>

<div class="box" bind:this={container}>
    {#if isObsidianView}
        <ViewSettings bind:codeBlockOptions bind:showSettings/>
    {/if}
    <div class="content">
    {#if codeBlockOptions.width == -1}
    <webview 
        src={getWebUrl(codeBlockOptions.view)}
        allowpopups
        class="fullSize"
        bind:this={frame}
    />
    {:else if !codeBlockOptions.width}
    <webview 
        src={getWebUrl(codeBlockOptions.view)}
        allowpopups
        style:height="{codeBlockOptions.height}px"
        bind:this={frame}
    />
    {:else}
    <webview 
        src={getWebUrl(codeBlockOptions.view)}
        allowpopups
        style:width="{codeBlockOptions.width}px"
        style:height="{codeBlockOptions.height}px"
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