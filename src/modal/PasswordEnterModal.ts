import { App, Modal, Setting } from "obsidian";

export class PasswordEnterModal extends Modal {

    password = '';
    setPassword: (password: string) => void;

    constructor(app: App, setPassword: (password: string) => void) {
        super(app);
        this.setPassword = setPassword;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl)
            .setName('Password')
            .setDesc('Enter your password')
            .addText(text => {
                text.inputEl.type = 'password';
                text.setPlaceholder('Password')
                text.onChange(async (value) => {
                    this.password = value;
                });
            });

        new Setting(contentEl)
            .setName('Submit')
            .setDesc('Submit your password')
            .addButton(button => {
                button.setButtonText('Submit')
                button.onClick(async (evt) => {
                    this.close();
                });
            });
    }

    onClose() {
        const { contentEl } = this;
        // Make sure a password is entered
        // Else open the modal again
        if (this.password) {
            this.setPassword(this.password)
            contentEl.empty();
        } else {
            new PasswordEnterModal(this.app, (enteredPassword) => {
                this.password = enteredPassword
                this.onClose();
            }).open();
        }
    }
}