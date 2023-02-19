<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type { GoogleEvent } from '../helper/types';
    
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { EventListModal } from "../modal/EventListModal";
    import { googleClearCachedEvents, googleListEvents } from "../googleApi/GoogleListEvents";
    import { onDestroy } from "svelte";
    import _ from "lodash"
    import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
    import { getDailyNotes, getSingleDailyNote, getSingleWeeklyNote, openDailyNote, openDailyNoteInNewWindow } from "../helper/DailyNoteHelper";
    import { createWeeklyNote } from "obsidian-daily-notes-interface";
	import { Menu, Platform } from "obsidian";
	import { DayCalendarView } from "../view/DayCalendarView";
	import { ScheduleCalendarView } from "../view/ScheduleCalendarView";


    export let displayedMonth = window.moment();
    export let width:number = 0;
    export let height:number = 0;
    export let include;
    export let exclude;

    let dailyNoteList = getDailyNotes();
    let interval;
    let newDayInterval;
    let events: GoogleEvent[];
    let loading: boolean = true;
    let sources:ICalendarSource[];
    let today = window.moment();
    let plugin = GoogleCalendarPlugin.getInstance();

    async function getSource(month:moment.Moment) {

        plugin.settings.dailyNoteDotColor = plugin.settings.dailyNoteDotColor;
        const prevMonthDate = month.clone().startOf("month").subtract(6, "days");
        const nextMonthDate = month.clone().endOf("month").add(12, "days");

        const eventsInMonth = await googleListEvents({
            startDate:prevMonthDate,
            endDate:nextMonthDate,
            include,
            exclude
        });    

        //Don't do anything when events are the same
        if(_.isEqual(eventsInMonth, events) && _.isEqual(dailyNoteList, getDailyNotes())){
            return;
        }
        dailyNoteList = getDailyNotes();
        
        let eventsByDay = _.groupBy(eventsInMonth, event =>
            window.moment(event.start.date ?? event.start.dateTime).startOf('day').format()
        );

        events = eventsInMonth;
        const customTagsSource: ICalendarSource = {
            getWeeklyMetadata: async (week: moment.Moment): Promise<IDayMetadata> => {
                let dots:IDot[] = [];
                if(plugin.settings.activateDailyNoteAddon && plugin.settings.useWeeklyNotes){
                    const note = getSingleWeeklyNote(week);
                    if(note){
                        dots = [{isFilled: true, className: "googleCalendarDailyDot", color: "default"}]
                    }
                }
                return {
                    dataAttributes: {"amount": dots.length + ""},
                    dots: dots,
                };
            },
            getDailyMetadata: async (day: moment.Moment): Promise<IDayMetadata> => {

                let dots:IDot[] = [];
                if(plugin.settings.activateDailyNoteAddon){
                    const note = getSingleDailyNote(day);
                    if(note){
                        dots = [{isFilled: true, className: "googleCalendarDailyDot", color: "default"}]
                    }
                }
                const eventsOfTheDay = eventsByDay[day.startOf("day").format()]; 
                if (!eventsOfTheDay){
                    return {
                    dataAttributes: {"amount": dots.length + ""},
                    dots: dots,
                };
                } 
                dots = [
                    ...dots,
                    ...Array(eventsOfTheDay.length).fill(
                        {isFilled: true, className: "googleCalendarDot", color: "default"}
                    )
                ]

                return {
                    dataAttributes: {"amount": eventsOfTheDay.length + ""},
                    dots: dots,
                };
            }
        }
        loading = false;
        sources = null
        sources = [customTagsSource]
    }


    const getEventsOfDay = (eventList: GoogleEvent[], date: moment.Moment):GoogleEvent[] => {
        return eventList.filter(event => {
            if(event.start.date){
                return window.moment(event.start.date).isSame(date, 'day');
            }else{
                return window.moment(event.start.dateTime).isSame(date, 'day');
            }    
        })
    }


    const onClickDay = (date: moment.Moment, isMenu:boolean) => {

        new EventListModal(getEventsOfDay(events, date),"details", date, false, () => {
            googleClearCachedEvents();
            displayedMonth = displayedMonth
        }).open();
    }
    
    const onClickWeek = async (week: moment.Moment, isMenu:boolean) => {

        let weeklyNote = getSingleWeeklyNote(week)
        if(!weeklyNote){
            weeklyNote = await createWeeklyNote(week);
        }

        const leaf = app.workspace.getLeaf(false)
        await leaf.openFile(weeklyNote, { active: true });
    }

    const onContextMenuDay = (date: moment.Moment, event: MouseEvent): boolean => {

        if(event.ctrlKey){
            openDailyNote({date, openInNewTab: true});
        }else if(event.shiftKey){
            openDailyNote({date, openInNewTab: false});
        }else if(event.altKey && Platform.isDesktop){  
            openDailyNoteInNewWindow(date);
        }else{
            const note = getSingleDailyNote(date);
            const menu = new Menu();

            if(!note){
                menu.addItem((item) => {
                    item.setTitle("Create Daily Note")
                    item.setIcon("create-new")
                    item.onClick(() => {
                        openDailyNote({date, openInNewTab: false});
                    })
                })
                menu.addItem((item) => {
                    item.setTitle("Create Daily Note Split Right")
                    item.setIcon("vertical-split")
                    item.onClick(() => {
                        openDailyNote({date, openInNewTab: true, openToRight: "horizontal"});
                    })
                })
                menu.addItem((item) => {
                    item.setTitle("Create Daily Note Split Down")
                    item.setIcon("horizontal-split")
                    item.onClick(() => {
                        openDailyNote({date, openInNewTab: true, openToRight: "vertical"});
                    })
                })
            }else{

                menu.addItem((item) => {
                    item.setTitle("Open Daily Note")
                    item.setIcon("file")
                    item.onClick(() => {
                        openDailyNote({date, openInNewTab: false});
                    })
                })
                menu.addItem((item) => {
                    item.setTitle("Open Daily Note Split Right")
                    item.setIcon("vertical-split")
                    item.onClick(() => {
                        openDailyNote({date, openInNewTab: true, openToRight: "horizontal"});
                    })
                })
                menu.addItem((item) => {
                    item.setTitle("Open Daily Note Split Down")
                    item.setIcon("horizontal-split")
                    item.onClick(() => {
                        openDailyNote({date, openInNewTab: true, openToRight: "vertical"});
                    })
                })
                //Make sure plugin wont crash on mobile
                if(Platform.isDesktop) {
                    menu.addItem((item) => {
                        item.setTitle("Open Daily Note in new Window")
                        item.setIcon("fullscreen")
                        item.onClick(() => {
                            openDailyNoteInNewWindow(date);
                        })
                    })
                }
            }

            menu.addSeparator()

            menu.addItem((item) => {
                item.setTitle("Open Timeline View")
                item.setIcon("calendar")
                item.onClick(async () => {
                    const leaf = app.workspace.getLeaf(true)
                    await leaf.open(new DayCalendarView(leaf, date));
                    app.workspace.setActiveLeaf(leaf);
                });
            })

            menu.addItem((item) => {
                item.setTitle("Open Schedule View")
                item.setIcon("bullet-list")
                item.onClick(async () => {
                    const leaf = app.workspace.getLeaf(true)
                    await leaf.open(new ScheduleCalendarView(leaf, date));
                    app.workspace.setActiveLeaf(leaf);
                });
            })

        menu.showAtPosition({ x: event.clientX, y: event.clientY });

        }

        return true;
    }

    $: {
        if(interval){
            clearInterval(interval);
        }
        interval = setInterval(() => getSource(displayedMonth), 1000)

        if(newDayInterval){
            clearInterval(newDayInterval);
        }
        newDayInterval = setInterval(() => today = window.moment(), 60000)

        getSource(displayedMonth)

    }
    onDestroy(() => {
        clearInterval(interval);
        clearInterval(newDayInterval);
    })

</script>

{#if width==0 || height == 0}
    <div class="calendarContainer">
        {#if loading}
            <p>Loading...</p>
        {:else} 
            <div style="--daily-dot-color: {plugin.settings.dailyNoteDotColor}">
                <CalendarBase
                    showWeekNums={plugin.settings.useWeeklyNotes}
                    {onClickDay}
                    {onClickWeek}
                    {onContextMenuDay}
                    bind:sources
                    bind:displayedMonth
                    bind:today
                />
            </div>
        {/if}
    </div>
{:else}
    <div 
        class="calendarContainer" 
        style:width="{width}px" 
        style:height="{height}px"
        >
        {#if loading}
            <p>Loading...</p>
        {:else} 
    
            <div style="--theme-color: {plugin.settings.dailyNoteDotColor}">
                <CalendarBase
                    showWeekNums={false}
                    {onClickDay}
                    bind:sources
                    bind:displayedMonth
                    bind:today
                />
            </div>
        {/if}
    </div>
{/if}

<style>

</style>

