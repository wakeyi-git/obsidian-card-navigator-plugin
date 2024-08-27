// src/ui/toolbar/toolbarActions.ts

import { TFolder, FuzzySuggestModal } from 'obsidian';
import { CardNavigator } from '../cardNavigator';
import { VIEW_TYPE_CARD_NAVIGATOR } from '../cardNavigator';
import CardNavigatorPlugin from '../../main';

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
    const view = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0].view as CardNavigator;
    const cardContainer = view.cardContainer;
    const cardContainerEl = cardContainer.getContainerEl();
    if (!cardContainerEl) return;

    const { cardWidth, cardHeight, isVertical } = cardContainer.getCardSizeAndOrientation();

    const moveAmount = amount === 'single'
        ? (isVertical ? cardHeight : cardWidth)
        : (isVertical ? cardHeight : cardWidth) * plugin.settings.cardsPerView;
    
    const currentScroll = isVertical ? cardContainerEl.scrollTop : cardContainerEl.scrollLeft;

    switch (direction) {
        case 'up':
            cardContainerEl.scrollTo({ top: currentScroll - moveAmount, behavior: 'smooth' });
            break;
        case 'down':
            cardContainerEl.scrollTo({ top: currentScroll + moveAmount, behavior: 'smooth' });
            break;
        case 'left':
            cardContainerEl.scrollTo({ left: currentScroll - moveAmount, behavior: 'smooth' });
            break;
        case 'right':
            cardContainerEl.scrollTo({ left: currentScroll + moveAmount, behavior: 'smooth' });
            break;
        case 'center': {
            const activeCard = cardContainerEl.querySelector('.card-navigator-active') as HTMLElement;
            if (activeCard) {
                activeCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
            break;
        }
    }
}

export function toggleSearch(plugin: CardNavigatorPlugin) {
    let searchPopup = document.querySelector('.card-navigator-search-popup') as HTMLElement;

    if (!searchPopup) {
        searchPopup = document.createElement('div');
        searchPopup.className = 'card-navigator-search-popup';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search...';

        input.addEventListener('input', async () => {
            const searchTerm = input.value;
            const view = plugin.app.workspace.getLeavesOfType('card-navigator-view')[0].view as CardNavigator;
            await view.cardContainer.searchCards(searchTerm);
        });

        searchPopup.appendChild(input);

        // 툴바 하단에 배치
        const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
        if (toolbarEl) {
            toolbarEl.insertAdjacentElement('afterend', searchPopup);

            // 화면의 다른 곳을 클릭하면 팝업을 닫는 이벤트 추가
            document.addEventListener('click', function onClickOutside(event) {
                if (searchPopup && !searchPopup.contains(event.target as Node) && !toolbarEl.contains(event.target as Node)) {
                    searchPopup.remove();
                    document.removeEventListener('click', onClickOutside);
                }
            });
        }
    } else {
        searchPopup.classList.toggle('hidden');
    }
}

export function toggleSort(plugin: CardNavigatorPlugin) {
    let sortPopup = document.querySelector('.card-navigator-sort-popup') as HTMLElement;

    if (!sortPopup) {
        sortPopup = document.createElement('div');
        sortPopup.className = 'card-navigator-sort-popup';

        const options: Array<'fileName' | 'lastModified' | 'created'> = ['fileName', 'lastModified', 'created'];
        options.forEach(option => {
            const ascButton = document.createElement('button');
            ascButton.textContent = `${option} ↑`;
            ascButton.addEventListener('click', async () => {
                await plugin.sortCards(option, 'asc');
                sortPopup.classList.add('hidden');
            });

            const descButton = document.createElement('button');
            descButton.textContent = `${option} ↓`;
            descButton.addEventListener('click', async () => {
                await plugin.sortCards(option, 'desc');
                sortPopup.classList.add('hidden');
            });

            sortPopup.appendChild(ascButton);
            sortPopup.appendChild(descButton);
        });

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
        sortPopup.classList.toggle('hidden');
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
