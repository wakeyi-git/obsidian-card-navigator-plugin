import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { fontSizeSettings } from '../../common/types';
import { SettingTab } from './settingsTab';

export function addCardStylingSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {

	containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('Card styling settings'))
        .setHeading();

    fontSizeSettings.forEach(({ key, name, description }) => {
        if (key === 'fileNameFontSize' || key === 'firstHeaderFontSize' || key === 'bodyFontSize') {
            settingTab.addSliderSetting(
                containerEl,
                key,
                t(name),
                t(description)
            );
        }
    });
}
