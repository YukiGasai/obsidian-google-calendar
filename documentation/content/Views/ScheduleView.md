---
title: Schedule View
---

The schedule view shows you all your events over a period of time in a list.
This view is ideal for getting an overview of your day or week.
The schedule view provides you with information abut the time, the title and if the event is reoccurring.

## Usage

To open the schedule view use the `Open gCal schedule View` command.
To use the month view in a [[Codeblocks]] you have to set the [[TypeSetting | Type]] to `schedule`.

## Functionality

You can click on an event to open the [[EventDetailsView]] for that event in a modal.
When holding `shift` while clicking the [[EventDetailsView]] is opened in a separate view.
You can click the day number to open a list of all events for that day.

## Settings

As with other [[Views]] the schedule view can be configured in the [[ViewSettings | View Settings]].
Possible settings are:

- [[NavigationSetting | Navigation]]
- [[ShowAllDaySetting | ShowAllDay]]
- [[HourRangeSetting | HourRange]]
- [[OffsetSetting | Offset]]
- [[IncludeSetting | Include]]
- [[ExcludeSetting | Exclude]]
- [[TimespanSetting | Timespan]]

## Example

~~~md
```gEvent
type: schedule
include: ["Lavender"]
offset: 0
timespan: 3
showAllDay: false
navigation: true
```
~~~

<video src="scheduleViewExample.mp4" controls title="Schedule View Example"></video>