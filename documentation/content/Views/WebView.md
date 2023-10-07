---
title: Web View
---

The web view is special. It differentiates itself from the others by displaying the [Google Calendar Web App](https://calendar.google.com/calendar/) directly.
This means that you can use all the features of the Google Calendar Web App in Obsidian.
It is not required to authenticate with Google to use the web view.
Instead of the authentication described in the [[Setup]] you have to login inside the view itself.
If your only intension is to use this view I strongly recommend to use the [ObsidianCustomFrames](https://github.com/Ellpeck/ObsidianCustomFrames) instead.

## Usage

Open the web view with the `Open gCal Web View` command.
To use the web view in a [[Codeblocks]] you have to set the [[TypeSetting | Type]] to `web`.
If there is no login option inside the view, open the [[ViewSettings]] and click the `Login` button.
The view will be redirected to the Google login page.
After logging in, refresh the view to see your calendar.

## Functionality

The web view has the same functionality as the Google Calendar Web App.

## Settings

As with other [[Views]] the web view can be configured in the [[ViewSettings | View Settings]].
Possible settings are:

- [[OffsetSetting | Offset]]
- [[WebThemeSetting |Theme]]
- [[WebViewSetting | View]]

## Example

~~~md
```gEvent
type: web
offset: 0
theme: dark
view: week
```
~~~

<video src="webViewExample.mp4" controls title="Web View Example"></video>
