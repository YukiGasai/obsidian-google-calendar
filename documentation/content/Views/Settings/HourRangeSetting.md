---
title: Hour Range Setting
---

The Hour Range setting limits the limits the hours that are shown in the view.
This Setting can be used in the [[TimelineView]] and [[ScheduleView]].

<video src="changeHourRangeSetting.mp4" controls title="Change Hour Range Setting"></video>

For [[Codeblocks]] this settings is a number array of length 2.
This setting defaults to an [0, 24].
Example:

~~~md
```gEvent
hourRange: [7, 17]
```
~~~
