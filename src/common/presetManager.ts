// src/common/presetManager.ts

import { Notice } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { t } from 'i18next';

export class PresetManager {
    constructor(private plugin: CardNavigatorPlugin) {}

    applyPreset(presetName: string) {
        const preset = this.plugin.settings.presets?.[presetName];
        if (preset) {
            this.plugin.settings = { ...this.plugin.settings, ...preset.settings };
            this.plugin.settings.lastActivePreset = presetName;
            this.plugin.saveSettings();
        } else {
            new Notice(t('Preset does not exist.', { presetName }));
        }
    }

    savePreset(presetName: string) {
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

    deletePreset(presetName: string) {
        if (presetName === 'default') {
            new Notice(t('Default preset cannot be deleted.'));
            return;
        }
        if (this.plugin.settings.presets) {
            delete this.plugin.settings.presets[presetName];
            if (this.plugin.settings.lastActivePreset === presetName) {
                this.plugin.settings.lastActivePreset = 'default';
                const defaultPreset = this.plugin.settings.presets['default'];
                if (defaultPreset) {
                    this.plugin.settings = { ...this.plugin.settings, ...defaultPreset.settings };
                }
            }
            this.plugin.saveSettings();
            new Notice(t('Preset deleted.', { presetName }));
        }
    }
}
