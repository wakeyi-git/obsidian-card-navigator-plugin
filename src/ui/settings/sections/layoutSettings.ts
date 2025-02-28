import { Setting } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { SettingsManager } from 'ui/settings/settingsManager';
import { SettingTab } from 'ui/settings/settingsTab';
import { t } from 'i18next';
import { rangeSettingConfigs } from 'common/types';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from '../../../ui/cardNavigatorView';

export function addLayoutSettings(
    containerEl: HTMLElement,
    plugin: CardNavigatorPlugin,
    settingsManager: SettingsManager,
    settingTab: SettingTab
): void {
    containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('LAYOUT_SETTINGS'))
        .setHeading();

    const settings: Record<string, Setting> = {};
    
    // 업데이트 중인지 추적하는 플래그
    let isFixedHeightUpdating = false;
    let isCardsPerColumnUpdating = false;

    // 카드 너비 임계값 설정
    settings.cardThresholdWidth = settingTab.addSliderSetting(
        containerEl,
        'cardThresholdWidth',
        t('CARD_THRESHOLD_WIDTH'),
        t('CARD_THRESHOLD_WIDTH_DESC')
    );

    // 카드 높이 정렬 설정
    settings.alignCardHeight = new Setting(containerEl)
        .setName(t('ALIGN_CARD_HEIGHT'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.alignCardHeight)
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting('alignCardHeight', value);
                updateSettingsState();
            })
        );

    // 높이 계산 방식 선택 토글 추가
    const useFixedHeightSetting = new Setting(containerEl)
        .setName(t('USE_FIXED_HEIGHT'))
        .setDesc(t('CHOOSE_HEIGHT_CALCULATION_METHOD'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.useFixedHeight)
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting('useFixedHeight', value);
                updateSettingsState();
            })
        );
    useFixedHeightSetting.settingEl.addClass('setting-use-fixed-height');

    // 고정 카드 높이 설정
    const fixedCardHeightSetting = new Setting(containerEl)
        .setName(t('FIXED_CARD_HEIGHT'))
        .setDesc(t('FIXED_CARD_HEIGHT_DESC'))
        .addSlider(slider => slider
            .setLimits(
                rangeSettingConfigs.fixedCardHeight.min,
                rangeSettingConfigs.fixedCardHeight.max,
                rangeSettingConfigs.fixedCardHeight.step
            )
            .setValue(plugin.settings.fixedCardHeight)
            .onChange(async (value) => {
                if (isFixedHeightUpdating) return;
                isFixedHeightUpdating = true;
                
                try {
                    await settingsManager.updateSetting('fixedCardHeight', value);
                    updateSettingsState();
                } finally {
                    isFixedHeightUpdating = false;
                }
            })
        );
    fixedCardHeightSetting.settingEl.addClass('setting-fixed-card-height');

    // 열당 카드 수 설정
    const cardsPerColumnSetting = new Setting(containerEl)
        .setName(t('CARDS_PER_COLUMN'))
        .setDesc(t('CARDS_PER_COLUMN_DESC'))
        .addSlider(slider => slider
            .setLimits(
                rangeSettingConfigs.cardsPerColumn.min,
                rangeSettingConfigs.cardsPerColumn.max,
                rangeSettingConfigs.cardsPerColumn.step
            )
            .setValue(plugin.settings.cardsPerColumn)
            .onChange(async (value) => {
                if (isCardsPerColumnUpdating) return;
                isCardsPerColumnUpdating = true;
                
                try {
                    await settingsManager.updateSetting('cardsPerColumn', value);
                    updateSettingsState();
                } finally {
                    isCardsPerColumnUpdating = false;
                }
            })
        );
    cardsPerColumnSetting.settingEl.addClass('setting-cards-per-column');

    function updateSettingsState() {
        const alignCardHeight = plugin.settings.alignCardHeight;
        const useFixedHeight = plugin.settings.useFixedHeight;
        
        // useFixedHeight 설정 활성화/비활성화
        const useFixedHeightSettingEl = containerEl.querySelector('.setting-use-fixed-height');
        if (useFixedHeightSettingEl instanceof HTMLElement) {
            useFixedHeightSettingEl.style.display = alignCardHeight ? 'flex' : 'none';
        }
        
        // fixedCardHeight 설정 활성화/비활성화
        const fixedCardHeightSettingEl = containerEl.querySelector('.setting-fixed-card-height');
        if (fixedCardHeightSettingEl instanceof HTMLElement) {
            fixedCardHeightSettingEl.style.display = alignCardHeight ? 'flex' : 'none';
            
            if (alignCardHeight) {
                if (useFixedHeight) {
                    fixedCardHeightSettingEl.classList.remove('setting-disabled');
                    const slider = fixedCardHeightSettingEl.querySelector('input[type="range"]') as HTMLInputElement;
                    if (slider) {
                        slider.disabled = false;
                    }
                } else {
                    fixedCardHeightSettingEl.classList.add('setting-disabled');
                    const slider = fixedCardHeightSettingEl.querySelector('input[type="range"]') as HTMLInputElement;
                    if (slider) {
                        slider.disabled = true;
                    }
                }
            }
        }
        
        // cardsPerColumn 설정 활성화/비활성화
        const cardsPerColumnSettingEl = containerEl.querySelector('.setting-cards-per-column');
        if (cardsPerColumnSettingEl instanceof HTMLElement) {
            cardsPerColumnSettingEl.style.display = alignCardHeight ? 'flex' : 'none';
            
            if (alignCardHeight) {
                if (!useFixedHeight) {
                    cardsPerColumnSettingEl.classList.remove('setting-disabled');
                    const slider = cardsPerColumnSettingEl.querySelector('input[type="range"]') as HTMLInputElement;
                    if (slider) {
                        slider.disabled = false;
                    }
                } else {
                    cardsPerColumnSettingEl.classList.add('setting-disabled');
                    const slider = cardsPerColumnSettingEl.querySelector('input[type="range"]') as HTMLInputElement;
                    if (slider) {
                        slider.disabled = true;
                    }
                }
            }
        }
    }

    // 초기 설정 상태 업데이트
    updateSettingsState();
}
