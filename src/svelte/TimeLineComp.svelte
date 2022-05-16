<script lang="ts" >
    import { DateToPercent } from "../helper/DateToPercent";
    import {getEventStartPosition, getEventHeight} from "../helper/CanvasDrawHelper";
    
    import { googleListEvents, googleListTodayEvents } from "../googleApi/GoogleListEvents";
    import type GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import type { GoogleEvent } from "../helper/types";
    import {ViewEventEntry} from '../modal/ViewEventEntry'


    import {moment} from 'obsidian';
    
    export let plugin: GoogleCalendarPlugin;
    export let height = 700;
    export let width = 300;
    export let date = 'today';



    let events:GoogleEvent[] = [];
    let eventPromise: Promise<GoogleEvent[]>;

    $: (() => {
 

        if(date == 'today'){
            eventPromise =  googleListTodayEvents(plugin);
        }else if(date == 'tomorrow'){
            const tomorrow = moment().add(1, "days");
            const dateString = tomorrow.format("YYYY-MM-DD");
            eventPromise =  googleListEvents(plugin, dateString);
        }else{
            let tmpDate = moment(date);
            if(!tmpDate.isValid()){
                tmpDate = moment(date, 'DD.MM.YYYY');
                if(!tmpDate.isValid()){
                    tmpDate = moment(date, 'DD-MM-YYYY');
                     if(!tmpDate.isValid()){
                        tmpDate = moment(date, 'DD/MM/YYYY');
                        if(!tmpDate.isValid()){
                            return;
                         }
                     }
                }
            }
            const dateString = tmpDate.format("YYYY-MM-DD");

            eventPromise =  googleListEvents(plugin, dateString);
        }
     
    })();

    const dayPercentage = DateToPercent(new Date());
    
    let timeDisplayPosition = Math.floor(height * dayPercentage);
    
    
    const goToEvent = (event:GoogleEvent, e:any) => {
        if(e.shiftKey){
            window.open(event.htmlLink);
        }else{
            new ViewEventEntry(plugin, event).open();
        }
    }

    
    </script>

    {#await eventPromise}
        <p>Loading</p>
    {:then events} 
        


    <div 
        style:height="{height}px"
        style:width="{width}px"
        class="timeline">
    
 
    
        
    
        <div class="hourLineContainer">
        {#each {length: 24} as _, i }
            <div class=hourLine style:height="{height/24}px" />
        {/each}
        </div>  
    
    
        <div class="hourTextContainer" style:margin-top="-{height/52}px">
        {#each {length: 24} as _, i }
                <span class=hourText
                 style:height="{height/24}px"
                 style:font-size="{height/50}px" 
                >{i}</span>
        {/each}
        </div>
    
    
    {#if moment().isSame(date, 'day')}
        <div class="timeDisplay" style:top="{timeDisplayPosition}px" style:width="{width}px"/>
    {/if}


    
        {#each events as event}
            <div 
                on:click={(e) => goToEvent(event,e)} 
                class="event" 
                style:top="{getEventStartPosition(event, height)}px"
                style:height="{getEventHeight(event, height)}px"
                style:background="{event.parent.backgroundColor}"
            >{event.summary}</div>
        {/each}
      

    </div>
    {/await}




    <style>
    
        .event{
            display: flex;
            padding:10px;
            position: absolute;
         
            width:150px;
            left:40px;
            border-radius: 5px;
            color:black;
            font-size: 0.5em;
        }
    
        .hourLine::after{
            content: "";
            position: absolute;
            width:200px;
            left:50px;
        
        
            border-bottom: 1px solid white;
        }
    
       .hourText{
        display:block;
        font-family: "consolas";
       
       }
       .timeline, .hourText, .hourTextContainer{
           overflow: hidden;
       }
       
    
       
       .timeDisplay{
           position: absolute;
        
           height:3px;
           background:red;
    
       }
    
    
       .timeline{
           position:relative;
           display: flex;
           flex-direction: row;
           /*border: 1px solid green;*/
       }
    
    
    </style>