import { App, Modal, Setting, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';
import { Preset } from '../../../common/types';

export class PresetImportExportModal extends Modal {
    private importText = '';

    constructor(
        app: App,
        private plugin: CardNavigatorPlugin,
        private settingsManager: SettingsManager,
        private mode: 'import' | 'export',
        private presetName?: string
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
        contentEl.createEl('h2', { text: '프리셋 가져오기' });

        const textAreaContainer = contentEl.createDiv('preset-import-textarea-container');
        const textArea = textAreaContainer.createEl('textarea', {
            attr: {
                placeholder: '여기에 프리셋 JSON을 붙여넣으세요',
            },
        });
        textArea.rows = 10;
        textArea.style.width = '100%';
        textArea.addEventListener('input', (e) => {
            this.importText = (e.target as HTMLTextAreaElement).value;
        });

		new Setting(contentEl)
		.addButton(btn => btn
			.setButtonText('가져오기')
			.setCta()
			.onClick(async () => {
				try {
					const presetData = JSON.parse(this.importText) as Preset;
					if (!presetData.name || !presetData.settings || typeof presetData.description !== 'string') {
						throw new Error('유효하지 않은 프리셋 데이터입니다.');
					}
					await this.plugin.presetManager.savePreset(presetData.name, presetData.description);
					// 프리셋의 설정을 적용하는 로직이 필요할 수 있습니다.
					// 예: await this.plugin.presetManager.applyPresetSettings(presetData.name, presetData.settings);
					this.settingsManager.applyChanges();
					new Notice(`프리셋 "${presetData.name}"을(를) 성공적으로 가져왔습니다.`);
					this.close();
				} catch (error: unknown) {
					if (error instanceof Error) {
						new Notice(`프리셋 가져오기 실패: ${error.message}`);
					} else {
						new Notice('프리셋 가져오기 중 알 수 없는 오류가 발생했습니다.');
					}
				}
			}));
    }

    private setupExportUI() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: '프리셋 내보내기' });

        if (this.presetName) {
            const preset = this.plugin.presetManager.getPreset(this.presetName);
            if (preset) {
                const jsonString = JSON.stringify(preset, null, 2);
                
                const textAreaContainer = contentEl.createDiv('preset-export-textarea-container');
                const textArea = textAreaContainer.createEl('textarea', {
                    text: jsonString,
                    attr: {
                        readonly: 'true',
                    },
                });
                textArea.rows = 10;
                textArea.style.width = '100%';

                new Setting(contentEl)
                    .addButton(btn => btn
                        .setButtonText('복사')
                        .setCta()
                        .onClick(() => {
                            navigator.clipboard.writeText(jsonString);
                            new Notice('프리셋 JSON이 클립보드에 복사되었습니다.');
                        }));
            } else {
                contentEl.createEl('p', { text: '프리셋을 찾을 수 없습니다.' });
            }
        } else {
            contentEl.createEl('p', { text: '내보낼 프리셋이 선택되지 않았습니다.' });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
