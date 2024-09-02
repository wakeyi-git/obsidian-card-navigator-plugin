import { TFolder, FuzzySuggestModal, setIcon, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SortCriterion, SortOrder, ToolbarMenu, CardNavigatorSettings, NumberSettingKey, rangeSettingConfigs, displaySettings, fontSizeSettings } from '../../common/types';
import { SettingsManager } from 'common/settingsManager';
import { DEFAULT_SETTINGS } from 'common/settings';
import { t } from 'i18next';

let currentPopup: { element: HTMLElement, type: ToolbarMenu } | null = null;

// Modal for folder suggestion
export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    constructor(private plugin: CardNavigatorPlugin, private onSelect: (folder: TFolder) => void) {
        super(plugin.app);
    }

    getItems(): TFolder[] {
        return this.plugin.app.vault.getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder);
    }

    getItemText(folder: TFolder): string {
        return folder.path;
    }

    onChooseItem(folder: TFolder): void {
        this.onSelect(folder);
    }
}

// Create a popup for sort or settings
function createPopup(className: string, type: ToolbarMenu): HTMLElement {
    closeCurrentPopup();
    const popup = document.createElement('div');
    popup.className = className;
    const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
    if (toolbarEl) {
        toolbarEl.insertAdjacentElement('afterend', popup);
        currentPopup = { element: popup, type };
        document.addEventListener('click', onClickOutside);
    }
    return popup;
}

// Toggle sort options
export function toggleSort(plugin: CardNavigatorPlugin) {
    const sortPopup = createPopup('card-navigator-sort-popup', 'sort');
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
        const button = createSortOption(option.value, option.label, currentSort, plugin);
        sortPopup.appendChild(button);
    });

    sortPopup.addEventListener('click', (e) => e.stopPropagation());
}

// Create a sort option button
function createSortOption(value: string, label: string, currentSort: string, plugin: CardNavigatorPlugin): HTMLButtonElement {
    const option = document.createElement('button');
    option.textContent = label;
    option.classList.add('sort-option');
    option.classList.toggle('active', currentSort === value);
    option.addEventListener('click', async () => {
        const [criterion, order] = value.split('_') as [SortCriterion, SortOrder];
        await updateSortSettings(plugin, criterion, order);
        closeCurrentPopup();
    });
    return option;
}

// Update sort settings
async function updateSortSettings(plugin: CardNavigatorPlugin, criterion: SortCriterion, order: SortOrder) {
    plugin.settings.sortCriterion = criterion;
    plugin.settings.sortOrder = order;
    await plugin.saveSettings();
    plugin.triggerRefresh();
}

// Toggle settings popup
export function toggleSettings(plugin: CardNavigatorPlugin) {
    const settingsPopup = createPopup('card-navigator-settings-popup', 'settings');
    const settingsManager = new SettingsManager(plugin);

    const topButtonsContainer = document.createElement('div');
    topButtonsContainer.className = 'settings-top-buttons';
    settingsPopup.appendChild(topButtonsContainer);

    const resetButton = createIconButton('rotate-ccw', t('Reset to Defaults'), () => resetToDefaults(plugin, settingsManager));
    topButtonsContainer.appendChild(resetButton);

    const closeButton = createIconButton('x', t('Close'), closeCurrentPopup);
    topButtonsContainer.appendChild(closeButton);

    // Add range and toggle settings
    addRangeSetting(settingsPopup, plugin, 'cardsPerView', t('Cards per view'), settingsManager);

    fontSizeSettings.forEach(setting => {
        addRangeSetting(settingsPopup, plugin, setting.key, setting.name, settingsManager);
    });

    addRangeSetting(settingsPopup, plugin, 'contentLength', t('Content Length'), settingsManager);

    displaySettings.forEach(setting => {
        addToggleSetting(settingsPopup, plugin, setting.key, setting.name, settingsManager);
    });

    addToggleSetting(settingsPopup, plugin, 'dragDropContent', t('Drag and Drop Content'), settingsManager);
}

// Create an icon button
function createIconButton(iconName: string, tooltip: string, onClick: () => void): HTMLElement {
    const button = document.createElement('div');
    button.className = 'settings-icon-button';
    setIcon(button, iconName);
    button.setAttribute('aria-label', tooltip);
    button.addEventListener('click', onClick);
    return button;
}

// Reset settings to default values
async function resetToDefaults(plugin: CardNavigatorPlugin, settingsManager: SettingsManager) {
    for (const key in DEFAULT_SETTINGS) {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
            const settingKey = key as keyof CardNavigatorSettings;
            const defaultValue = DEFAULT_SETTINGS[settingKey];
            
            if (typeof defaultValue === 'number') {
                await settingsManager.updateNumberSetting(settingKey as NumberSettingKey, defaultValue);
            } else if (typeof defaultValue === 'boolean') {
                await settingsManager.updateBooleanSetting(settingKey, defaultValue);
            }
        }
    }
    
    plugin.triggerRefresh();
    closeCurrentPopup();
    toggleSettings(plugin);
}

// Add a range setting to the settings popup
function addRangeSetting(container: HTMLElement, plugin: CardNavigatorPlugin, key: NumberSettingKey, name: string, settingsManager: SettingsManager) {
    const config = rangeSettingConfigs[key];
    new Setting(container)
        .setClass('card-navigator-range-setting')
        .setName(t(name))
        .addSlider(slider => slider
            .setLimits(config.min, config.max, config.step)
            .setValue(plugin.settings[key])
            .setDynamicTooltip()
            .onChange(async (value) => {
                await settingsManager.updateNumberSetting(key, value);
                plugin.triggerRefresh();
            })
        );
}

// Add a toggle setting to the settings popup
function addToggleSetting(container: HTMLElement, plugin: CardNavigatorPlugin, key: keyof CardNavigatorSettings, name: string, settingsManager: SettingsManager) {
    new Setting(container)
        .setClass('card-navigator-toggle-setting')
        .setName(t(name))
        .addToggle(toggle => toggle
            .setValue(plugin.settings[key] as boolean)
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting(key, value);
                plugin.triggerRefresh();
            })
        );
}

// Close the current popup
function closeCurrentPopup() {
    if (currentPopup) {
        currentPopup.element.remove();
        currentPopup = null;
        document.removeEventListener('click', onClickOutside);
    }
}

// Handle clicks outside the popup
function onClickOutside(event: MouseEvent) {
    const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
    if (currentPopup && !currentPopup.element.contains(event.target as Node) && !toolbarEl?.contains(event.target as Node)) {
        if (currentPopup.type === 'sort') {
            closeCurrentPopup();
        } else if (currentPopup.type === 'settings' && !event.composedPath().some(el => (el as HTMLElement).classList?.contains('card-navigator-settings-popup'))) {
            closeCurrentPopup();
        }
    }
}
