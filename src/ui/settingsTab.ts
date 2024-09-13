import { App, PluginSettingTab, Setting, Modal, Notice, DropdownComponent } from 'obsidian';
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

// Class to manage the settings tab in the plugin settings panel
export class SettingTab extends PluginSettingTab {
    private settingsManager: SettingsManager;

    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
        this.settingsManager = plugin.settingsManager;
    }

    // Main method to render the settings UI
    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Add different sections to the settings tab
        this.addPresetSection(containerEl);
        this.addLayoutSettings(containerEl);
        this.addContentSettings(containerEl);
        this.addKeyboardShortcutsInfo(containerEl);
    }

    // Section for managing presets (create, update, delete)
    private addPresetSection(containerEl: HTMLElement): void {
        const presets = this.settingsManager.getPresets();

        // Dropdown to select existing presets
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

        // Buttons to manage presets: Create, Update, Delete
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

        // Button to revert settings to default values
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

    // Section for layout-related settings
	private addLayoutSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t('Layout Settings'))
			.setHeading();
	
		new Setting(containerEl)
			.setName(t('Default Layout'))
			.setDesc(t('Choose the default layout for cards'))
			.addDropdown((dropdown: DropdownComponent) => {
				dropdown
					.addOption('auto', t('Auto'))
					.addOption('list', t('List'))
					.addOption('grid', t('Grid'))
					.addOption('masonry', t('Masonry'))
					.setValue(this.plugin.settings.defaultLayout)
					.onChange(async (value: string) => {
						const layout = value as CardNavigatorSettings['defaultLayout'];
						await this.plugin.settingsManager.updateSetting('defaultLayout', layout);
						this.plugin.updateCardNavigatorLayout(layout);
						this.display(); // Refresh the settings tab to show/hide relevant options
					});
			});
	
		if (this.plugin.settings.defaultLayout === 'auto' || this.plugin.settings.defaultLayout === 'list') {
			this.addNumberSetting('minCardWidth', t('Minimum Card Width'), t('Minimum width of a card in pixels'), containerEl);
			this.addNumberSetting('maxCardWidth', t('Maximum Card Width'), t('Maximum width of a card in pixels'), containerEl);
		}
	
		if (this.plugin.settings.defaultLayout === 'auto') {
			this.addNumberSetting('listLayoutThreshold', t('List Layout Threshold'), t('Container width below which list layout is used'), containerEl);
			this.addNumberSetting('gridLayoutThreshold', t('Grid Layout Threshold'), t('Container width below which grid layout is used'), containerEl);
		}
	
		if (this.plugin.settings.defaultLayout === 'auto' || this.plugin.settings.defaultLayout === 'grid') {
			this.addNumberSetting('gridColumns', t('Grid Columns'), t('Number of columns in grid layout'), containerEl);
		}
	
		if (this.plugin.settings.defaultLayout === 'auto' || this.plugin.settings.defaultLayout === 'masonry') {
			this.addNumberSetting('masonryColumns', t('Masonry Columns'), t('Number of columns in masonry layout'), containerEl);
		}
	
		this.addNumberSetting('cardsPerView', t('Cards per view'), t('Number of cards to display at once'), containerEl);
	
		if (this.plugin.settings.defaultLayout !== 'masonry') {
			this.addToggleSetting('alignCardHeight', t('Align Card Height'), t('If enabled, all cards will have the same height. If disabled, card height will adjust to content.'), containerEl);
		}
	
		this.addToggleSetting('centerActiveCardOnOpen', t('Center Active Card on Open'), t('Automatically center the active card when opening the Card Navigator'), containerEl);
	}

		// Section for card display settings
		private addContentSettings(containerEl: HTMLElement): void {
			new Setting(containerEl)
				.setName(t('Content Settings'))
				.setHeading();
	
			this.addFolderSelectionSetting(containerEl);
			this.addSortSetting(containerEl);
	
			// Card display settings
			displaySettings.forEach(({ key, name }) => {
				this.addToggleSetting(
					key, 
					t(name), 
					t('toggleDisplayFor', { name: t(name.toLowerCase()) }),
					containerEl
				);
			});
	
			// Font size settings
			fontSizeSettings.forEach(({ key, name }) => {
				this.addNumberSetting(
					key, 
					t(name), 
					t('setFontSizeFor', { name: t(name.toLowerCase()) }),
					containerEl
				);
			});
	
			// Content length settings
			this.addToggleSetting(
				'isContentLengthUnlimited',
				t('Content Length Limit'),
				t('Toggle between limited and unlimited content length'),
				containerEl
			);
	
			this.addNumberSetting(
				'contentLength',
				t('Content Length Limit'),
				t('Set the maximum content length displayed on each card when content length is limited.'),
				containerEl
			);
	
			// Additional content settings
			this.addToggleSetting('renderContentAsHtml', t('Render Content as HTML'), t('If enabled, card content will be rendered as HTML'), containerEl);
			this.addToggleSetting('dragDropContent', t('Drag and Drop Content'), t('When enabled, dragging a card will insert the note content instead of a link.'), containerEl);
		}
	
		// Section for displaying keyboard shortcuts information
		private addKeyboardShortcutsInfo(containerEl: HTMLElement): void {
			new Setting(containerEl)
				.setName(t('Keyboard Shortcuts'))
				.setHeading();
	
			const shortcutDesc = containerEl.createEl('p');
			shortcutDesc.setText(t('Card Navigator provides the following features that can be assigned keyboard shortcuts. You can set these up in Obsidian\'s Hotkeys settings:'));
	
			const shortcutList = containerEl.createEl('ul');
			keyboardShortcuts.forEach(({ name, description }) => {
				const item = shortcutList.createEl('li');
				item.createEl('span', { text: t(name), cls: 'keyboard-shortcut-name' });
				item.createEl('span', { text: ` - ${t(description)}`, cls: 'keyboard-shortcut-description' });
			});
	
			const customizeNote = containerEl.createEl('p');
			customizeNote.setText(t('To set up shortcuts for these actions, go to Settings → Hotkeys and search for "Card Navigator". You can then assign your preferred key combinations for each action.'));
	
			const additionalNote = containerEl.createEl('p');
			additionalNote.setText(t('Note: Some shortcuts like arrow keys for navigation and Enter for opening cards are built-in and cannot be customized.'));
		}

    // Add a number setting with a slider
    private addNumberSetting(key: NumberSettingKey, name: string, desc: string, parentEl: HTMLElement): void {
        const setting = new Setting(parentEl)
            .setName(name)
            .setDesc(desc);

        const config = this.settingsManager.getNumberSettingConfig(key);

        // Disable the slider if content length is unlimited
        if (key === 'contentLength') {
            setting.setClass('content-length-slider')
                .setDisabled(this.plugin.settings.isContentLengthUnlimited);
        }

        // Add slider control
        setting.addSlider(slider => slider
            .setLimits(config.min, config.max, config.step)
            .setValue(this.plugin.settings[key])
            .setDynamicTooltip()
            .onChange(async (value) => {
                if (key === 'contentLength' && this.plugin.settings.isContentLengthUnlimited) {
                    return;
                }
                await this.settingsManager.updateNumberSetting(key, value);
                this.plugin.triggerRefresh();
            })
        );

        setting.settingEl.addClass('setting-number');
    }

    // Section for folder selection settings
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

        // Show folder selection if 'selected folder' is enabled
        if (this.plugin.settings.useSelectedFolder) {
            this.addFolderSetting(parentEl);
        }
    }

    // Add folder selection button when 'Selected Folder' is chosen
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

    // Section for sorting settings
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

    // Add toggle settings (boolean options)
    private addToggleSetting(key: keyof CardNavigatorSettings, name: string, desc: string, parentEl: HTMLElement): void {
        const settingEl = new Setting(parentEl)
            .setName(name)
            .setDesc(desc)
            .addToggle(toggle => toggle
                .setValue(key === 'isContentLengthUnlimited' ? !this.plugin.settings[key] : this.plugin.settings[key] as boolean)
                .onChange(async (value) => {
                    if (key === 'isContentLengthUnlimited') {
                        value = !value;  // Invert the value for this specific setting
                    }
                    await this.settingsManager.updateBooleanSetting(key, value);
                    if (key === 'isContentLengthUnlimited') {
                        const contentLengthSlider = parentEl.querySelector('.content-length-slider');
                        if (contentLengthSlider) {
                            (contentLengthSlider as HTMLElement).style.opacity = value ? '0.5' : '1';
                            const sliderComponent = (contentLengthSlider as HTMLElement).querySelector('.slider');
                            if (sliderComponent) {
                                (sliderComponent as HTMLInputElement).disabled = value;
                            }
                        }
                    }
                    this.plugin.triggerRefresh();
                })
            ).settingEl;

        settingEl.addClass('setting-toggle');
    }
}

// Modal to handle saving a new preset
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

    // Display the modal when it's opened
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

        // Save button with validation for duplicate preset names
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

    // Clear the modal content when it's closed
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
