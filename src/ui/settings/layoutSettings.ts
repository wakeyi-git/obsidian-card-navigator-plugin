import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { CardNavigatorSettings, rangeSettingConfigs, NumberSettingKey } from '../../common/types';

export function addLayoutSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(containerEl)
        .setName(t('Layout settings'))
        .setHeading();

    const settings: Record<string, Setting> = {};

    // Default Layout
    settings.defaultLayout = new Setting(containerEl)
        .setName(t('Default layout'))
        .setDesc(t('Choose the default layout for Card Navigator'))
        .addDropdown(dropdown => {
            dropdown
                .addOption('auto', t('Auto'))
                .addOption('list', t('List'))
                .addOption('grid', t('Grid'))
                .addOption('masonry', t('Masonry'))
                .setValue(plugin.settings.defaultLayout)
                .onChange(async (value) => {
                    const layout = value as CardNavigatorSettings['defaultLayout'];
                    await settingsManager.updateSetting('defaultLayout', layout);
                    updateSettingsState(layout, plugin.settings.alignCardHeight);
                });
        });

    // Card Width Threshold
    settings.cardWidthThreshold = addSliderSetting(containerEl, plugin, settingsManager, 'cardWidthThreshold', t('Card width threshold'), t('Width threshold for adding/removing columns'));

    // Align Card Height
    settings.alignCardHeight = new Setting(containerEl)
        .setName(t('Align card height'))
        .setDesc(t('If enabled, all cards will have the same height. If disabled, card height will adjust to content.'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.alignCardHeight)
            .onChange(async (value) => {
                await settingsManager.updateSetting('alignCardHeight', value);
                updateSettingsState(plugin.settings.defaultLayout, value);
            })
        );

    // Cards Per View
    settings.cardsPerView = addSliderSetting(containerEl, plugin, settingsManager, 'cardsPerView', t('Cards per view'), t('Number of cards to display at once'));

    // Grid Columns
    settings.gridColumns = addSliderSetting(containerEl, plugin, settingsManager, 'gridColumns', t('Grid columns'), t('Number of columns in grid layout'));

    // Grid Card Height
    settings.gridCardHeight = addSliderSetting(containerEl, plugin, settingsManager, 'gridCardHeight', t('Grid card height'), t('Card height in grid layout'));

    // Masonry Columns
    settings.masonryColumns = addSliderSetting(containerEl, plugin, settingsManager, 'masonryColumns', t('Masonry columns'), t('Number of columns in masonry layout'));

    function updateSettingsState(layout: CardNavigatorSettings['defaultLayout'], alignCardHeight: boolean) {
        const updateSettingState = (setting: Setting, isEnabled: boolean) => {
            setting.setDisabled(!isEnabled);
            if (isEnabled) {
                setting.settingEl.removeClass('setting-disabled');
            } else {
                setting.settingEl.addClass('setting-disabled');
            }
        };

        updateSettingState(settings.cardWidthThreshold, layout === 'auto');
        updateSettingState(settings.gridColumns, layout === 'grid');
        updateSettingState(settings.gridCardHeight, layout === 'auto' || layout === 'grid');
        updateSettingState(settings.masonryColumns, layout === 'masonry');
        updateSettingState(settings.alignCardHeight, layout === 'auto' || layout === 'list');
        updateSettingState(settings.cardsPerView, (layout === 'auto' || layout === 'list') && alignCardHeight);
    }

    // Set initial state
    updateSettingsState(plugin.settings.defaultLayout, plugin.settings.alignCardHeight);
}

function addSliderSetting(
    containerEl: HTMLElement, 
    plugin: CardNavigatorPlugin, 
    settingsManager: SettingsManager, 
    key: NumberSettingKey, 
    name: string, 
    desc: string
): Setting {
    const config = rangeSettingConfigs[key];
    if (!config) {
        console.error(`No range config found for setting: ${key}`);
        return new Setting(containerEl);
    }

    return new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addSlider(slider => slider
            .setLimits(config.min, config.max, config.step)
            .setValue(plugin.settings[key])
            .setDynamicTooltip()
            .onChange(async (value) => {
                await settingsManager.updateSetting(key, value);
            })
        );
}
