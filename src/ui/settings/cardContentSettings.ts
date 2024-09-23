import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { contentSettings } from '../../common/types';
import { SettingTab } from './settingsTab';

export function addCardContentSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {

	containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('Card content settings'))
        .setHeading();

    settingTab.addToggleSetting(
        containerEl,
        'renderContentAsHtml',
        t('Render content as HTML'),
        t('If enabled, card content will be rendered as HTML.')
    );

    settingTab.addToggleSetting(
        containerEl,
        'dragDropContent',
        t('Drag and drop content'),
        t('When enabled, dragging a card will insert the note content instead of a link.')
    );

    contentSettings.forEach(({ key, name, description }) => {
        settingTab.addToggleSetting(
            containerEl,
            key,
            t(name),
            t(description)
        );
    });

    settingTab.addToggleSetting(
        containerEl,
        'bodyLengthLimit',
        t('Body length limit'),
        t('Toggle between limited and unlimited body length.')
    );

    const bodyLengthSetting = settingTab.addSliderSetting(
        containerEl,
        'bodyLength',
        t('Body length'),
        t('Set the maximum body length displayed on each card when body length is limited.')
    );

    // Update Body Length setting state
    const updateBodyLengthState = (isLimited: boolean) => {
        bodyLengthSetting.setDisabled(!isLimited);
        if (isLimited) {
            bodyLengthSetting.settingEl.removeClass('setting-disabled');
        } else {
            bodyLengthSetting.settingEl.addClass('setting-disabled');
        }
    };

    // Set initial state of Body Length setting
    updateBodyLengthState(plugin.settings.bodyLengthLimit);
}
