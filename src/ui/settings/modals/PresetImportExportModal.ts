import { App, Modal, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';

export class PresetImportExportModal extends Modal {
    constructor(
        app: App,
        private plugin: CardNavigatorPlugin,
        private settingsManager: SettingsManager
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Import/Export Presets' });

        new Setting(contentEl)
            .setName('Export Presets')
            .addButton(btn => btn
                .setButtonText('Export')
                .onClick(async () => {
                    // 프리셋 내보내기 로직
                }));

        new Setting(contentEl)
            .setName('Import Presets')
            .addTextArea(text => text
                .setPlaceholder('Paste preset JSON here')
                .onChange(async (value) => {
                    // 프리셋 가져오기 로직
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
