# Obsidian Google Calendar Api

This [Api](https://en.wikipedia.org/wiki/API) is allowing access to the CRUD functions of this plugin.

This is useful when creating complex Templater or Dataview.js functionalities.

> Please be careful when using this function as it is still in development

## The CRUD functions

- [Creating events with the API](/Api/Create.md)
- [Reading events with the API](/Api/Read.md)
- [Updating events with the API](/Api/Update.md)
- [Deleting events with the API](/Api/Delete.md)

## Other helpful functions

### Get all calendars

To get a list of all non black listed calendars use the `getCalendars` function.

#### Example

~~~markdown
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
2. the calendar id

#### Example

~~~markdown
<%*
const {getEvent} = this.app.plugins.plugins["google-calendar"].api;
const event = await getEvent("25t2r0005cnbxoev871o5ll4ls","d74f57c01c85828d747bc3afbc4dd79603e9e552a4218ae2509589d6f25c2d162@group.calendar.google.com");
tR = JSON.stringify(event);
%>
~~~
