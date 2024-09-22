import { App, PluginSettingTab } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { addPresetSettings } from './presetSettings';
import { addContainerSettings } from './containerSettings';
import { addLayoutSettings } from './layoutSettings';
import { addCardContentSettings } from './cardContentSettings';
import { addCardStylingSettings } from './cardStyleSettings';
import { addKeyboardShortcutsInfo } from './keyboardShortcutsInfo';

export class SettingTab extends PluginSettingTab {
    private settingsManager: SettingsManager;

    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
        this.settingsManager = plugin.settingsManager;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        addPresetSettings(containerEl, this.plugin, this.settingsManager);
        addContainerSettings(containerEl, this.plugin, this.settingsManager);
        addLayoutSettings(containerEl, this.plugin, this.settingsManager);
        addCardContentSettings(containerEl, this.plugin, this.settingsManager);
        addCardStylingSettings(containerEl, this.plugin, this.settingsManager);
        addKeyboardShortcutsInfo(containerEl);
    }
}
