// src/common/presetManager.ts

import { Notice } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { Preset, CardNavigatorSettings, DEFAULT_SETTINGS } from './types';
import { t } from 'i18next';

export class PresetManager {
    private plugin: CardNavigatorPlugin;
    private tempPreset: Partial<CardNavigatorSettings> = {};

    constructor(plugin: CardNavigatorPlugin) {
        this.plugin = plugin;
    }

	// Initializes the temporary preset with the last active or default preset settings
    initializeTempPreset() {
        const lastActivePresetName = this.plugin.settings.lastActivePreset;
        if (lastActivePresetName && this.plugin.settings.presets[lastActivePresetName]) {
            this.tempPreset = { ...this.plugin.settings.presets[lastActivePresetName].settings };
        } else {
            this.tempPreset = { ...this.plugin.settings.presets['default'].settings };
        }
        this.applyTempPreset();
    }

	// Applies a preset to the temporary settings
	applyPresetInternal(presetName: string) {
		if (this.plugin.settings.presets[presetName]) {
			this.tempPreset = { ...this.plugin.settings.presets[presetName].settings };
			this.tempPreset.lastActivePreset = presetName;
			this.applyTempPreset();
			
			const newLayout = this.tempPreset.defaultLayout;
			if (newLayout) {
				this.plugin.updateCardNavigatorLayout(newLayout);
			}
			new Notice(`${t('Preset \'{presetName}\' Applied.').replace('{presetName}', presetName)}`);
		} else {
			new Notice(`${t('Preset \'{presetName}\' does not exist.').replace('{presetName}', presetName)}`);
		}
	}

	// Saves the current temporary settings as a preset
	savePresetInternal(presetName: string) {
		if (presetName === 'default') {
			return;
		}
		this.plugin.settings.presets[presetName] = {
			name: presetName,
			settings: { ...this.tempPreset }
		};
		this.plugin.settings.lastActivePreset = presetName;
	}

    // Deletes a preset, reverting to default if necessary
    deletePresetInternal(presetName: string) {
        if (presetName === 'default') {
            return;
        }
        delete this.plugin.settings.presets[presetName];
        if (this.plugin.settings.lastActivePreset === presetName) {
            this.plugin.settings.lastActivePreset = 'default';
        }
        this.plugin.saveSettings();
    }

	// Reverts the temporary settings to the default preset
    revertToDefault() {
        this.tempPreset = { ...this.plugin.settings.presets['default'].settings };
        this.applyTempPreset();
    }

    // Updates a specific setting in the temporary preset
    updateTempSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.tempPreset[key] = value;
        this.applyTempPreset();
    }

    // Updates the temporary preset to default settings
	updateTempPresetToDefault(currentPresetName: string) {
		this.tempPreset = { ...DEFAULT_SETTINGS };
		delete this.tempPreset.presets; // Remove nested presets
		this.tempPreset.lastActivePreset = currentPresetName; // Maintain the current preset
	}

    // Returns a copy of the current temporary preset
    getTempPreset(): Partial<CardNavigatorSettings> {
        return { ...this.tempPreset };
    }

	// Applies the temporary preset settings and saves them
	applyTempPreset() {
		Object.assign(this.plugin.settings, this.tempPreset);
		this.plugin.triggerRefresh();
	}

	// Ensuring synchronization between tempPreset and actual settings
	syncTempPresetWithSettings() {
		const currentSettings = { ...this.plugin.settings };
		const { ...tempPreset } = currentSettings;
		this.tempPreset = tempPreset;
	}

	// Returns all available presets
	getPresets(): Record<string, Preset> {
		return this.plugin.settings.presets;
	}

	// Updates the settings of the currently active preset.
	updateActivePreset() {
		const currentPresetName = this.plugin.settings.lastActivePreset;
		if (currentPresetName !== 'default') {
			this.plugin.settings.presets[currentPresetName].settings = { ...this.tempPreset };
			this.plugin.saveSettings();
		}
	}

	// Saves the last active preset based on the current temporary settings
	saveLastActivePreset() {
		const lastActivePresetName = Object.entries(this.plugin.settings.presets).find(
			([_, preset]) => {
				const presetSettings = preset.settings as Partial<CardNavigatorSettings>;
				const tempPreset = this.tempPreset as Partial<CardNavigatorSettings>;
				return Object.keys(tempPreset).every(key => 
					JSON.stringify(presetSettings[key as keyof CardNavigatorSettings]) === 
					JSON.stringify(tempPreset[key as keyof CardNavigatorSettings])
				);
			}
		)?.[0] || this.plugin.settings.lastActivePreset;
	
		if (lastActivePresetName !== this.plugin.settings.lastActivePreset) {
			this.plugin.settings.lastActivePreset = lastActivePresetName;
			this.plugin.saveSettings();
		}
	}
}
