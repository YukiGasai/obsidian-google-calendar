<script lang="ts">
    import type { ICalendarSource, IDayMetadata, IDot} from "obsidian-calendar-ui"
    import type { CodeBlockOptions, GoogleEvent } from '../../helper/types';
    
    import { Calendar as CalendarBase } from "obsidian-calendar-ui";
    import { EventListModal } from "../../modal/EventListModal";
    import { googleClearCachedEvents, listEvents } from "../../googleApi/GoogleListEvents";
    import { onDestroy } from "svelte";
    import _ from "lodash"
    import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";
    import { getDailyNotes, getSingleDailyNote, getSingleWeeklyNote, openPeriodicNote, openPeriodicNoteInNewWindow } from "../../helper/DailyNoteHelper";
    import { createWeeklyNote } from "obsidian-daily-notes-interface";
	import { Menu, Platform } from "obsidian";
	import { DayCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_DAY } from "../../view/DayCalendarView";
	import { ScheduleCalendarView, VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE } from "../../view/ScheduleCalendarView";
	import { VIEW_TYPE_GOOGLE_CALENDAR_WEEK, WeekCalendarView } from "../../view/WeekCalendarView";
	import ViewSettings from "../components/ViewSettings.svelte";
	import { onMount } from "svelte";

    export let codeBlockOptions: CodeBlockOptions;
    export let isObsidianView = false;
    export let showSettings = false;

    let displayedMonth;
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

        const eventsInMonth = await listEvents({
            startDate:prevMonthDate,
            endDate:nextMonthDate,
            include: codeBlockOptions.include,
            exclude: codeBlockOptions.exclude,
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
                    ...eventsOfTheDay.map((event:GoogleEvent) => 
                        ({isFilled: true, className: `googleCalendarDot_${event.parent.colorId}`, color: "default"})
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

    const onContextMenuHotKey = (date: moment.Moment, event: MouseEvent, type: 'daily' | 'weekly'): boolean => {
        if(event.ctrlKey){
            openPeriodicNote({date, openInNewTab: true, type});
            return false;
        }
        if(event.shiftKey){
            openPeriodicNote({date, openInNewTab: false, type});
            return false;
        }
        if(event.altKey && Platform.isDesktop){  
            openPeriodicNoteInNewWindow({date, type});
            return false;
        }

        return true;
    }

    const onContextMenu = (date: moment.Moment, type: 'daily' | 'weekly'): Menu => {
        const note = type === "daily" ? getSingleDailyNote(date) : getSingleWeeklyNote(date);
        const typeText = type.charAt(0).toUpperCase() + type.slice(1)
        const menu = new Menu();

        if(!note){
            menu.addItem((item) => {
                item.setTitle(`Create ${typeText} Note`)
                item.setIcon("create-new")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: false, type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Create ${typeText} Note Split Right`)
                item.setIcon("vertical-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "horizontal", type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Create ${typeText} Note Split Down`)
                item.setIcon("horizontal-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "vertical", type});
                })
            })
        }else{
            menu.addItem((item) => {
                item.setTitle(`Open ${typeText} Note`)
                item.setIcon("file")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: false, type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Open ${typeText} Note Split Right`)
                item.setIcon("vertical-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "horizontal", type});
                })
            })
            menu.addItem((item) => {
                item.setTitle(`Open ${typeText} Note Split Down`)
                item.setIcon("horizontal-split")
                item.onClick(() => {
                    openPeriodicNote({date, openInNewTab: true, openToRight: "vertical", type});
                })
            })
            //Make sure plugin wont crash on mobile
            if(Platform.isDesktop) {
                menu.addItem((item) => {
                    item.setTitle(`Open ${typeText} Note in new Window`)
                    item.setIcon("fullscreen")
                    item.onClick(() => {
                        openPeriodicNoteInNewWindow({date, type});
                    })
                })
            }
        }
        // Add extra function for daily notes
        if(type === "daily") {
            menu.addSeparator()

            menu.addItem((item) => {
                item.setTitle("Open Timeline View")
                item.setIcon("calendar")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_DAY);
                    if (leaf.view instanceof DayCalendarView) {
                        leaf.view.setDate(date);
                    }                  
                });
            })

            menu.addItem((item) => {
                item.setTitle("Open Schedule View")
                item.setIcon("bullet-list")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE);
                    if (leaf.view instanceof ScheduleCalendarView) {
                        leaf.view.setDate(date);
                    }     
                });
            })
        }else {
            menu.addSeparator()

            menu.addItem((item) => {
                item.setTitle("Open Weekly View")
                item.setIcon("calendar")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_WEEK);
                    if (leaf.view instanceof WeekCalendarView) {
                        leaf.view.setDate(date);
                    }                  
                });
            })

            menu.addItem((item) => {
                item.setTitle("Open Schedule View")
                item.setIcon("bullet-list")
                item.onClick(async () => {
                    const leaf = await plugin.initView(VIEW_TYPE_GOOGLE_CALENDAR_SCHEDULE);
                    if (leaf.view instanceof ScheduleCalendarView) {
                        leaf.view.setDate(date);
                    }     
                });
            })
        }
        return menu;
    }

    const onContextMenuDay = (date: moment.Moment, event: MouseEvent): boolean => {
        if(onContextMenuHotKey(date, event, "daily")){
            onContextMenu(date, "daily").showAtPosition({ x: event.clientX, y: event.clientY });
        }
        return true;
    }

    const onContextMenuWeek = (date: moment.Moment, event: MouseEvent): boolean => {
        if(onContextMenuHotKey(date, event, "weekly")){
            onContextMenu(date, "weekly").showAtPosition({ x: event.clientX, y: event.clientY });
        }
        return true;
    }


    onMount(() => {
        displayedMonth = codeBlockOptions.date ? window.moment(codeBlockOptions.date).add(codeBlockOptions.offset, "month") : window.moment().add(codeBlockOptions.offset, "month");
    })


    $: {
        if(displayedMonth){
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
    }
    onDestroy(() => {
        clearInterval(interval);
        clearInterval(newDayInterval);
    })

</script>
{#if isObsidianView}
    <ViewSettings bind:codeBlockOptions bind:showSettings/>
{/if}
{#if !codeBlockOptions.width || !codeBlockOptions.height}
    <div class="gcal-calendar-container">
        {#if loading}
            <p>Loading...</p>
        {:else} 
            <div style="--daily-dot-color: {plugin.settings.dailyNoteDotColor}">
                <CalendarBase
                    showWeekNums={plugin.settings.useWeeklyNotes}
                    {onClickDay}
                    {onClickWeek}
                    {onContextMenuDay}
                    {onContextMenuWeek}
                    bind:sources
                    bind:displayedMonth
                    bind:today
                />
            </div>
        {/if}
    </div>
{:else}
    <div 
        class="gcal-calendar-container" 
        style:width="{codeBlockOptions.width}px" 
        style:height="{codeBlockOptions.height}px"
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

