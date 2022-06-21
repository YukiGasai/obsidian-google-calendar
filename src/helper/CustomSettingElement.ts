export function customSetting(
	root: HTMLElement,
	title: string,
	description: string
): HTMLElement {
	const settingTtem = root.createDiv({ cls: "setting-item" });

	const settingIitemInfo = settingTtem.createDiv({
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

	const settingItemControl = settingTtem.createDiv({
		cls: "setting-item-control",
	});

	return settingItemControl;
}
