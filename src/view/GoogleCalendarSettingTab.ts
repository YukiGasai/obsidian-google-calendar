import type { Template } from "../helper/types";
import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import {
	PluginSettingTab,
	App,
	Setting,
	Notice,
	ButtonComponent,
	Platform,
} from "obsidian";
import { LoginGoogle } from "../googleApi/GoogleAuth";
import { getRefreshToken, setAccessToken, setExpirationTime, setRefreshToken } from "../helper/LocalStorage";
import { customSetting } from "src/helper/CustomSettingElement";
import { googleListCalendars } from "../googleApi/GoogleListCalendars";

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
		containerEl.createEl("h4", { text: "Please restart Obsidian to let changes take effect"})
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
		const AuthSetting = new Setting(containerEl);

		const createLogOutButton = (button: ButtonComponent) => {
			button.setButtonText("Logout");
			button.onClick(async () => {
				setRefreshToken("");
				setAccessToken("");
				setExpirationTime(0);
				button.buttonEl.remove();

				AuthSetting.setName("Login");
				AuthSetting.setDesc("Login to your Google Account");
				AuthSetting.addButton((button: ButtonComponent) => {
					button.setButtonText("Login");
					button.onClick(async () => {
						if (settingsAreCorret()) {
							LoginGoogle();
						}
					});
				});
			});
		};

		if (Platform.isDesktop) {
			if (getRefreshToken()) {
				AuthSetting.setName("Logout");
				AuthSetting.setDesc("Logout off your Google Account");
				AuthSetting.addButton(createLogOutButton);
			} else {
				AuthSetting.setName("Login");
				AuthSetting.setDesc("Login to your Google Account");
				AuthSetting.addButton((button: ButtonComponent) => {
					button.setButtonText("Login");
					button.onClick(async () => {
						if (settingsAreCorret()) {
							LoginGoogle();

							let count = 0;
							const intId = setInterval(() => {
								count++;

								if (count > 900) {
									clearInterval(intId);
								} else if (getRefreshToken()) {
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
		} else {
			new Setting(containerEl)
				.setName("Refresh Token")
				.setDesc("Google Refresh Token from OAuth")
				.addText((text) =>
					text
						.setPlaceholder("Enter refresh token")
						.setValue(this.plugin.settings.googleRefreshToken)
						.onChange(async (value) => {
							this.plugin.settings.googleRefreshToken = value;
							setRefreshToken(value);
						})
				);
		}

		new Setting(containerEl)
		.setName("Auto create Event Notes")
		.setDesc("Will create new notes from a event if the description contains :obsidian:")
		.addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.autoCreateEventNotes);
			toggle.onChange(async (state) => {
				this.plugin.settings.autoCreateEventNotes = state;
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
		.setName("Keep auto created Notes open")
		.setDesc("When creating a new note should it stay open for direct editing")
		.addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.autoCreateEventKeepOpen);
			toggle.onChange(async (state) => {
				this.plugin.settings.autoCreateEventKeepOpen = state;
				await this.plugin.saveSettings();
			});
		});

		const ImportStartSetting = customSetting(
			containerEl,
			"Import Start Offset",
			"Days in the past from events to import",
			"SubSettings"
		).createEl("input", {
			type: "number",
		});
		ImportStartSetting.value = this.plugin.settings.importStartOffset + "";
		ImportStartSetting.min = "0";
		ImportStartSetting.step = "1";
		ImportStartSetting.addEventListener("input", async () => {
			this.plugin.settings.importStartOffset = parseInt(
				ImportStartSetting.value
			);
			await this.plugin.saveSettings();
		});


		const ImportEndSetting = customSetting(
			containerEl,
			"Import End Offset",
			"Days in the future from events to import",
			"SubSettings"
		).createEl("input", {
			type: "number",
		});
		ImportEndSetting.value = this.plugin.settings.importEndOffset + "";
		ImportEndSetting.min = "0";
		ImportEndSetting.step = "1";
		ImportEndSetting.addEventListener("input", async () => {
			this.plugin.settings.importEndOffset = parseInt(
				ImportEndSetting.value
			);
			await this.plugin.saveSettings();
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
			await this.plugin.saveSettings();
		});

		const templateList:Template[] = this.plugin.settings.insertTemplates;
		if(templateList.length) {
			new Setting(containerEl).setName("Saved Templates");
			

			templateList.forEach((template:Template) => {
				const setting = new Setting(containerEl)
					.setClass("SubSettings")
					.setName(template.name)
					.addButton((button) => {
						button.setButtonText("Remove");
						button.onClick(async () => {
							this.plugin.settings.insertTemplates.remove(template);
							setting.settingEl.remove();
							await this.plugin.saveSettings();
						});
					});
			});
		}




		if(settingsAreCompleteAndLoggedIn()){

			new Setting(containerEl)
				.setName("Default Calendar")
				.addDropdown(async (dropdown) => {
					dropdown.addOption("Default", "Select a calendar");
					const calendars = await googleListCalendars();

					calendars.forEach((calendar) => {
						dropdown.addOption(
							calendar.id,
							calendar.summary
						);
					});
					dropdown.setValue(this.plugin.settings.defaultCalendar);
					dropdown.onChange(async (value) => {
						this.plugin.settings.defaultCalendar = value;
						await this.plugin.saveSettings();			
					});
				});


			containerEl.createEl("h3", "Calendar Blacklist");
			const calendarBlackList = this.plugin.settings.calendarBlackList;

			new Setting(containerEl)
				.setName("Add Item to BlackList")
				.addDropdown(async (dropdown) => {
					dropdown.addOption("Default", "Select Option to add");
					const calendars = await googleListCalendars();

					calendars.forEach((calendar) => {
						dropdown.addOption(
							calendar.id + "_=_" + calendar.summary,
							calendar.summary
						);
						
					});

					dropdown.onChange(async (value) => {
						const [id, summery] = value.split("_=_");
						if (!calendarBlackList.contains([id, summery])) {
							this.plugin.settings.calendarBlackList = [
								...calendarBlackList,
								[id, summery],
							];

							await this.plugin.saveSettings();
						}
						const setting = new Setting(containerEl)
							.setClass("SubSettings")
							.setName(summery)
							.addButton((button) => {
								button.setButtonText("Remove");
								button.onClick(async () => {
									this.plugin.settings.calendarBlackList.remove([
										id,
										summery,
									]);
									setting.settingEl.remove();
									await this.plugin.saveSettings();
								});
							});
					});
				});

			calendarBlackList.forEach((calendar) => {
				const setting = new Setting(containerEl)
					.setClass("SubSettings")
					.setName(calendar[1])
					.addButton((button) => {
						button.setButtonText("Remove");
						button.onClick(async () => {
							this.plugin.settings.calendarBlackList.remove(calendar);
							setting.settingEl.remove();
							await this.plugin.saveSettings();
						});
					});
			});
		}
	}
}

export function settingsAreComplete(showNotice = true): boolean {
	const plugin = GoogleCalendarPlugin.getInstance();
	if (
		plugin.settings.googleApiToken == "" ||
		plugin.settings.googleClientId == "" ||
		plugin.settings.googleClientSecret == ""
	) {
		createNotice("Google Calendar missing settings", showNotice);
		return false;
	}
	return true;
}

export function settingsAreCorret(): boolean {
	const plugin = GoogleCalendarPlugin.getInstance();
	if (
		/^AIza[0-9A-Za-z-_]{35}$/.test(plugin.settings.googleApiToken) == false
	) {
		new Notice("API Token is not the correct format");
		return false;
	} else if (
		/^[0-9a-zA-z-]*\.apps\.googleusercontent\.com$/.test(
			plugin.settings.googleClientId
		) == false
	) {
		new Notice("Client ID Token is not the correct format");
		return false;
	} else if (
		/^[0-9a-zA-z-]*$/.test(plugin.settings.googleClientSecret) == false
	) {
		new Notice("Client Secret is not the correct format");
		return false;
	}
	return true;
}

export function settingsAreCompleteAndLoggedIn(showNotice = true): boolean {
	if (!settingsAreComplete(false) || getRefreshToken() == "") {
		createNotice(
			"Google Calendar missing settings or not logged in",
			showNotice
		);
		return false;
	}
	return true;
}
