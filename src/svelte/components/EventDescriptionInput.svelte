<script lang="ts">
	import type { GoogleEvent } from "../../helper/types";
    import TurndownService from 'turndown';
    import { marked } from 'marked';
	import { obsidianLinkToAnchor } from "../../helper/Helper";

    export let event: GoogleEvent;
    let isPreview = event.id  !== undefined;

    const convertDescriptionToMarkdown = () => {
        const turndownService = new TurndownService();
        let markdown = turndownService.turndown(event.description ?? "");
        // Replace google escaped links with normal obsidian links
        return markdown.replace(/\\\[\\\[([^(\\\])]*)\\\]\\\]/g, `[[$1]]`);
    }

    const updateEventDescription = (e) => {
        const markdown = e.target.value;
        const html = marked(markdown);
        event.description = html;
    }

    const switchPreview = () => {
        isPreview = !isPreview;
    }

</script>
<div>
    <label for="description" class="gcal-description-label">
        <span>Description</span>
        {#if isPreview}
            <button class={"gcal-icon-button"} on:click={switchPreview}> 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </button>        
        {:else}
            <button class={"gcal-icon-button"} on:click={switchPreview}> 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
        {/if}
    </label>
  
        {#if isPreview}
        <div class="gcal-description-container">
            {@html obsidianLinkToAnchor(event.description ?? "")}
        </div>
        {:else}
        <div class="gcal-description-container" style:padding="10px 0 0 10px">
            <textarea class="gcal-description-texarea" on:change={updateEventDescription}>{convertDescriptionToMarkdown()}</textarea>
        </div>
        {/if}

</div>
<style>
    .gcal-description-label{
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 10px 0 ;
    }

    .gcal-description-texarea {
        width: 100%;
        height: 150px;
        background: transparent;
        border: none;
        resize: vertical;
        padding: 0;
        margin: 0;
    }

    .gcal-description-texarea:focus {
        outline: none;
        box-shadow: none;
    }

    .gcal-icon-button{
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 20%;
        background-color: var(--color-primary);
        color: var(--color-primary-text);
        cursor: pointer;
        width: 30px;
        height: 30px;
        padding: 0;
    }
    .gcal-icon-button svg {
        width: 24px;
        height: 24px;
    }
    
    .gcal-description-container{
        width: 100%;
        border-radius: 10px;
        padding: 10px;
        overflow: scroll;
        border: var(--input-border-width) solid var(--background-modifier-border);
    }

    .gcal-description-container:focus-within {
        box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
    }
</style>
