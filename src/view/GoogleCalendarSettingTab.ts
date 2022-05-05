import { createNotice } from "src/helper/NoticeHelper";
import {
	PluginSettingTab,
	App,
	Setting,
	Notice,
	ButtonComponent,
} from "obsidian";
import { LoginGoogle } from "../googleApi/GoogleAuth";
import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";

import { getRT, setAT, setET, setRT } from "../helper/LocalStorage";
import { customSetting } from "src/helper/CustomSettingElement";

export class GoogleCalendarSettingTab extends PluginSettingTab {
	plugin: GoogleCalendarPlugin;

	constructor(app: App, plugin: GoogleCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for Google Calendar" });

		new Setting(containerEl)
			.setName("ClientId")
			.setDesc("Google client id")
			.addText((text) =>
				text
					.setPlaceholder("Enter your client id")
					.setValue(this.plugin.settings.googleClientId)
					.onChange(async (value) => {
						this.plugin.settings.googleClientId = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("ClientSecret")
			.setDesc("Google client secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your client secret")
					.setValue(this.plugin.settings.googleClientSecret)
					.onChange(async (value) => {
						this.plugin.settings.googleClientSecret = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("ApiToken")
			.setDesc("Google Api Token")
			.addText((text) =>
				text
					.setPlaceholder("Enter your api token")
					.setValue(this.plugin.settings.googleApiToken)
					.onChange(async (value) => {
						this.plugin.settings.googleApiToken = value;
						await this.plugin.saveSettings();
					})
			);
		let AuthSetting = new Setting(containerEl);

		const createLogOutButton = (button: ButtonComponent) => {
			button.setButtonText("Logout");
			button.onClick(async (event) => {
				setRT("");
				setAT("");
				setET(0);
				button.buttonEl.remove();

				AuthSetting.setName("Login");
				AuthSetting.setDesc("Login to your Google Account");
				AuthSetting.addButton((button: ButtonComponent) => {
					button.setButtonText("Login");
					button.onClick(async (event) => {
						if (settingsAreCorret(this.plugin)) {
							LoginGoogle(this.plugin);
						}
					});
				});
			});
		};

		if (getRT()) {
			AuthSetting.setName("Logout");
			AuthSetting.setDesc("Logout off your Google Account");
			AuthSetting.addButton(createLogOutButton);
		} else {
			AuthSetting.setName("Login");
			AuthSetting.setDesc("Login to your Google Account");
			AuthSetting.addButton((button: ButtonComponent) => {
				button.setButtonText("Login");
				button.onClick(async (event) => {
					if (settingsAreCorret(this.plugin)) {
						LoginGoogle(this.plugin);

						let count = 0;
						let intId = setInterval(() => {
							count++;

							if (count > 900) {
								clearInterval(intId);
							} else if (getRT()) {
								clearInterval(intId);
								button.buttonEl.remove();
								AuthSetting.setName("Logout");
								AuthSetting.setDesc(
									"Logout off your Google Account"
								);
								AuthSetting.addButton(createLogOutButton);
							}
						}, 200);
					}
				});
			});
		}

		new Setting(containerEl)
			.setName("Confirmations")
			.setDesc("Ask for confirmations when deleting a event")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.askConfirmation);
				toggle.onChange(async (state) => {
					this.plugin.settings.askConfirmation = state;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Notifications")
			.setDesc("Show notifications of info and errors")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showNotice);
				toggle.onChange(async (state) => {
					this.plugin.settings.showNotice = state;
					await this.plugin.saveSettings();
				});
			});

		const RefreshIntervalInput = customSetting(
			containerEl,
			"Refresh Interval",
			"Time in seconds between refresh request from google server"
		).createEl("input", {
			type: "number",
		});
		RefreshIntervalInput.value = this.plugin.settings.refreshInterval + "";
		RefreshIntervalInput.min = "10";
		RefreshIntervalInput.step = "1";
		RefreshIntervalInput.addEventListener("input", async () => {
			this.plugin.settings.refreshInterval = parseInt(
				RefreshIntervalInput.value
			);
			//TODO
			// this.app.workspace
			// 	.getLeavesOfType(VIEW_TYPE_GOOGLE_CALENDAR)
			// 	.forEach((leaf) => {
			// 		if (leaf.view instanceof GoogleTaskView) {
			// 			leaf.view.setRefreshInterval();
			// 		}
			// 	});
			await this.plugin.saveSettings();
		});
	}
}

export function settingsAreComplete(
	plugin: GoogleCalendarPlugin,
	showNotice: boolean = true
): boolean {
	if (
		plugin.settings.googleApiToken == "" ||
		plugin.settings.googleClientId == "" ||
		plugin.settings.googleClientSecret == ""
	) {
		createNotice(plugin, "Google Calendar missing settings", showNotice);
		return false;
	}
	return true;
}

export function settingsAreCorret(plugin: GoogleCalendarPlugin): boolean {
	if (
		/^AIza[0-9A-Za-z-_]{35}$/.test(plugin.settings.googleApiToken) == false
	) {
		new Notice("API Token is not the correct format");
		return false;
	} else if (
		/^[0-9a-zA-z\-]*\.apps\.googleusercontent\.com$/.test(
			plugin.settings.googleClientId
		) == false
	) {
		new Notice("Client ID Token is not the correct format");
		return false;
	} else if (
		/^[0-9a-zA-z\-]*$/.test(plugin.settings.googleClientSecret) == false
	) {
		new Notice("Client Secret is not the correct format");
		return false;
	}
	return true;
}

export function settingsAreCompleteAndLoggedIn(
	plugin: GoogleCalendarPlugin,
	showNotice: boolean = true
): boolean {
	if (!settingsAreComplete(plugin, false) || getRT() == "") {
		createNotice(
			plugin,
			"Google Calendar missing settings or not logged in",
			showNotice
		);

		return false;
	}
	return true;
}
