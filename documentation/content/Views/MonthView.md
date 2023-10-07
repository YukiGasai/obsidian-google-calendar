---
title: Month View
---

The month view is a calendar view that shows you all your events in a month.
The events are displayed as colored dots under each day number.
The color is the same as the color of the calendar the event belongs to.
The calendar element is based on the [obsidian-calendar-ui](https://github.com/liamcain/obsidian-calendar-ui).

## Usage

To open the month view use the `Open gCal month View` command.
To use the month view in a [[Codeblocks]] you have to set the [[TypeSetting | Type]] to `month`.

## Functionality

You can left click on a day to get a list of all events, select a event from the dropdown to open the [[EventDetailsView]] of the selected event.
You can right click on a day to open the [[TimelineView]] and [[ScheduleView]] or create the daily note for that day.
You can enable [[Show Daily Notes]] to see your daily notes in the calendar.

## Settings

As with other [[Views]] the month view can be configured in the [[ViewSettings | View Settings]].
Possible settings are:

- [[OffsetSetting | Offset]]
- [[IncludeSetting | Include]]
- [[ExcludeSetting | Exclude]]

## Example

~~~md
```gEvent
type: month
offset: 0
include: ["Personal"]
```
~~~

<video src="monthViewExample.mp4" controls title="Month View Example"></video>
