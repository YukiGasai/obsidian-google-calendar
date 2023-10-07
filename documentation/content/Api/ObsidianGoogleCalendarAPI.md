---
title: Obsidian Google Calendar API
---

This [Api](https://en.wikipedia.org/wiki/API) is allowing access to the [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) functions for Google Calendar Events.

This is useful when creating complex [[EventNote]] templates with [Templater](https://github.com/SilentVoid13/TemplaterDa) or [Dataview.js](https://github.com/blacksmithgu/obsidian-dataview) queries.

## The CRUD functions

- [[Create | Creating events with the API]]
- [[Read | Reading events with the API]]
- [[Update | Updating events with the API]]
- [[Delete | Deleting events with the API]]

## Other helpful functions

### Get all calendars

To get a list of all non black listed calendars use the `getCalendars` function.

~~~markdown title="Example"
<%*
const {getCalendars} = this.app.plugins.plugins["google-calendar"].api;
const calendars = await getCalendars();
tR = calendars.reduce((text, calendar )=> text += "\n" + calendar.summary, "");
%>
~~~

### Get a single Event

To get a single event from an id you can use the `getEvent` function.
This function takes to arguments.

1. the event id
2. the calendar id (optional but recommended)

~~~markdown title="Example"
<%*
const {getEvent} = this.app.plugins.plugins["google-calendar"].api;
const event = await getEvent("25t2r0005cnbxoev871o5ll4ls","d74f57c01c85828d747bc3afbc4dd79603e9e552a4218ae2509589d6f25c2d162@group.calendar.google.com");
tR = JSON.stringify(event);
%>
~~~
