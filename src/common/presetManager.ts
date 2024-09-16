import { Notice } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { t } from 'i18next';

// PresetManager class to handle operations related to settings presets
export class PresetManager {
    constructor(private plugin: CardNavigatorPlugin) {}

    // Apply a specific preset to the current settings
    applyPreset(presetName: string) {
        const preset = this.plugin.settings.presets?.[presetName];
        if (preset) {
            // Merge the preset settings with the current settings
            this.plugin.settings = { ...this.plugin.settings, ...preset.settings };
            // Update the last active preset
            this.plugin.settings.lastActivePreset = presetName;
            // Save the updated settings
            this.plugin.saveSettings();
        } else {
            // Show a notice if the preset doesn't exist
            new Notice(t('Preset does not exist.', { presetName }));
        }
    }

    // Save the current settings as a new preset
    savePreset(presetName: string) {
        // Prevent modification of the default preset
        if (presetName === 'default') {
            new Notice(t('Default preset cannot be modified.'));
            return;
        }
        // Initialize the presets object if it doesn't exist
        if (!this.plugin.settings.presets) {
            this.plugin.settings.presets = {};
        }
        // Create a new preset with the current settings
        this.plugin.settings.presets[presetName] = {
            name: presetName,
            settings: { ...this.plugin.settings }
        };
        // Update the last active preset
        this.plugin.settings.lastActivePreset = presetName;
        // Save the updated settings
        this.plugin.saveSettings();
    }

    // Delete a specific preset
    deletePreset(presetName: string) {
        // Prevent deletion of the default preset
        if (presetName === 'default') {
            new Notice(t('Default preset cannot be deleted.'));
            return;
        }
        if (this.plugin.settings.presets) {
            // Remove the preset from the presets object
            delete this.plugin.settings.presets[presetName];
            // If the deleted preset was the last active one, switch to the default preset
            if (this.plugin.settings.lastActivePreset === presetName) {
                this.plugin.settings.lastActivePreset = 'default';
                const defaultPreset = this.plugin.settings.presets['default'];
                if (defaultPreset) {
                    // Apply the default preset settings
                    this.plugin.settings = { ...this.plugin.settings, ...defaultPreset.settings };
                }
            }
            // Save the updated settings
            this.plugin.saveSettings();
            // Show a notice confirming the deletion
            new Notice(t('Preset deleted.', { presetName }));
        }
    }
}
