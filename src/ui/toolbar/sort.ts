import { Menu } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { SortCriterion, SortOrder } from 'common/types';
import { getTranslatedSortOptions } from 'common/types';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';
import { getSearchService } from 'ui/toolbar/search';
import { t } from 'i18next';

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

    // 정렬 버튼 요소 찾기
    let buttonEl = null;
    
    // 액션 아이콘 컨테이너에서 정렬 버튼 찾기 (두 번째 아이콘)
    const actionIconsContainer = containerEl.querySelector('.card-navigator-action-icons-container');
    if (actionIconsContainer) {
        const icons = actionIconsContainer.querySelectorAll('.clickable-icon');
        if (icons.length >= 2) {
            buttonEl = icons[1]; // 두 번째 아이콘이 정렬 버튼
        }
    }
    
    // 버튼을 찾지 못한 경우 클래스로 찾기 시도
    if (!buttonEl) {
        buttonEl = containerEl.querySelector('.card-navigator-sort-button');
    }

    if (buttonEl instanceof HTMLElement) {
        const rect = buttonEl.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    } else {
        // 버튼을 찾을 수 없는 경우 컨테이너 요소 기준으로 표시
        const rect = containerEl.getBoundingClientRect();
        menu.showAtPosition({ x: rect.right - 100, y: rect.top + 40 });
    }
}

// 정렬 설정 업데이트
async function updateSortSettings(
    plugin: CardNavigatorPlugin, 
    criterion: SortCriterion, 
    order: SortOrder, 
    containerEl: HTMLElement
) {
    // 설정 업데이트
    plugin.settings.sortCriterion = criterion;
    plugin.settings.sortOrder = order;
    await plugin.saveSettings();

    // 현재 활성화된 Card Navigator 뷰의 검색 결과 재정렬
    const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    for (const leaf of leaves) {
        if (leaf.view instanceof CardNavigatorView) {
            const view = leaf.view;
            const searchService = getSearchService(plugin);
            
            // 카드 컨테이너 초기화 및 강제 새로고침
            if (view.cardContainer) {
                // 검색 모드인 경우 검색 결과 재정렬
                if (view.cardContainer.isSearchMode && view.cardContainer.getSearchResults()) {
                    // 검색 모드: 검색 결과 재정렬
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
                        // 카드 배열 초기화
                        view.cardContainer.cards = [];
                        
                        // 카드 렌더러 초기화 (DOM 요소 제거)
                        const cardRenderer = view.cardContainer.cardRenderer;
                        if (cardRenderer) {
                            cardRenderer.resetCardElements();
                        }
                        
                        // 재정렬된 결과를 검색 결과로 설정하고 카드 업데이트
                        view.cardContainer.setSearchResults(resortedResults);
                        await view.cardContainer.displayFilesAsCards(resortedResults);
                    }
                } else {
                    // 일반 모드: 검색 결과가 없는 경우 전체 카드 목록 새로고침
                    view.cardContainer.setSearchResults(null);
                    
                    // 카드 배열 초기화
                    view.cardContainer.cards = [];
                    
                    // 카드 렌더러 초기화 (DOM 요소 제거)
                    const cardRenderer = view.cardContainer.cardRenderer;
                    if (cardRenderer) {
                        cardRenderer.resetCardElements();
                    }
                    
                    // 강제로 카드 다시 로드 - 이 과정에서 새로운 정렬 설정이 적용됨
                    await view.cardContainer.loadCards();
                }
            }
        }
    }
}
