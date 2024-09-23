import { App, PluginSettingTab, Setting } from 'obsidian';
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

    constructor(
        app: App,
        private plugin: CardNavigatorPlugin,
        private settingsManager: SettingsManager,
    ) {
        super(app, plugin);
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

    addToggleSetting(
        containerEl: HTMLElement,
        key: keyof CardNavigatorSettings,
        name: string,
        desc: string
    ): Setting {
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings[key] as boolean)
                .onChange(async (value: boolean) => {
                    await this.settingsManager.updateBooleanSetting(key, value);
                })
            );
    }

    addSliderSetting(
        containerEl: HTMLElement,
        key: NumberSettingKey,
        name: string,
        desc: string
    ): Setting {
        const config = this.settingsManager.getNumberSettingConfig(key);
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addSlider(slider => slider
                .setLimits(config.min, config.max, config.step)
                .setValue(this.plugin.settings[key] as number)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    await this.settingsManager.updateSetting(key, value);
                })
            );
    }

    addDropdownSetting(
        containerEl: HTMLElement,
        key: 'sortMethod',
        name: string,
        desc: string
    ): Setting {
        return new Setting(containerEl)
            .setName(t(name))
            .setDesc(t(desc))
            .addDropdown(dropdown => {
                sortOptions.forEach(option => {
                    dropdown.addOption(option.value, t(option.label));
                });
                dropdown
                    .setValue(`${this.plugin.settings.sortCriterion}_${this.plugin.settings.sortOrder}`)
                    .onChange(async (value: string) => {
                        const [criterion, order] = value.split('_') as [SortCriterion, SortOrder];
                        await this.settingsManager.updateSetting('sortCriterion', criterion);
                        await this.settingsManager.updateSetting('sortOrder', order);
                    });
            });
    }
}
