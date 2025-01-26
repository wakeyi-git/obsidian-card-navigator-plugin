import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { CardNavigatorSettings } from '../../common/types';
import { SettingTab } from './settingsTab';
import { t } from 'i18next';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';

export function addLayoutSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {
    containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('LAYOUT_SETTINGS'))
        .setHeading();

    const settings: Record<string, Setting> = {};

    // Default Layout
    settings.defaultLayout = new Setting(containerEl)
        .setName(t('DEFAULT_LAYOUT'))
        .setDesc(t('DEFAULT_LAYOUT_DESC'))
        .addDropdown(dropdown => {
            dropdown
                .addOption('auto', t('AUTO'))
                .addOption('list', t('LIST'))
                .addOption('grid', t('GRID'))
                .addOption('masonry', t('MASONRY'))
                .setValue(plugin.settings.defaultLayout)
                .onChange(async (value) => {
                    const layout = value as CardNavigatorSettings['defaultLayout'];
                    await settingsManager.updateSetting('defaultLayout', layout);
                    updateSettingsState(layout, plugin.settings.alignCardHeight);
                });
        });

    // Card Width Threshold
    settings.cardWidthThreshold = settingTab.addSliderSetting(
        containerEl,
        'cardWidthThreshold',
        t('CARD_WIDTH_THRESHOLD'),
        t('CARD_WIDTH_THRESHOLD_DESC')
    );

    // Align Card Height
    settings.alignCardHeight = new Setting(containerEl)
    .setName(t('ALIGN_CARD_HEIGHT'))
    .setDesc(t('ALIGN_CARD_HEIGHT_DESC'))
    .addToggle(toggle => toggle
        .setValue(plugin.settings.alignCardHeight)
        .onChange(async (value) => {
            await settingsManager.updateSetting('alignCardHeight', value);
            updateSettingsState(plugin.settings.defaultLayout, value);
        })
    );

    // Cards Per View
    settings.cardsPerView = settingTab.addSliderSetting(
        containerEl,
        'cardsPerView',
        t('CARDS_PER_VIEW'),
        t('CARDS_PER_VIEW_DESC')
    );

    // Grid Columns
    settings.gridColumns = settingTab.addSliderSetting(
        containerEl,
        'gridColumns',
        t('GRID_COLUMNS'),
        t('GRID_COLUMNS_DESC')
    );

    // Grid Card Height
    settings.gridCardHeight = settingTab.addSliderSetting(
        containerEl,
        'gridCardHeight',
        t('GRID_CARD_HEIGHT'),
        t('GRID_CARD_HEIGHT_DESC')
    );

    // Masonry Columns
    settings.masonryColumns = settingTab.addSliderSetting(
        containerEl,
        'masonryColumns',
        t('MASONRY_COLUMNS'),
        t('MASONRY_COLUMNS_DESC')
    );

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
