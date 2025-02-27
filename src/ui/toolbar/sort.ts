import { Menu } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { SortCriterion, SortOrder } from 'common/types';
import { getTranslatedSortOptions } from 'common/types';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';
import { getSearchService } from 'ui/toolbar/search';

// 정렬 메뉴 토글
export function toggleSort(plugin: CardNavigatorPlugin, containerEl: HTMLElement | null) {
    if (!containerEl) {
        console.error('Container element is undefined in toggleSort');
        return;
    }

    const menu = new Menu();
    const currentSort = `${plugin.settings.sortCriterion}_${plugin.settings.sortOrder}`;
    const sortOptions = getTranslatedSortOptions();

    // 이름 정렬 옵션 추가
    const nameOptions = sortOptions.filter(option => option.value.includes('fileName'));
    nameOptions.forEach(option => {
        menu.addItem(item => 
            item
                .setTitle(option.label)
                .setChecked(currentSort === option.value)
                .onClick(async () => {
                    const [criterion, order] = option.value.split('_') as [SortCriterion, SortOrder];
                    await updateSortSettings(plugin, criterion, order, containerEl);
                })
        );
    });

    if (nameOptions.length > 0) {
        menu.addSeparator();
    }

    // 수정일 정렬 옵션 추가
    const modifiedOptions = sortOptions.filter(option => option.value.includes('lastModified'));
    modifiedOptions.forEach(option => {
        menu.addItem(item => 
            item
                .setTitle(option.label)
                .setChecked(currentSort === option.value)
                .onClick(async () => {
                    const [criterion, order] = option.value.split('_') as [SortCriterion, SortOrder];
                    await updateSortSettings(plugin, criterion, order, containerEl);
                })
        );
    });

    if (modifiedOptions.length > 0) {
        menu.addSeparator();
    }

    // 생성일 정렬 옵션 추가
    const createdOptions = sortOptions.filter(option => option.value.includes('created'));
    createdOptions.forEach(option => {
        menu.addItem(item => 
            item
                .setTitle(option.label)
                .setChecked(currentSort === option.value)
                .onClick(async () => {
                    const [criterion, order] = option.value.split('_') as [SortCriterion, SortOrder];
                    await updateSortSettings(plugin, criterion, order, containerEl);
                })
        );
    });

    const buttonEl = containerEl.querySelector('.card-navigator-sort-button');
    if (buttonEl instanceof HTMLElement) {
        const rect = buttonEl.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }
}

// 정렬 설정 업데이트
async function updateSortSettings(
    plugin: CardNavigatorPlugin, 
    criterion: SortCriterion, 
    order: SortOrder, 
    containerEl: HTMLElement
) {
    plugin.settings.sortCriterion = criterion;
    plugin.settings.sortOrder = order;
    await plugin.saveSettings();

    // 현재 활성화된 Card Navigator 뷰의 검색 결과 재정렬
    const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    for (const leaf of leaves) {
        if (leaf.view instanceof CardNavigatorView) {
            const view = leaf.view;
            const searchService = getSearchService(plugin);
            const resortedResults = searchService.resortLastResults((a, b) => {
                let comparison = 0;
                switch (plugin.settings.sortCriterion) {
                    case 'fileName':
                        comparison = a.basename.localeCompare(b.basename, undefined, { numeric: true, sensitivity: 'base' });
                        break;
                    case 'lastModified':
                        comparison = a.stat.mtime - b.stat.mtime;
                        break;
                    case 'created':
                        comparison = a.stat.ctime - b.stat.ctime;
                        break;
                }
                return plugin.settings.sortOrder === 'asc' ? comparison : -comparison;
            });
            if (resortedResults) {
                // 재정렬된 결과를 검색 결과로 설정하고 카드 업데이트
                view.cardContainer.setSearchResults(resortedResults);
                
                // 강제로 카드 다시 렌더링을 위해 cards 배열 초기화
                view.cardContainer.cards = [];
                
                await view.cardContainer.displayCards(resortedResults);
            } else {
                // 검색 결과가 없다면 일반 새로고침
                view.cardContainer.setSearchResults(null);
                await view.refresh(RefreshType.CONTENT);
            }
        }
    }
}

// 모든 Card Navigator 뷰 새로고침
async function refreshAllCardNavigatorViews(plugin: CardNavigatorPlugin, type: RefreshType) {
    const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    for (const leaf of leaves) {
        if (leaf.view instanceof CardNavigatorView) {
            await leaf.view.refresh(type);
        }
    }
}

