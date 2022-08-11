
/**
 * A helper function to easily create settings with custom html elements 
 * @param root the container element 
 * @param title the title of the setting displayed on the left side top
 * @param description the description of the setting displayed on the left side bottom
 * @returns the setting
 */
export function customSetting(
	root: HTMLElement,
	title: string,
	description: string,
	extraClass?: string,
): HTMLElement {
	const settingItem = root.createDiv({ cls: `setting-item ${extraClass ?? ""}` });

	const settingIitemInfo = settingItem.createDiv({
		cls: "setting-item-info",
	});

	settingIitemInfo.createDiv({
		cls: "setting-item-name",
		text: title,
	});

	settingIitemInfo.createDiv({
		cls: "setting-item-description",
		text: description,
	});

	const settingItemControl = settingItem.createDiv({
		cls: "setting-item-control",
	});

	return settingItemControl;
}
