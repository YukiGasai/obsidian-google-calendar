import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { Platform } from "obsidian";
import { googleListTodayEvents } from "src/googleApi/GoogleListTodayEvents";
import { DateToPercent } from "./DateToPercent";

export async function GoogleEventProcessor(
	text: string,
	el: HTMLElement,
	plugin: GoogleCalendarPlugin
) {
	if (text.contains("today") && text.contains("page")) {
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
	} else if (text.contains("today")) {
		const colors = [
			"#a4bdfc",
			"#7ae7bf",
			"#dbadff",
			"#ff887c",
			"#fbd75b",
			"#ffb878",
			"#46d6db",
			"#e1e1e1",
			"#5484ed",
			"#51b749",
			"#dc2127",
		];

		const events = await googleListTodayEvents(plugin);

		const todayCanvas = createEl("canvas", { cls: "todayCanvas" });
		todayCanvas.width = 300;
		todayCanvas.height = 700;
		el.appendChild(todayCanvas);

		const dayPercentage = DateToPercent(new Date());

		var ctx = todayCanvas.getContext("2d");

		for (let i = 1; i <= 24; i++) {
			ctx.fillStyle = "#FFFFFF";
			ctx.strokeStyle = "#FFFFFF";
			ctx.fillRect(20, 700 * (i / 24), 260, 1);
			ctx.strokeText("" + i, 5, 700 * (i / 24));
		}

		for (let i = 0; i < events.length; i++) {
			if (events[i].start.dateTime == undefined) continue;
			const startPercentage = DateToPercent(
				new Date(events[i].start.dateTime)
			);
			const endPercentage = DateToPercent(
				new Date(events[i].end.dateTime)
			);

			const startHeight = 700 * startPercentage;
			const totalHeight = 700 * (endPercentage - startPercentage);

			console.log(events[i].htmlLink);

			ctx.fillStyle = colors[parseInt(events[i].colorId)] || "#00FF00";
			ctx.fillRect(20, startHeight, 260, totalHeight);
			ctx.strokeStyle = "#000000";
			ctx.strokeText(events[i].summary, 20, startHeight + 10, 260);
		}

		let height = Math.floor(700 * dayPercentage);
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(0, height - 3, 300, 6);
	}
}
