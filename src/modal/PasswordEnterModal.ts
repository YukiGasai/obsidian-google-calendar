import { App, Modal, Setting } from "obsidian";

/*
    Obsidian modal to enter a password.
    The password will be used the encrypt sensitive data.
*/

export class PasswordEnterModal extends Modal {
    password = '';
    repeatPassword = '';
    setPassword: (password: string) => void;
    createNewPassword: boolean;
    constructor(app: App, setPassword: (password: string) => void, createNewPassword = false) {
        super(app);
        this.setPassword = setPassword;
        this.createNewPassword = createNewPassword;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl)
            .setName('Password')
            .setDesc('Enter your password')
            .addText(text => {
                //Set input type to hide the password
                text.inputEl.type = 'password';
                text.setPlaceholder('Password')
                text.onChange(async (value) => {
                    this.password = value;
                });
            });

        if(this.createNewPassword) {
            new Setting(contentEl)
            .setName('Repeat Password')
            .setDesc('Repeat your password')
            .addText(text => {
                //Set input type to hide the password
                text.inputEl.type = 'password';
                text.setPlaceholder('Repeat Password')
                text.onChange(async (value) => {
                    this.repeatPassword = value;
                });
            });
        }

        new Setting(contentEl)
            .setName('Submit')
            .setDesc('Submit your password')
            .addButton(button => {
                button.setButtonText('Submit')
                button.onClick(async (evt) => {
                    if(!this.createNewPassword || this.password === this.repeatPassword) {
                        this.close();
                    }
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