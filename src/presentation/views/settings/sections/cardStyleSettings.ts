import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../../../main';
import { SettingsManager } from '../settingsManager';
import { fontSizeSettings, FontSizeSetting } from '../../../../domain/models/types';
import { SettingTab } from '../settingsTab';
import { t } from 'i18next';

export function addCardStylingSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {

    containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('CARD_STYLING_SETTINGS'))
        .setHeading();

    fontSizeSettings.forEach(({ key, name, description }: FontSizeSetting) => {
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
