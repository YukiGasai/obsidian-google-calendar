<script lang="ts">
	import type { InsertEventsModal } from "../../modal/InsertEventsModal";
	import type { GoogleCalendar, GoogleEvent, Template } from "../../helper/types";
	import { onMount } from "svelte";
	import { listCalendars } from "../../googleApi/GoogleListCalendars";
	import { GoogleEventSuggestionList } from "../../suggest/GoogleEventSuggestionList";
	import { listEvents } from "../../googleApi/GoogleListEvents";
	import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";
	import { AskNameModal } from "../../modal/AskNameModal";
	import { createNotice } from "../../helper/NoticeHelper";

    export let onSubmit :(printType:string, eventList: GoogleEvent[], tableOptions: string[], insertEventsModal: InsertEventsModal) => void;
    export let insertEventsModal: InsertEventsModal;

    let plugin:GoogleCalendarPlugin = GoogleCalendarPlugin.getInstance();

    let selectedTemplate;
    let insertType; 
    let eventList: [GoogleEvent, boolean][];
    let calendarList: [GoogleCalendar, boolean][];

    let tableOptions: string[] = [".summary", ".description"];
    
	onMount(async () => {
        const totalCalendarList = await listCalendars();
        calendarList = totalCalendarList.map(calendar => {return [calendar, true]});

        const totalEventList = await listEvents();
        eventList = totalEventList.map(event => {return [event, true]});		

	});

    let handleSubmit = () => {
        const resultEventList = eventList
            .filter((eventTupel:[GoogleEvent, boolean]) => eventTupel[1])
            .map((eventTupel:[GoogleEvent, boolean]) => eventTupel[0]);
        onSubmit(insertType, resultEventList, tableOptions, insertEventsModal)
    }

    let changedCalendarList = (e) => {
        eventList.forEach((event:[GoogleEvent, boolean]) => {
            if(event[0].parent.id == e.target.id){
                event[1] = e.target.checked
            }
        });
        //Make sure svelt updates the content
        eventList = eventList;
    }

    let addRemoveItem = (e) => {
        let selectedOption = e.target.value;
        if(selectedOption == "on"){
            selectedOption = e.target.id;
        }
        if(tableOptions.contains(selectedOption)){
            tableOptions.remove(selectedOption)
        }else{
            tableOptions.push(selectedOption);
        }
        tableOptions = tableOptions;
    }

    let removeItem = (option:string) => {
        if(tableOptions.contains(option)){
            tableOptions.remove(option)
        }
        tableOptions = tableOptions;
    }


    let changedDate = async (e) => {
 
        const totalCalendarList = await listCalendars();
        calendarList = totalCalendarList.map(calendar => {return [calendar, true]});

        const totalEventList = await listEvents({startDate:window.moment(e.target.value).local()});
        eventList = totalEventList.map(event => {return [event, true]});	
        eventList = eventList;
    }


    let getSelectedCalendarIdList = ():string[] => {
        return calendarList
            .filter((calendarTupel:[GoogleCalendar, boolean]) => calendarTupel[1])
            .map((calendarTupel:[GoogleCalendar, boolean]) => calendarTupel[0].id);
    }


    let handleSaveSettings = () => {

        new AskNameModal(app, (name:string) => {
            
            const newTemplate:Template = {
                name: name,
                insertType: insertType,
                tableOptions: tableOptions,
                calendarList: getSelectedCalendarIdList() 
            } 

            plugin.settings.insertTemplates = [...plugin.settings.insertTemplates, newTemplate];
            plugin.saveSettings();

            createNotice("Added template");

        }).open();
    }

    let selectTemplate = (e) => {
        const templateName = e.target.value;
        if(templateName == "None")return;

        const templateList = plugin.settings.insertTemplates;

        const template = templateList.find(template => template.name == templateName);

        if(!template)return;

        insertType = template.insertType 
        tableOptions = template.tableOptions;
        
        calendarList.forEach((calendarTuple:[GoogleCalendar, boolean]) => 
            calendarTuple[1] = template.calendarList.contains(calendarTuple[0].id)
        )
      

        eventList.forEach((event:[GoogleEvent, boolean]) => 
            event[1] = template.calendarList.contains(event[0].parent.id)
        );

        calendarList = calendarList;
        eventList = eventList;
    }


</script>
<div class="optionContainer">
    
    <div class="header">
        <select bind:value={selectedTemplate} class="dropdown left" on:change="{selectTemplate}">
            <option value="None">None</option>
            {#if plugin.settings.insertTemplates.length}
                {#each plugin.settings.insertTemplates as template}
                    <option value="{template.name}">{template.name}</option>
                {/each}
            {/if}
        </select>
        <h1 class="center">Insert Options</h1>
        <button class="right" on:click="{handleSaveSettings}">Save as template</button>
    </div>
    <hr>
    <div class="settingsContainer">
        <div class="input">
            <label for="insertType">Insert type</label>
            <select bind:value={insertType} class="dropdown">
                <option selected={true} value="bullet">Bullet</option>
                <option value="table">Table</option>
            </select>
        </div>
        <div class="input">
            <label for="date">Insert date</label>
            <input type="date" name="date" id="date" value={window.moment().format("YYYY-MM-DD")} on:change="{changedDate}">
        </div> 
    </div>
    <h4>Calendars</h4>
    <div class="calendarList">
        {#if calendarList}
            {#each calendarList as calendar }
                <div class="optionItem">
                    <label for="{calendar[0].id}">{calendar[0].summary}</label>
                    <input type="checkbox" id="{calendar[0].id}" bind:checked="{calendar[1]}" on:change="{changedCalendarList}">
                </div>
            {/each}
        {:else}
            <span>Loading...</span>
        {/if}
    </div>

    <h4>Events</h4>
    <div class="eventList">
        {#if eventList}
            {#each eventList as event}
                <div class="optionItem">
                    <label for="{event[0].id}">{event[0].summary}</label>
                    <input type="checkbox" id="{event[0].id}" bind:checked="{event[1]}">
                </div>
            {/each}
        {:else}
            <span>Loading...</span>
        {/if}
    </div> 
    {#if insertType == "table"}
        <h4>Table structure</h4>
        <select name="tableOptions" on:change="{addRemoveItem}" class="dropdown">
            {#each GoogleEventSuggestionList as option}
            <option value="{option}">{option}</option>
            {/each}
        </select>
        
        <div class="optionList">
            {#each tableOptions as option}
                <div class="optionItem">
                    <span>{option}</span>
                    <input type="checkbox" id="{option}" on:click="{() => removeItem(option)}" checked/>
                </div>
            {/each}
        </div>
    {/if}
    <button on:click="{handleSubmit}">Insert</button>
</div>
<style>


.optionContainer{
    display: flex;
    flex-direction: column;
}

.header{
    display: grid;
    grid-template-columns: [first] 30% auto [last] 30%;
}

.center {
  text-align: center;
}


.settingsContainer{
    display: flex;
    flex-direction: row;
    flex:1 1;
    gap:20px;
}

.optionItem{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.input,
.eventList,
.optionList,
.calendarList{
    width: 100%;
    display: flex;
    flex-direction: column;
}

.eventList,
.optionList,
.calendarList{
    padding-left: 16px;
}

button {
    align-self: center;
}

</style>