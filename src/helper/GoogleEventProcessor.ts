import { Platform } from "obsidian";

export async function GoogleEventProcessor(text: string, el: HTMLElement) {
	if (text.contains("today")) {
		if (Platform.isDesktopApp) {
			const frame: any = document.createElement("webview");
			frame.setAttribute(
				"src",
				"https://calendar.google.com/calendar/u/0/r/day"
			);

			frame.setAttribute("allowpopups", "");

			frame.addEventListener("dom-ready", () => {});

			el.appendChild(frame);
		}
	}
}
