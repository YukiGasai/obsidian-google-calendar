/**
 * Function to calculate how much a day has gone by in Percent
 */
export function DateToPercent(date: Date): number {
	return date.getHours() / 24 + date.getMinutes() / (60 * 24);
}
