// src/ui/toolbar/toolbarActions.ts

import { TFolder, FuzzySuggestModal } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SortCriterion, CardNavigatorSettings, NumberSettingKey, rangeSettingConfigs } from '../../common/types';
import { SettingsManager } from 'common/settingsManager';
import { t } from 'i18next';

let currentPopup: HTMLElement | null = null;

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

function createPopup(className: string): HTMLElement {
    closeCurrentPopup();
    const popup = document.createElement('div');
    popup.className = className;
    const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
    if (toolbarEl) {
        toolbarEl.insertAdjacentElement('afterend', popup);
        currentPopup = popup;
        document.addEventListener('click', onClickOutside);
    }
    return popup;
}

export function toggleSort(plugin: CardNavigatorPlugin) {
    const sortPopup = createPopup('card-navigator-sort-popup');
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
}

function createSortOption(value: string, label: string, currentSort: string, plugin: CardNavigatorPlugin): HTMLButtonElement {
    const option = document.createElement('button');
    option.textContent = label;
    option.classList.add('sort-option');
    option.classList.toggle('active', currentSort === value);
    option.addEventListener('click', async () => {
        const [criterion, order] = value.split('_') as [SortCriterion, 'asc' | 'desc'];
        await updateSortSettings(plugin, criterion, order);
        closeCurrentPopup();
    });
    return option;
}

async function updateSortSettings(plugin: CardNavigatorPlugin, criterion: SortCriterion, order: 'asc' | 'desc') {
    plugin.settings.sortCriterion = criterion;
    plugin.settings.sortOrder = order;
    await plugin.saveSettings();
    plugin.triggerRefresh();
}

export function toggleSettings(plugin: CardNavigatorPlugin) {
    const settingsPopup = createPopup('card-navigator-settings-popup');
    const settingsManager = new SettingsManager(plugin);

    const settings: Array<{ key: keyof CardNavigatorSettings, label: string, type: 'range' | 'toggle' }> = [
        { key: 'cardsPerView', label: t('Cards per view'), type: 'range' },
        { key: 'fileNameSize', label: t('File Name Font Size'), type: 'range' },
        { key: 'firstHeaderSize', label: t('First Header Font Size'), type: 'range' },
		{ key: 'contentSize', label: t('Content Font Size'), type: 'range' },
        { key: 'contentLength', label: t('Content Length'), type: 'range' },
        { key: 'showFileName', label: t('Show File Name'), type: 'toggle' },
        { key: 'showFirstHeader', label: t('Show First Header'), type: 'toggle' },
        { key: 'showContent', label: t('Show Content'), type: 'toggle' },
        { key: 'dragDropContent', label: t('Drag and Drop Content'), type: 'toggle' },
    ];

    settings.forEach(setting => {
        const container = createSettingContainer(setting.label, setting.type);
        
        if (setting.type === 'range' && setting.key in rangeSettingConfigs) {
            addRangeSetting(container, plugin, setting.key as NumberSettingKey, settingsManager);
        } else if (setting.type === 'toggle') {
            addToggleSetting(container, plugin, setting.key, settingsManager);
        }
        
        settingsPopup.appendChild(container);
    });
}

function createSettingContainer(labelText: string, type: 'range' | 'toggle'): HTMLElement {
    const container = document.createElement('div');
    container.className = `setting-container ${type}-setting-container`;
    
    const label = document.createElement('label');
    label.textContent = labelText;
    container.appendChild(label);
    
    return container;
}

function addRangeSetting(container: HTMLElement, plugin: CardNavigatorPlugin, key: NumberSettingKey, settingsManager: SettingsManager) {
    const config = rangeSettingConfigs[key];
    
    const input = document.createElement('input');
    input.type = 'range';
    input.min = config.min.toString();
    input.max = config.max.toString();
    input.step = config.step.toString();
    input.value = plugin.settings[key].toString();

    const tooltip = document.createElement('div');
    tooltip.className = 'slider-tooltip';

    input.addEventListener('input', () => {
        tooltip.textContent = input.value;
        tooltip.classList.add('visible');
    });

    input.addEventListener('change', async () => {
        const value = parseInt(input.value, 10);
        await settingsManager.updateNumberSetting(key, value);
        plugin.triggerRefresh();
    });

    input.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });

    container.appendChild(input);
    container.appendChild(tooltip);
}

function addToggleSetting(container: HTMLElement, plugin: CardNavigatorPlugin, key: keyof CardNavigatorSettings, settingsManager: SettingsManager) {
    const toggleWrapper = document.createElement('div');
    toggleWrapper.className = 'toggle-wrapper';
    
    const toggle = document.createElement('div');
    toggle.className = 'toggle-button';
    toggle.classList.toggle('active', plugin.settings[key] as boolean);
    
    toggle.addEventListener('click', async () => {
        const newValue = !plugin.settings[key];
        toggle.classList.toggle('active', newValue);
        await settingsManager.updateBooleanSetting(key, newValue);
        plugin.triggerRefresh();
    });

    toggleWrapper.appendChild(toggle);
    container.appendChild(toggleWrapper);
}

function closeCurrentPopup() {
    if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
        document.removeEventListener('click', onClickOutside);
    }
}

function onClickOutside(event: MouseEvent) {
    const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
    if (currentPopup && !currentPopup.contains(event.target as Node) && !toolbarEl?.contains(event.target as Node)) {
        closeCurrentPopup();
    }
}
