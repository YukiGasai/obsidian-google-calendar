# Creating events with the Obsidian Google Calendar API

The plugin allows you to create events on you own. The function `createEvent` is publicly exposed so codeblocks from templater or dataview can access it.

## Usage

The argument of the `createEvent` function is a GoogleEvent object. This object has to contain the required fields listed in the [Google Calendar API documentation](https://developers.google.com/calendar/api/v3/reference/events). To define the calendar where the event is created add a field `parent` containing a GoogleCalendar object. If no parent field is set the functions uses the default calendar.

## Example (templater script)

~~~markdown
<%*
const {createEvent} = this.app.plugins.plugins["google-calendar"].api;
await createEvent({
 summary: "Test event",
 start: {
  date: window.moment()
 },
 end: {
  date: window.moment()
 }
});
%>
~~~
