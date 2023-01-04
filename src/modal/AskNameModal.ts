import { App, Modal, Setting } from "obsidian";

export class AskNameModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Enter a name for the template" });

    new Setting(contentEl)
      .setName("Name")
      .addText((text) =>
        text.onChange((value) => {
          this.result = value
        }));

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Save")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          }));
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}