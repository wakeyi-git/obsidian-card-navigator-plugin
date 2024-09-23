import { Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { t } from 'i18next';
import { FolderSuggest } from './components/FolderSuggest';
import { SettingTab } from './settingsTab';

export function addContainerSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {
    
	// containerEl.createEl('div', { cls: 'settings-section-margin' });

	// new Setting(containerEl)
    //     .setName(t('Container settings'))
    //     .setHeading();

	settingTab.addToggleSetting(
		containerEl,
		'useSelectedFolder',
		t('Source folder'),
		t('Choose whether to use the active file\'s folder or the selected folder in the card navigator.')
	);
	
	new Setting(containerEl)
		.setName(t('Select folder'))
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
			cb.inputEl.addClass("card-navigator-folder-search");
		});

	settingTab.addDropdownSetting(
		containerEl,
		'sortMethod',
		t('Default sort method'),
		t('Choose the default sorting method for cards.')
	);

	settingTab.addToggleSetting(
		containerEl,
		'centerActiveCardOnOpen',
		t('Center active card on open'),
		t('Automatically center the active card when opening the Card Navigator')
	);
}
