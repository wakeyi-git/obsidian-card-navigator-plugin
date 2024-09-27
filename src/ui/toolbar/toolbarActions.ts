import { Setting, TextComponent } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SortCriterion, SortOrder, ToolbarMenu, CardNavigatorSettings, NumberSettingKey } from '../../common/types';
import { SettingsManager } from '../settings/settingsManager';
import { FolderSuggest } from '../settings/components/FolderSuggest';
import { getTranslatedSortOptions } from '../../common/types';
import { t } from 'i18next';

// 전역 변수 및 상수
const currentPopups: Map<Window, { element: HTMLElement, type: ToolbarMenu }> = new Map();

// 유틸리티 함수
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

function createCollapsibleSection(parentEl: HTMLElement, title: string, collapsed = true): HTMLElement {
    const sectionEl = parentEl.createDiv('tree-item graph-control-section');
    const selfEl = sectionEl.createDiv('tree-item-self');
    const iconEl = selfEl.createDiv('tree-item-icon collapse-icon');
    iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>';
    const innerEl = selfEl.createDiv('tree-item-inner');
    innerEl.createEl('header', { text: title, cls: 'graph-control-section-header' });
    const contentEl = sectionEl.createDiv('tree-item-children');

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

// 정렬 관련 함수
export function toggleSort(plugin: CardNavigatorPlugin, containerEl: HTMLElement | null) {
    if (!containerEl) {
        console.error('Container element is undefined in toggleSort');
        return;
    }
    const currentWindow = containerEl.ownerDocument.defaultView;
    if (!currentWindow) {
        console.error('Cannot determine the window of the container element');
        return;
    }
    const sortPopup = createPopup('card-navigator-sort-popup', 'sort', currentWindow);
    const currentSort = `${plugin.settings.sortCriterion}_${plugin.settings.sortOrder}`;
    const sortOptions = getTranslatedSortOptions();
    sortOptions.forEach(option => {
        const button = createSortOption(option.value, option.label, currentSort, plugin, containerEl);
        sortPopup.appendChild(button);
    });
    sortPopup.addEventListener('click', (e) => e.stopPropagation());
}

function createSortOption(
    value: string, 
    label: string, 
    currentSort: string, 
    plugin: CardNavigatorPlugin, 
    containerEl: HTMLElement
): HTMLButtonElement {
    const button = containerEl.ownerDocument.createElement('button');
    button.textContent = label;
    button.className = `sort-option${currentSort === value ? ' active' : ''}`;
    
    button.addEventListener('click', async () => {
        const [criterion, order] = value.split('_') as [SortCriterion, SortOrder];
        await updateSortSettings(plugin, criterion, order, containerEl);
    });
    
    return button;
}

async function updateSortSettings(
    plugin: CardNavigatorPlugin, 
    criterion: SortCriterion, 
    order: SortOrder, 
    containerEl: HTMLElement
) {
    plugin.settings.sortCriterion = criterion;
    plugin.settings.sortOrder = order;
    await plugin.saveSettings();
    plugin.triggerRefresh();
    
    const currentWindow = containerEl.ownerDocument.defaultView;
    if (currentWindow) {
        closeCurrentPopup(currentWindow);
    } else {
        console.error('Cannot determine the window of the container element in updateSortSettings');
    }
}

// 설정 관련 함수
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

	addFolderSelectionSetting(settingsPopup, plugin, settingsManager);

	addPresetSettingsToPopup(settingsPopup, plugin);
	
	const layoutSection = createCollapsibleSection(settingsPopup, t('LAYOUT_SETTINGS'), true);
    
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

    // Function to update cardsPerView setting
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

    // Initial update of layout settings
    updateLayoutSettings(plugin.settings.defaultLayout);

    // Add Card Display Settings section
	const displaySection = createCollapsibleSection(settingsPopup, t('CARD_CONTENT_SETTINGS'), true);
	addToggleSetting('renderContentAsHtml', t('RENDER_CONTENT_AS_HTML'), displaySection, plugin, settingsManager);
	addToggleSetting('dragDropContent', t('DRAG_AND_DROP_CONTENT'), displaySection, plugin, settingsManager);
	addToggleSetting('showFileName', t('SHOW_FILE_NAME'), displaySection, plugin, settingsManager);
	addToggleSetting('showFirstHeader', t('SHOW_FIRST_HEADER'), displaySection, plugin, settingsManager);
	addToggleSetting('showBody', t('SHOW_BODY'), displaySection, plugin, settingsManager);

    // Function to update bodyLength setting visibility
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

    // Add Body Length Limit toggle with updateBodyLengthSetting callback
	addToggleSetting('bodyLengthLimit', t('BODY_LENGTH_LIMIT'), displaySection, plugin, settingsManager, () => {
		updateBodyLengthSetting();
	});

    // Initial update of bodyLength setting
    updateBodyLengthSetting();

    // Add Card Styling Settings section
	const stylingSection = createCollapsibleSection(settingsPopup, t('CARD_STYLING_SETTINGS'), true);
	addSliderSetting('fileNameFontSize', t('FILE_NAME_FONT_SIZE'), stylingSection, plugin, settingsManager);
	addSliderSetting('firstHeaderFontSize', t('FIRST_HEADER_FONT_SIZE'), stylingSection, plugin, settingsManager);
	addSliderSetting('bodyFontSize', t('BODY_FONT_SIZE'), stylingSection, plugin, settingsManager);

    // Prevent click events from closing the popup
    settingsPopup.addEventListener('click', (e) => e.stopPropagation());
}

async function addPresetSettingsToPopup(settingsPopup: HTMLElement, plugin: CardNavigatorPlugin) {
    const presetSection = createCollapsibleSection(settingsPopup, t('PRESET_SETTINGS'), true);
    presetSection.classList.add('preset-settings-section');

    // 프리셋 자동 적용 토글 버튼 추가
    new Setting(presetSection)
        .setName(t('AUTO_APPLY_PRESETS'))
        .addToggle((toggle) => 
            toggle
                .setValue(plugin.settings.autoApplyPresets)
                .onChange(async (value) => {
                    plugin.settings.autoApplyPresets = value;
                    await plugin.saveSettings();
                    const currentFile = plugin.app.workspace.getActiveFile();
                    if (currentFile) {
                        await plugin.selectAndApplyPresetForCurrentFile();
                    }
                })
        );

    // 전역 프리셋 드롭다운 추가
    const presetNames = await plugin.presetManager.getPresetNames();
    new Setting(presetSection)
        .setName(t('GLOBAL_PRESET'))
        .addDropdown(async (dropdown) => {
            presetNames.forEach(name => {
                dropdown.addOption(name, name);
            });
            dropdown.setValue(plugin.settings.GlobalPreset)
                .onChange(async (value) => {
                    await plugin.presetManager.applyGlobalPreset(value);
                    plugin.triggerRefresh();
                });
        });
}

function addFolderSelectionSetting(parentEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(parentEl)
        .setName(t('SOURCE_FOLDER'))
        .setClass('setting-item-toggle')
        .addToggle(toggle => toggle
            .setValue(plugin.settings.useSelectedFolder)
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting('useSelectedFolder', value);
                toggleSettings(plugin, parentEl);
            })
        );

    if (plugin.settings.useSelectedFolder) {
        const setting = createFullWidthSetting(parentEl);
        addFullWidthText(setting, text => {
            new FolderSuggest(plugin.app, text.inputEl);
            text.setPlaceholder(t('SELECT_FOLDER'))
                .setValue(plugin.settings.selectedFolder || '')
                .onChange(async (newFolder) => {
                if (newFolder) {
                    await settingsManager.updateSetting('selectedFolder', newFolder);
                }
            });
        });
    }
}

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
                    plugin.triggerRefresh();
                    if (onChange) {
                        onChange(value);
                    }
                });
        });
}

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
                plugin.triggerRefresh();
                if (onChange) {
                    onChange();
                }
            })
        );
}

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

    setting.addSlider(slider => slider
        .setLimits(config.min, config.max, config.step)
        .setValue(plugin.settings[key])
        .setDynamicTooltip()
        .onChange(async (value) => {
            // Check if the setting should be updated based on other settings
            if (
                (key === 'bodyLength' && !plugin.settings.bodyLengthLimit) ||
                (key === 'cardsPerView' && !plugin.settings.alignCardHeight)
            ) {
                return;
            }
            await settingsManager.updateSetting(key, value);
            // Update layout if necessary
            if (key === 'gridColumns' || key === 'masonryColumns') {
                plugin.updateCardNavigatorLayout(plugin.settings.defaultLayout);
            }
            plugin.triggerRefresh();
        })
    );

    // Disable bodyLength setting if body length is not limited
    if (key === 'bodyLength') {
        setting.setDisabled(!plugin.settings.bodyLengthLimit);
    }

    return setting;
}
