//src/ui/settingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { FolderSuggestModal } from './toolbar/toolbarActions';
import { 
    SortCriterion, 
    CardNavigatorSettings, 
    NumberSettingKey,
    displaySettings,
    fontSizeSettings,
    keyboardShortcuts,
    sortOptions,
    SortOrder
} from '../common/types';
import { t } from 'i18next';
import { SettingsManager } from '../common/settingsManager';

export class SettingTab extends PluginSettingTab {
    private settingsManager: SettingsManager;

    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
        this.settingsManager = new SettingsManager(plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.addGeneralSettings();
        this.addDisplaySettings();
        this.addFontSettings();
        this.addKeyboardShortcutsInfo();
    }

    private addGeneralSettings(): void {
        const sectionEl = this.containerEl.createDiv({ cls: 'settings-section general-settings' });
        
        this.addNumberSetting('cardsPerView', t('Cards per view'), t('Number of cards to display at once'), sectionEl);
        this.addFolderSelectionSetting(sectionEl);
        this.addSortSetting(sectionEl);

        const toggleSettings = [
            { key: 'alignCardHeight', name: t('Align Card Height'), desc: t('If enabled, all cards will have the same height. If disabled, card height will adjust to content.') },
            { key: 'renderContentAsHtml', name: t('Render Content as HTML'), desc: t('If enabled, card content will be rendered as HTML') },
            { key: 'centerActiveCardOnOpen', name: t('Center Active Card on Open'), desc: t('Automatically center the active card when opening the Card Navigator') },
            { key: 'dragDropContent', name: t('Drag and Drop Content'), desc: t('When enabled, dragging a card will insert the note content instead of a link.') },
        ] as const;

        toggleSettings.forEach(setting => {
            this.addToggleSetting(setting.key, setting.name, setting.desc, sectionEl);
        });
    }

    // Add a number setting with a slider
    private addNumberSetting(key: NumberSettingKey, name: string, desc: string, parentEl: HTMLElement): void {
        const setting = new Setting(parentEl)
            .setName(name)
            .setDesc(desc);

        const config = this.settingsManager.getNumberSettingConfig(key);
        setting.addSlider(slider => slider
            .setLimits(config.min, config.max, config.step)
            .setValue(this.plugin.settings[key])
            .setDynamicTooltip()
            .onChange(async (value) => {
                await this.settingsManager.updateNumberSetting(key, value);
            }));
        
        setting.settingEl.addClass('setting-number');
    }

    // Add folder selection setting
    private addFolderSelectionSetting(parentEl: HTMLElement): void {
        const folderSettingEl = new Setting(parentEl)
            .setName(t('Folder Selection'))
            .setDesc(t('Choose whether to use the active file\'s folder or a selected folder'))
            .addDropdown(dropdown => dropdown
                .addOption('active', t('Active File\'s Folder'))
                .addOption('selected', t('Selected Folder'))
                .setValue(this.plugin.settings.useSelectedFolder ? 'selected' : 'active')
                .onChange(async (value) => {
                    await this.settingsManager.updateBooleanSetting('useSelectedFolder', value === 'selected');
                    this.display();
                })).settingEl;

        folderSettingEl.addClass('setting-folder-selection');

        if (this.plugin.settings.useSelectedFolder) {
            this.addFolderSetting(parentEl);
        }
    }

    // Add folder setting when 'Selected Folder' option is chosen
    private addFolderSetting(parentEl: HTMLElement): void {
        const folderEl = new Setting(parentEl)
            .setName(t('Select Folder'))
            .setDesc(t('Choose a folder for Card Navigator'))
            .addButton(button => button
                .setButtonText(this.plugin.settings.selectedFolder || t('Choose folder'))
                .onClick(() => {
                    new FolderSuggestModal(this.plugin, async (folder) => {
                        await this.settingsManager.updateSelectedFolder(folder);
                        this.display();
                    }).open();
                })).settingEl;

        folderEl.addClass('setting-select-folder');
    }

    // Add sort setting for default sorting method
    private addSortSetting(parentEl: HTMLElement): void {
        const sortEl = new Setting(parentEl)
            .setName(t('Default sort method'))
            .setDesc(t('Choose the default sorting method for cards'))
            .addDropdown(dropdown => {
                sortOptions.forEach(option => {
                    dropdown.addOption(option.value, t(option.label));
                });
                dropdown
                    .setValue(`${this.plugin.settings.sortCriterion}_${this.plugin.settings.sortOrder}`)
                    .onChange(async (value) => {
                        const [criterion, order] = value.split('_') as [SortCriterion, SortOrder];
                        await this.settingsManager.updateSortSettings(criterion, order);
                    });
            }).settingEl;

        sortEl.addClass('setting-sort-method');
    }

    // Add toggle setting for boolean options
    private addToggleSetting(key: keyof CardNavigatorSettings, name: string, desc: string, parentEl: HTMLElement): void {
        const settingEl = new Setting(parentEl)
            .setName(name)
            .setDesc(desc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings[key] as boolean)
                .onChange(async (value) => {
                    await this.settingsManager.updateBooleanSetting(key, value);
                })).settingEl;

        settingEl.addClass('setting-toggle');
    }

    // Add display settings section
	private addDisplaySettings(): void {
		const sectionEl = this.containerEl.createDiv({ cls: 'settings-section display-settings' });
		new Setting(sectionEl)
			.setName(t('Settings What to Show'))
			.setHeading();
	
		displaySettings.forEach(({ key, name }) => {
			this.addToggleSetting(key, t(name), t(`Toggle to display or hide the ${name.toLowerCase()} on cards`), sectionEl);
		});
	
		this.addNumberSetting('contentLength', t('Content Length'), t('Maximum content length displayed on each card'), sectionEl);
	}

    // Add font settings section
	private addFontSettings(): void {
		const sectionEl = this.containerEl.createDiv({ cls: 'settings-section font-settings' });
		new Setting(sectionEl)
			.setName(t('Font Size Settings'))
			.setHeading();
	
		fontSizeSettings.forEach(({ key, name }) => {
			this.addNumberSetting(key, t(name), t(`Set the font size for the ${name.toLowerCase()}`), sectionEl);
		});
	}

    // Add keyboard shortcuts information section
	private addKeyboardShortcutsInfo(): void {
		const sectionEl = this.containerEl.createDiv({ cls: 'settings-section keyboard-shortcuts' });
	
		new Setting(sectionEl)
			.setName(t('Keyboard Shortcuts'))
			.setHeading();
	
		const shortcutDesc = sectionEl.createEl('p');
		shortcutDesc.setText(t('Card Navigator provides the following features that can be assigned keyboard shortcuts. You can set these up in Obsidian\'s Hotkeys settings:'));
		
		const shortcutList = sectionEl.createEl('ul');
		keyboardShortcuts.forEach(({ name }) => {
			const item = shortcutList.createEl('li');
			item.setText(t(name));
		});
		
		const customizeNote = sectionEl.createEl('p');
		customizeNote.setText(t('To set up shortcuts for these actions, go to Settings → Hotkeys and search for "Card Navigator". You can then assign your preferred key combinations for each action.'));
	}	
}
