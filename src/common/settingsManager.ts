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

    async updateSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.plugin.settings[key] = value;
        await this.saveSettings();
        this.plugin.triggerRefresh();
    }

    getPresets() {
        return this.plugin.settings.presets || {};
    }

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

    async updateCurrentPreset(presetName: string) {
        const presets = this.getPresets();
        if (presetName !== 'default' && presets[presetName]) {
            presets[presetName].settings = { ...this.plugin.settings };
            await this.saveSettings();
        }
    }

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

    private areSettingsEqual(settings1: Partial<CardNavigatorSettings>, settings2: Partial<CardNavigatorSettings>): boolean {
        const keys1 = Object.keys(settings1) as (keyof CardNavigatorSettings)[];
        const keys2 = Object.keys(settings2) as (keyof CardNavigatorSettings)[];

        if (keys1.length !== keys2.length) return false;

        for (const key of keys1) {
            if (settings1[key] !== settings2[key]) return false;
        }

        return true;
    }

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

    async revertCurrentPresetToDefault() {
        const presets = this.getPresets();
        const defaultSettings = presets['default']?.settings;
        if (defaultSettings) {
            this.plugin.settings = { ...this.plugin.settings, ...defaultSettings };
            const lastActivePreset = this.plugin.settings.lastActivePreset;
            if (lastActivePreset && lastActivePreset !== 'default' && presets[lastActivePreset]) {
                presets[lastActivePreset].settings = { ...defaultSettings };
            }
            await this.saveSettings();
            this.plugin.triggerRefresh();
        }
    }

	// Reverts to default settings
    async revertToDefault() {
        this.plugin.settings = { ...DEFAULT_SETTINGS };
        this.plugin.settings.lastActivePreset = 'default';
        await this.saveSettings();
        this.plugin.triggerRefresh();
    }

    getCurrentSettings(): Partial<CardNavigatorSettings> {
        return this.plugin.settings;
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
