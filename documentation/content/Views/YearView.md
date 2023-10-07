---
title: Year View
---

The year view displays all your events at once.
Well kinda. It shows you a github inspired calendar heatmap.
The color of the day is based on the number of events on that day.
The more events the darker the color.
The squares with red border are the first days of the month.
This view is less useful than the others but it looks cool.

## Usage

To open the year view use the `Open gCal year View` command.
To use the year view in a [[Codeblocks]] you have to set the [[TypeSetting | Type]] to `year`.

## Functionality

You can left click on a day to get a list of all events, select a event from the dropdown to open the [[EventDetailsView]] of the selected event.

## Settings

As with other [[Views]] the year view can be configured in the [[ViewSettings | View Settings]].
Possible settings are:

- [[NavigationSetting | Navigation]]
- [[OffsetSetting | Offset]]
- [[IncludeSetting | Include]]
- [[ExcludeSetting | Exclude]]
- [[SizeSetting | Size]]

## Example

~~~md
```gEvent
type: year
offset: -1
size: 10
include: ["Personal"]
```
~~~

<video src="yearViewExample.mp4" controls title="Year View Example"></video>
