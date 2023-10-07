---
title: Auto create EventNotes
---

Auto create [[EventNote | EventNotes]] or Auto import is a function that allows you to automatically create [[EventNote | EventNotes]] from events in your calendar.

## How to use

To use this function you need to enable the [[AutoCreateEventNotes]] setting.
After that you can configure the [[AutoCreateEventNotesMarkers]] setting to your liking.
The plugin will then check in a configured time range defined by [[ImportStartOffset]] and [[ImportEndOffset]] around the current date for events.
Every event that contains `:{marker}:` will be imported as an [[EventNote | EventNotes]].
In the following example `obsidian` is the marker. Make sure to surround the marker with `:` in the event description.

~~~md title="Example Google Event Description"
:obsidian:
~~~

To define which template should be used for the [[EventNote | EventNotes]] you can add the path to the template on the right side of the marker.
Separate the marker and the path with a `-`.

~~~md title="Example Google Event Description"
:obsidian-UniTemplate:
~~~

To define where to store the [[EventNote | EventNotes]] you can add the path to the folder on the left side of the marker.
Separate the marker and the path with a `-`.
It is possible to use [[Placeholders]] in the path.

~~~md title="Example Google Event Description"
:Uni/Math-obsidian-UniTemplate:
~~~

> You can run the import again with the `gCal Trigger Auto Import` command.