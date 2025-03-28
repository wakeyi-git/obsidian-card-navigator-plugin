import { App, Modal, Setting, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';
import { Preset } from '../../../common/types';
import { t } from 'i18next';

/**
 * 프리셋을 가져오기/내보내기하는 모달 클래스입니다.
 */
export class PresetImportExportModal extends Modal {
    //#region 클래스 속성
    private importText = '';
    //#endregion

    //#region 초기화
    /**
     * 프리셋 가져오기/내보내기 모달 생성자
     * @param app - Obsidian 앱 인스턴스
     * @param plugin - Card Navigator 플러그인 인스턴스
     * @param settingsManager - 설정 관리자 인스턴스
     * @param mode - 모달 모드 ('import' | 'export')
     * @param presetName - 내보낼 프리셋 이름
     * @param refreshPresetList - 프리셋 목록 새로고침 콜백
     */
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
    //#endregion

    //#region UI 생성 및 표시
    /**
     * 모달이 열릴 때 호출되는 메서드
     * 모드에 따라 적절한 UI를 표시합니다.
     */
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        if (this.mode === 'import') {
            this.setupImportUI();
        } else {
            this.setupExportUI();
        }
    }

    /**
     * 모달이 닫힐 때 호출되는 메서드
     * UI 요소를 정리합니다.
     */
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    //#endregion

    //#region 가져오기 UI 설정
    /**
     * 프리셋 가져오기 UI를 설정합니다.
     */
    private setupImportUI() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: t('IMPORT_PRESET') });

        // 텍스트 영역 생성
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

        // 가져오기 버튼 추가
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
    //#endregion

    //#region 내보내기 UI 설정
    /**
     * 프리셋 내보내기 UI를 설정합니다.
     */
    private async setupExportUI() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: t('EXPORT_PRESET') });

        if (this.presetName) {
            try {
                const preset = await this.plugin.presetManager.getPreset(this.presetName);
                if (preset) {
                    // 프리셋 데이터를 JSON 문자열로 변환
                    const jsonString = JSON.stringify(preset, null, 2);
                    
                    // 텍스트 영역 생성
                    const textAreaContainer = contentEl.createDiv('preset-export-textarea-container');
                    const textArea = textAreaContainer.createEl('textarea', {
                        text: jsonString,
                        attr: {
                            readonly: 'true',
                        },
                    });
                    textArea.rows = 20;
                    textArea.style.width = '100%';

                    // 복사 버튼 추가
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
    //#endregion
}
