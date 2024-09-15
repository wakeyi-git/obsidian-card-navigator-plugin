// src/common/presetManager.ts

import { Notice } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { t } from 'i18next';

export class PresetManager {
    constructor(private plugin: CardNavigatorPlugin) {}

    applyPreset(presetName: string) {
        if (this.plugin.settings.presets[presetName]) {
            this.plugin.settings.currentSettings = { ...this.plugin.settings.presets[presetName].settings };
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
        this.plugin.settings.presets[presetName] = {
            name: presetName,
            settings: { ...this.plugin.settings.currentSettings }
        };
        this.plugin.settings.lastActivePreset = presetName;
        this.plugin.saveSettings();
    }

    deletePreset(presetName: string) {
        if (presetName === 'default') {
            new Notice(t('Default preset cannot be deleted.'));
            return;
        }
        delete this.plugin.settings.presets[presetName];
        if (this.plugin.settings.lastActivePreset === presetName) {
            this.plugin.settings.lastActivePreset = 'default';
            this.plugin.settings.currentSettings = { ...this.plugin.settings.presets['default'].settings };
        }
        this.plugin.saveSettings();
        new Notice(t('Preset deleted.', { presetName }));
    }
}
