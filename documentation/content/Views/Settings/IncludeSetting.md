---
title: Include Setting
---

When using the include setting only events from specific calendars are shown in the view.
Besides the calendar name you can also use the calendar id.
Additionally you can use [[Label colors]] to filter the events further.

<video src="changeIncludeSetting.mp4" controls title="Change Include Setting"></video>

For [[Codeblocks]] this settings is an array of strings.
This setting defaults to an empty array.
Example:

~~~md
```gEvent
include: ["Calendar 1", "Calendar 2", "Lavender"]
```
~~~
