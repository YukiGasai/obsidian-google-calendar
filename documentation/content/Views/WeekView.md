---
title: Week View
---

The week view is a [[TimelineView]] with the option to display multiple days side by side.

## Usage

To open the week view use the `Open gCal week View` command.
To use the timeline view in a [[Codeblocks]] you have to set the [[TypeSetting | Type]] to `week`.

## Functionality

The week view has the same functionality as the [[TimelineView]].
Additionally, you can move events between days.

## Settings

As with other [[Views]] the week view can be configured in the [[ViewSettings | View Settings]].
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
type: week
navigation: true
showAllDay: true
hourRange: [6, 17]
offset: 0
include: ["Personal"]
timespan: 3
```
~~~

<video src="weekViewExample.mp4" controls title="Week View Example"></video>
