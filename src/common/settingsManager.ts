// src/common/settingsManager.ts

import CardNavigatorPlugin from '../main';
import { 
    CardNavigatorSettings, 
    SortCriterion, 
    NumberSettingKey, 
    RangeSettingConfig, 
    rangeSettingConfigs,
    sortOptions, 
    displaySettings, 
    fontSizeSettings, 
    keyboardShortcuts 
} from './types';
import { DEFAULT_SETTINGS } from './settings';
import { TFolder } from 'obsidian';

export class SettingsManager {
    constructor(private plugin: CardNavigatorPlugin) {}

    async loadSettings() {
        this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
    }

    async saveSettings() {
        await this.plugin.saveData(this.plugin.settings);
        this.plugin.triggerRefresh();
    }

    private async updateSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
    }

    async updateSortSettings(criterion: SortCriterion, order: 'asc' | 'desc') {
        await this.updateSetting('sortCriterion', criterion);
        await this.updateSetting('sortOrder', order);
    }

    async updateNumberSetting(key: NumberSettingKey, value: number) {
        const config = this.getNumberSettingConfig(key);
        const clampedValue = Math.max(config.min, Math.min(config.max, value));
        await this.updateSetting(key, clampedValue);
    }

    async updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean) {
        if (typeof this.plugin.settings[key] === 'boolean') {
            await this.updateSetting(key, value);
        } else {
            console.error(`Setting ${key} is not a boolean`);
        }
    }

    async updateSelectedFolder(folder: TFolder | null) {
        await this.updateSetting('selectedFolder', folder ? folder.path : null);
    }

    getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig {
        return rangeSettingConfigs[key];
    }

    getSortOptions() {
        return sortOptions;
    }

    getDisplaySettings() {
        return displaySettings;
    }

    getFontSizeSettings() {
        return fontSizeSettings.map(setting => ({
            ...setting,
            ...this.getNumberSettingConfig(setting.key)
        }));
    }

    getKeyboardShortcuts() {
        return keyboardShortcuts;
    }
}
