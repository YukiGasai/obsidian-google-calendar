import { App, Modal, Setting } from "obsidian";

export class OAuthAlertModal extends Modal {

    constructor(app: App) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h1", { text: "Google Calendar Alert" });
        contentEl.createEl("p", { text: "The public client is full and will not work. Please activate `Use own authentication client` again. Press the link below to find out how to create a own client." });
        contentEl.createEl("a", { text: "Tutorial", href: "https://yukigasai.github.io/obsidian-google-calendar/#/Basics/Installation" });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}