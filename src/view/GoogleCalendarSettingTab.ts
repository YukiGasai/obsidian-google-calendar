import { InfoModalType, Template } from "../helper/types";
import GoogleCalendarPlugin from "src/GoogleCalendarPlugin";
import { createNotice } from "src/helper/NoticeHelper";
import {
	PluginSettingTab,
	App,
	Setting,
	Notice,
} from "obsidian";
import { clearClient, clearTokens, getClientId, getClientSecret, isLoggedIn, setClientId, setClientSecret, setTokenPassword, } from "../helper/LocalStorage";
import { listCalendars } from "../googleApi/GoogleListCalendars";
import { FileSuggest } from "../suggest/FileSuggest";
import { FolderSuggest } from "../suggest/FolderSuggester";
import { checkForNewWeeklyNotes } from "../helper/DailyNoteHelper";
import { SettingsInfoModal } from "../modal/SettingsInfoModal";
import { pkceFlowServerStart } from "../googleApi/oauth/pkceServerFlow";
import { pkceFlowLocalStart } from "../googleApi/oauth/pkceLocalFlow";

export class GoogleCalendarSettingTab extends PluginSettingTab {
	plugin: GoogleCalendarPlugin;
	clientId: string;
	clientSecret = '';
	oauthServer = '';
	constructor(app: App, plugin: GoogleCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.oauthServer = this.plugin.settings.googleOAuthServer;
		(async () => {
			this.clientId = await getClientId();
			this.clientSecret = await getClientSecret();
		})();
	}

	async display(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for Google Calendar" });
		containerEl.createEl("h4", { text: "Please restart Obsidian to let changes take effect" })


		new Setting(containerEl)
			.setName('Protect google Login')
			.setDesc('This will encrypt the google login data with a password you set.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.encryptToken)
				toggle.onChange(async (value) => {
					if (value === false) {
						new SettingsInfoModal(this.app, InfoModalType.ENCRYPT_INFO).open();
					}
					this.plugin.settings.encryptToken = value;
					await this.plugin.saveSettings();
					clearTokens();
					clearClient();
					setTokenPassword(null)
					this.display();
				});
			});

		const clientDesc = document.createDocumentFragment();
		clientDesc.append(
			"Use own authentication client",
			clientDesc.createEl("br"),
			"Check the ",
			clientDesc.createEl("a", {
				href: "https://yukigasai.github.io/obsidian-google-calendar/#/Basics/Installation",
				text: "documentation",
			}),
			" to find out how to create a own client."
		);




		new Setting(containerEl)
			.setName("Use own authentication client")
			.setDesc("Please create your own client.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useCustomClient)
					.onChange(async (value) => {
						if (value === false) {
							new SettingsInfoModal(this.app, InfoModalType.USE_OWN_CLIENT).open();
						}
						clearTokens();
						this.plugin.settings.useCustomClient = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.useCustomClient) {

			new Setting(containerEl)
				.setName("ClientId")
				.setDesc("Google client id")
				.setClass("SubSettings")
				.addText((text) =>
					text
						.setPlaceholder("Enter your client id")
						.setValue(this.clientId)
						.onChange(value => {
							this.clientId = value.trim();
						})
				)


			new Setting(containerEl)
				.setName("ClientSecret")
				.setDesc("Google client secret")
				.setClass("SubSettings")
				.addText((text) => {
					text.inputEl.type = "password";
					text
						.setPlaceholder("Enter your client secret")
						.setValue(this.clientSecret)
						.onChange(value => {
							this.clientSecret = value.trim();
						})
				})

			new Setting(containerEl)
				.setName("Save")
				.setDesc("Save the client id and secret")
				.setClass("SubSettings")
				.addButton((button) =>
					button
						.setButtonText("Save")
						.onClick(async () => {
							await setClientId(this.clientId);
							await setClientSecret(this.clientSecret);
							this.display();
						})
				);

		} else {

			new Setting(containerEl)
				.setName("Server url")
				.setDesc("The url to the server where the oauth takes place")
				.setClass("SubSettings")
				.addText(text => {
					text
						.setValue(this.oauthServer)
						.onChange(value => {
							this.oauthServer = value.trim();
						})
				})
				.addButton((button) =>
					button
						.setButtonText("Save")
						.onClick(async () => {
							this.plugin.settings.googleOAuthServer = this.oauthServer;
							await this.plugin.saveSettings();
							this.display();
						})
				);

		}

		const getLoginButtonStatus = async () => {
			if (this.plugin.settings.useCustomClient) {
				return (await getClientId() === '') || (await getClientSecret() === '');
			} else {
				return this.plugin.settings.googleOAuthServer === '';
			}
		}

		if (isLoggedIn()) {
			new Setting(containerEl)
				.setName("Logout")
				.setDesc("Logout from google")
				.addButton((button) => {
					button.setClass("login-with-google-btn")
					button.setButtonText("Sign out from Google")
					button.onClick(() => {
						clearTokens();
						this.display();
					})
				})
		} else {
			const buttonState = await getLoginButtonStatus()
			new Setting(containerEl)
				.setName("Login")
				.setDesc("Login with google")
				.addButton((button) => {
					button.setDisabled(buttonState)
					button.setClass("login-with-google-btn")
					button.setButtonText("Sign in with Google")
					button.onClick(() => {
						if (this.plugin.settings.useCustomClient) {
							pkceFlowLocalStart();
						} else {
							pkceFlowServerStart();
						}
					})
				})
		}


		new Setting(containerEl)
			.setName("Refresh Interval")
			.setDesc("Time in seconds between refresh request from google server")
			.addSlider(cb => {
				cb.setValue(this.plugin.settings.refreshInterval)
				cb.setLimits(this.plugin.settings.useCustomClient ? 10 : 60, 360, 1);
				cb.setDynamicTooltip();
				cb.onChange(async value => {
					if (value < 60 && !this.plugin.settings.useCustomClient) return;
					this.plugin.settings.refreshInterval = value;
					await this.plugin.saveSettings();
				})
			});


		new Setting(containerEl)
			.setName("Use event Notification")
			.setDesc("Will send notification when an event starts")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.useNotification);
				toggle.onChange(async (state) => {
					this.plugin.settings.useNotification = state;
					await this.plugin.saveSettings();
					this.hide();
					this.display();
				});
			});

		new Setting(containerEl)
			.setName("Show daily notes")
			.setDesc("Will display daily notes and allow to open and create daily notes")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.activateDailyNoteAddon);
				toggle.onChange(async (state) => {
					this.plugin.settings.activateDailyNoteAddon = state;
					await this.plugin.saveSettings();
					this.hide();
					this.display();
				});
			});

		if (this.plugin.settings.activateDailyNoteAddon) {

			new Setting(containerEl)
				.setName("Use Weekly Notes")
				.setDesc("Will show week numbers with weekly note dots")
				.setClass("SubSettings")
				.addToggle((toggle) => {
					toggle.setValue(this.plugin.settings.useWeeklyNotes);
					toggle.onChange(async (state) => {
						this.plugin.settings.useWeeklyNotes = state;
						if (state) {
							checkForNewWeeklyNotes(this.plugin)
						}
						await this.plugin.saveSettings();
						this.hide();
						this.display();
					});
				});

			new Setting(containerEl)
				.setName("Daily dot color")
				.setDesc("Color for daily note dots in month view")
				.setClass("SubSettings")
				.addText((toggle) => {
					toggle.inputEl.type = "color"
					toggle.setValue(this.plugin.settings.dailyNoteDotColor);
					toggle.onChange(async (state) => {
						this.plugin.settings.dailyNoteDotColor = state;
						await this.plugin.saveSettings();
					});
				});

		}


		new Setting(containerEl)
			.setName("Enable @ Annotations")
			.setDesc("Will help you to easily link events from you calendar in your notes")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.atAnnotationEnabled);
				toggle.onChange(async (state) => {
					this.plugin.settings.atAnnotationEnabled = state;
					await this.plugin.saveSettings();
					this.hide();
					this.display();
				});
			});

		if (this.plugin.settings.atAnnotationEnabled) {
			new Setting(containerEl)
				.setName("@ Annotation date format")
				.setDesc("SWitch between mm/dd/yyyy and dd/mm/yyyy")
				.setClass("SubSettings")
				.addDropdown((dropdown) => {
					dropdown.addOption("mm/dd/yyyy", "mm/dd/yyyy");
					dropdown.addOption("dd/mm/yyyy", "dd/mm/yyyy");
					dropdown.setValue(this.plugin.settings.usDateFormat ? "mm/dd/yyyy" : "dd/mm/yyyy");
					dropdown.onChange(async (state) => {
						if (state == "mm/dd/yyyy") {
							this.plugin.settings.usDateFormat = true;
						} else {
							this.plugin.settings.usDateFormat = false;
						}
						await this.plugin.saveSettings();
						this.hide();
						this.display();
					});
				});
		}

		new Setting(containerEl)
			.setName("Auto create Event Notes")
			.setDesc("Will create new notes from a event if the description contains :obsidian:")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoCreateEventNotes);
				toggle.onChange(async (state) => {
					this.plugin.settings.autoCreateEventNotes = state;
					await this.plugin.saveSettings();
					this.hide();
					this.display();
				});
			});

		new Setting(containerEl)
			.setName("Auto create Event Notes Marker")
			.setDesc("Specify the marker that will be used to find events to create notes. Keep empty to create a note for all events.")
			.setClass("SubSettings")
			.addText(text => {
				text.setValue(this.plugin.settings.autoCreateEventNotesMarker);
				text.onChange(async value => {
					this.plugin.settings.autoCreateEventNotesMarker = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(containerEl)
			.setName("Keep auto created Notes open")
			.setDesc("When creating a new note should it stay open for direct editing")
			.setClass("SubSettings")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.autoCreateEventKeepOpen);
				toggle.onChange(async (state) => {
					this.plugin.settings.autoCreateEventKeepOpen = state;
					await this.plugin.saveSettings();
					this.hide();
					this.display();
				});
			});

		new Setting(containerEl)
			.setName("Import Start Offset")
			.setDesc("Days in the past from events to import")
			.setClass("SubSettings")
			.addSlider(cb => {
				cb.setValue(this.plugin.settings.importStartOffset)
				cb.setLimits(0, 7, 1);
				cb.setDynamicTooltip();
				cb.onChange(async value => {
					cb.showTooltip()
					this.plugin.settings.importStartOffset = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName("Import End Offset")
			.setDesc("Days in the future from events to import")
			.setClass("SubSettings")
			.addSlider(cb => {
				cb.setValue(this.plugin.settings.importEndOffset)
				cb.setLimits(0, 7, 1);
				cb.setDynamicTooltip();
				cb.onChange(async value => {
					this.plugin.settings.importEndOffset = value;
					await this.plugin.saveSettings();
				});
			});


		new Setting(containerEl)
			.setName("Event Note Prefix")
			.setDesc("Optional prefix for event notes to improve performance")
			.setClass("SubSettings")
			.addText(text => {
				text.setValue(this.plugin.settings.optionalNotePrefix);
				text.onChange(async value => {
					this.plugin.settings.optionalNotePrefix = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(containerEl)
			.setName("Event Note Name Format")
			.setDesc("Define how the event note name should look like")
			.setClass("SubSettings")
			.addText(text => {
				text.setValue(this.plugin.settings.eventNoteNameFormat);
				text.onChange(async value => {
					this.plugin.settings.eventNoteNameFormat = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(containerEl)
			.setName("Debug Mode")
			.setDesc("Enable if something is not working")
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.debugMode);
				toggle.onChange(async (state) => {
					this.plugin.settings.debugMode = state;
					await this.plugin.saveSettings();
				})
			})

		new Setting(containerEl)
			.setName("Use defaults for note creation")
			.setDesc("If active creating notes will be faster but less flexible")
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.useDefaultTemplate);
				toggle.onChange(async (state) => {
					this.plugin.settings.useDefaultTemplate = state;
					await this.plugin.saveSettings();
					this.display();
				})
			})

		if (this.plugin.settings.useDefaultTemplate) {
			new Setting(containerEl)
				.setName("Default Template")
				.setDesc("Template to use at note creation")
				.setClass("SubSettings")
				.addSearch((cb) => {
					new FileSuggest(
						cb.inputEl,
						this.plugin
					);
					cb.setPlaceholder("Template")
						.setValue(this.plugin.settings.defaultTemplate)
						.onChange(async (new_template) => {
							this.plugin.settings.defaultTemplate = new_template;
							await this.plugin.saveSettings();
						});
					// @ts-ignore
					cb.containerEl.addClass("templater_search");
				});

			new Setting(containerEl)
				.setName("Default Folder")
				.setDesc("Folder to save notes to after creation")
				.setClass("SubSettings")
				.addSearch((cb) => {
					new FolderSuggest(cb.inputEl);
					cb.setPlaceholder("Example: folder1/folder2")
						.setValue(this.plugin.settings.defaultFolder)
						.onChange(async (new_folder) => {
							this.plugin.settings.defaultFolder = new_folder;
							await this.plugin.saveSettings();
						});
					// @ts-ignore
					cb.containerEl.addClass("templater_search");
				});
		}


		const templateList: Template[] = this.plugin.settings.insertTemplates;
		if (templateList.length) {
			new Setting(containerEl).setName("Saved Templates");

			templateList.forEach((template: Template) => {
				const setting = new Setting(containerEl)
					.setClass("SubSettings")
					.setName(template.name)
					.addButton((button) => {
						button.setButtonText("Remove");
						button.onClick(async () => {
							this.plugin.settings.insertTemplates.remove(template);
							setting.settingEl.remove();
							await this.plugin.saveSettings();
							this.hide();
							this.display();
						});
					});
			});
		}

		if (settingsAreCompleteAndLoggedIn()) {

			new Setting(containerEl)
				.setName("Default Calendar")
				.addDropdown(async (dropdown) => {
					dropdown.addOption("Default", "Select a calendar");
					const calendars = await listCalendars();

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
					const calendars = await listCalendars();

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

export function settingsAreComplete(): boolean {
	const plugin = GoogleCalendarPlugin.getInstance();
	if (
		plugin.settings.useCustomClient && (
			plugin.settings.googleClientId == "" ||
			plugin.settings.googleClientSecret == ""
		)
	) {
		createNotice("Google Calendar missing settings");
		return false;
	}
	return true;
}

export function settingsAreCorret(): boolean {
	if (
		/^[0-9a-zA-z-]*\.apps\.googleusercontent\.com$/.test(
			this.plugin.settings.googleClientId
		) == false
	) {
		new Notice("Client ID Token is not the correct format");
		return false;
	} else if (
		/^[0-9a-zA-z-]*$/.test(this.plugin.settings.googleClientSecret) == false
	) {
		new Notice("Client Secret is not the correct format");
		return false;
	}
	return true;
}

export function settingsAreCompleteAndLoggedIn(): boolean {

	const refreshToken = window.localStorage.getItem("google_calendar_plugin_refresh_key")
	if (!refreshToken || refreshToken == "") {
		createNotice(
			"Google Calendar missing settings or not logged in"
		);
		return false;
	}
	return true;
}
