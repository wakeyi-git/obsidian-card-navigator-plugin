import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { fontSizeSettings } from '../../common/types';

export function addCardStylingSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(containerEl)
        .setName(t('Card styling settings'))
        .setHeading();

    fontSizeSettings.forEach(({ key, name, description }) => {
        if (key === 'fileNameFontSize' || key === 'firstHeaderFontSize' || key === 'bodyFontSize') {
            new Setting(containerEl)
                .setName(t(name))
                .setDesc(t(description))
                .addSlider(slider => {
                    const config = settingsManager.getNumberSettingConfig(key);
                    slider
                        .setLimits(config.min, config.max, config.step)
                        .setValue(plugin.settings[key])
                        .setDynamicTooltip()
                        .onChange(async (value) => {
                            await settingsManager.updateSetting(key, value);
                            plugin.triggerRefresh();
                        });
                });
        }
    });
}
