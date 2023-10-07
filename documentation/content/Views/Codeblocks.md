---
title: Codeblocks
---

This plugin adds a new codeblock language `gEvent` that allows you to display [[Views]] inside your notes.
To configure the view you can use the different [[ViewSettings]].
Make sure to use valid YAML syntax.

~~~md title="Simple Example"
```gEvent
type: month
offset: 0
include: ["Personal"]
```
~~~

Besides the usual static values you can use javascript to dynamically generate the values.
To indicate the use of javascript, start and end the value with `;`

~~~md title="JS Example"
```gEvent
type: week
date: ;window.moment().startOf("week");
navigation: true
```
~~~
