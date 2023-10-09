---
title: AtAnnotation
---

The @Annotation allows you to reference Google Calendar events inside a note by typing typing `@` followed by a date or a keyword like `today` or `tomorrow` then select the event you want to insert.

Possible options are:

- `@today`
- `@nextmonday`
- `@in2weeks`
- `@+n` where n is a number
- `@-n` where n is a number
- `@YYYY-MM-DD`
- `@MM-DD-YYYY`

> Type a space to confirm your input and trigger the selection menu

To detect the date from text the [Chrono](https://github.com/wanasit/chrono) library is used.

To allow the detection of dates in the format of `@DD-MM-YYYY` the [[UsDateFormat]] option must be set to `false`.

![AtAnnotation example](./AtAnnotation.gif)

After inserting the event, the plugin will know that every reference made is related to this event.

You can insert information inside a note by writing `{{gEvent.<Any option>}}`

> Type a space to confirm your input and trigger the insert

![Detail Insert Example](./detailInsert.gif)

When there a multiple events inserted in one note add a zero based index to gEvent to select the event.
When the note is an [[EventNote]] the first event will always be the event linked to the note by the id in the frontmatter.

`{{gEvent<index>.summary}}`
