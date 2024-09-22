import { App, Modal, Setting } from 'obsidian';

export class ConfirmModal extends Modal {
    private result = false;

    constructor(app: App, private title: string, private message: string) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('confirm-modal');

        contentEl.createEl('h2', { text: this.title });
        contentEl.createEl('p', { text: this.message });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('취소')
                .onClick(() => {
                    this.result = false;
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText('삭제')
                .setCta()
                .onClick(() => {
                    this.result = true;
                    this.close();
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    async waitForClose(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.onClose = () => {
                resolve(this.result);
            };
        });
    }
}
