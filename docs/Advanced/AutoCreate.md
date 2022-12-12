# Auto Create Event Notes

The plugin allows you to generate notes automatically from Google Events.
1. To achieve this, enable `Auto create Event Notes` inside the settings.
1. Select an Import date range. This is the range in which events are checked. The center is always today.
1. Google events that contain `:obsidian:` inside the description will create new notes if the plugin starts

You can also define a template that should be used when creating new notes by adding the template title `:obsidian-UniTemplate:`
Make sure to activate the core plugin Templates or the Templater plugin.

You can also define a location where the new note should be saved by adding the folder location in front of the text like this `:Folder/Path-obsidian:`

Example `:Uni/Math-obsidian-UniTemplate:` Create the node in the folder Math with the Template UniTemplate.

To insert event information into templates use `{{gEvent.AnyField}}` for both plugins

or you can use Templater with the exposed Plugin Api

Example
```
Event Description

{{gEvent.description}}

```

The fields to use are defined in the [Google Calendar API](https://developers.google.com/calendar/api/v3/reference/events) and can be selected from the dropdown menu

> To trigger this feature manually use the `Google Calendar Trigger Auto Import` 