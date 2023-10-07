---
title: Timeline View
---

The timeline view is a recreation of the default Google Calendar view.
It is a view that shows all your events in a timeline.
The timeline view is a great way to get an overview of your day.

## Usage

To open the timeline view use the `Open gCal Timeline View` command.
To use the timeline view in a [[Codeblocks]] you have to set the [[TypeSetting | Type]] to `day`.

## Functionality

You can click on events to Open the [[EventDetailsView]] for that event in a modal.
When holding `shift` while clicking the [[EventDetailsView]] is opened in a separate view.
When dragging the event on the timeline, the start and end date of the event is modified.
When dragging the top or bottom of the event on the timeline, the duration of the event is changed.
When double clicking the background, a new event can be created at the clicked time.

## Settings

As with other [[Views]] the timeline can be configured in the [[ViewSettings | View Settings]] and [[Codeblocks]].
Possible settings are:

- [[NavigationSetting | Navigation]]
- [[ShowAllDaySetting | ShowAllDay]]
- [[HourRangeSetting | HourRange]]
- [[OffsetSetting | Offset]]
- [[IncludeSetting | Include]]
- [[ExcludeSetting | Exclude]]

## Example

~~~md
```gEvent
type: day
navigation: true
showAllDay: true
hourRange: [6, 17]
offset: 0
include: ["Personal"]
```
~~~

<video src="timelineViewExample.mp4" controls title="TimelineView Example"></video>
