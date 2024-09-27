import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { FolderSuggest } from './components/FolderSuggest';
import { SettingTab } from './settingsTab';

export function addContainerSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {
    
    containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('CONTAINER_SETTINGS'))
        .setHeading();

    settingTab.addToggleSetting(
        containerEl,
        'useSelectedFolder',
        t('SOURCE_FOLDER'),
        t('SOURCE_FOLDER_DESC')
    );
    
    new Setting(containerEl)
        .setName(t('SELECT_FOLDER'))
        .setDesc(t('SELECT_FOLDER_DESC'))
        .addText(cb => {
            new FolderSuggest(plugin.app, cb.inputEl);
            cb.setPlaceholder(t('SELECT_FOLDER_PLACEHOLDER'))
                .setValue(plugin.settings.selectedFolder || '')
                .onChange(async (newFolder) => {
                    if (newFolder) {
                        await settingsManager.updateSetting('selectedFolder', newFolder);
                    }
                });
            cb.inputEl.addClass("card-navigator-folder-search");
        });

    settingTab.addDropdownSetting(
        containerEl,
        'sortMethod',
        t('DEFAULT_SORT_METHOD'),
        t('DEFAULT_SORT_METHOD_DESC')
    );

    settingTab.addToggleSetting(
        containerEl,
        'centerActiveCardOnOpen',
        t('CENTER_ACTIVE_CARD_ON_OPEN'),
        t('CENTER_ACTIVE_CARD_ON_OPEN_DESC')
    );
}
