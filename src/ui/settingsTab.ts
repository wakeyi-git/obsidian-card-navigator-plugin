//src/ui/settingsTab.ts

import { App, PluginSettingTab, Setting, Modal, Notice } from 'obsidian';
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
        this.settingsManager = plugin.settingsManager;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.addPresetSection(containerEl);
        this.addContainerSettings(containerEl);
        this.addCardSettings(containerEl);
        this.addKeyboardShortcutsInfo(containerEl);
    }

    private addPresetSection(containerEl: HTMLElement): void {
    
        const presets = this.settingsManager.getPresets();

		// Add dropdown for selecting presets
		new Setting(containerEl)
			.setName(t('Select Preset'))
			.setDesc(t('Select a preset created by the user to load the settings.'))
			.addDropdown(dropdown => {
				Object.keys(presets).forEach(presetName => {
					dropdown.addOption(presetName, presetName);
				});
				dropdown.setValue(this.plugin.settings.lastActivePreset)
					.onChange(async (value) => {
						await this.settingsManager.applyPreset(value);
						this.plugin.settings.lastActivePreset = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh the settings tab
					});
			});

        // Add buttons for saving new preset and updating current preset
        new Setting(containerEl)
            .setName(t('Managing Presets'))
			.setDesc(t('Create, update, or delete presets.'))
            .addButton(button => button
                .setButtonText(t('Create New'))
				.setCta()
                .onClick(() => {
                    new SavePresetModal(this.plugin.app, async (presetName) => {
                        if (presetName) {
                            await this.settingsManager.saveAsNewPreset(presetName);
                            new Notice(t('presetSaved', { presetName }));
                            this.plugin.settings.lastActivePreset = presetName;
                            await this.plugin.saveSettings();
                            this.display(); // Refresh the settings tab
                        }
                    }, this.plugin).open();
                }))
            .addButton(button => button
                .setButtonText(t('Update'))
                .onClick(async () => {
                    const currentPreset = this.plugin.settings.lastActivePreset;
                    if (currentPreset !== 'default') {
                        await this.settingsManager.updateCurrentPreset(currentPreset);
                        new Notice(t('presetUpdated', { presetName: currentPreset }));
                        this.display(); // Refresh the settings tab
                    } else {
                        new Notice(t('defaultPresetCannotBeModified'));
                    }
                }))
            .addButton(button => button
                .setButtonText(t('Delete'))
                .setWarning()
                .onClick(async () => {
                    const currentPreset = this.plugin.settings.lastActivePreset;
                    if (currentPreset !== 'default') {
                        await this.settingsManager.deletePreset(currentPreset);
                        // Apply default preset after deletion
                        await this.settingsManager.applyPreset('default');
                        this.plugin.settings.lastActivePreset = 'default';
                        await this.plugin.saveSettings();
                        new Notice(t('presetDeletedDefaultApplied', { presetName: currentPreset }));
                        this.display(); // Refresh the settings tab
                    } else {
                        new Notice(t('defaultPresetCannotBeDeleted'));
                    }
                }));

        // Add button for reverting to default settings
        new Setting(containerEl)
			.setName(t('Revert to Default Settings'))
			.setDesc(t('This button will revert the settings to their default values.'))
			.addButton(button => button
				.setButtonText(t('Revert'))
				.onClick(async () => {
					await this.settingsManager.revertToDefaultSettings();
					new Notice(t('Settings reverted to default values'));
					this.display(); // Refresh the settings tab
                }));
    }

    private addContainerSettings(containerEl: HTMLElement): void {

		new Setting(containerEl)
		.setName(t('Container Settings'))
		.setHeading();

        this.addFolderSelectionSetting(containerEl);
        this.addSortSetting(containerEl);

		this.addNumberSetting('cardsPerView', t('Cards per view'), t('Number of cards to display at once'), containerEl);

        const toggleSettings = [
            { key: 'alignCardHeight', name: t('Align Card Height'), desc: t('If enabled, all cards will have the same height. If disabled, card height will adjust to content.') },
            { key: 'centerActiveCardOnOpen', name: t('Center Active Card on Open'), desc: t('Automatically center the active card when opening the Card Navigator') },
        ] as const;

        toggleSettings.forEach(setting => {
            this.addToggleSetting(setting.key, setting.name, setting.desc, containerEl);
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
    private addCardSettings(containerEl: HTMLElement): void {

		new Setting(containerEl)
			.setName(t('Card Settings'))
			.setHeading();
	
		const toggleSettings = [
			{ key: 'renderContentAsHtml', name: t('Render Content as HTML'), desc: t('If enabled, card content will be rendered as HTML') },
			{ key: 'dragDropContent', name: t('Drag and Drop Content'), desc: t('When enabled, dragging a card will insert the note content instead of a link.') },
		] as const;

		toggleSettings.forEach(setting => {
			this.addToggleSetting(setting.key, setting.name, setting.desc, containerEl);
		});

		displaySettings.forEach(({ key, name }) => {
			this.addToggleSetting(
				key, 
				t(name), 
				t('toggleDisplayFor', { name: t(name.toLowerCase()) }),
				containerEl
			);
		});

		this.addNumberSetting('contentLength', t('Content Length'), t('Maximum content length displayed on each card'), containerEl);

		fontSizeSettings.forEach(({ key, name }) => {
			this.addNumberSetting(
				key, 
				t(name), 
				t('setFontSizeFor', { name: t(name.toLowerCase()) }),
				containerEl
			);
		});
	}

    // Add keyboard shortcuts information section
    private addKeyboardShortcutsInfo(containerEl: HTMLElement): void {
	
		new Setting(containerEl)
			.setName(t('Keyboard Shortcuts'))
			.setHeading();
	
		const shortcutDesc = containerEl.createEl('p');
		shortcutDesc.setText(t('Card Navigator provides the following features that can be assigned keyboard shortcuts. You can set these up in Obsidian\'s Hotkeys settings:'));
		
		const shortcutList = containerEl.createEl('ul');
		keyboardShortcuts.forEach(({ name }) => {
			const item = shortcutList.createEl('li');
			item.setText(t(name));
		});
		
		const customizeNote = containerEl.createEl('p');
		customizeNote.setText(t('To set up shortcuts for these actions, go to Settings → Hotkeys and search for "Card Navigator". You can then assign your preferred key combinations for each action.'));
	}	
}

class SavePresetModal extends Modal {
    private result = '';
    private existingPresets: string[];

    constructor(
        app: App,
        private onSubmit: (result: string) => void,
        private plugin: CardNavigatorPlugin
    ) {
        super(app);
        this.existingPresets = Object.keys(this.plugin.settingsManager.getPresets());
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: t("Save New Preset") });

        new Setting(contentEl)
            .setName(t("Preset Name"))
            .addText((text) =>
                text.onChange((value) => {
                    this.result = value;
                }));

        const warningEl = contentEl.createEl("p", { cls: "preset-warning", text: "" });
        warningEl.style.color = "var(--text-error)";
        warningEl.style.display = "none";

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText(t("Save"))
                    .setCta()
                    .onClick(() => {
                        if (this.existingPresets.includes(this.result)) {
                            warningEl.textContent = t("A preset with this name already exists. Please use the Update button to modify existing presets.");
                            warningEl.style.display = "block";
                        } else {
                            this.close();
                            this.onSubmit(this.result);
                        }
                    }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
