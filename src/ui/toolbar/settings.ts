import { Setting, TextComponent } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { ToolbarMenu, CardNavigatorSettings, NumberSettingKey } from 'common/types';
import { SettingsManager } from 'ui/settings/settingsManager';
import { FolderSuggest } from 'ui/settings/components/FolderSuggest';
import { t } from 'i18next';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';

// 현재 팝업 정보를 저장하는 맵
interface PopupInfo {
    element: HTMLElement;
    clickHandler: (e: MouseEvent) => void;
}

// 팝업 클래스 이름을 키로 사용하는 맵
const currentPopups = new Map<string, PopupInfo>();

//#region 설정 기능
// 설정 메뉴 토글
export function toggleSettings(plugin: CardNavigatorPlugin, toolbarEl: HTMLElement): void {
    const currentWindow = window;
    const popupClass = 'card-navigator-settings-popup';
    
    // 현재 팝업이 열려있는지 확인
    const existingPopupElement = currentWindow.document.querySelector(`.${popupClass}`);
    
    if (existingPopupElement) {
        closePopup(popupClass, currentWindow);
        return;
    }
    
    // 새 팝업 생성
    closeCurrentPopup(currentWindow);
    const popup = createPopup(popupClass, 'settings', currentWindow);
    
    // 설정 팝업 내용 생성
    createSettingsContent(plugin, popup);
}

// 프리셋 설정 추가
async function addPresetSettingsToPopup(settingsPopup: HTMLElement, plugin: CardNavigatorPlugin) {
    const presetSection = createCollapsibleSection(settingsPopup, t('PRESET_SETTINGS'), 'preset', true);
    presetSection.classList.add('preset-settings-section');

    const autoApplySetting = new Setting(presetSection)
        .setName(t('AUTO_APPLY_PRESETS'))
        .addToggle((toggle) => 
            toggle
                .setValue(plugin.settings.autoApplyPresets)
                .onChange(async (value) => {
                    plugin.settings.autoApplyPresets = value;
                    await plugin.saveSettings();
                    
                    // 토글 상태에 따라 GlobalPreset 설정 표시/숨김
                    const globalPresetSetting = presetSection.querySelector('.global-preset-setting');
                    if (globalPresetSetting instanceof HTMLElement) {
                        globalPresetSetting.style.display = value ? 'flex' : 'none';
                    }
                    
                    const currentFile = plugin.app.workspace.getActiveFile();
                    if (currentFile) {
                        await plugin.selectAndApplyPresetForCurrentFile();
                    }
                })
        );

    // GlobalPreset 설정 추가
    const presetNames = await plugin.presetManager.getPresetNames();
    const globalPresetSetting = new Setting(presetSection)
        .setName(t('GLOBAL_PRESET'))
        .addDropdown(async (dropdown) => {
            presetNames.forEach(name => {
                dropdown.addOption(name, name);
            });
            dropdown.setValue(plugin.settings.GlobalPreset)
                .onChange(async (value) => {
                    if (plugin.settings.autoApplyPresets) {
                        await plugin.presetManager.applyGlobalPreset(value);
                        // 설정 팝업 UI 새로고침
                        refreshSettingsPopup(settingsPopup, plugin);
                    }
                });
        });
    
    // 설정 요소에 클래스 추가
    globalPresetSetting.settingEl.addClass('global-preset-setting');
    
    // 초기 상태 설정
    if (!plugin.settings.autoApplyPresets) {
        globalPresetSetting.settingEl.style.display = 'none';
    }
}

// 설정 팝업 UI 새로고침 함수 수정
function refreshSettingsPopup(settingsPopup: HTMLElement, plugin: CardNavigatorPlugin) {
    // 레이아웃 섹션 업데이트
    const layoutSection = settingsPopup.querySelector('.tree-item-children[data-section="layout"]') as HTMLElement;
    if (layoutSection) {
        updateLayoutSettingValues(layoutSection, plugin);
    }
    
    // 디스플레이 섹션 업데이트
    const displaySection = settingsPopup.querySelector('.tree-item-children[data-section="display"]') as HTMLElement;
    if (displaySection) {
        updateDisplaySettingValues(displaySection, plugin);
    }
    
    // 스타일링 섹션 업데이트
    const stylingSection = settingsPopup.querySelector('.tree-item-children[data-section="styling"]') as HTMLElement;
    if (stylingSection) {
        updateStylingSettingValues(stylingSection, plugin);
    }
}

// 각 섹션의 설정값만 업데이트하는 함수들
function updateLayoutSettingValues(layoutSection: HTMLElement, plugin: CardNavigatorPlugin) {
    // 각 설정의 값 업데이트
    updateSliderValue(layoutSection, 'cardThresholdWidth', plugin);
    updateSliderValue(layoutSection, 'fixedCardHeight', plugin);
    updateToggleValue(layoutSection, 'alignCardHeight', plugin);
}

function updateDisplaySettingValues(displaySection: HTMLElement, plugin: CardNavigatorPlugin) {
    updateToggleValue(displaySection, 'renderContentAsHtml', plugin);
    updateToggleValue(displaySection, 'dragDropContent', plugin);
    updateToggleValue(displaySection, 'showFileName', plugin);
    updateToggleValue(displaySection, 'showFirstHeader', plugin);
    updateToggleValue(displaySection, 'showBody', plugin);
    updateToggleValue(displaySection, 'bodyLengthLimit', plugin);
    updateSliderValue(displaySection, 'bodyLength', plugin);
}

function updateStylingSettingValues(stylingSection: HTMLElement, plugin: CardNavigatorPlugin) {
    updateSliderValue(stylingSection, 'fileNameFontSize', plugin);
    updateSliderValue(stylingSection, 'firstHeaderFontSize', plugin);
    updateSliderValue(stylingSection, 'bodyFontSize', plugin);
}

// 개별 설정 요소 업데이트 헬퍼 함수들
function updateSliderValue(section: HTMLElement, settingKey: keyof CardNavigatorSettings, plugin: CardNavigatorPlugin) {
    const settingItem = section.querySelector(`.setting-item[data-setting="${settingKey}"]`);
    if (!settingItem) return;

    const slider = settingItem.querySelector('input[type="range"]');
    if (slider instanceof HTMLInputElement) {
        slider.value = String(plugin.settings[settingKey]);
        
        // description 제거 (기존 숫자 표시 제거)
        const description = settingItem.querySelector('.setting-item-description');
        if (description) {
            description.remove();
        }

        // 값 표시 업데이트
        const valueDisplay = settingItem.querySelector('.slider-value');
        if (valueDisplay) {
            valueDisplay.textContent = String(plugin.settings[settingKey]);
        }
    }
}

function updateToggleValue(section: HTMLElement, settingKey: keyof CardNavigatorSettings, plugin: CardNavigatorPlugin) {
    const toggle = section.querySelector(`.setting-item[data-setting="${settingKey}"] input[type="checkbox"]`);
    if (toggle instanceof HTMLInputElement) {
        toggle.checked = plugin.settings[settingKey] as boolean;
    }
}

// 드롭다운 설정 추가
function addDropdownSetting(
    key: keyof CardNavigatorSettings, 
    name: string, 
    container: HTMLElement, 
    plugin: CardNavigatorPlugin, 
    settingsManager: SettingsManager, 
    options: { value: string, label: string }[], 
    onChange?: (value: string) => void
) {
    new Setting(container)
        .setName(name)
        .setClass('setting-item-dropdown')
        .addDropdown(dropdown => {
            options.forEach(option => {
                dropdown.addOption(option.value, option.label);
            });
            dropdown.setValue(plugin.settings[key] as string)
                .onChange(async (value) => {
                    await settingsManager.updateSetting(key, value);
                    if (onChange) {
                        onChange(value);
                    }
                });
        });
}

// 토글 설정 추가
function addToggleSetting(
    key: keyof CardNavigatorSettings, 
    name: string, 
    container: HTMLElement, 
    plugin: CardNavigatorPlugin, 
    settingsManager: SettingsManager, 
    onChange?: () => void
) {
    new Setting(container)
        .setName(name)
        .addToggle(toggle => toggle
            .setValue(plugin.settings[key] as boolean)
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting(key, value);
                if (onChange) {
                    onChange();
                }
            })
        );
}

// 슬라이더 설정 추가
function addSliderSetting(
    key: NumberSettingKey, 
    name: string, 
    container: HTMLElement, 
    plugin: CardNavigatorPlugin, 
    settingsManager: SettingsManager
): Setting {
    const config = settingsManager.getNumberSettingConfig(key);
    const setting = new Setting(container)
        .setName(name)
        .setClass('setting-item-slider');
    setting.settingEl.setAttribute('data-setting', key);

    // description 제거 (기본 숫자 표시 제거)
    const description = setting.settingEl.querySelector('.setting-item-description');
    if (description) {
        description.remove();
    }

    // 현재 값을 표시할 span 요소 생성
    const valueDisplay = createSpan({
        text: String(plugin.settings[key])
    });
    // 이름 요소 찾기
    const nameEl = setting.settingEl.querySelector('.setting-item-name');
    if (nameEl) {
        // 값 표시 요소를 이름 요소 바로 뒤에 추가
        nameEl.appendChild(createSpan({ text: ' (' }));
        nameEl.appendChild(valueDisplay);
        nameEl.appendChild(createSpan({ text: ')' }));
    }

    // 이전 값 저장
    let previousValue = plugin.settings[key];
    // 업데이트 중인지 추적하는 플래그
    let isUpdating = false;

    setting.addSlider(slider => slider
        .setLimits(config.min, config.max, config.step)
        .setValue(plugin.settings[key])
        .onChange(async (value) => {
            if (
                (key === 'bodyLength' && !plugin.settings.bodyLengthLimit) ||
                (key === 'cardsPerColumn' && !plugin.settings.alignCardHeight) ||
                (key === 'fixedCardHeight' && !plugin.settings.alignCardHeight) ||
                (key === 'cardsPerColumn' && plugin.settings.useFixedHeight) ||
                (key === 'fixedCardHeight' && !plugin.settings.useFixedHeight)
            ) {
                return;
            }
            
            // 이미 업데이트 중이면 무한 루프 방지
            if (isUpdating) return;
            isUpdating = true;
            
            try {
                // 값 표시 업데이트
                valueDisplay.textContent = String(value);
                
                // 설정 업데이트
                await settingsManager.updateSetting(key, value);
            } finally {
                isUpdating = false;
            }
        })
    );

    if (key === 'bodyLength') {
        setting.setDisabled(!plugin.settings.bodyLengthLimit);
    } else if (key === 'fixedCardHeight') {
        setting.setDisabled(!plugin.settings.alignCardHeight || !plugin.settings.useFixedHeight);
    } else if (key === 'cardsPerColumn') {
        setting.setDisabled(!plugin.settings.alignCardHeight || plugin.settings.useFixedHeight);
    }

    return setting;
}

//#region 유틸리티 함수
// 팝업 관련 유틸리티 함수들은 더 이상 필요하지 않으므로 제거합니다.

// 팝업 생성 함수
export function createPopup(popupClass: string, type: string, currentWindow: Window): HTMLElement {
    // 툴바 요소 찾기 시도
    let toolbarEl = currentWindow.document.querySelector('.card-navigator-toolbar-container') as HTMLElement;
    
    if (!toolbarEl) {
        toolbarEl = currentWindow.document.querySelector('.card-navigator-toolbar') as HTMLElement;
    }
    
    // 카드 네비게이터 요소 찾기
    const cardNavigatorEl = currentWindow.document.querySelector('.card-navigator') as HTMLElement;
    
    // 팝업 요소 생성
    const popupEl = currentWindow.document.createElement('div');
    popupEl.className = popupClass;
    popupEl.setAttribute('data-type', type);
    
    // 팝업 요소를 적절한 위치에 추가
    if (toolbarEl) {
        toolbarEl.appendChild(popupEl);
    } else if (cardNavigatorEl) {
        cardNavigatorEl.appendChild(popupEl);
    } else {
        console.error('팝업을 추가할 적절한 컨테이너를 찾을 수 없습니다.');
        return popupEl; // 빈 팝업 반환
    }
    
    // 문서 클릭 이벤트 리스너 등록
    const clickHandler = (e: MouseEvent) => {
        if (!popupEl.contains(e.target as Node) && 
            !toolbarEl?.contains(e.target as Node)) {
            closePopup(popupClass, currentWindow);
        }
    };
    
    // 이벤트 리스너 등록 및 currentPopups에 저장
    currentWindow.document.addEventListener('click', clickHandler);
    currentPopups.set(popupClass, {
        element: popupEl,
        clickHandler: clickHandler
    });
    
    return popupEl;
}

// 현재 열려있는 모든 팝업 닫기
export function closeCurrentPopup(currentWindow: Window): void {
    // 모든 팝업 요소 찾기
    const popups = currentWindow.document.querySelectorAll('.card-navigator-settings-popup, .card-navigator-sort-popup');
    
    // 각 팝업 요소 제거
    popups.forEach(popup => {
        const popupClass = popup.className;
        if (typeof popupClass === 'string') {
            closePopup(popupClass, currentWindow);
        }
    });
}

// UI 유틸리티
function createCollapsibleSection(parentEl: HTMLElement, title: string, sectionKey: string, collapsed = true): HTMLElement {
    const sectionEl = parentEl.createDiv('tree-item graph-control-section');
    const selfEl = sectionEl.createDiv('tree-item-self');
    const iconEl = selfEl.createDiv('tree-item-icon collapse-icon');
    iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>';
    const innerEl = selfEl.createDiv('tree-item-inner');
    innerEl.createEl('header', { text: title, cls: 'graph-control-section-header' });
    const contentEl = sectionEl.createDiv('tree-item-children');
    contentEl.setAttribute('data-section', sectionKey);

    if (collapsed) {
        sectionEl.addClass('is-collapsed');
        iconEl.addClass('is-collapsed');
        contentEl.style.display = 'none';
    }

    selfEl.addEventListener('click', () => {
        const isCollapsed = sectionEl.hasClass('is-collapsed');
        sectionEl.toggleClass('is-collapsed', !isCollapsed);
        iconEl.toggleClass('is-collapsed', !isCollapsed);
        contentEl.style.display = isCollapsed ? 'block' : 'none';
    });

    return contentEl;
}

export function createFullWidthSetting(containerEl: HTMLElement): Setting {
    const setting = new Setting(containerEl);
    setting.settingEl.addClass('setting-full-width');
    setting.settingEl.addClass('no-info');
    return setting;
}

export function addFullWidthText(setting: Setting, callback: (text: TextComponent) => void): Setting {
    return setting.addText(text => {
    text.inputEl.style.width = '100%';
    callback(text);
    });
}

// 모든 Card Navigator 뷰 새로고침
function refreshAllCardNavigatorViews(plugin: CardNavigatorPlugin, type: RefreshType) {
    const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    leaves.forEach(leaf => {
        if (leaf.view instanceof CardNavigatorView) {
            leaf.view.refresh(type);
        }
    });
}

// 레이아웃 변경
export async function handleLayoutChange(
    plugin: CardNavigatorPlugin
): Promise<void> {
    await plugin.saveSettings();
    refreshAllCardNavigatorViews(plugin, RefreshType.LAYOUT);
}

// 팝업 닫기 함수
export function closePopup(popupClass: string, currentWindow: Window): void {
    // 현재 팝업 정보 가져오기
    const popupInfo = currentPopups.get(popupClass);
    
    if (popupInfo) {
        const { element, clickHandler } = popupInfo;
        
        // 팝업 요소가 DOM에 있는지 확인
        if (element && element.isConnected) {
            element.remove();
        }
        
        // 이벤트 리스너 제거
        if (clickHandler) {
            currentWindow.document.removeEventListener('click', clickHandler);
        }
        
        // 맵에서 팝업 정보 제거
        currentPopups.delete(popupClass);
    }
}

// 설정 팝업 내용 생성 함수
function createSettingsContent(plugin: CardNavigatorPlugin, popup: HTMLElement): void {
    const settingsManager = plugin.settingsManager;

    // 프리셋 설정 추가
    addPresetSettingsToPopup(popup, plugin);
    
    // 레이아웃 섹션 생성
    const layoutSection = createCollapsibleSection(popup, t('LAYOUT_SETTINGS'), 'layout', true);
    
    const updateLayoutSettings = () => {
        layoutSection.empty();

        // 카드 너비 임계값 설정
        addSliderSetting('cardThresholdWidth', t('CARD_THRESHOLD_WIDTH'), layoutSection, plugin, settingsManager);
        
        // 카드 높이 정렬 설정
        addToggleSetting('alignCardHeight', t('ALIGN_CARD_HEIGHT'), layoutSection, plugin, settingsManager, () => {
            updateUseFixedHeightSetting();
            updateFixedCardHeightSetting();
            updatecardsPerColumnSetting();
        });
        
        // 높이 계산 방식 선택 토글 추가
        updateUseFixedHeightSetting();
        
        // 고정 카드 높이 설정 추가 (alignCardHeight가 활성화된 경우에만)
        updateFixedCardHeightSetting();
        
        // 뷰당 카드 수 설정 추가 (alignCardHeight가 활성화된 경우에만)
        updatecardsPerColumnSetting();

        popup.addEventListener('click', (e) => e.stopPropagation());
    };

    const updateUseFixedHeightSetting = () => {
        const useFixedHeightSetting = layoutSection.querySelector('.setting-use-fixed-height');
        if (useFixedHeightSetting) {
            useFixedHeightSetting.remove();
        }
        if (plugin.settings.alignCardHeight) {
            const setting = new Setting(layoutSection)
                .setName(t('USE_FIXED_HEIGHT'))
                .addToggle(toggle => toggle
                    .setValue(plugin.settings.useFixedHeight)
                    .onChange(async (value) => {
                        await settingsManager.updateBooleanSetting('useFixedHeight', value);
                        updateFixedCardHeightSetting();
                        updatecardsPerColumnSetting();
                    })
                );
            setting.settingEl.addClass('setting-use-fixed-height');
        }
    };

    const updateFixedCardHeightSetting = () => {
        const fixedCardHeightSetting = layoutSection.querySelector('.setting-fixed-card-height');
        if (fixedCardHeightSetting) {
            fixedCardHeightSetting.remove();
        }
        if (plugin.settings.alignCardHeight) {
            const setting = addSliderSetting('fixedCardHeight', t('FIXED_CARD_HEIGHT'), layoutSection, plugin, settingsManager);
            setting.settingEl.addClass('setting-fixed-card-height');
            
            // useFixedHeight가 false인 경우 비활성화
            if (!plugin.settings.useFixedHeight) {
                setting.setDisabled(true);
                setting.settingEl.addClass('setting-disabled');
            }
        }
    };

    const updatecardsPerColumnSetting = () => {
        const cardsPerColumnSetting = layoutSection.querySelector('.setting-cards-per-column');
        if (cardsPerColumnSetting) {
            cardsPerColumnSetting.remove();
        }
        if (plugin.settings.alignCardHeight) {
            const setting = addSliderSetting('cardsPerColumn', t('CARDS_PER_COLUMN'), layoutSection, plugin, settingsManager);
            setting.settingEl.addClass('setting-cards-per-column');
            
            // useFixedHeight가 true인 경우 비활성화
            if (plugin.settings.useFixedHeight) {
                setting.setDisabled(true);
                setting.settingEl.addClass('setting-disabled');
            }
        }
    };

    updateLayoutSettings();

    // 카드 내용 섹션 생성
    const displaySection = createCollapsibleSection(popup, t('CARD_CONTENT_SETTINGS'), 'display', true);
    addToggleSetting('renderContentAsHtml', t('RENDER_CONTENT_AS_HTML'), displaySection, plugin, settingsManager);
    addToggleSetting('dragDropContent', t('DRAG_AND_DROP_CONTENT'), displaySection, plugin, settingsManager);
    addToggleSetting('showFileName', t('SHOW_FILE_NAME'), displaySection, plugin, settingsManager);
    addToggleSetting('showFirstHeader', t('SHOW_FIRST_HEADER'), displaySection, plugin, settingsManager);
    addToggleSetting('showBody', t('SHOW_BODY'), displaySection, plugin, settingsManager);
    addToggleSetting('showTags', t('SHOW_TAGS'), displaySection, plugin, settingsManager);

    const updateBodyLengthSetting = () => {
        const bodyLengthSetting = displaySection.querySelector('.setting-body-length');
        if (bodyLengthSetting) {
            bodyLengthSetting.remove();
        }
        if (plugin.settings.bodyLengthLimit) {
            addSliderSetting('bodyLength', t('BODY_LENGTH'), displaySection, plugin, settingsManager)
            .settingEl.addClass('setting-body-length');
        }
    };

    addToggleSetting('bodyLengthLimit', t('BODY_LENGTH_LIMIT'), displaySection, plugin, settingsManager, () => {
        updateBodyLengthSetting();
    });

    updateBodyLengthSetting();

    // 카드 스타일링 섹션 생성
    const stylingSection = createCollapsibleSection(popup, t('CARD_STYLING_SETTINGS'), 'styling', true);
    addSliderSetting('fileNameFontSize', t('FILE_NAME_FONT_SIZE'), stylingSection, plugin, settingsManager);
    addSliderSetting('firstHeaderFontSize', t('FIRST_HEADER_FONT_SIZE'), stylingSection, plugin, settingsManager);
    addSliderSetting('bodyFontSize', t('BODY_FONT_SIZE'), stylingSection, plugin, settingsManager);
    addSliderSetting('tagsFontSize', t('TAGS_FONT_SIZE'), stylingSection, plugin, settingsManager);

    // 이벤트 버블링 방지
    popup.addEventListener('click', (e) => e.stopPropagation());
}

