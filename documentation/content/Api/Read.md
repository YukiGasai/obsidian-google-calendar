---
title: Read
---

The [[ObsidianGoogleCalendarAPI | Obsidian Google Calendar API]] allows you to query for events on your own.
The function `getEvents` is publicly exposed so codeblocks from [Templater](https://github.com/SilentVoid13/Templater) or [Dataview](https://github.com/blacksmithgu/obsidian-dataview) can access it.

## Usage

The argument of the `getEvents` function is a object to allow named parameters.

|name|description|type|default|
|---|---|---|---|
|startDate| Define the start moment of the query range | moment | today |
|endDate| Define the end moment of the query range | moment | today |
|exclude| A list of calendar names or ids to exclude from the query result | string[] | []
|include| A list of calendar names or ids to include in the query result | string[] | []

when not using include, exclude the result will contain all your calendars except the black listed ones from the settings page.

~~~markdown title="Example"
<%*
const {getEvents} = this.app.plugins.plugins["google-calendar"].api;
const theEvents = await getEvents({
startDate: window.moment("12/06/2022")
});
tR = theEvents.reduce((text, event )=> text += "\n" + event.summary, "");
%>
~~~
