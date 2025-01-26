import { App, Modal, Setting, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';
import { Preset } from '../../../common/types';
import { t } from 'i18next';

export class PresetImportExportModal extends Modal {
    private importText = '';

    constructor(
        app: App,
        private plugin: CardNavigatorPlugin,
        private settingsManager: SettingsManager,
        private mode: 'import' | 'export',
        private presetName?: string,
        private refreshPresetList?: () => void
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        if (this.mode === 'import') {
            this.setupImportUI();
        } else {
            this.setupExportUI();
        }
    }

    private setupImportUI() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: t('IMPORT_PRESET') });

        const textAreaContainer = contentEl.createDiv('preset-import-textarea-container');
        const textArea = textAreaContainer.createEl('textarea', {
            attr: {
                placeholder: t('PASTE_PRESET_JSON_HERE'),
            },
        });
        textArea.rows = 20;
        textArea.style.width = '100%';
        textArea.addEventListener('input', (e) => {
            this.importText = (e.target as HTMLTextAreaElement).value;
        });

        new Setting(contentEl)
        .addButton(btn => btn
            .setButtonText(t('IMPORT'))
            .setCta()
            .onClick(async () => {
                try {
                    const presetData = JSON.parse(this.importText) as Preset;
                    if (!presetData.name || !presetData.settings || typeof presetData.description !== 'string') {
                        throw new Error(t('INVALID_PRESET_DATA'));
                    }
                    // 프리셋 저장 시 설정 값도 함께 저장
                    await this.plugin.presetManager.savePreset(presetData.name, presetData.description, presetData.settings);
                    this.settingsManager.applyChanges();
                    new Notice(t('PRESET_IMPORTED_SUCCESSFULLY', {name: presetData.name}));
                    this.close();
                    // 프리셋 목록 새로고침
                    if (this.refreshPresetList) {
                        this.refreshPresetList();
                    }
				} catch (error: unknown) {
					if (error instanceof Error) {
						new Notice(t('PRESET_IMPORT_FAILED', {error: error.message}));
					} else {
						new Notice(t('UNKNOWN_ERROR_DURING_IMPORT'));
					}
				}
			}));
    }

    private async setupExportUI() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: t('EXPORT_PRESET') });

        if (this.presetName) {
            try {
                const preset = await this.plugin.presetManager.getPreset(this.presetName);
                if (preset) {
                    const jsonString = JSON.stringify(preset, null, 2);
                    
                    const textAreaContainer = contentEl.createDiv('preset-export-textarea-container');
                    const textArea = textAreaContainer.createEl('textarea', {
                        text: jsonString,
                        attr: {
                            readonly: 'true',
                        },
                    });
                    textArea.rows = 20;
                    textArea.style.width = '100%';

                    new Setting(contentEl)
                        .addButton(btn => btn
                            .setButtonText(t('COPY'))
                            .setCta()
                            .onClick(() => {
                                navigator.clipboard.writeText(jsonString);
                                new Notice(t('PRESET_JSON_COPIED'));
                            }));
                } else {
                    contentEl.createEl('p', { text: t('PRESET_NOT_FOUND') });
                }
            } catch (error) {
                console.error(t('ERROR_LOADING_PRESET'), error);
                contentEl.createEl('p', { text: t('ERROR_LOADING_PRESET') });
            }
        } else {
            contentEl.createEl('p', { text: t('NO_PRESET_SELECTED') });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
