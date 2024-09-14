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
import { t } from 'i18next';

export class SettingsManager {
    constructor(private plugin: CardNavigatorPlugin) {}

	// Loads the plugin settings from storage
    async loadSettings() {
        const loadedData = await this.plugin.loadData();
        this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
        
        // Ensure presets are properly loaded
        if (!this.plugin.settings.presets) {
            this.plugin.settings.presets = DEFAULT_SETTINGS.presets;
        }
        
        // Ensure lastActivePreset is set
        if (!this.plugin.settings.lastActivePreset) {
            this.plugin.settings.lastActivePreset = 'default';
        }
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
        this.plugin.presetManager.updateTempSetting(key, value);
        await this.saveSettings();
        if (key === 'defaultLayout') {
            this.plugin.updateCardNavigatorLayout(value as CardNavigatorSettings['defaultLayout']);
        }
    }

    // Reverts to default settings as defined in DEFAULT_SETTINGS
	async revertToDefaultSettings() {
        this.plugin.settings = { ...DEFAULT_SETTINGS };
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
        if (key === 'contentLength') {
            await this.updateContentLengthSetting(value);
        } else {
            const config = this.getNumberSettingConfig(key);
            const clampedValue = Math.max(config.min, Math.min(config.max, value));
            await this.updateSetting(key, clampedValue);
        }
    }

	// Updates the content length setting, with handling for unlimited content length
	async updateContentLengthSetting(value: number) {
		if (value <= 0) {
			await this.updateSetting('isContentLengthUnlimited', true);
			await this.updateSetting('contentLength', -1);
		} else {
			const config = this.getNumberSettingConfig('contentLength');
			const clampedValue = Math.max(config.min, Math.min(config.max, value));
			await this.updateSetting('isContentLengthUnlimited', false);
			await this.updateSetting('contentLength', clampedValue);
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
            ...this.getNumberSettingConfig(setting.key)
        }));
    }

	// Gets the available keyboard shortcuts
    getKeyboardShortcuts() {
        return keyboardShortcuts;
    }

	// Gets the current settings
	getCurrentSettings(): CardNavigatorSettings {
		return this.plugin.presetManager.getTempPreset() as CardNavigatorSettings;
	}

	// Applies a preset
	async applyPreset(presetName: string) {
		await this.plugin.presetManager.applyPreset(presetName);
		this.plugin.settings.lastActivePreset = presetName;
		await this.plugin.saveSettings();
	}

	// Saves the current settings as a new preset
    async saveAsNewPreset(presetName: string) {
        await this.plugin.presetManager.savePreset(presetName);
    }

	// Updates the current preset if it isn't the default preset
	async updateCurrentPreset(presetName: string) {
		if (presetName === 'default') {
			throw new Error(t('Default preset cannot be modified.'));
		}
		this.plugin.settings.presets[presetName] = {
			name: presetName,
			settings: { ...this.plugin.presetManager.getTempPreset() }
		};
		this.plugin.settings.lastActivePreset = presetName;
		await this.plugin.saveSettings();
	}

	// Deletes a preset
	async deletePreset(presetName: string) {
		if (presetName === 'default') {
			throw new Error(t('Default preset cannot be deleted.'));
		}
		delete this.plugin.settings.presets[presetName];
		// Apply default preset after deletion
		await this.applyPreset('default');
		this.plugin.settings.lastActivePreset = 'default';
		await this.plugin.saveSettings();
	}

	// Gets all available presets
	getPresets() {
		return this.plugin.presetManager.getPresets();
	}

	// Reverts to default settings
	async revertToDefault() {
		await this.plugin.presetManager.revertToDefault();
	}
}
