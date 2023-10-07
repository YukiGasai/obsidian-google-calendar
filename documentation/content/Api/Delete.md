---
title: Delete
---

The [[ObsidianGoogleCalendarAPI | Obsidian Google Calendar API]] allows you to delete events on your own. The function `deleteEvent` is publicly exposed so codeblocks from [Templater](https://github.com/SilentVoid13/Templater) or [Dataview](https://github.com/blacksmithgu/obsidian-dataview) can access it.

## Usage

The first argument of the `deleteEvent` function is a GoogleEvent object.
To define the calendar where the event is created add a field `parent` containing a GoogleCalendar object.
If no parent field is set the functions uses the default calendar.
The second argument `deleteAllOccurrences` is a boolean that defaults to `false`.
If it is `true` and the event is reoccurring, it will delete all occurrences of the event.

~~~markdown title="Example"
<%*
const {deleteEvent, getEvents} = this.app.plugins.plugins["google-calendar"].api;
const events = await getEvents({});
await deleteEvent(events[0], false);
%>
~~~
