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

export class SettingsManager {
    constructor(private plugin: CardNavigatorPlugin) {}

    async saveSettings() {
        await this.plugin.saveSettings();
    }

	// Reverts to default settings
	async revertToDefault() {
		this.plugin.settings.currentSettings = { ...DEFAULT_SETTINGS.presets.default.settings };
		this.plugin.settings.lastActivePreset = 'default';
		await this.saveSettings();
		this.plugin.triggerRefresh();
	}

    getCurrentSettings(): Partial<CardNavigatorSettings> {
        return this.plugin.settings.currentSettings;
    }

    async updateSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.plugin.settings[key] = value;
        this.plugin.settings.currentSettings[key] = value;
        await this.saveSettings();
        this.plugin.triggerRefresh();
    }

	// Gets all available presets
	getPresets() {
		return this.plugin.settings.presets;
	}

    async applyPreset(presetName: string) {
        if (this.plugin.settings.presets[presetName]) {
            const presetSettings = this.plugin.settings.presets[presetName].settings;
            this.plugin.settings = { ...this.plugin.settings, ...presetSettings };
            this.plugin.settings.currentSettings = { ...presetSettings };
            this.plugin.settings.lastActivePreset = presetName;
            
            await this.saveSettings();
            this.plugin.triggerRefresh();
        }
    }

    async saveAsNewPreset(presetName: string) {
        this.plugin.settings.presets[presetName] = {
            name: presetName,
            settings: { ...this.plugin.settings.currentSettings }
        };
        this.plugin.settings.lastActivePreset = presetName;
        await this.saveSettings();
    }

    async updateCurrentPreset(presetName: string) {
        if (presetName !== 'default' && this.plugin.settings.presets[presetName]) {
            this.plugin.settings.presets[presetName].settings = { ...this.plugin.settings.currentSettings };
            await this.saveSettings();
        }
    }

    async deletePreset(presetName: string) {
        if (presetName !== 'default') {
            delete this.plugin.settings.presets[presetName];
            if (this.plugin.settings.lastActivePreset === presetName) {
                this.plugin.settings.lastActivePreset = 'default';
                this.plugin.settings.currentSettings = { ...this.plugin.settings.presets.default.settings };
            }
            await this.saveSettings();
        }
    }

    isCurrentSettingModified(): boolean {
        const activePreset = this.plugin.settings.presets[this.plugin.settings.lastActivePreset];
        return JSON.stringify(this.plugin.settings.currentSettings) !== JSON.stringify(activePreset.settings);
    }

    async revertToOriginalPreset() {
        const activePreset = this.plugin.settings.presets[this.plugin.settings.lastActivePreset];
        this.plugin.settings.currentSettings = { ...activePreset.settings };
        await this.saveSettings();
        this.plugin.triggerRefresh();
    }

    async revertCurrentPresetToDefault() {
        this.plugin.settings.currentSettings = { ...this.plugin.settings.presets.default.settings };
        if (this.plugin.settings.lastActivePreset !== 'default') {
            this.plugin.settings.presets[this.plugin.settings.lastActivePreset].settings = { ...this.plugin.settings.currentSettings };
        }
        await this.saveSettings();
        this.plugin.triggerRefresh();
    }

	// Updates the sort settings
    async updateSortSettings(criterion: SortCriterion, order: SortOrder) {
        await this.updateSetting('sortCriterion', criterion);
        await this.updateSetting('sortOrder', order);
    }

	// Updates a number setting, clamping the value to the allowed range
    async updateNumberSetting(key: NumberSettingKey, value: number) {
        if (key === 'bodyLength') {
            await this.updateBodyLengthSetting(value);
        } else {
            const config = this.getNumberSettingConfig(key);
            const clampedValue = Math.max(config.min, Math.min(config.max, value));
            await this.updateSetting(key, clampedValue);
        }
    }

	// Updates the body length setting, with handling for unlimited body length
	async updateBodyLengthSetting(value: number) {
		if (value <= 0) {
			await this.updateSetting('isBodyLengthUnlimited', true);
			await this.updateSetting('bodyLength', -1);
		} else {
			const config = this.getNumberSettingConfig('bodyLength');
			const clampedValue = Math.max(config.min, Math.min(config.max, value));
			await this.updateSetting('isBodyLengthUnlimited', false);
			await this.updateSetting('bodyLength', clampedValue);
		}
		this.plugin.triggerRefresh();
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
			...this.getNumberSettingConfig(setting.key as NumberSettingKey)
		}));
	}
	
	isFontSizeSetting(key: keyof CardNavigatorSettings): key is NumberSettingKey {
		const fontSizeKeys: NumberSettingKey[] = ['fileNameFontSize', 'firstHeaderFontSize', 'bodyFontSize'];
		return fontSizeKeys.includes(key as NumberSettingKey);
	}

	// Gets the available keyboard shortcuts
    getKeyboardShortcuts() {
        return keyboardShortcuts;
    }
}
