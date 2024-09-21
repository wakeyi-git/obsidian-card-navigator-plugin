// toolbarActions.ts
import { TFolder, FuzzySuggestModal, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SortCriterion, SortOrder, ToolbarMenu, CardNavigatorSettings, NumberSettingKey } from '../../common/types';
import { SettingsManager } from '../../common/settingsManager';
import { t } from 'i18next';

// Track the current popup for proper management
const currentPopups: Map<Window, { element: HTMLElement, type: ToolbarMenu }> = new Map();

// Modal for selecting folders in the toolbar
export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    constructor(private plugin: CardNavigatorPlugin, private onSelect: (folder: TFolder) => void) {
        super(plugin.app);
    }

    // Retrieve all folders in the vault
    getItems(): TFolder[] {
        return this.plugin.app.vault.getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder);
    }

    // Display the folder path as the item text
    getItemText(folder: TFolder): string {
        return folder.path;
    }

    // Handle folder selection
    onChooseItem(folder: TFolder): void {
        this.onSelect(folder);
    }
}

// Define a handler function
function handleWindowClick(event: MouseEvent, windowObj: Window) {
    onClickOutside(event, windowObj);
}

// Create and attach a popup to the toolbar
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

// Close the current popup for a specific window
function closeCurrentPopup(windowObj: Window) {
    const existingPopup = currentPopups.get(windowObj);
    if (existingPopup) {
        existingPopup.element.remove();
        currentPopups.delete(windowObj);
        windowObj.removeEventListener('click', (e) => handleWindowClick(e, windowObj));
    }
}

// Handle clicks outside the popup to close it
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

// Toggle the sort options in the toolbar
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

    const sortOptions: Array<{ value: string, label: string }> = [
        { value: 'fileName_asc', label: t('File name (A to Z)') },
        { value: 'fileName_desc', label: t('File name (Z to A)') },
        { value: 'lastModified_desc', label: t('Last modified (newest first)') },
        { value: 'lastModified_asc', label: t('Last modified (oldest first)') },
        { value: 'created_desc', label: t('Created (newest first)') },
        { value: 'created_asc', label: t('Created (oldest first)') },
    ];

    sortOptions.forEach(option => {
        const button = createSortOption(option.value, option.label, currentSort, plugin, containerEl);
        sortPopup.appendChild(button);
    });

    sortPopup.addEventListener('click', (e) => e.stopPropagation());
}

// Create a button for a specific sort option
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

// Update the plugin's sort settings and refresh the view
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

// Toggle the settings popup in the toolbar
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

    // Add preset selection dropdown
    addPresetDropdown(settingsPopup, plugin, settingsManager);

    // Add Folder Selection setting
    addFolderSelectionSetting(settingsPopup, plugin, settingsManager);

    // Add Layout Settings section
    const layoutSection = createCollapsibleSection(settingsPopup, t('Layout Settings'), true);
    
    // Function to update layout settings visibility
    const updateLayoutSettings = (layout: CardNavigatorSettings['defaultLayout']) => {
        // Clear existing settings
        layoutSection.empty();

        // Add Default Layout dropdown
        addDropdownSetting('defaultLayout', t('Default Layout'), layoutSection, plugin, settingsManager, [
            { value: 'auto', label: t('Auto') },
            { value: 'list', label: t('List') },
            { value: 'grid', label: t('Grid') },
            { value: 'masonry', label: t('Masonry') }
        ], (value) => {
            updateLayoutSettings(value as CardNavigatorSettings['defaultLayout']);
        });

        // Add settings based on selected layout
        if (layout === 'auto') {
            addNumberSetting('cardWidthThreshold', t('Card Width Threshold'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'grid') {
            addNumberSetting('gridColumns', t('Grid Columns'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'auto' || layout === 'grid') {
            addNumberSetting('gridCardHeight', t('Grid Card Height'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'masonry') {
            addNumberSetting('masonryColumns', t('Masonry Columns'), layoutSection, plugin, settingsManager);
        }
        if (layout === 'auto' || layout === 'list') {
            addToggleSetting('alignCardHeight', t('Align Card Height'), layoutSection, plugin, settingsManager, () => {
                updateCardsPerViewSetting();
            });
            updateCardsPerViewSetting();
        }

        // Prevent click events from closing the popup
        settingsPopup.addEventListener('click', (e) => e.stopPropagation());
    };

    // Function to update cardsPerView setting
    const updateCardsPerViewSetting = () => {
        const cardsPerViewSetting = layoutSection.querySelector('.setting-cards-per-view');
        if (cardsPerViewSetting) {
            cardsPerViewSetting.remove();
        }
        if (plugin.settings.alignCardHeight) {
            addNumberSetting('cardsPerView', t('Cards per view'), layoutSection, plugin, settingsManager)
                .settingEl.addClass('setting-cards-per-view');
        }
    };

    // Initial update of layout settings
    updateLayoutSettings(plugin.settings.defaultLayout);

    // Add Card Display Settings section
    const displaySection = createCollapsibleSection(settingsPopup, t('Card Content Settings'), true);
    addToggleSetting('renderContentAsHtml', t('Render Content as HTML'), displaySection, plugin, settingsManager);
    addToggleSetting('dragDropContent', t('Drag and Drop Content'), displaySection, plugin, settingsManager);
    addToggleSetting('showFileName', t('Show File Name'), displaySection, plugin, settingsManager);
    addToggleSetting('showFirstHeader', t('Show First Header'), displaySection, plugin, settingsManager);
    addToggleSetting('showBody', t('Show Body'), displaySection, plugin, settingsManager);

    // Function to update bodyLength setting visibility
    const updateBodyLengthSetting = () => {
        const bodyLengthSetting = displaySection.querySelector('.setting-body-length');
        if (bodyLengthSetting) {
            bodyLengthSetting.remove();
        }
        if (plugin.settings.bodyLengthLimit) {
            addNumberSetting('bodyLength', t('Body Length'), displaySection, plugin, settingsManager)
                .settingEl.addClass('setting-body-length');
        }
    };

    // Add Body Length Limit toggle with updateBodyLengthSetting callback
    addToggleSetting('bodyLengthLimit', t('Body Length Limit'), displaySection, plugin, settingsManager, () => {
        updateBodyLengthSetting();
    });

    // Initial update of bodyLength setting
    updateBodyLengthSetting();

    // Add Card Styling Settings section
    const stylingSection = createCollapsibleSection(settingsPopup, t('Card Styling Settings'), true);
    addNumberSetting('fileNameFontSize', t('File Name Font Size'), stylingSection, plugin, settingsManager);
    addNumberSetting('firstHeaderFontSize', t('First Header Font Size'), stylingSection, plugin, settingsManager);
    addNumberSetting('bodyFontSize', t('Body Font Size'), stylingSection, plugin, settingsManager);

    // Prevent click events from closing the popup
    settingsPopup.addEventListener('click', (e) => e.stopPropagation());
}

// Create a collapsible section for settings
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

// Add dropdown setting
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

// Add the dropdown to select a preset
function addPresetDropdown(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager) {
    new Setting(containerEl)
        .setName(t('Select Preset'))
        .setClass('setting-item-dropdown')
        .addDropdown(dropdown => {
            const presets = settingsManager.getPresets();
            Object.keys(presets).forEach(presetName => {
                dropdown.addOption(presetName, presetName);
            });
            dropdown.setValue(plugin.settings.lastActivePreset)
                .onChange(async (value) => {
                    await settingsManager.applyPreset(value);
                    plugin.settings.lastActivePreset = value;
                    await plugin.saveSettings();
                    toggleSettings(plugin, containerEl);
                });
        });
    new Setting(containerEl)
        .setName(t('Auto Apply Folder\'s Presets'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.autoApplyPresets)
            .onChange(async (value) => {
                await settingsManager.toggleAutoApplyPresets(value);
            })
        );
}

// Add the folder selection setting to the settings UI
function addFolderSelectionSetting(parentEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    const folderSettingEl = new Setting(parentEl)
        .setName(t('Folder Selection'))
        .setClass('setting-item-dropdown')
        .addDropdown(dropdown => dropdown
            .addOption('active', t('Active Folder'))
            .addOption('selected', t('Selected Folder'))
            .setValue(plugin.settings.useSelectedFolder ? 'selected' : 'active')
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting('useSelectedFolder', value === 'selected');
                toggleSettings(plugin, parentEl);
            })).settingEl;

    folderSettingEl.addClass('setting-folder-selection');

    if (plugin.settings.useSelectedFolder) {
        addFolderSetting(parentEl, plugin, settingsManager);
    }
}

// Add the folder picker when "Selected Folder" is enabled
function addFolderSetting(parentEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(parentEl)
        .setName(t('Select Folder'))
        .addButton(button => button
            .setButtonText(plugin.settings.selectedFolder || t('Choose folder'))
            .onClick(() => {
                new FolderSuggestModal(plugin, async (folder) => {
                    await settingsManager.updateSelectedFolder(folder);
                    toggleSettings(plugin, parentEl);
                }).open();
            }));
}

// Add a toggle switch for a setting
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

// Add a number input slider for a setting
function addNumberSetting(
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
            await settingsManager.updateNumberSetting(key, value);
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
