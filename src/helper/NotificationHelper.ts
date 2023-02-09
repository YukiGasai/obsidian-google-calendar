import { Platform } from "obsidian";
import type { GoogleEvent } from "../helper/types";
import { findEventNote } from "src/helper/Helper";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const createNotification = async (event: GoogleEvent): Promise<void> => {

    // Notifications are not supported on mobile because electron is no used
    if(Platform.isMobile) {
        return;
    }

    const plugin = GoogleCalendarPlugin.getInstance();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { remote } = require('electron');

    //check if event note exists
    const { file: eventNote } = findEventNote(event, plugin)

    const buttonContent = eventNote ? "Open Note" : "Create Note";

    const title = event.summary ?? "Event started";
    const body = event.description ?? "";
    let notification: any;

    if (process.platform === 'win32') {
        //Notification for windows
        notification = new remote.Notification({
            toastXml: `
            <toast 
                content="Open Note"
                arguments="obsidian://googleOpenNote?event=${event.id}::${event.parent.id}"
                activationType="protocol"
            >
                <visual>
                    <binding template="ToastGeneric">
                        <text>Google event now</text>
                        <text>Title: ${title}</text>
                        <text>Description: ${body}</text>
                    </binding>
                </visual>

                <actions>
                    <action
                        content="${buttonContent}"
                        arguments="obsidian://googleOpenNote?event=${event.id}::${event.parent.id}"
                        activationType="protocol"/>

                    <action activationType="background" content="Dismiss" arguments="dismiss"/>
                </actions>
            </toast>`})


    } else if (process.platform === 'darwin') {
        //Notification for mac
        notification = new remote.Notification({
            title,
            body,
            actions: [{
                type: 'button',
                text: buttonContent
            }, {
                type: 'button',
                text: 'Dismiss'
            }],
        })

        notification.on('action', (e, buttonIndex) => {
            //Create/Open button was clicked
            if (buttonIndex === 0) {
                window.open(`obsidian://googleOpenNote?event=${event.id}::${event.parent.id}`);
            }
        });

    } else {
        //Notification for linux
        //Not supported by electron
    }

    //Display the notification
    notification.show();

}
