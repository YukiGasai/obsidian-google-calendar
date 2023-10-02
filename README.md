# Google Calendar

Manage your Google Calendar from inside Obsidian

## Features

- List Events
- Create Events
- Edit Events
- Delete Events
- Auto create Notes from Events
- Insert Links to Events into Notes

## Installation

- One click install from [community plugin store](obsidian://show-plugin?id=google-calendar)
- Go to settings and activate plugin
- Go into plugin settings
- Create a own OAuth client (The public test client is full and will not work anymore)
- Press Login and authenticate with google

### Create a own OAuth client (its easy)

Please follow the [Step by Step Guide](https://yukigasai.github.io/obsidian-google-calendar/#/Basics/Installation) that describes the process with images or take a look at this [video](https://youtu.be/TMQ8HZjeauo).

After obtaining the Client ID and Client Secret enter them into the plugin settings.

- Switch on `Use own authentication client` in the settings tab
- add the keys into the fields under the plugin settings
- Press Login

## Usage

### Views

#### Web View

A webframe to the original google calendar page

![](https://i.imgur.com/oukwdQY.png)

#### Month view

A calendar based on the [obsidian-calendar-ui](https://github.com/liamcain/obsidian-calendar-ui) to display events over a month

![](https://i.imgur.com/JEnuZ2E.png)

#### Day view

A timeline view to see all events over a day

![](https://i.imgur.com/f9nYmOn.png)

#### Week view

A timeline view to see all events over a week

![](https://i.imgur.com/KDYTaIJ.png)

#### Year view

A Github like calendar view to see all events over a year

![](https://i.imgur.com/rlcitLA.png)

#### Schedule view

A schedule view to see all your event in a order

![](https://i.imgur.com/HkYQg4Z.png)

### Commands

| Name                                            | Description                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| Open Google Calendar web view                   | Opens the web view                                                         |
| Open Google Calendar month view                 | Opens the month/calendar view                                              |
| Open Google Calendar day view                   | Opens the day/timeline view                                                |
| Open Google Calendar schedule view              | Opens the schedule view                                                    |
| Insert Google Events                            | Inserts events into the active file as a table or list                     |
| Insert Google Event CodeBlock                   | Inserts a codeblock into the active file to display the 3 views            |
| Insert Google Event Template                    | Inserts a template string into the active file to insert event information |
| List Google Events                              | Opens a dropdown to view todays events                                     |
| List Google Calendars                           | Opens a dropdown to view all calendars                                     |
| Create Google Calendar Event                    | Opens an empty details view to create a new event                          |
| Create Google Calendar Event from frontmatter   | Creates an event from the yaml of an open file                             |
| Google Calendar Trigger Auto Import             | Runs the Auto create Notes function again                                  |
| Create Event Note                               | Creates an event note for a selected event                                 |
| Create Event Note for current event             | Creates an event note for a currently running selected event               |

### @Annotation

Reference Google Calendar events inside text by typing @today or @01.01.2022 then select the event you want to insert.

Other Options are @tomorrow, @yesterday, @+1 @-1

### CodeBlock

This plugin adds a custom codeBlock gEvent to insert the Web, Day, Week, Month, year and schedule view inside file. To options are parsed with yaml. You can use the settings from the views to copy the configuration as a codeblock.

#### Parameters

````
    ```gEvent
        type: [web, month, day, schedule] necessary
        date: [today, tomorrow, yesterday, A specific date] optional
        width: number optional
        height: number  optional
        navigation: boolean optional only for timeline view
        timespan: number optional only for schedule view
        include: [list of calendar ids or names]
        exclude: [list of calendar ids or names]
        theme: [light, dark, auto] only for web view
        hourRange: [start, end] only for day view
    ```
````
Instead of declaring the parameters directly javascript can be used to set them dynamically. Signal a javascript expression by using `;` as prefix and suffix.
Example:
~~~
```gEvent
type: week
date: ;window.moment().startOf("week");
navigation: true
```
~~~

### Auto create Notes

The plugin allows you to generate notes automatically from Google Events.

1. To achieve this, activate it inside the settings.
1. Select an Import date range. This is the range in which events are checked. The center is always today.
1. Google events that contain `:obsidian:` inside the description will create new notes if the plugin starts

You can also define a template that should be used when creating new notes by adding the template title `:obsidian-UniTemplate:`
Make sure to activate the core plugin Templates or the Templater plugin.

You can also define a position where the new note should be saved by adding the folder location in front of the text like this `:Folder/Path-obsidian:`

Example `:Uni/Math-obsidian-UniTemplate:` Create the node in the folder Math with the Template UniTemplate.

To insert event information into templates use `{{gEvent.AnyField}}` for both plugins

Example

```
Event Description

{{gEvent.description}}

```

The fields to use are defined in the [Google Calendar API](https://developers.google.com/calendar/api/v3/reference/events) and can be selected from the dropdown menu

Inserting a template strings into a file that already has an inserted event using @Annotation will automatically replace the template with the event information.

### Use daily notes

To make this plugin a one stop solution for calendars in obsidian you can enable the setting `Show daily notes`. This will allow you to see your daily notes and google events inside the month view and will add the option to view or create a daily note when opening an event select.
![modal with daily note](https://i.imgur.com/LhhP7C2.png)

## Thank you to the following plugins:

[obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin)

[Obsidian Custom Frames](https://github.com/Ellpeck/ObsidianCustomFrames)

[Hotkeys for templates](https://github.com/Vinzent03/obsidian-hotkeys-for-templates)

[obsidian-periodic-notes](https://github.com/liamcain/obsidian-periodic-notes)

## Sponsor

If you like the plugin maybe 👉👈

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q5Q1G07N2)
