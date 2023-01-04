import { Notice } from "obsidian";

const noticeMap: Map<string, moment.Moment> = new Map();

/**
 * A wrapper function around Notice to make them be able to only show in an interval
 * @param text The text displayed inside the Notice
 */
export function createNotice(
	text: string,
	ignoreTimeout = false
): void {

	const now = window.moment();

	if (noticeMap.has(text)) {

		const lastDisplay = noticeMap.get(text);

		if (lastDisplay.isBefore(now) || ignoreTimeout) {
			new Notice(text);
			noticeMap.set(text, now.add(1, "minute"))
		}

	} else {
		console.log(`[Google Calendar] ${text}`)
		new Notice(text);
		noticeMap.set(text, now.add(0, "minute"))
	}

}

