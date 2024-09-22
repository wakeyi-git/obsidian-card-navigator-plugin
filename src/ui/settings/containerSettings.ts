import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { FolderSuggest } from './components/FolderSuggest';
import { SortCriterion, SortOrder, sortOptions } from '../../common/types';

export function addContainerSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(containerEl)
        .setName(t('Container settings'))
        .setHeading();

	addFolderSelectionSetting(containerEl, plugin, settingsManager);
    
    addSortSetting(containerEl, plugin, settingsManager);
    
    new Setting(containerEl)
        .setName(t('Center active card on open'))
        .setDesc(t('Automatically center the active card when opening the Card Navigator'))
        .addToggle(toggle => toggle
            .setValue(plugin.settings.centerActiveCardOnOpen)
            .onChange(async (value) => {
                await settingsManager.updateSetting('centerActiveCardOnOpen', value);
            })
        );
}

function addFolderSelectionSetting(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    const folderSetting = new Setting(containerEl)
        .setName(t('Folder selection'))
        .setDesc(t('Select the folder to use for Card Navigator'));

    folderSetting.addToggle(toggle => toggle
        .setValue(plugin.settings.useSelectedFolder)
        .setTooltip(t('Use selected folder'))
        .onChange(async (value) => {
            await settingsManager.updateSetting('useSelectedFolder', value);
            updateSelectedFolderVisibility(value);
        })
    );

    const selectedFolderSetting = new Setting(containerEl)
        .setName(t('Selected folder'))
        .setDesc(t('Select a folder for Card Navigator'))
        .addText(cb => {
            new FolderSuggest(plugin.app, cb.inputEl);
            cb.setPlaceholder(t('Select folder'))
                .setValue(plugin.settings.selectedFolder || '')
                .onChange(async (newFolder) => {
                    if (newFolder) {
                        await settingsManager.updateSetting('selectedFolder', newFolder);
                    }
                });
            // @ts-ignore
            cb.inputEl.addClass("card-navigator-folder-search");
        });

    function updateSelectedFolderVisibility(value: boolean) {
        if (value) {
            selectedFolderSetting.settingEl.show();
        } else {
            selectedFolderSetting.settingEl.hide();
        }
    }

    // 초기 상태 설정
    updateSelectedFolderVisibility(plugin.settings.useSelectedFolder);
}

function addSortSetting(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(containerEl)
        .setName(t('Default sort method'))
        .setDesc(t('Choose the default sorting method for cards.'))
        .addDropdown(dropdown => {
            sortOptions.forEach(option => {
                dropdown.addOption(option.value, t(option.label));
            });
            dropdown
                .setValue(`${plugin.settings.sortCriterion}_${plugin.settings.sortOrder}`)
                .onChange(async (value) => {
                    const [criterion, order] = value.split('_') as [SortCriterion, SortOrder];
                    await settingsManager.updateSetting('sortCriterion', criterion);
                    await settingsManager.updateSetting('sortOrder', order);
                });
        });
}
