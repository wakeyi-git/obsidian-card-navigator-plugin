import { Menu } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { SortCriterion, SortOrder } from 'common/types';
import { getTranslatedSortOptions } from 'common/types';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';

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
    refreshAllCardNavigatorViews(plugin, RefreshType.CONTENT);
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

