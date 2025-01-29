import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { FolderSuggest } from './components/FolderSuggest';
import { SettingTab } from './settingsTab';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';
import { CardSetType } from 'common/types';

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
                    await settingsManager.updateSetting('cardSetType', value as CardSetType);
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
        t('DEFAULT_SORT_METHOD_DESC')
    );

    settingTab.addToggleSetting(
        containerEl,
        'enableScrollAnimation',
        t('ENABLE_SCROLL_ANIMATION'),
        t('ENABLE_SCROLL_ANIMATION_DESC')
    );
}
