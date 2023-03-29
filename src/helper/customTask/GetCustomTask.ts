import { parseYaml } from "obsidian";
import { listEvents } from "../../googleApi/GoogleListEvents";
import type { CustomTask, ListOptions } from "../types"

export const getCustomTasks = async (listOptions: ListOptions = {}): Promise<CustomTask[]> => {

    const events = await listEvents(listOptions);

    const taskList:CustomTask[] = events.map(event => {
        if(!event.description?.includes("~obsidianTask~")){
            return null;
        }
        const cleanDescription = event.description.replace(/<br>/g, "\n").replace(/<\/?[^>]+(>|$)/g, "");
        const foundTaskOptions = parseYaml(cleanDescription);

        const foundTask:CustomTask = {
            event: event,
            current: foundTaskOptions.current || 0,
            steps: foundTaskOptions.steps || 0,
            goal: foundTaskOptions.goal || 0,
            done: foundTaskOptions.done || false,
        }

        return foundTask;
    }).filter(task => task !== null)

    return taskList;
}


export const getTodaysCustomTasks = async (): Promise<CustomTask[]> => {
    return await getCustomTasks();
}