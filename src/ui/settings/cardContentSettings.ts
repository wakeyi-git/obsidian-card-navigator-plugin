import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { contentSettings } from '../../common/types';

export function addCardContentSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(containerEl)
        .setName(t('Card content settings'))
        .setHeading();

    new Setting(containerEl)
        .setName(t('Render content as HTML'))
        .setDesc(t('If enabled, card content will be rendered as HTML.'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.renderContentAsHtml)
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting('renderContentAsHtml', value);
            })
        );

    new Setting(containerEl)
        .setName(t('Drag and drop content'))
        .setDesc(t('When enabled, dragging a card will insert the note content instead of a link.'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.dragDropContent)
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting('dragDropContent', value);
            })
        );

    contentSettings.forEach(({ key, name, description }) => {
        new Setting(containerEl)
            .setName(t(name))
            .setDesc(t(description))
            .addToggle(toggle => toggle
                .setValue(plugin.settings[key] as boolean)
                .onChange(async (value) => {
                    await settingsManager.updateBooleanSetting(key, value);
                })
            );
    });

    new Setting(containerEl)
        .setName(t('Body length limit'))
        .setDesc(t('Toggle between limited and unlimited body length.'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.bodyLengthLimit)
            .onChange(async (value) => {
                await settingsManager.updateSetting('bodyLengthLimit', value);
                updateBodyLengthState(value);
            })
        );

    const bodyLengthSetting = new Setting(containerEl)
        .setName(t('Body length'))
        .setDesc(t('Set the maximum body length displayed on each card when body length is limited.'))
        .addSlider(slider => {
            const config = settingsManager.getNumberSettingConfig('bodyLength');
            slider
                .setLimits(config.min, config.max, config.step)
                .setValue(plugin.settings.bodyLength)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await settingsManager.updateSetting('bodyLength', value);
                    plugin.triggerRefresh();
                });
        });

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
