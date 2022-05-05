import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { Platform, moment } from "obsidian";
import { googleListTodayEvents } from "src/googleApi/GoogleListTodayEvents";
import { DateToPercent } from "./DateToPercent";
import { roundRect } from "./CanvasDrawHelper";
import {
	googleCalendarColors,
	googleEventColors,
} from "src/googleApi/GoogleColors";

function getKeyValueList(codeBlock: string): Map<string, string> {
	const options = codeBlock.split("\n");

	const result = new Map<string, string>();

	options.forEach((option) => {
		const parts = option.split(":");

		if (parts.length == 2) {
			result.set(
				parts[0].trim().toLowerCase(),
				parts[1].trim().toLowerCase()
			);
		}
	});

	return result;
}

export async function GoogleEventProcessor(
	text: string,
	el: HTMLElement,
	plugin: GoogleCalendarPlugin
) {
	const options = getKeyValueList(text);

	const blockType = options.has("type") ? options.get("type") : "self";

	const blockWidth = options.has("width") ? options.get("width") : "300";

	const blockHeight = options.has("height") ? options.get("height") : "500";

	const blockDate = options.has("date") ? options.get("date") : "today";

	el.style.width = blockWidth + "px";
	el.style.height = blockHeight + "px";

	if (blockType == "web") {
		if (Platform.isDesktopApp) {
			const frame: any = document.createElement("webview");

			if (blockDate === "tomorrow") {
				const tomorrow = moment().add(1, "days");
				const dateString = tomorrow.format("yyyy/M/D");

				frame.setAttribute(
					"src",
					`https://calendar.google.com/calendar/u/0/r/day/${dateString}`
				);
			} else {
				frame.setAttribute(
					"src",
					"https://calendar.google.com/calendar/u/0/r/day"
				);
			}

			frame.setAttribute("allowpopups", "");

			frame.addEventListener("dom-ready", () => {});

			el.appendChild(frame);
		}
	} else if (blockType == "self") {
		const events = await googleListTodayEvents(plugin);

		const todayCanvas = createEl("canvas", { cls: "todayCanvas" });

		const canvasWidth = el.clientWidth;
		const canvasHeight = el.clientHeight;

		todayCanvas.width = canvasWidth;
		todayCanvas.height = canvasHeight;
		el.appendChild(todayCanvas);

		const dayPercentage = DateToPercent(new Date());

		var ctx = todayCanvas.getContext("2d");

		for (let i = 1; i <= 24; i++) {
			ctx.fillStyle = "#FFFFFF";
			ctx.strokeStyle = "#FFFFFF";
			roundRect(
				ctx,
				20,
				canvasHeight * (i / 24),
				canvasWidth,
				1,
				10
			).fill();
			ctx.strokeText("" + i, 5, canvasHeight * (i / 24));
		}

		for (let i = 0; i < events.length; i++) {
			if (events[i].start.dateTime == undefined) continue;
			const startPercentage = DateToPercent(
				new Date(events[i].start.dateTime)
			);
			const endPercentage = DateToPercent(
				new Date(events[i].end.dateTime)
			);

			const startHeight = canvasHeight * startPercentage;
			const totalHeight =
				canvasHeight * (endPercentage - startPercentage);

			const eventColors = googleEventColors();

			if (events[i].colorId) {
				console.log(
					events[i].colorId,
					eventColors[parseInt(events[i].colorId) - 1]
				);
				ctx.fillStyle =
					eventColors[parseInt(events[i].colorId) - 1] || "#00FF00";
			} else {
				ctx.fillStyle = events[i].parent?.backgroundColor || "#00FF00";
			}

			roundRect(
				ctx,
				20,
				startHeight,
				canvasWidth - 20,
				totalHeight,
				10
			).fill();
			ctx.strokeStyle = "#000000";
			ctx.strokeText(
				events[i].summary,
				20,
				startHeight + 10,
				canvasWidth - 20
			);
		}

		let height = Math.floor(canvasHeight * dayPercentage);
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(0, height - 3, canvasWidth, 6);
	}
}
