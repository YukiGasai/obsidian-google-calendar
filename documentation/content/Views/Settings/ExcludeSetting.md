---
title: Exclude Setting
---

When using the exclude setting all events from specific calendars are hidden in the view.
Besides the calendar name you can also use the calendar id.
Additionally you can use [[Label colors]] to filter the events further.

<video src="changeExludeSetting.md" controls title="Change Exlude Setting"></video>

For [[Codeblocks]] this settings is an array of strings.
This setting defaults to an empty array.
Example:

~~~md
```gEvent
exclude: ["Calendar 1", "Calendar 2", "Lavender"]
```
~~~
