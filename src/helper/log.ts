import GoogleCalendarPlugin from "../GoogleCalendarPlugin";

export const log = (...args: any[]): void => {
    const plugin = GoogleCalendarPlugin.getInstance();
    if (plugin.settings.debugMode) {
        console.log('[Google Calendar]', ...args);
    }
}

export const logError = (...args: any[]): void => {
    const plugin = GoogleCalendarPlugin.getInstance();
    if (plugin.settings.debugMode) {
        console.error('[Google Calendar]', ...args);
    }
}