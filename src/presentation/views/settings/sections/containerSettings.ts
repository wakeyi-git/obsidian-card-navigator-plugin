import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../../../main';
import { SettingsManager } from '../settingsManager';
import { t } from 'i18next';
import { FolderSuggest } from '../components/FolderSuggest';
import { SettingTab } from '../settingsTab';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR, RefreshType } from '../../CardNavigatorView';
import { CardSetType } from '../../../../domain/models/types';
import { getSearchService } from '../../toolbar/search';

export function addContainerSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {
    
    containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('CONTAINER_SETTINGS'))
        .setHeading();

    new Setting(containerEl)
        .setName(t('CARD_SET_TYPE'))
        .setDesc(t('CARD_SET_TYPE_DESC'))
        .addDropdown(dropdown => {
            dropdown
                .addOption('activeFolder', t('ACTIVE_FOLDER'))
                .addOption('selectedFolder', t('SELECTED_FOLDER'))
                .addOption('vault', t('ENTIRE_VAULT'))
                .setValue(plugin.settings.cardSetType)
                .onChange(async (value) => {
                    const searchService = getSearchService(plugin);
                    searchService.clearCache();
                    
                    await settingsManager.updateSetting('cardSetType', value as CardSetType);
                    
                    const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
                    leaves.forEach(leaf => {
                        if (leaf.view instanceof CardNavigatorView) {
                            leaf.view.cardContainer.setSearchResults(null);
                            leaf.view.refresh(RefreshType.CONTENT);
                        }
                    });

                    const folderSetting = containerEl.querySelector('.folder-select-setting');
                    if (folderSetting instanceof HTMLElement) {
                        folderSetting.style.display = value === 'selectedFolder' ? '' : 'none';
                    }
                });
        });

    const folderSetting = new Setting(containerEl)
        .setClass('folder-select-setting')
        .setName(t('SELECT_FOLDER'))
        .setDesc(t('SELECT_FOLDER_DESC'))
        .addText(cb => {
            new FolderSuggest(plugin.app, cb.inputEl);
            cb.setPlaceholder(t('SELECT_FOLDER_PLACEHOLDER'))
                .setValue(plugin.settings.selectedFolder || '')
                .onChange(async (newFolder) => {
                    await settingsManager.updateSetting('selectedFolder', newFolder);
                });
            cb.inputEl.addClass("card-navigator-folder-search");
        });

    if (plugin.settings.cardSetType !== 'selectedFolder') {
        folderSetting.settingEl.style.display = 'none';
    }

    settingTab.addDropdownSetting(
        containerEl,
        'sortMethod',
        t('DEFAULT_SORT_METHOD'),
        t('DEFAULT_SORT_METHOD_DESC'),
        async () => {
            // 모든 Card Navigator 뷰 업데이트
            const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
            leaves.forEach(leaf => {
                if (leaf.view instanceof CardNavigatorView) {
                    const view = leaf.view;
                    const searchService = getSearchService(plugin);
                    const resortedResults = searchService.resortLastResults();
                    if (resortedResults) {
                        // 재정렬된 결과를 검색 결과로 설정하고 카드 업데이트
                        view.cardContainer.setSearchResults(resortedResults);
                        view.cardContainer.displayCards(resortedResults);
                    } else {
                        // 검색 결과가 없다면 일반 새로고침
                        view.refresh(RefreshType.CONTENT);
                    }
                }
            });
        }
    );

    settingTab.addToggleSetting(
        containerEl,
        'enableScrollAnimation',
        t('ENABLE_SCROLL_ANIMATION'),
        t('ENABLE_SCROLL_ANIMATION_DESC')
    );
}
