# Obsidian Google Calendar

Manage your Google Calendar from inside Obsidian

## Features

-   List Events ✔
-   Create Events
-   Edit Events (Will create a new task and delete the old one)
-   Delete Events

## Installation

-   Download obsidian-google-calendar from the latest [release](https://github.com/YukiGasai/obsidian-google-calendar/releases/)
-   Extract zip into `.obsidian/plugins` folder
-   Restart Obsidian
-   Activate inside the obsidian settings page
-   [Create Google Cloud Project](https://console.cloud.google.com/projectcreate?)
-   [Activate Google Tasks API](https://console.cloud.google.com/marketplace/product/google/tasks.googleapis.com?q=search&referrer=search&project=iron-core-327018)
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

### Google Calendar Day View

-   Open view by pressing the calendar icon in the left sidebar
-   View will show you a timeine for the current day
    -   Interact with an event by clicking on it
    -   Edit the event by long pressing it
    -   Press the plus button to create a new event
    -   use the arrow buttons to switch between days

### Commands

#### List Google Events

Shows a list of all events of the current day from every calendar

#### List Google Calendars

Shows a list of all calendars selecting a calendar will show todays events

#### Insert Todays Events

Will insert a table into the currently opened file
The table contains all events of the current day from every calendar
