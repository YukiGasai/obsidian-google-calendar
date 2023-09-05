<script lang="ts">
    import { EventDetailsModal } from "../../modal/EventDetailsModal"
    import { googleClearCachedEvents } from "../../googleApi/GoogleListEvents";
	import { VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS } from "../../view/EventDetailsView";
    import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";

    export let date;
    export let startDate;
    export let dateOffset;
    let plugin = GoogleCalendarPlugin.getInstance();

    const minusOneWeek = () => dateOffset-= 7;
    const minusOneDay  = () => dateOffset-= 1;
    const backToday    = () => dateOffset = 0;
    const plusOneWeek  = () => dateOffset+= 7;
    const plusOneDay   = () => dateOffset+= 1;

    const openNewEventDialog = (e: MouseEvent) => {  
        if(e.shiftKey) {
            plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_EVENT_DETAILS, {start:{}, end:{}}, () => {
					googleClearCachedEvents();
                    date=date;
            })
        }else {
            new EventDetailsModal({start:{}, end:{}}, () =>{
                googleClearCachedEvents()
                date=date;
            }).open()
        }
    }

</script>

<div class="gcal-title-container">
    <div class="gcal-date-container">
        <h3 class="gcal-date-dayofweek">{date.format("dddd")}</h3>
        <h1 class="gcal-date-main">{date.format("MMMM DD, YYYY")}</h1>
        <div class="gcal-nav-container">
            <button class="gcal-nav-button" aria-label="Back 1 week"    on:click={minusOneWeek}>&lt;&lt;</button>
            <button class="gcal-nav-button" aria-label="Back 1 day"     on:click={minusOneDay}>&lt;</button>
            <button class="gcal-nav-button" aria-label="Jump to today"  on:click={backToday}>{window.moment().isSame(startDate, "day") ? "Today" : "Start"}</button>
            <button class="gcal-nav-button" aria-label="Forward 1 day"  on:click={plusOneDay}>&gt;</button>
            <button class="gcal-nav-button" aria-label="Forward 1 week" on:click={plusOneWeek}>&gt;&gt;</button>
            <button class="gcal-new-event-button" aria-label="Create Event" on:click={openNewEventDialog}>+</button>
        </div>
    </div>    
</div>


<style>
    .gcal-date-container{
        margin-bottom: 10px;
    }

    .gcal-date-dayofweek, .gcal-date-main {
        margin: 0px;
    }

    .gcal-nav-container {
        margin-bottom: 1em;
    }
</style>