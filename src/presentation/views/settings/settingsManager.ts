import { TFolder, TFile, debounce, Modal, App, WorkspaceLeaf } from 'obsidian';
import type { CardNavigatorPlugin } from '@main';
import { CardNavigatorSettings, NumberSettingKey, RangeSettingConfig, rangeSettingConfigs, FolderPresets, DEFAULT_SETTINGS, globalSettingsKeys } from '@domain/models/types';
import { ISettingsManager, IPresetManager } from '@common/interface';
import { t } from 'i18next';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from '@presentation/views/CardNavigatorView';

export class SettingsManager implements ISettingsManager {
    //#region 클래스 속성
    // 설정 저장을 위한 디바운스 함수
    private saveSettingsDebounced = debounce(async () => {
        try {
            await this.plugin.saveData(this.plugin.settings);
            // 설정이 저장된 후에만 한 번 이벤트 발생
            this.plugin.events.trigger('settings-updated');
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, 250);
    //#endregion

    //#region 초기화
    // 생성자: 설정 매니저 초기화
    constructor(private plugin: CardNavigatorPlugin) {
        this.presetManager = plugin.presetManager;
    }
    //#endregion

    private presetManager: IPresetManager;

    //#region 설정 로드 및 저장
    // 설정 저장
    async saveSettings() {
        try {
            await this.plugin.saveSettings();
        } catch (error) {
            console.error(t('ERROR_SAVING_SETTINGS'), error);
        }
    }

    // 설정 로드
    async loadSettings() {
        const loadedData = await this.plugin.loadData();
        
        if (loadedData) {
            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData) as CardNavigatorSettings;
        } else {
            this.plugin.settings = { ...DEFAULT_SETTINGS };
        }
    
        // 누락된 설정을 기본값으로 채움
        for (const key in DEFAULT_SETTINGS) {
            if (!(key in this.plugin.settings)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this.plugin.settings as any)[key] = DEFAULT_SETTINGS[key as keyof CardNavigatorSettings];
            }
        }
    
        if (!this.plugin.settings.folderPresets) {
            this.plugin.settings.folderPresets = {};
        }
        if (!this.plugin.settings.activeFolderPresets) {
            this.plugin.settings.activeFolderPresets = {};
        }
    
        await this.saveSettings();
        await this.saveDefaultPreset();
    }

    // 기본 프리셋 저장
    private async saveDefaultPreset() {
        const presetFolderPath = this.plugin.settings.presetFolderPath;
        const filePath = `${presetFolderPath}/default.json`;
        try {
            await this.plugin.app.vault.adapter.write(filePath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
        } catch (error) {
            console.error(t('ERROR_SAVING_DEFAULT_PRESET'), error);
        }
    }

    // 설정 업데이트
    async updateSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.plugin.settings[key] = value;
        await this.saveSettingsDebounced();
        
        // cardSetType이 변경되었을 때 모든 Card Navigator 뷰의 툴바 새로고침
        if (key === 'cardSetType') {
            this.refreshViews();
        }
    }

    // 현재 설정 가져오기
    getCurrentSettings(): Partial<CardNavigatorSettings> {
        const currentSettings = { ...this.plugin.settings };
        globalSettingsKeys.forEach((key: string) => delete currentSettings[key as keyof CardNavigatorSettings]);
        return currentSettings;
    }
    //#endregion

    //#region 프리셋 파일 관리
    // 프리셋 파일 가져오기
    async getPresetFiles(): Promise<TFile[]> {
        const presetFolderPath = this.plugin.settings.presetFolderPath;
        const presetFolder = this.plugin.app.vault.getAbstractFileByPath(presetFolderPath);
        if (presetFolder instanceof TFolder) {
            return presetFolder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'json');
        }
        return [];
    }

    // 파일에서 프리셋 로드
    async loadPresetFromFile(fileName: string): Promise<Partial<CardNavigatorSettings> | null> {
        const presetFolderPath = this.plugin.settings.presetFolderPath;
        const filePath = `${presetFolderPath}/${fileName}`;
        try {
            const content = await this.plugin.app.vault.adapter.read(filePath);
            return JSON.parse(content);
        } catch (error) {
            console.error(t('ERROR_LOADING_PRESET_FROM_FILE', { fileName }), error);
            return null;
        }
    }

    // 새 프리셋으로 저장
    async saveAsNewPreset(presetName: string, settings?: Partial<CardNavigatorSettings>) {
        const presetFolderPath = this.plugin.settings.presetFolderPath;
        const filePath = `${presetFolderPath}/${presetName}.json`;
        const presetSettings = settings || this.getCurrentSettings();
        try {
            await this.plugin.app.vault.adapter.write(filePath, JSON.stringify(presetSettings, null, 2));
            return true;
        } catch (error) {
            console.error(t('ERROR_SAVING_NEW_PRESET', { presetName }), error);
            return false;
        }
    }
    //#endregion

    //#region 폴더 프리셋 관리
    // 폴더 프리셋 가져오기
    getFolderPresets(): FolderPresets {
        return this.plugin.settings.folderPresets || {};
    }

    // 특정 폴더의 프리셋 가져오기
    getPresetsForFolder(folderPath: string): string[] {
        return this.plugin.settings.folderPresets?.[folderPath] || [];
    }

    // 폴더에 프리셋 추가
    async addPresetToFolder(folderPath: string, presetName: string) {
        if (!this.plugin.settings.folderPresets) {
            this.plugin.settings.folderPresets = {};
        }
        if (!this.plugin.settings.folderPresets[folderPath]) {
            this.plugin.settings.folderPresets[folderPath] = [];
        }
        if (!this.plugin.settings.folderPresets[folderPath].includes(presetName)) {
            this.plugin.settings.folderPresets[folderPath].push(presetName);
            await this.saveSettings();
        }
    }

    // 폴더에서 프리셋 제거
    async removePresetFromFolder(folderPath: string, presetName: string) {
        if (this.plugin.settings.folderPresets && this.plugin.settings.folderPresets[folderPath]) {
            this.plugin.settings.folderPresets[folderPath] = this.plugin.settings.folderPresets[folderPath].filter((name: string) => name !== presetName);
            if (this.plugin.settings.folderPresets[folderPath].length === 0) {
                delete this.plugin.settings.folderPresets[folderPath];
            }
            await this.saveSettings();
        }
    }

    // 폴더의 기본 프리셋 설정
    async setDefaultPresetForFolder(folderPath: string, presetName: string) {
        if (!this.plugin.settings.folderPresets) {
            this.plugin.settings.folderPresets = {};
        }
        if (!this.plugin.settings.folderPresets[folderPath]) {
            this.plugin.settings.folderPresets[folderPath] = [];
        }
        this.plugin.settings.folderPresets[folderPath] = [
            presetName,
            ...this.plugin.settings.folderPresets[folderPath].filter((name: string) => name !== presetName)
        ];
        await this.saveSettings();
    }
    //#endregion

    //#region 프리셋 설정 관리
    // 자동 적용 프리셋 토글
    async toggleAutoApplyPresets(value: boolean): Promise<void> {
        await this.updateSetting('autoApplyFolderPresets', value);
    }

    // 마지막 활성 프리셋 업데이트
    async updateLastActivePreset(presetName: string): Promise<void> {
        await this.updateSetting('lastActivePreset', presetName);
    }

    // 전역 프리셋 업데이트
    async updateGlobalPreset(presetName: string): Promise<void> {
        await this.updateSetting('GlobalPreset', presetName);
    }

    // 폴더 프리셋 자동 적용 설정 업데이트
    async updateAutoApplyFolderPresets(value: boolean): Promise<void> {
        await this.updateSetting('autoApplyFolderPresets', value);
    }
    //#endregion

    //#region 유틸리티 메서드
    // 삭제 확인 모달 표시
    async confirmDelete(name: string): Promise<boolean> {
        return new Promise((resolve) => {
            new ConfirmDeleteModal(this.plugin.app, name, (result) => {
                resolve(result);
            }).open();
        });
    }

    // 변경사항 적용
    applyChanges() {
        // 설정 저장만 트리거
        this.saveSettingsDebounced();
    }

    // 활성 폴더 가져오기
    getActiveFolder(): string | null {
        return this.plugin.settings.selectedFolder;
    }

    // 선택된 폴더 업데이트
    async updateSelectedFolder(folder: TFolder | null) {
        await this.updateSetting('selectedFolder', folder ? folder.path : null);
    }

    // 숫자 설정 구성 가져오기
    getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig {
        return rangeSettingConfigs[key];
    }

    // 불리언 설정 업데이트
    async updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean): Promise<void> {
        await this.updateSetting(key, value);
    }

    private refreshViews(): void {
        const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf: WorkspaceLeaf) => {
            if (leaf.view instanceof CardNavigatorView) {
                leaf.view.refresh(RefreshType.SETTINGS);
            }
        });
    }

    async removePresetFromAllFolders(name: string): Promise<void> {
        // ... existing code ...
    }
    //#endregion
}

//#region 보조 클래스
// 삭제 확인 모달 클래스
class ConfirmDeleteModal extends Modal {
    constructor(app: App, private itemName: string, private onConfirm: (result: boolean) => void) {
        super(app);
    }

    // 모달 열기
    onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        contentEl.createEl('h2', {text: t('CONFIRM_DELETE_TITLE')});
        contentEl.createEl('p', {text: t('CONFIRM_DELETE_MESSAGE', {name: this.itemName})});

        const buttonContainer = contentEl.createDiv('button-container');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '20px';

        const cancelButton = buttonContainer.createEl('button', {text: t('CANCEL')});
        cancelButton.style.marginRight = '10px';
        cancelButton.onclick = () => {
            this.close();
            this.onConfirm(false);
        };

        const deleteButton = buttonContainer.createEl('button', {text: t('DELETE')});
        deleteButton.onclick = () => {
            this.close();
            this.onConfirm(true);
        };
    }

    // 모달 닫기
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}
//#endregion
