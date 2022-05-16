import { DropdownComponent, Modal, Setting } from "obsidian";
import type { GoogleCalander, GoogleEvent } from "../helper/types";
import { customSetting } from "../helper/CustomSettingElement";
import type GoogleCalendarPlugin from "./../GoogleCalendarPlugin";
import { googleListCalendars } from "../googleApi/GoogleListCalendars";
import TimeLineComp from "../svelte/TimeLineComp.svelte";

export class ViewEventEntry extends Modal {
	plugin: GoogleCalendarPlugin;
	selectedEvent: GoogleEvent;

	calendarList: GoogleCalander[];

	onSubmit: (event: GoogleEvent) => void;
	constructor(plugin: GoogleCalendarPlugin, selectedEvent: GoogleEvent) {
		super(plugin.app);
		this.plugin = plugin;
		this.selectedEvent = selectedEvent;
	}

	async onOpen() {
		const { contentEl } = this;

		this.calendarList = await googleListCalendars(this.plugin);

		new TimeLineComp({
			target: contentEl,
			props: {
				plugin: this.plugin,
				height: 400,
				width: 400,
			},
		});
		const createDateTimeSettings = () => {
			const dateStartSelectElement = customSetting(
				document.querySelector(".dateSettingsContainer"),
				"Start Date",
				""
			).createEl("input", {
				type: "datetime-local",
			});

			dateStartSelectElement.value = window
				.moment(this.selectedEvent.start.dateTime)
				.format("YYYY-MM-DDThh:mm:ss.ms");

			console.log(
				window.moment(this.selectedEvent.start.dateTime).toISOString()
			);

			dateStartSelectElement.addEventListener("input", (event) => {
				//this.selectedEvent.start. = dateSelectElement.value;
				console.log(dateStartSelectElement.value);
			});

			const dateEndSelectElement = customSetting(
				document.querySelector(".dateSettingsContainer"),
				"End Date",
				""
			).createEl("input", {
				type: "datetime-local",
			});

			dateEndSelectElement.value = window
				.moment(this.selectedEvent.end.dateTime)
				.format("YYYY-MM-DDThh:mm:ss.ms");

			console.log(
				window.moment(this.selectedEvent.end.dateTime).toISOString()
			);

			dateEndSelectElement.addEventListener("input", (event) => {
				this.selectedEvent.start.dateTime =
					dateEndSelectElement.valueAsDate.getDate();
			});
		};

		const createDateSettings = () => {
			const dateSelectElement = customSetting(
				document.querySelector(".dateSettingsContainer"),
				"Event Date",
				""
			).createEl("input", {
				type: "date",
			});

			dateSelectElement.value = window
				.moment(this.selectedEvent.start.dateTime)
				.format("YYYY-MM-DD");

			console.log(
				window.moment(this.selectedEvent.start.dateTime).toISOString()
			);

			dateSelectElement.addEventListener("input", (event) => {
				//this.selectedEvent.start. = dateSelectElement.value;
				console.log(dateSelectElement.value);
			});
		};

		contentEl.createEl("h1", { text: "Google Event" });
		new Setting(contentEl)
			.setName("Summary")
			.addText((text) => {
				text.setValue(this.selectedEvent.summary);
				text.onChange((value) => {
					this.selectedEvent.summary = value;
				});
			})
			.settingEl.querySelector("input")
			.focus();

		new Setting(contentEl).setName("Details").addTextArea((text) => {
			let cleanText =
				this.selectedEvent.description.replace(/<\/?[^>]+(>|$)/g, "") ??
				"";

			text.setValue(cleanText);
			text.onChange((value) => {
				text.setValue(this.selectedEvent.description ?? "");
				this.selectedEvent.description = value;
			});
		});

		const dropDown = new Setting(contentEl);

		dropDown.setName("Categorie");
		dropDown.addDropdown((text: DropdownComponent) => {
			text.onChange((value) => {
				this.selectedEvent.parent.id = value;
			});

			for (let i = 0; i < this.calendarList.length; i++) {
				text.addOption(
					this.calendarList[i].id,
					this.calendarList[i].summary
				);
			}

			text.setValue(this.selectedEvent.parent.id);

			return text;
		});

		new Setting(contentEl).setName("Full Day").addToggle((toggle) => {
			toggle.setValue(this.selectedEvent.start.dateTime == undefined);
			toggle.onChange((state) => {
				contentEl
					.querySelectorAll(
						'input[type="date"], input[type="datetime-local"]'
					)
					.forEach((el) => el.parentElement.parentElement.remove());

				if (state) {
					createDateSettings();
				} else {
					createDateTimeSettings();
				}
			});
		});

		contentEl.createDiv({ cls: "dateSettingsContainer" });

		if (this.selectedEvent.start.dateTime == undefined) {
			createDateSettings();
		} else {
			createDateTimeSettings();
		}

		new Setting(contentEl).addButton((button) =>
			button.setButtonText("Create").onClick(() => {
				this.close();

				//CreateGoogleTask(this.plugin, taskInput);
			})
		);
	}
	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
