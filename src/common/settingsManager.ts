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
    SortOrder, 
    DEFAULT_SETTINGS
} from './types';
import { TFolder } from 'obsidian';

// SettingsManager class to handle all settings-related operations
export class SettingsManager {
    constructor(private plugin: CardNavigatorPlugin) {}

    // Save the current settings
    async saveSettings() {
        await this.plugin.saveSettings();
    }

    // Update a specific setting and trigger a refresh
    async updateSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.plugin.settings[key] = value;
        await this.saveSettings();
        this.plugin.triggerRefresh();
    }

    // Get all available presets
    getPresets() {
        return this.plugin.settings.presets || {};
    }

    // Apply a specific preset
    async applyPreset(presetName: string) {
        const presets = this.getPresets();
        if (presets[presetName]) {
            const presetSettings = presets[presetName].settings;
            this.plugin.settings = { ...this.plugin.settings, ...presetSettings };
            this.plugin.settings.lastActivePreset = presetName;
            await this.saveSettings();
            this.plugin.triggerRefresh();
        }
    }

    // Save current settings as a new preset
    async saveAsNewPreset(presetName: string) {
        const settingsToSave = Object.fromEntries(
            Object.entries(this.plugin.settings).filter(
                ([key]) => key !== 'presets' && key !== 'lastActivePreset'
            )
        );
        if (!this.plugin.settings.presets) {
            this.plugin.settings.presets = {};
        }
        this.plugin.settings.presets[presetName] = {
            name: presetName,
            settings: settingsToSave
        };
        this.plugin.settings.lastActivePreset = presetName;
        await this.saveSettings();
    }

    // Update the current preset with the current settings
    async updateCurrentPreset(presetName: string) {
        const presets = this.getPresets();
        if (presetName !== 'default' && presets[presetName]) {
            const settingsToSave = Object.fromEntries(
                Object.entries(this.plugin.settings).filter(
                    ([key]) => key !== 'presets' && key !== 'lastActivePreset'
                )
            );
            presets[presetName].settings = settingsToSave;
            await this.saveSettings();
        }
    }

    // Check if the current settings are different from the active preset
    isCurrentSettingModified(): boolean {
        const presets = this.getPresets();
        const lastActivePreset = this.plugin.settings.lastActivePreset || 'default';
        const activePreset = presets[lastActivePreset];
    
        if (!activePreset) return false;
    
        const settingsToCompare = Object.fromEntries(
            Object.entries(this.plugin.settings).filter(
                ([key]) => key !== 'presets' && key !== 'lastActivePreset'
            )
        );
    
        return !this.areSettingsEqual(settingsToCompare, activePreset.settings);
    }

    // Helper method to compare two settings objects
    private areSettingsEqual(settings1: Partial<CardNavigatorSettings>, settings2: Partial<CardNavigatorSettings>): boolean {
        const keys1 = Object.keys(settings1) as (keyof CardNavigatorSettings)[];
        const keys2 = Object.keys(settings2) as (keyof CardNavigatorSettings)[];

        if (keys1.length !== keys2.length) return false;

        for (const key of keys1) {
            if (settings1[key] !== settings2[key]) return false;
        }

        return true;
    }

    // Revert to the original preset settings
    async revertToOriginalPreset() {
        const presets = this.getPresets();
        const lastActivePreset = this.plugin.settings.lastActivePreset || 'default';
        const activePreset = presets[lastActivePreset];
        if (activePreset) {
            this.plugin.settings = { ...this.plugin.settings, ...activePreset.settings };
            await this.saveSettings();
            this.plugin.triggerRefresh();
        }
    }

    // Delete a specific preset
    async deletePreset(presetName: string) {
        const presets = this.getPresets();
        if (presetName !== 'default' && presets[presetName]) {
            delete presets[presetName];
            if (this.plugin.settings.lastActivePreset === presetName) {
                this.plugin.settings.lastActivePreset = 'default';
                const defaultPreset = presets['default'];
                if (defaultPreset) {
                    this.plugin.settings = { ...this.plugin.settings, ...defaultPreset.settings };
                }
            }
            await this.saveSettings();
        }
    }

    // Revert the current preset to default settings
    async revertCurrentPresetToDefault() {
        const presets = this.getPresets();
        const defaultSettings = presets['default']?.settings;
        if (defaultSettings) {
            this.plugin.settings = { ...this.plugin.settings, ...defaultSettings };
            await this.saveSettings();
            this.plugin.triggerRefresh();
        }
    }

    // Revert all settings to default
    async revertToDefault() {
        this.plugin.settings = { ...DEFAULT_SETTINGS };
        this.plugin.settings.lastActivePreset = 'default';
        await this.saveSettings();
        this.plugin.triggerRefresh();
    }

    // Get the current settings
    getCurrentSettings(): Partial<CardNavigatorSettings> {
        return this.plugin.settings;
    }

    // Update sort settings
    async updateSortSettings(criterion: SortCriterion, order: SortOrder) {
        await this.updateSetting('sortCriterion', criterion);
        await this.updateSetting('sortOrder', order);
    }

    // Update a numeric setting, clamping the value to the allowed range
    async updateNumberSetting(key: NumberSettingKey, value: number) {
        if (key === 'bodyLength') {
            await this.updateBodyLengthSetting(value);
        } else {
            const config = this.getNumberSettingConfig(key);
            const clampedValue = Math.max(config.min, Math.min(config.max, value));
            await this.updateSetting(key, clampedValue);
        }
    }

    // Update the body length setting, with handling for unlimited body length
	async updateBodyLengthSetting(value: number) {
		const config = this.getNumberSettingConfig('bodyLength');
		const clampedValue = Math.max(config.min, Math.min(config.max, value));
		await this.updateSetting('bodyLengthLimit', true);
		await this.updateSetting('bodyLength', clampedValue);
		this.plugin.triggerRefresh();
	}

    // Update a boolean setting
    async updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean) {
        if (typeof this.plugin.settings[key] === 'boolean') {
            await this.updateSetting(key, value);
        } else {
            console.error(`Setting ${key} is not a boolean`);
        }
    }

    // Update the selected folder setting
    async updateSelectedFolder(folder: TFolder | null) {
        await this.updateSetting('selectedFolder', folder ? folder.path : null);
    }

    // Get the configuration for a numeric setting
    getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig {
        return rangeSettingConfigs[key];
    }

    // Get the available sort options
    getSortOptions() {
        return sortOptions;
    }

    // Get the display settings
    getDisplaySettings() {
        return displaySettings;
    }

    // Get the font size settings with their configurations
    getFontSizeSettings() {
        return fontSizeSettings.map(setting => ({
            ...setting,
            ...this.getNumberSettingConfig(setting.key as NumberSettingKey)
        }));
    }
    
    // Check if a setting key is a font size setting
    isFontSizeSetting(key: keyof CardNavigatorSettings): key is NumberSettingKey {
        const fontSizeKeys: NumberSettingKey[] = ['fileNameFontSize', 'firstHeaderFontSize', 'bodyFontSize'];
        return fontSizeKeys.includes(key as NumberSettingKey);
    }

    // Get the available keyboard shortcuts
    getKeyboardShortcuts() {
        return keyboardShortcuts;
    }
}
