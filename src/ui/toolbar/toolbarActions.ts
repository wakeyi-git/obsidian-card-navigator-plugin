// src/ui/toolbar/toolbarActions.ts

import { TFolder, FuzzySuggestModal } from 'obsidian';
import { CardNavigator } from '../cardNavigator';
import { VIEW_TYPE_CARD_NAVIGATOR } from '../cardNavigator';
import CardNavigatorPlugin from '../../main';
import { SortCriterion } from '../../common/types';

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

export function moveCards(direction: string, plugin: CardNavigatorPlugin, amount: 'single' | 'multiple' = 'single') {
    const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    if (leaves.length === 0) return;

    const view = leaves[0].view as CardNavigator;
    if (!view || !view.cardContainer) return;

    const cardContainer = view.cardContainer;

    switch (direction) {
        case 'up':
            cardContainer.scrollUp(amount);
            break;
        case 'down':
            cardContainer.scrollDown(amount);
            break;
        case 'left':
            cardContainer.scrollLeft(amount);
            break;
        case 'right':
            cardContainer.scrollRight(amount);
            break;
        case 'center':
            cardContainer.scrollToCenter();
            break;
    }
}

export function toggleSort(plugin: CardNavigatorPlugin) {
    let sortPopup = document.querySelector('.card-navigator-sort-popup') as HTMLElement;

    if (!sortPopup) {
        sortPopup = document.createElement('div');
        sortPopup.className = 'card-navigator-sort-popup';

        const currentSort = `${plugin.settings.sortCriterion}_${plugin.settings.sortOrder}`;

        const addSortOption = (value: string, label: string) => {
            const option = document.createElement('button');
            option.textContent = label;
            option.classList.toggle('active', currentSort === value);
            option.addEventListener('click', async () => {
                const [criterion, order] = value.split('_') as [SortCriterion, 'asc' | 'desc'];
                plugin.settings.sortCriterion = criterion;
                plugin.settings.sortOrder = order;
                await plugin.saveSettings();
                plugin.refreshViews();
                sortPopup.remove();
            });
            sortPopup.appendChild(option);
        };

        addSortOption('fileName_asc', 'File name (A to Z)');
        addSortOption('fileName_desc', 'File name (Z to A)');
        addSortOption('lastModified_desc', 'Last modified (newest first)');
        addSortOption('lastModified_asc', 'Last modified (oldest first)');
        addSortOption('created_desc', 'Created (newest first)');
        addSortOption('created_asc', 'Created (oldest first)');

        // 툴바 하단에 배치
        const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
        if (toolbarEl) {
            toolbarEl.insertAdjacentElement('afterend', sortPopup);

            // 화면의 다른 곳을 클릭하면 팝업을 닫는 이벤트 추가
            document.addEventListener('click', function onClickOutside(event) {
                if (sortPopup && !sortPopup.contains(event.target as Node) && !toolbarEl.contains(event.target as Node)) {
                    sortPopup.remove();
                    document.removeEventListener('click', onClickOutside);
                }
            });
        }
    } else {
        sortPopup.remove();
    }
}

export function toggleSettings(plugin: CardNavigatorPlugin) {
    let settingsPopup = document.querySelector('.card-navigator-settings-popup') as HTMLElement;

    if (!settingsPopup) {
        settingsPopup = document.createElement('div');
        settingsPopup.className = 'card-navigator-settings-popup';

        // 카드 수 설정
        const cardsPerViewSetting = document.createElement('input');
        cardsPerViewSetting.type = 'range';
        cardsPerViewSetting.min = '1';
        cardsPerViewSetting.max = '10';
        cardsPerViewSetting.value = plugin.settings.cardsPerView.toString();
        cardsPerViewSetting.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            plugin.settings.cardsPerView = parseInt(value, 10);
            plugin.saveSettings();
            plugin.refreshViews();
        });
        const cardsPerViewLabel = document.createElement('label');
        cardsPerViewLabel.textContent = 'Cards Per View:';
        settingsPopup.appendChild(cardsPerViewLabel);
        settingsPopup.appendChild(cardsPerViewSetting);

        // 글자 크기 설정
        const fontSizeSetting = document.createElement('input');
        fontSizeSetting.type = 'range';
        fontSizeSetting.min = '10';
        fontSizeSetting.max = '30';
        fontSizeSetting.value = plugin.settings.contentSize.toString();
        fontSizeSetting.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            plugin.settings.contentSize = parseInt(value, 10);
            plugin.saveSettings();
            plugin.refreshViews();
        });
        const fontSizeLabel = document.createElement('label');
        fontSizeLabel.textContent = 'Content Font Size:';
        settingsPopup.appendChild(fontSizeLabel);
        settingsPopup.appendChild(fontSizeSetting);

        // 표시 항목 선택을 위한 토글 버튼들
        const createToggle = (labelText: string, initialValue: boolean, onChange: (value: boolean) => void) => {
            const container = document.createElement('div');
            const label = document.createElement('label');
            label.textContent = labelText;

            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = initialValue;
            toggle.addEventListener('change', (e) => {
                onChange((e.target as HTMLInputElement).checked);
                plugin.saveSettings();
                plugin.refreshViews();
            });

            container.appendChild(label);
            container.appendChild(toggle);
            return container;
        };

        // File Name 표시
        const fileNameToggle = createToggle('Show File Name', plugin.settings.showFileName, (value) => {
            plugin.settings.showFileName = value;
        });
        settingsPopup.appendChild(fileNameToggle);

        // First Header 표시
        const firstHeaderToggle = createToggle('Show First Header', plugin.settings.showFirstHeader, (value) => {
            plugin.settings.showFirstHeader = value;
        });
        settingsPopup.appendChild(firstHeaderToggle);

        // Content 표시
        const contentToggle = createToggle('Show Content', plugin.settings.showContent, (value) => {
            plugin.settings.showContent = value;
        });
        settingsPopup.appendChild(contentToggle);

        // Drag and Drop Content 표시 (새로 추가된 부분)
        const dragDropContentToggle = createToggle('Drag and Drop Content', plugin.settings.dragDropContent, (value) => {
            plugin.settings.dragDropContent = value;
        });
        settingsPopup.appendChild(dragDropContentToggle);

        // 툴바 하단에 배치
        const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
        if (toolbarEl) {
            toolbarEl.insertAdjacentElement('afterend', settingsPopup);

            // 화면의 다른 곳을 클릭하면 팝업을 닫는 이벤트 추가
            document.addEventListener('click', function onClickOutside(event) {
                if (settingsPopup && !settingsPopup.contains(event.target as Node) && !toolbarEl.contains(event.target as Node)) {
                    settingsPopup.remove();
                    document.removeEventListener('click', onClickOutside);
                }
            });
        }
    } else {
        settingsPopup.classList.toggle('hidden');
    }
}
