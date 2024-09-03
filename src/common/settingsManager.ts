//src/ui/common/settingsManager.ts

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
    keyboardShortcuts, 
	SortOrder
} from './types';
import { DEFAULT_SETTINGS } from './settings';
import { TFolder } from 'obsidian';

export class SettingsManager {
    constructor(private plugin: CardNavigatorPlugin) {}

	// Loads the plugin settings from storage
    async loadSettings() {
        this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
    }

	// Saves the current plugin settings to storage
    async saveSettings() {
        await this.plugin.saveData(this.plugin.settings);
        this.plugin.triggerRefresh();
    }

	// Updates a specific setting
    public async updateSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
    }

	// Updates the sort settings
    async updateSortSettings(criterion: SortCriterion, order: SortOrder) {
        await this.updateSetting('sortCriterion', criterion);
        await this.updateSetting('sortOrder', order);
    }

	// Updates a number setting, clamping the value to the allowed range
    async updateNumberSetting(key: NumberSettingKey, value: number) {
        const config = this.getNumberSettingConfig(key);
        const clampedValue = Math.max(config.min, Math.min(config.max, value));
        await this.updateSetting(key, clampedValue);
    }

	// Updates a boolean setting
    async updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean) {
        if (typeof this.plugin.settings[key] === 'boolean') {
            await this.updateSetting(key, value);
        } else {
            console.error(`Setting ${key} is not a boolean`);
        }
    }

	// Updates the selected folder setting
    async updateSelectedFolder(folder: TFolder | null) {
        await this.updateSetting('selectedFolder', folder ? folder.path : null);
    }

	// Gets the configuration for a number setting
    getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig {
        return rangeSettingConfigs[key];
    }

	// Gets the available sort options
    getSortOptions() {
        return sortOptions;
    }

	// Gets the display settings
    getDisplaySettings() {
        return displaySettings;
    }

	// Gets the font size settings with their configurations
    getFontSizeSettings() {
        return fontSizeSettings.map(setting => ({
            ...setting,
            ...this.getNumberSettingConfig(setting.key)
        }));
    }

	// Gets the available keyboard shortcuts
    getKeyboardShortcuts() {
        return keyboardShortcuts;
    }
}
