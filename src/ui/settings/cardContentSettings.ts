import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { contentSettings } from '../../common/types';
import { SettingTab } from './settingsTab';
import { t } from 'i18next';

export function addCardContentSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {

    containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('CARD_CONTENT_SETTINGS'))
        .setHeading();

    settingTab.addToggleSetting(
        containerEl,
        'renderContentAsHtml',
        t('RENDER_CONTENT_AS_HTML'),
        t('RENDER_CONTENT_AS_HTML_DESC')
    );

    settingTab.addToggleSetting(
        containerEl,
        'dragDropContent',
        t('DRAG_AND_DROP_CONTENT'),
        t('DRAG_AND_DROP_CONTENT_DESC')
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
        t('BODY_LENGTH_LIMIT'),
        t('BODY_LENGTH_LIMIT_DESC')
    );

    const bodyLengthSetting = settingTab.addSliderSetting(
        containerEl,
        'bodyLength',
        t('BODY_LENGTH'),
        t('BODY_LENGTH_DESC')
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
