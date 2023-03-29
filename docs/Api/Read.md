# Reading events with the Obsidian Google Calendar API

The plugin allows you to query for events on you own.
The function `getEvents` is publicly exposed so codeblocks from templater or dataview can access it.

## Usage

The argument of the `getEvents` function is a object now to allow named parameters.

|name|description|type|default|
|---|---|---|---|
|startDate| Define the start moment of the query range | moment | today |
|endDate| Define the end moment of the query range | moment | today |
|exclude| A list of calendar names or ids to exclude from the query result | string[] | []
|include| A list of calendar names or ids to include in the query result | string[] | []

when not using include, exclude the result will contain all your calendars except the black listed ones from the settings page.

## Example (templater script)

~~~markdown
<%*
const {getEvents} = this.app.plugins.plugins["google-calendar"].api;
const theEvents = await getEvents({
startDate: window.moment("12/06/2022")
});
tR = theEvents.reduce((text, event )=> text += "\n" + event.summary, "");
%>
~~~
