---
title: Update
---

The [[ObsidianGoogleCalendarAPI | Obsidian Google Calendar API]] allows you to update events on your own.
The function `updateEvent` is publicly exposed so codeblocks from [Templater](https://github.com/SilentVoid13/Templater) or [Dataview](https://github.com/blacksmithgu/obsidian-dataview) can access it.

## Usage

The arguments of the `updateEvent` function is a GoogleEvent object and a flag if reoccurring events should be updated as well. This object has to contain the required fields listed in the [Google Calendar API documentation](https://developers.google.com/calendar/api/v3/reference/events).
The second argument `updateAllOccurrences` is a boolean that defaults to `false`.
If it is `true` and the event is reoccurring, it will update all occurrences of the event.

~~~markdown title="Example"
<%*
const {updateEvent, getEvents} = this.app.plugins.plugins["google-calendar"].api;
const events = await getEvents({});

events[0].summary = "Updated summary";
await updateEvent(events[0], false);
%>
~~~
