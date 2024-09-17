// settingsManager.ts
import { TFolder, Notice } from 'obsidian';
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
    DEFAULT_SETTINGS,
    FolderPresets
} from './types';
import { t } from 'i18next';

const globalSettingsKeys = ['presets', 'lastActivePreset', 'autoApplyPresets', 'folderPresets', 'selectedFolder'];

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
			// 현재 설정에서 전역 설정을 유지하고, 나머지 설정을 프리셋으로 덮어씁니다
			const globalSettings = Object.fromEntries(
				Object.entries(this.plugin.settings).filter(
					([key]) => globalSettingsKeys.includes(key)
				)
			);
			this.plugin.settings = {
				...this.plugin.settings,
				...presetSettings,
				...globalSettings
			};
			this.plugin.settings.lastActivePreset = presetName;
			await this.saveSettings();
			this.plugin.triggerRefresh();
		}
	}

	// Save the current settings as a new preset
	async savePreset(presetName: string) {
		if (presetName === 'default') {
			new Notice(t('Default preset cannot be modified.'));
			return;
		}
		if (!this.plugin.settings.presets) {
			this.plugin.settings.presets = {};
		}
		this.plugin.settings.presets[presetName] = {
			name: presetName,
			settings: { ...this.plugin.settings }
		};
		this.plugin.settings.lastActivePreset = presetName;
		this.plugin.saveSettings();
	}
	
    // Save current settings as a new preset
	async saveAsNewPreset(presetName: string) {
		const settingsToSave = Object.fromEntries(
			Object.entries(this.plugin.settings).filter(
				([key]) => !globalSettingsKeys.includes(key)
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
					([key]) => !globalSettingsKeys.includes(key)
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
				([key]) => !globalSettingsKeys.includes(key)
			)
		);
	
		const presetSettings = Object.fromEntries(
			Object.entries(activePreset.settings).filter(
				([key]) => !globalSettingsKeys.includes(key)
			)
		);
	
		return !this.areSettingsEqual(settingsToCompare, presetSettings);
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

	// Adding presets to a specific folder
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

	// Set a default preset for a specific folder
	async setDefaultPresetForFolder(folderPath: string, presetName: string) {
		if (this.plugin.settings.folderPresets && this.plugin.settings.folderPresets[folderPath]) {
			const presets = this.getPresets();
			this.plugin.settings.folderPresets[folderPath].forEach(name => {
				if (presets[name]) {
					presets[name].isDefault = (name === presetName);
				}
			});

			await this.saveSettings();

			if (this.isCurrentFolder(folderPath)) {
				const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
				if (folder instanceof TFolder) {
					await this.applyPresetForFolder(folder);
				}
			}
		}
	}

	// Get the default presets in a specific folder
    getDefaultPresetForFolder(folderPath: string): string | null {
        if (this.plugin.settings.folderPresets && this.plugin.settings.folderPresets[folderPath]) {
            const presets = this.getPresets();
            for (const name of this.plugin.settings.folderPresets[folderPath]) {
                if (presets[name] && presets[name].isDefault) {
                    return name;
                }
            }
        }
        return null;
    }

	// Apply a preset for a specific folder
	async applyPresetForFolder(folder: TFolder) {
		if (!this.plugin.settings.autoApplyPresets) return;

		const folderPath = folder.path;
		const defaultPreset = this.getDefaultPresetForFolder(folderPath);
		if (defaultPreset) {
			await this.applyPreset(defaultPreset);
			this.plugin.settings.lastActivePreset = defaultPreset;
		} else {
			await this.applyPreset('default');
			this.plugin.settings.lastActivePreset = 'default';
		}
		await this.saveSettings();
	}

	// Get the current active preset
	getCurrentActivePreset(): string {
		return this.plugin.settings.lastActivePreset || 'default';
	}

	// Get all folder preset mappings
    getFolderPresets(): FolderPresets {
        return this.plugin.settings.folderPresets || {};
    }

	// Get a list of presets for a specific folder
    getPresetsForFolder(folderPath: string): string[] {
        return this.plugin.settings.folderPresets && this.plugin.settings.folderPresets[folderPath] 
            ? this.plugin.settings.folderPresets[folderPath] 
            : [];
    }

	// Turn auto-preset application on or off
    async toggleAutoApplyPresets(value: boolean) {
        await this.updateSetting('autoApplyPresets', value);
    }

	// Removing presets from a specific folder
	async removePresetFromFolder(folderPath: string, presetName: string) {
		if (this.plugin.settings.folderPresets && this.plugin.settings.folderPresets[folderPath]) {
			const folderPresets = this.plugin.settings.folderPresets[folderPath];
			const defaultPreset = this.getDefaultPresetForFolder(folderPath);

			this.plugin.settings.folderPresets[folderPath] = folderPresets.filter(name => name !== presetName);

			if (defaultPreset === presetName) {
				await this.setDefaultPresetForFolder(folderPath, 'default');

				if (this.isCurrentFolder(folderPath)) {
					const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
					if (folder instanceof TFolder) {
						await this.applyPresetForFolder(folder);
					}
				}
			}

			if (this.plugin.settings.folderPresets[folderPath].length === 0) {
				delete this.plugin.settings.folderPresets[folderPath];
			}

			await this.saveSettings();
		}
	}

	// Helper methods to check if this is the current folder
	private isCurrentFolder(folderPath: string): boolean {
		const currentFolderPath = this.getCurrentFolderPath();
		return currentFolderPath === folderPath;
	}

	// Methods to get the current folder path
	private getCurrentFolderPath(): string | null {
		if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
			return this.plugin.settings.selectedFolder;
		} else {
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (activeFile && activeFile.parent) {
				return activeFile.parent.path;
			}
		}
		return null;
	}	

	// Delete a specific preset
	async deletePreset(presetName: string) {
		await this.removePresetFromAllFolders(presetName);

		if (presetName !== 'default' && this.plugin.settings.presets[presetName]) {
			delete this.plugin.settings.presets[presetName];
			if (this.plugin.settings.lastActivePreset === presetName) {
				this.plugin.settings.lastActivePreset = 'default';
				await this.applyPreset('default');
			}
			await this.saveSettings();
		}
	}

	// Remove presets from all folders when they are deleted
    async removePresetFromAllFolders(presetName: string) {
        if (this.plugin.settings.folderPresets) {
            for (const folderPath in this.plugin.settings.folderPresets) {
                await this.removePresetFromFolder(folderPath, presetName);
            }
        }
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
