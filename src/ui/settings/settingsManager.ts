import { TFolder, debounce, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigatorSettings, NumberSettingKey, RangeSettingConfig, rangeSettingConfigs, DEFAULT_SETTINGS } from '../../common/types';
import { ISettingsManager } from '../../common/ISettingsManager';

export class SettingsManager implements ISettingsManager {
    private saveSettingsDebounced = debounce(async () => {
        try {
            await this.plugin.saveSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, 500);

    constructor(private plugin: CardNavigatorPlugin) {}

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
        Object.keys(DEFAULT_SETTINGS).forEach((key) => {
            if (!(key in this.plugin.settings)) {
                if (key in DEFAULT_SETTINGS) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (this.plugin.settings as any)[key] = (DEFAULT_SETTINGS as any)[key];
                }
            }
        });
    
        await this.saveSettings();
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

    getActiveFolder(): string | null {
        return this.plugin.settings.selectedFolder;
    }

    async updateSelectedFolder(folder: TFolder | null) {
        await this.updateSetting('selectedFolder', folder ? folder.path : null);
    }

    getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig {
        return rangeSettingConfigs[key];
    }

    async updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean): Promise<void> {
        await this.updateSetting(key, value);
    }
}
