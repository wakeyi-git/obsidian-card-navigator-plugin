import { App, Modal, Setting, Notice, TextAreaComponent } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';
import { t } from 'i18next';

/**
 * 프리셋을 생성, 편집, 복제하는 모달 클래스입니다.
 */
export class PresetEditModal extends Modal {
    //#region 클래스 속성
    private presetName = '';
    private description = '';
    private presetData = '';
    private dataTextArea: TextAreaComponent | null = null;
    //#endregion

    //#region 초기화
    /**
     * 프리셋 편집 모달 생성자
     * @param app - Obsidian 앱 인스턴스
     * @param plugin - Card Navigator 플러그인 인스턴스
     * @param settingsManager - 설정 관리자 인스턴스
     * @param mode - 모달 모드 ('create' | 'edit' | 'clone')
     * @param existingPresetName - 기존 프리셋 이름 (편집/복제 시)
     * @param refreshPresetList - 프리셋 목록 새로고침 콜백
     */
    constructor(
        app: App,
        private plugin: CardNavigatorPlugin,
        private settingsManager: SettingsManager,
        private mode: 'create' | 'edit' | 'clone',
        private existingPresetName?: string,
        private refreshPresetList?: () => void
    ) {
        super(app);
    }
    //#endregion

    //#region UI 생성 및 표시
    /**
     * 모달이 열릴 때 호출되는 메서드
     * UI 요소를 생성하고 초기화합니다.
     */
    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.getModalTitle() });
    
        // 프리셋 이름 입력 필드
        new Setting(contentEl)
            .setName(t('PRESET_NAME'))
            .setDesc(t('ENTER_PRESET_NAME'))
            .addTextArea(async text => {
                text.setPlaceholder(t('ENTER_PRESET_NAME_PLACEHOLDER'))
                .setValue(this.getInitialPresetName())
                .onChange(value => this.presetName = value);
                text.inputEl.rows = 1;
                text.inputEl.style.width = '350px';
            });
    
        // 프리셋 설명 입력 필드
        new Setting(contentEl)
            .setName(t('DESCRIPTION'))
            .setDesc(t('ENTER_PRESET_DESCRIPTION'))
            .addTextArea(async text => {
                text.setPlaceholder(t('ENTER_PRESET_DESCRIPTION_PLACEHOLDER'))
                    .setValue(await this.getInitialDescription())
                    .onChange(value => this.description = value);
                text.inputEl.rows = 4;
                text.inputEl.style.width = '350px';
            });
    
        // 프리셋 데이터 입력 필드
        new Setting(contentEl)
        .setName(t('PRESET_DATA'))
        .setDesc(t('EDIT_PRESET_DATA_DESC'))
        .addTextArea(async text => {
            this.dataTextArea = text;
            const initialData = await this.getInitialPresetData();
            this.presetData = initialData;
            text.setPlaceholder(t('PRESET_DATA_PLACEHOLDER'))
                .setValue(initialData)
                .onChange(value => this.presetData = value);
            text.inputEl.rows = 10;
            text.inputEl.style.width = '350px';
        });
    
        // 현재 설정으로 업데이트 버튼
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText(t('UPDATE_WITH_CURRENT_SETTINGS'))
                .onClick(() => this.updatePresetWithCurrentSettings()));
    
        // 저장 버튼
        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText(t('SAVE'))
                .setCta()
                .onClick(() => this.savePreset()));
    }
    //#endregion

    //#region 초기값 및 상태 관리
    /**
     * 모달 제목을 가져옵니다.
     */
    private getModalTitle(): string {
        switch (this.mode) {
            case 'create': return t('CREATE_NEW_PRESET');
            case 'edit': return t('EDIT_PRESET');
            case 'clone': return t('CLONE_PRESET');
        }
    }

    /**
     * 초기 프리셋 이름을 가져옵니다.
     */
    private getInitialPresetName(): string {
        switch (this.mode) {
            case 'create': return '';
            case 'edit': return this.existingPresetName || '';
            case 'clone': return t('PRESET_COPY', {name: this.existingPresetName || ''});
        }
    }

    /**
     * 초기 프리셋 설명을 가져옵니다.
     */
    private async getInitialDescription(): Promise<string> {
        if (this.mode === 'create') return '';
        const existingPreset = await this.plugin.presetManager.getPreset(this.existingPresetName || '');
        return existingPreset?.description || '';
    }
    
    /**
     * 초기 프리셋 데이터를 가져옵니다.
     */
    private async getInitialPresetData(): Promise<string> {
        if (this.mode === 'create') return JSON.stringify(this.plugin.settingsManager.getCurrentSettings(), null, 2);
        const existingPreset = await this.plugin.presetManager.getPreset(this.existingPresetName || '');
        return JSON.stringify(existingPreset?.settings || {}, null, 2);
    }
    //#endregion

    //#region 데이터 업데이트 및 저장
    /**
     * 현재 설정으로 프리셋 데이터를 업데이트합니다.
     */
    private async updatePresetWithCurrentSettings() {
        const currentSettings = this.plugin.settingsManager.getCurrentSettings();
        this.presetData = JSON.stringify(currentSettings, null, 2);
        if (this.dataTextArea) {
            this.dataTextArea.setValue(this.presetData);
        }
    }

    /**
     * 프리셋을 저장합니다.
     * 입력값을 검증하고 적절한 저장 작업을 수행합니다.
     */
    private async savePreset() {
        // 입력값 검증
        if (!this.presetName && this.mode !== 'edit') {
            new Notice(t('ENTER_PRESET_NAME_NOTICE'));
            return;
        }
    
        if (!this.presetData.trim()) {
            new Notice(t('PRESET_DATA_EMPTY'));
            return;
        }
    
        try {
            const presetSettings = JSON.parse(this.presetData);
            const saveName = this.mode === 'edit' ? (this.existingPresetName || this.presetName) : this.presetName;
    
            // 모드별 저장 처리
            switch (this.mode) {
                case 'create':
                case 'clone':
                    await this.plugin.presetManager.savePreset(saveName, this.description, presetSettings);
                    await this.plugin.presetManager.applyGlobalPreset(saveName);
                    break;
                case 'edit':
                    if (this.existingPresetName) {
                        if (this.existingPresetName !== saveName) {
                            await this.plugin.presetManager.deletePreset(this.existingPresetName);
                        }
                        await this.plugin.presetManager.savePreset(saveName, this.description, presetSettings);
                    }
                    break;
            }
    
            // 저장 완료 후 처리
            this.close();
            this.settingsManager.applyChanges();
            new Notice(t('PRESET_SAVED', {name: saveName}));
            
            if (this.refreshPresetList) {
                this.refreshPresetList();
            }
        } catch (error) {
            console.error(t('FAILED_TO_SAVE_PRESET'), error);
            new Notice(t('PRESET_SAVE_FAILED', {error: error instanceof Error ? error.message : String(error)}));
        }
    }
    //#endregion
}
