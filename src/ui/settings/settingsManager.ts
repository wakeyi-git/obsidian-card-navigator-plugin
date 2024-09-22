import { TFolder, TFile, debounce, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigatorSettings, Preset, NumberSettingKey, RangeSettingConfig, rangeSettingConfigs, FolderPresets, DEFAULT_SETTINGS } from '../../common/types';
import { ISettingsManager } from '../../common/ISettingsManager';
import { IPresetManager } from '../../common/IPresetManager';

export class SettingsManager implements ISettingsManager {
    private saveSettingsDebounced = debounce(async () => {
        try {
            await this.plugin.saveSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, 500);

    constructor(private plugin: CardNavigatorPlugin, private presetManager: IPresetManager) {}

    async saveSettings() {
        try {
            await this.plugin.saveSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

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
		await this.saveDefaultPreset(); // 기본 프리셋 저장
	}
	
	private async saveDefaultPreset() {
		const presetFolderPath = this.plugin.settings.presetFolderPath;
		const filePath = `${presetFolderPath}/Default.json`;
		try {
			await this.plugin.app.vault.adapter.write(filePath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
		} catch (error) {
			console.error(`Error saving default preset:`, error);
		}
	}

    async updateSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.plugin.settings[key] = value;
        this.saveSettingsDebounced();
        this.plugin.triggerRefresh();
    }

	async confirmDelete(itemName: string): Promise<boolean> {
        return new Promise((resolve) => {
            const notice = new Notice(`정말로 ${itemName}을(를) 삭제하시겠습니까?`, 0);
            notice.noticeEl.createEl('button', { text: '취소' }).onclick = () => {
                notice.hide();
                resolve(false);
            };
            notice.noticeEl.createEl('button', { text: '삭제' }).onclick = () => {
                notice.hide();
                resolve(true);
            };
        });
    }

	applyChanges() {
        this.plugin.triggerRefresh();
    }

    getCurrentSettings(): Partial<CardNavigatorSettings> {
        return this.plugin.settings;
    }

    async applyPreset(presetName: string): Promise<void> {
        try {
            const preset = this.presetManager.getPreset(presetName);
            if (preset) {
                // 프리셋의 설정값을 plugin.settings에 적용
                Object.assign(this.plugin.settings, preset.settings);
                this.plugin.settings.lastActivePreset = presetName;
                
                await this.saveSettings();
                this.plugin.refreshCardNavigator(); // 플러그인 새로고침
                new Notice(`프리셋 "${presetName}"이(가) 적용되었습니다.`);
            } else {
                throw new Error(`프리셋 "${presetName}"을(를) 찾을 수 없습니다.`);
            }
        } catch (error) {
            console.error('프리셋 적용 실패:', error);
            new Notice(`프리셋 적용 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    getActiveFolder(): string | null {
        return this.plugin.settings.selectedFolder;
    }

    async updateSelectedFolder(folder: TFolder | null) {
        await this.updateSetting('selectedFolder', folder ? folder.path : null);
    }

	getPresets(): Record<string, Preset> {
        return this.plugin.settings.presets || {};
    }

    getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig {
        return rangeSettingConfigs[key];
    }

    async toggleAutoApplyPresets(value: boolean): Promise<void> {
        await this.updateSetting('autoApplyFolderPresets', value);
    }

    async updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean): Promise<void> {
        await this.updateSetting(key, value);
    }

    async getPresetFiles(): Promise<TFile[]> {
        const presetFolderPath = this.plugin.settings.presetFolderPath; // 올바른 프리셋 폴더 경로 사용
        const presetFolder = this.plugin.app.vault.getAbstractFileByPath(presetFolderPath);
        if (presetFolder instanceof TFolder) {
            return presetFolder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'json');
        }
        return [];
    }

    async loadPresetFromFile(fileName: string): Promise<Partial<CardNavigatorSettings> | null> {
        const presetFolderPath = this.plugin.settings.presetFolderPath; // 올바른 프리셋 폴더 경로 사용
        const filePath = `${presetFolderPath}/${fileName}`;
        try {
            const content = await this.plugin.app.vault.adapter.read(filePath);
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error loading preset from file ${fileName}:`, error);
            return null;
        }
    }

    async saveAsNewPreset(presetName: string, settings?: Partial<CardNavigatorSettings>) {
        const presetFolderPath = this.plugin.settings.presetFolderPath; // 올바른 프리셋 폴더 경로 사용
        const filePath = `${presetFolderPath}/${presetName}.json`;
        const presetSettings = settings || this.getCurrentSettings();
        try {
            await this.plugin.app.vault.adapter.write(filePath, JSON.stringify(presetSettings, null, 2));
            return true;
        } catch (error) {
            console.error(`Error saving new preset ${presetName}:`, error);
            return false;
        }
    }

    getFolderPresets(): FolderPresets {
        return this.plugin.settings.folderPresets || {};
    }

    getPresetsForFolder(folderPath: string): string[] {
        return this.plugin.settings.folderPresets?.[folderPath] || [];
    }

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

    async removePresetFromFolder(folderPath: string, presetName: string) {
        if (this.plugin.settings.folderPresets && this.plugin.settings.folderPresets[folderPath]) {
            this.plugin.settings.folderPresets[folderPath] = this.plugin.settings.folderPresets[folderPath].filter(name => name !== presetName);
            if (this.plugin.settings.folderPresets[folderPath].length === 0) {
                delete this.plugin.settings.folderPresets[folderPath];
            }
            await this.saveSettings();
        }
    }

    async setDefaultPresetForFolder(folderPath: string, presetName: string) {
        if (!this.plugin.settings.folderPresets) {
            this.plugin.settings.folderPresets = {};
        }
        if (!this.plugin.settings.folderPresets[folderPath]) {
            this.plugin.settings.folderPresets[folderPath] = [];
        }
        this.plugin.settings.folderPresets[folderPath] = [
            presetName,
            ...this.plugin.settings.folderPresets[folderPath].filter(name => name !== presetName)
        ];
        await this.saveSettings();
    }
}
