
# Obsidian Google Calendar

Manage your Google Calendar from inside Obsidian

## Features

-   List Events
-   Create Events 
-   Edit Events   
-   Delete Events 
-   Auto create Notes from Events
-   Insert Links to Events into Notes

## Installation

-   Download obsidian-google-calendar from the latest [release](https://github.com/YukiGasai/obsidian-google-calendar/releases/)
-   Extract zip into `.obsidian/plugins` folder
-   Restart Obsidian
-   Activate inside the obsidian settings page
-   [Create Google Cloud Project](https://console.cloud.google.com/projectcreate?)
-   [Activate Google Calendar API](https://console.cloud.google.com/marketplace/product/google/calendar-json.googleapis.com)
-   [Configure OAUTH screen](https://console.cloud.google.com/apis/credentials/consent?)
    -   Select Extern
    -   Fill necessary inputs
    -   Add your email as tester if using "@gmail" add gmail and googlemail
-   [Add API Token](https://console.cloud.google.com/apis/credentials)
-   [Add OAUTH client](https://console.cloud.google.com/apis/credentials/oauthclient)
    -   select Webclient
    -   add `http://127.0.0.1:42813` as Javascript origin
    -   add `http://127.0.0.1:42813/callback` as redirect URI
-   add the keys into the fields under the plugin settings
-   Press Login


### Using the plugin on Mobile (work around)

-   Login on a desktop device
-   Use the `Copy Google Refresh Token to Clipboard` command on that device
-   Install the plugin on the phone
-   Instead of `Login` paste the token from the desktop device into the Refresh token field on the phone

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

#### Schedule view
A schedule view to see all your event in a order

![](https://i.imgur.com/HkYQg4Z.png)


### Commands


| Name | Description |
| ---  | --- |
| Open Google Calendar web view|       Opens the web view |
| Open Google Calendar month view|     Opens the month/calendar view|
| Open Google Calendar day view|       Opens the day/timeline view|
| Open Google Calendar schedule view|  Opens the schedule view|
| Insert todays Google Events|         Inserts todays events into the active file as a table |
| Insert Google Event CodeBlock|       Inserts a codeblock into the active file to display the 3 views  |
| List Google Events|                  Opens a dropdown to view todays events |
| List Google Calendars|               Opens a dropdown to view all calendars |
| Create Google Calendar Event|        Opens an empty details view to create a new event |
| Google Calendar Trigger Auto Import| Runs the Auto create Notes function again |
| Copy Google Calendar Refresh Token to Clipboard|  Copies the refresh token (PC only) |


### @Anotation
Refrence Google Calendar events inside text by typing @today or @01.01.2022 then select the event you want to insert.

Other Options are @tomorrow, @yesterday, @+1 @-1 

### CodeBlock
This plugin adds a cutom codeBlock gEvent to insert the Web, Month and day view inside file

#### Parameters
```
    ```gEvent
        type: [web, month, day] necessary
        date: [today, tomorrow, yesterday, A specific date] optional
        width: number optional
        height: number  optional
        navigation: boolean optional only for timeline view
        timespan: number optional only for schedule view
    ```
```

### Auto create Notes

The plugin allows you to generate notes automatically from Google Events.
1. To achieve this, activate it inside the settings.
1. Select an Import date range. This is the range in which events are checked. The center is always today.
1. Google events that contain `:obsidian:` inside the description will create new notes if the plugin starts

You can also define a template that should be used when creating new notes by adding the template title `:obsidian-UniTemplate:`
Make sure to activate the core plugin Templates or the Templater plugin.

You can also deifine a position where the new note should be saved by adding the folder location infornt of the text like this `:Folder/Path-obsidian:`

Example `:Uni/Math-obsidian-UniTemplate:` Create the node in the folder Math with the Template UniTemplate.

To insert event information into tempates use `{{gEvent.AnyField}}` or `<%gEvent.AnyField%>` for Templater

Example
```
Event Description

{{gEvent.description}}

Event Organizer

<%gEvent.organizer.email%>
```
The fields to use are defined in the [Google Calendar API](https://developers.google.com/calendar/api/v3/reference/events) and can be selected from the dropdown menu

Inserting a template strings into a file that already has an inserted event using @Anotation will automatically replace the template with the event information. 


## Thank you to the following plugins: 

[obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin)

[Obsidian Custom Frames](https://github.com/Ellpeck/ObsidianCustomFrames)

[Hotkeys for templates](https://github.com/Vinzent03/obsidian-hotkeys-for-templates)



