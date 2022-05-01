export function customSetting(
	root: HTMLElement,
	title: string,
	description: string
): HTMLElement {
	const settingTtem = root.createDiv({ cls: "setting-item" });

	const settingIitemInfo = settingTtem.createDiv({
		cls: "setting-item-info",
	});

	const settingItemName = settingIitemInfo.createDiv({
		cls: "setting-item-name",
		text: title,
	});

	const settingItemDescription = settingIitemInfo.createDiv({
		cls: "setting-item-description",
		text: description,
	});

	const settingItemControl = settingTtem.createDiv({
		cls: "setting-item-control",
	});

	return settingItemControl;
}
