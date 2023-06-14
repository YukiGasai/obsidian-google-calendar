import { App, Modal } from "obsidian";
import { InfoModalType } from "../helper/types";

export class SettingsInfoModal extends Modal {

    info: InfoModalType;
    constructor(app: App, info: InfoModalType) {
        super(app);
        this.info = info;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl("h1", { text: "Google Calendar Alert" });
        if (this.info === InfoModalType.USE_OWN_CLIENT) {
            contentEl.createEl("p", { text: "The public clients purpose is to be used as a testing mode for the plugin. After testing the plugin, please create a own client" });
            contentEl.createEl("a", { text: "Tutorial", href: "https://yukigasai.github.io/obsidian-google-calendar/#/Basics/Installation" });
        } else if (this.info === InfoModalType.ENCRYPT_INFO) {
            contentEl.createEl("p", { text: "You are switching the secret protection off. This will reduce the security of your credentials and is not recommended." });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}