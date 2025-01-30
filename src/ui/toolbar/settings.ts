import { Setting, TextComponent } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { ToolbarMenu, CardNavigatorSettings, NumberSettingKey } from 'common/types';
import { SettingsManager } from 'ui/settings/settingsManager';
import { FolderSuggest } from 'ui/settings/components/FolderSuggest';
import { t } from 'i18next';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';

// 팝업 관리를 위한 맵
const currentPopups: Map<Window, { element: HTMLElement, type: ToolbarMenu }> = new Map();

//#region 설정 기능
// 설정 메뉴 토글
export function toggleSettings(plugin: CardNavigatorPlugin, containerEl: HTMLElement | null) {
    if (!containerEl) {
        console.error('Container element is undefined in toggleSettings');
        return;
    }
    const currentWindow = containerEl.ownerDocument.defaultView;
    if (!currentWindow) {
        console.error('Cannot determine the window of the container element');
        return;
    }
    const settingsPopup = createPopup('card-navigator-settings-popup', 'settings', currentWindow);
    const settingsManager = plugin.settingsManager;

    // addFolderSelectionSetting(settingsPopup, plugin, settingsManager);
    addPresetSettingsToPopup(settingsPopup, plugin);
    
    const layoutSection = createCollapsibleSection(settingsPopup, t('LAYOUT_SETTINGS'), 'layout', true);
    
    const updateLayoutSettings = (layout: CardNavigatorSettings['defaultLayout']) => {
        layoutSection.empty();

        addDropdownSetting('defaultLayout', t('DEFAULT_LAYOUT'), layoutSection, plugin, settingsManager, [
            { value: 'auto', label: t('AUTO') },
            { value: 'list', label: t('LIST') },
            { value: 'grid', label: t('GRID') },
            { value: 'masonry', label: t('MASONRY') }
        ], (value) => {
            updateLayoutSettings(value as CardNavigatorSettings['defaultLayout']);
        });
        
        if (layout === 'auto') {
            addSliderSetting('cardWidthThreshold', t('CARD_WIDTH_THRESHOLD'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'grid') {
            addSliderSetting('gridColumns', t('GRID_COLUMNS'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'auto' || layout === 'grid') {
            addSliderSetting('gridCardHeight', t('GRID_CARD_HEIGHT'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'masonry') {
            addSliderSetting('masonryColumns', t('MASONRY_COLUMNS'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'auto' || layout === 'list') {
            addToggleSetting('alignCardHeight', t('ALIGN_CARD_HEIGHT'), layoutSection, plugin, settingsManager, () => {
                updateCardsPerViewSetting();
            });
            updateCardsPerViewSetting();
        }

        settingsPopup.addEventListener('click', (e) => e.stopPropagation());
    };

    const updateCardsPerViewSetting = () => {
        const cardsPerViewSetting = layoutSection.querySelector('.setting-cards-per-view');
        if (cardsPerViewSetting) {
            cardsPerViewSetting.remove();
        }
        if (plugin.settings.alignCardHeight) {
            addSliderSetting('cardsPerView', t('CARDS_PER_VIEW'), layoutSection, plugin, settingsManager)
                .settingEl.addClass('setting-cards-per-view');
        }
    };

    updateLayoutSettings(plugin.settings.defaultLayout);

    const displaySection = createCollapsibleSection(settingsPopup, t('CARD_CONTENT_SETTINGS'), 'display', true);
    addToggleSetting('renderContentAsHtml', t('RENDER_CONTENT_AS_HTML'), displaySection, plugin, settingsManager);
    addToggleSetting('dragDropContent', t('DRAG_AND_DROP_CONTENT'), displaySection, plugin, settingsManager);
    addToggleSetting('showFileName', t('SHOW_FILE_NAME'), displaySection, plugin, settingsManager);
    addToggleSetting('showFirstHeader', t('SHOW_FIRST_HEADER'), displaySection, plugin, settingsManager);
    addToggleSetting('showBody', t('SHOW_BODY'), displaySection, plugin, settingsManager);

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

    const stylingSection = createCollapsibleSection(settingsPopup, t('CARD_STYLING_SETTINGS'), 'styling', true);
    addSliderSetting('fileNameFontSize', t('FILE_NAME_FONT_SIZE'), stylingSection, plugin, settingsManager);
    addSliderSetting('firstHeaderFontSize', t('FIRST_HEADER_FONT_SIZE'), stylingSection, plugin, settingsManager);
    addSliderSetting('bodyFontSize', t('BODY_FONT_SIZE'), stylingSection, plugin, settingsManager);

    settingsPopup.addEventListener('click', (e) => e.stopPropagation());
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
                        refreshAllCardNavigatorViews(plugin, RefreshType.SETTINGS);
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
    // 레이아웃 드롭다운 업데이트
    const layoutDropdown = layoutSection.querySelector('.setting-item-dropdown select');
    if (layoutDropdown instanceof HTMLSelectElement) {
        layoutDropdown.value = plugin.settings.defaultLayout;
    }

    // 각 설정의 값 업데이트
    updateSliderValue(layoutSection, 'cardWidthThreshold', plugin);
    updateSliderValue(layoutSection, 'gridColumns', plugin);
    updateSliderValue(layoutSection, 'gridCardHeight', plugin);
    updateSliderValue(layoutSection, 'masonryColumns', plugin);
    updateSliderValue(layoutSection, 'cardsPerView', plugin);
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
                    refreshAllCardNavigatorViews(plugin, RefreshType.SETTINGS);
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
                refreshAllCardNavigatorViews(plugin, RefreshType.SETTINGS);
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
        // cls: 'slider-value',
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

    setting.addSlider(slider => slider
        .setLimits(config.min, config.max, config.step)
        .setValue(plugin.settings[key])
        .onChange(async (value) => {
            if (
                (key === 'bodyLength' && !plugin.settings.bodyLengthLimit) ||
                (key === 'cardsPerView' && !plugin.settings.alignCardHeight)
            ) {
                return;
            }
            // 값 표시 업데이트
            valueDisplay.textContent = String(value);
            await settingsManager.updateSetting(key, value);
            if (key === 'gridColumns' || key === 'masonryColumns') {
                plugin.updateLayout(plugin.settings.defaultLayout);
            } else {
                refreshAllCardNavigatorViews(plugin, RefreshType.SETTINGS);
            }
        })
    );

    if (key === 'bodyLength') {
        setting.setDisabled(!plugin.settings.bodyLengthLimit);
    }

    return setting;
}

//#region 유틸리티 함수
// 팝업 관련 유틸리티
function handleWindowClick(event: MouseEvent, windowObj: Window) {
    onClickOutside(event, windowObj);
}

function onClickOutside(event: MouseEvent, windowObj: Window) {
    const target = event.target as Node;
    const toolbarEl = windowObj.document.querySelector('.card-navigator-toolbar-container');
    const existingPopup = currentPopups.get(windowObj);
    if (existingPopup && !existingPopup.element.contains(target) && !toolbarEl?.contains(target)) {
        if (
            existingPopup.type === 'sort' ||
            (existingPopup.type === 'settings' &&
                !event.composedPath().some(el => (el as HTMLElement).classList?.contains('card-navigator-settings-popup')))
        ) {
            closeCurrentPopup(windowObj);
        }
    }
}

function createPopup(className: string, type: ToolbarMenu, windowObj: Window): HTMLElement {
    closeCurrentPopup(windowObj);
    const popup = windowObj.document.createElement('div');
    popup.className = className;
    const toolbarEl = windowObj.document.querySelector('.card-navigator-toolbar-container');
    if (toolbarEl) {
        toolbarEl.insertAdjacentElement('afterend', popup);
        currentPopups.set(windowObj, { element: popup, type });
        windowObj.addEventListener('click', (e) => handleWindowClick(e, windowObj));
    }
    return popup;
}

function closeCurrentPopup(windowObj: Window) {
    const existingPopup = currentPopups.get(windowObj);
    if (existingPopup) {
        existingPopup.element.remove();
        currentPopups.delete(windowObj);
        windowObj.removeEventListener('click', (e) => handleWindowClick(e, windowObj));
    }
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
    plugin: CardNavigatorPlugin, 
    layout: CardNavigatorSettings['defaultLayout']
): Promise<void> {
    plugin.settings.defaultLayout = layout;
    await plugin.saveSettings();
    plugin.updateLayout(layout);
}

