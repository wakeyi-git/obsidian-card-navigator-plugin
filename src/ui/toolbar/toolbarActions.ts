// src/ui/toolbar/toolbarActions.ts

import { TFolder, FuzzySuggestModal } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SortCriterion, CardNavigatorSettings } from '../../common/types';
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

export function toggleSort(plugin: CardNavigatorPlugin) {
    closeCurrentPopup();
    
    let sortPopup = document.querySelector('.card-navigator-sort-popup') as HTMLElement;

    if (!sortPopup) {
        sortPopup = document.createElement('div');
        sortPopup.className = 'card-navigator-sort-popup';

        const currentSort = `${plugin.settings.sortCriterion}_${plugin.settings.sortOrder}`;

        const addSortOption = (value: string, label: string) => {
            const option = document.createElement('button');
            option.textContent = label;
            option.classList.add('sort-option');
            option.classList.toggle('active', currentSort === value);
            option.addEventListener('click', async () => {
                const [criterion, order] = value.split('_') as [SortCriterion, 'asc' | 'desc'];
                plugin.settings.sortCriterion = criterion;
                plugin.settings.sortOrder = order;
                await plugin.saveSettings();
                plugin.triggerRefresh();
                closeCurrentPopup();
            });
            sortPopup.appendChild(option);
        };

        addSortOption('fileName_asc', t('File name (A to Z)'));
        addSortOption('fileName_desc', t('File name (Z to A)'));
        addSortOption('lastModified_desc', t('Last modified (newest first)'));
        addSortOption('lastModified_asc', t('Last modified (oldest first)'));
        addSortOption('created_desc', t('Created (newest first)'));
        addSortOption('created_asc', t('Created (oldest first)'));

        const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
        if (toolbarEl) {
            toolbarEl.insertAdjacentElement('afterend', sortPopup);
            currentPopup = sortPopup;

            document.addEventListener('click', onClickOutside);
        }
    } else {
        closeCurrentPopup();
    }
}

export function toggleSettings(plugin: CardNavigatorPlugin) {
    closeCurrentPopup();
    
    let settingsPopup = document.querySelector('.card-navigator-settings-popup') as HTMLElement;

    if (!settingsPopup) {
        settingsPopup = document.createElement('div');
        settingsPopup.className = 'card-navigator-settings-popup';

        const updateSetting = async <K extends keyof CardNavigatorSettings>(
            settingKey: K,
            value: CardNavigatorSettings[K]
        ) => {
            plugin.settings[settingKey] = value;
            await plugin.saveSettings();
            plugin.triggerRefresh();
        };

        // 카드 수 설정
        const cardsPerViewContainer = createSettingContainer('Cards per view:');
        const cardsPerViewSetting = document.createElement('input');
        cardsPerViewSetting.type = 'range';
        cardsPerViewSetting.min = '1';
        cardsPerViewSetting.max = '10';
        cardsPerViewSetting.value = plugin.settings.cardsPerView.toString();
        cardsPerViewSetting.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value, 10);
            updateSetting('cardsPerView', value);
            cardsPerViewValue.textContent = value.toString();
        });
        const cardsPerViewValue = document.createElement('span');
        cardsPerViewValue.textContent = plugin.settings.cardsPerView.toString();
        cardsPerViewContainer.appendChild(cardsPerViewSetting);
        cardsPerViewContainer.appendChild(cardsPerViewValue);
        settingsPopup.appendChild(cardsPerViewContainer);

        // 글자 크기 설정
        const fontSizeContainer = createSettingContainer('Content Size:');
        const fontSizeSetting = document.createElement('input');
        fontSizeSetting.type = 'range';
        fontSizeSetting.min = '10';
        fontSizeSetting.max = '30';
        fontSizeSetting.value = plugin.settings.contentSize.toString();
        fontSizeSetting.addEventListener('input', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value, 10);
            updateSetting('contentSize', value);
            fontSizeValue.textContent = value.toString() + 'px';
        });
        const fontSizeValue = document.createElement('span');
        fontSizeValue.textContent = plugin.settings.contentSize.toString() + 'px';
        fontSizeContainer.appendChild(fontSizeSetting);
        fontSizeContainer.appendChild(fontSizeValue);
        settingsPopup.appendChild(fontSizeContainer);

        // 토글 버튼들
        const createToggle = (labelText: string, settingKey: keyof CardNavigatorSettings) => {
            const container = createSettingContainer(labelText);
            const toggleWrapper = document.createElement('div');
            toggleWrapper.className = 'toggle-wrapper';
            const toggle = document.createElement('div');
            toggle.className = 'toggle-button';
            toggle.classList.toggle('active', plugin.settings[settingKey] as boolean);
            toggle.addEventListener('click', async () => {
                const newValue = !plugin.settings[settingKey];
                toggle.classList.toggle('active', newValue);
                await updateSetting(settingKey, newValue);
            });
            toggleWrapper.appendChild(toggle);
            container.appendChild(toggleWrapper);
            return container;
        };

        settingsPopup.appendChild(createToggle(t('Show File Name'), 'showFileName'));
        settingsPopup.appendChild(createToggle(t('Show First Header'), 'showFirstHeader'));
        settingsPopup.appendChild(createToggle(t('Show Content'), 'showContent'));
        settingsPopup.appendChild(createToggle(t('Drag and Drop Content'), 'dragDropContent'));

        const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
        if (toolbarEl) {
            toolbarEl.insertAdjacentElement('afterend', settingsPopup);
            currentPopup = settingsPopup;

            document.addEventListener('click', onClickOutside);
        }
    } else {
        closeCurrentPopup();
    }
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

function createSettingContainer(labelText: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'setting-container';
    const label = document.createElement('label');
    label.textContent = labelText;
    container.appendChild(label);
    return container;
}
