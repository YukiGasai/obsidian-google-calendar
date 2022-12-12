# Obsidian Google Calendar Api

This Api  is allowing anyone to access the CRUD functions of this plugin.

This is helpful when creating complex Templater or Dataview functionalities.

> The usage is currently limited to reading



## 
The argument for the getEvents function is a object now to allow named params

|name|description|type|default|
|---|---|---|---|
|startDate| Define the start moment of the query range | moment | today |
|endDate| Define the end moment of the query range | moment | tomorrow |
|exclude| A list of calendar names or ids to exclude from the query result | string[] | []
|include| A list of calendar names or ids to include in the query result | string[] | []

when not using include, exclude the result will contain all your calendars except the black listed ones from the settings page

~~~
Example:
<%*
const {getEvents} = this.app.plugins.plugins["google-calendar"].api;
const theEvents = await getEvents({
startDate: window.moment("12/06/2022")
});
tR = theEvents.reduce((text, event )=> text += "\n" + event.summary, "");
%>
~~~