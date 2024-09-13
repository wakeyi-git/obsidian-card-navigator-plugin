import { Notice } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { Preset, CardNavigatorSettings } from './types';
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
    applyPreset(presetName: string) {
        if (this.plugin.settings.presets[presetName]) {
            this.tempPreset = { ...this.plugin.settings.presets[presetName].settings };
            this.applyTempPreset();
			new Notice(t('Preset \'{presetName}\' applied to temporary settings.', { presetName }));
        } else {
			new Notice(t('Preset \'{presetName}\' does not exist.', { presetName }));
        }
    }

    // Saves the current temporary settings as a preset
    savePreset(presetName: string) {
        if (presetName === 'default') {
			new Notice(t('Default preset cannot be modified.'));
            return;
        }
        this.plugin.settings.presets[presetName] = {
            name: presetName,
            settings: { ...this.tempPreset }
        };
        this.plugin.settings.lastActivePreset = presetName;
        this.plugin.saveSettings();
		new Notice(t('Preset \'{presetName}\' saved successfully.', { presetName }));
    }

    // Deletes a preset, reverting to default if necessary
    deletePreset(presetName: string) {
        if (presetName === 'default') {
			new Notice(t('Default preset cannot be deleted.'));
            return;
        }
        delete this.plugin.settings.presets[presetName];
        if (this.plugin.settings.lastActivePreset === presetName) {
            this.plugin.settings.lastActivePreset = 'default';
        }
        this.plugin.saveSettings();
		new Notice(t('Preset \'{presetName}\' deleted successfully.', { presetName }));
    }

    // Reverts the temporary settings to the default preset
    revertToDefault() {
        this.tempPreset = { ...this.plugin.settings.presets['default'].settings };
        this.applyTempPreset();
		new Notice(t('Reverted to default settings.'));
    }

    // Updates a specific setting in the temporary preset
    updateTempSetting<K extends keyof CardNavigatorSettings>(
        key: K,
        value: CardNavigatorSettings[K]
    ) {
        this.tempPreset[key] = value;
        this.applyTempPreset();
    }

    // Returns a copy of the current temporary preset
    getTempPreset(): Partial<CardNavigatorSettings> {
        return { ...this.tempPreset };
    }

    // Returns all available presets
    getPresets(): Record<string, Preset> {
        return this.plugin.settings.presets;
    }

    // Applies the temporary preset settings and saves them
    private applyTempPreset() {
        Object.assign(this.plugin.settings, this.tempPreset);
        this.plugin.saveSettings();
    }

    // Saves the last active preset based on the current temporary settings
    saveLastActivePreset() {
        const lastActivePresetName = Object.entries(this.plugin.settings.presets).find(
            ([_, preset]) => JSON.stringify(preset.settings) === JSON.stringify(this.tempPreset)
        )?.[0] || 'default';

        this.plugin.settings.lastActivePreset = lastActivePresetName;
        this.plugin.saveSettings();
    }
}
