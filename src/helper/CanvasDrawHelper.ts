import events from "events";
import { DateToPercent } from "./DateToPercent";
import type { GoogleEvent } from "./types";

export function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	if (width < 2 * radius) radius = width / 2;
	if (height < 2 * radius) radius = height / 2;
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + width, y, x + width, y + height, radius);
	ctx.arcTo(x + width, y + height, x, y + height, radius);
	ctx.arcTo(x, y + height, x, y, radius);
	ctx.arcTo(x, y, x + width, y, radius);
	ctx.closePath();
	return ctx;
}

export function getEventStartPosition(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	const startPercentage = DateToPercent(new Date(event.start.dateTime));
	return timeLineHeight * startPercentage;
}

export function getEventHeight(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	const startPercentage = DateToPercent(new Date(event.start.dateTime));
	const endPercentage = DateToPercent(new Date(event.end.dateTime));

	return timeLineHeight * (endPercentage - startPercentage);
}
