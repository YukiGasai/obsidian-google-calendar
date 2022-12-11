# @Anotation

Reference Google Calendar events inside a note by typing @today or @01.01.2022 then select the event you want to insert.

Other Options are @tomorrow, @yesterday, @+n @-n 

> Type a space to confirm your input and trigger the selection menu

![@Anotation example](../img/@Anotation.gif)

After inserting the event, the plugin will know that every refrence made is related to this event.

You can insert information inside a note by writing `{{gEvent.<Any option>}}`

> Type a space to confirm your input and trigger the insert

![DetailInsert Example](../img/DetailInsert.gif)

When there a multiple events inserted in one note add a zero based insex to gEvent to select the event

`{{gEvent<index>.summary}}` 
 

