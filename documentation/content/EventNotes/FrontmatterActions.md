---
title: Frontmatter Actions
---

Frontmatter Actions are a set of commands to create, update and delete Google events by using the frontmatter of an active note.

## Create Event from Frontmatter

To create a new Google Event from the frontmatter of an active note use the `Create gCal Event from Frontmatter` command.
This command will only run if no `event-id` is present in the frontmatter, signaling that this note is not linked to an event yet.
The command will create a new event and use the data provided by the frontmatter to fill in the details.
After the event is created the `event-id` will be added to the frontmatter, turning this note into an [[EventNote]].
To allow a more flexible naming you can use a [[mapping]].

~~~md title="Example"
---
title: My event title
start:
  dateTime: 2023-10-01T12:00:00+02:00
end:
  dateTime: 2023-10-01T13:00:00+02:00
location: My event location
---
~~~

## Update Event from Frontmatter

To update an existing Google Event from the frontmatter of an active note use the `Update gCal Event from Frontmatter` command.
This command will only run if an `event-id` is present in the frontmatter, signaling that this note is an [[EventNote]].
The command will update the event and use the data provided by the frontmatter to fill in the details.
To allow a more flexible naming you can use a [mapping](#mapping).

## Delete Event from Frontmatter

To delete an existing Google Event from the frontmatter of an active note use the `Delete gCal Event from Frontmatter` command.
This command will only run if an `event-id` is present in the frontmatter, signaling that this note is an [[EventNote]].
The command will delete the event and remove the `event-id` from the frontmatter.

## Mapping

The mapping is a way to define how the frontmatter of a note is mapped to the event details.
This allows you to use different names for the frontmatter and the event details.
The mapping is defined in another note and can then by selected by using the `mapping` key in the frontmatter with the path to the mapping note.

~~~md title="MappingNoteExample.md"
---
mapping:
 title: summary
 start: start.date
 end: end.date
 startTime: start.dateTime
 endTime: end.dateTime
---
~~~

~~~md title="Example note"
---
mapping: SubFolder/MappingNoteExample.md
title: Test
start: 2023-10-01T03:57:00
end: 2023-10-05T18:50:00
---

# Note title

Note content
~~~

## Special Values

You can include the content of the note in the event description.

- To include the whole note set the `description` key to `File`.
- To include only the headers set the `description` key to `Headers`.
- To include specific section of the note set the `description` key to an array of numbers.

The numbers represent the headers of the note.
If the header is included in the array the content under the header will be included in the description.
You can use negative numbers to address the headers from the end of the note.
Instead of a number you can also enter a array of two numbers indication a range of headers.

Examples:

- `description: [0, 1]` will include the content of the first two headers.
- `description: [0, -1]` will include the content of the first and last header.
- `description: [[0, 2], [-3, -1]]` will include the content of the first three and the last three headers.

~~~md title="Example note"
---
mapping: SubFolder/MappingNoteExample.md
title: Test
start: 2023-10-01T03:57:00
end: 2023-10-05T18:50:00
description: [0, -1]
---
~~~
