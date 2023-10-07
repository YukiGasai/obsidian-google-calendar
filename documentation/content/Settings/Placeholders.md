---
title: Placeholders
---

Placeholders are used to add dynamic content to strings.
Placeholders are used in specific functions of the plugin.

- The [[EventNoteNameFormat]] setting uses placeholders to define the name of an [[EventNote]].
- The [[AutoImport]] signature uses placeholders to define the location where an event note is saved.

## Available Placeholders

| Placeholder | Description |
| ----------- | ----------- |
| `{{prefix}}` | A prefix defined in the [[]] Setting|
| `{{date}}` | Current date in YYYY-MM-DD format |
| `{{date-year}}` | Current year in YYYY format |
| `{{date-month}}` | Current month in MM format |
| `{{date-day}}` | Current day in DD format |
| `{{date-hour}}` | Current hour in hh format |
| `{{date-hour24}}` | Current hour in HH format (24h) |
| `{{date-minute}}` | Current minute in mm format |
| `{{event-date}}` | Start date of event in YYYY-MM-DD format |
| `{{event-year}}` | Start year of event in YYYY format |
| `{{event-month}}` | Start month of event in MM format |
| `{{event-day}}` | Start day of event in DD format |
| `{{event-hour}}` | Start hour of event in hh format |
| `{{event-hour24}}` | Start hour of event in HH format (24h) |
| `{{event-minute}}` | Start minute of event in mm format |
| `{{event-end-hour}}` | End hour of event in hh format |
| `{{event-end-hour24}}` | End hour of event in HH format (24h) |
| `{{event-end-minute}}` | End minute of event in mm format |
| `{{event-title}}` | Title of event |

The prefix placeholder could become deprecated in the future.
It better to just use the prefix directly in the string.
