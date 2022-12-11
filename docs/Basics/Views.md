# Views

The plugin suports 4 different views. 
- [Day view](#Day-view)
- [Month view](#Month-view)
- [Schedule view](#Schedule-view)
- [Web view](#Web-view)

Every view can be displayed in a leaf or as a embeded codeblock.

## Open view

To open a view as in a leaf, use the `Open Google Calendar ... view`

To display a view inside a note, add a gEvent code block

~~~markdown
```gEvent
        type: [web, month, day]
        date: [today, tomorrow, yesterday, A specific date]
        width: number
        height: number 
        navigation: boolean only for timeline view
        timespan: number only for schedule view
        include: [list of calendar ids or names]
        exclude: [list of calendar ids or names]
```
~~~


## Day view
A timeline view to see all events over a day
![](https://i.imgur.com/f9nYmOn.png)

When using codeblock the option `navigation` can be toggled on or off to hide the day/week navigation

## Month view
A calendar based on the [obsidian-calendar-ui](https://github.com/liamcain/obsidian-calendar-ui) to display events over a month

![](https://i.imgur.com/JEnuZ2E.png)

It is possible to additionaly show your daily notes to activate this feature enable `Show daily notes` in the plugin settings

## Schedule view
A schedule view to see all your event in order

![](https://i.imgur.com/HkYQg4Z.png)

## Web view
A webframe to the original google calendar page

![](https://i.imgur.com/oukwdQY.png)