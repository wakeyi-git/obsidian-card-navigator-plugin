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

// Main class for managing the settings tab in the plugin settings panel
export class SettingTab extends PluginSettingTab {
    private settingsManager: SettingsManager;
    private presetSection: HTMLElement;
    private modifiedSettingsSection: HTMLElement;

    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
        this.settingsManager = plugin.settingsManager;
        this.presetSection = document.createElement('div');
        this.modifiedSettingsSection = document.createElement('div');
    }

    // Update the preset section of the settings tab
    private updatePresetSection(): void {
        const presetSectionEl = this.containerEl.querySelector('.preset-section');
        if (presetSectionEl) {
            presetSectionEl.empty();
            this.addPresetSection(presetSectionEl as HTMLElement);
        }
    }

    // Update the layout section of the settings tab
	private updateLayoutSection(): void {
        const layoutSectionEl = this.containerEl.querySelector('.layout-section');
        if (layoutSectionEl) {
            layoutSectionEl.empty();
            this.addLayoutSettings(layoutSectionEl as HTMLElement);
        }
    }

    // Update the folder selection section of the settings tab
    private updateFolderSelectionSection(): void {
        const folderSectionEl = this.containerEl.querySelector('.folder-selection-section');
        if (folderSectionEl) {
            folderSectionEl.empty();
            this.addFolderSelectionSetting(folderSectionEl as HTMLElement);
        }
    }

    // Display all settings sections
    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const presetSectionEl = containerEl.createDiv('preset-section');
        this.addPresetSection(presetSectionEl);

        this.addGeneralSettings(containerEl);
        
        const layoutSectionEl = containerEl.createDiv('layout-section');
        this.addLayoutSettings(layoutSectionEl);
        
        this.addCardDisplaySettings(containerEl);
        this.addCardStylingSettings(containerEl);
        this.addAdvancedSettings(containerEl);
        this.addKeyboardShortcutsInfo(containerEl);
    }

    // Add preset management section
    private addPresetSection(containerEl: HTMLElement): void {
        const presets = this.settingsManager.getPresets();
    
        // Preset selection dropdown
        new Setting(containerEl)
            .setName(t('Select Preset'))
            .setDesc(t('Select a preset created by the user to load the settings.'))
            .addDropdown(dropdown => {
                Object.keys(presets).forEach(presetName => {
                    dropdown.addOption(presetName, presetName);
                });
                dropdown.setValue(this.plugin.settings.lastActivePreset)
                    .onChange(async (value) => {
                        if (this.plugin.settingsManager.isCurrentSettingModified()) {
                            new ConfirmationModal(this.app, 
                                t('You have unsaved changes. Do you want to update the current preset before switching?'),
                                async (choice) => {
                                    if (choice === 'update') {
                                        await this.settingsManager.updateCurrentPreset(this.plugin.settings.lastActivePreset);
                                    }
                                    if (choice !== 'cancel') {
                                        await this.settingsManager.applyPreset(value);
                                        new Notice(t('Preset applied.', { presetName: value }));
                                        this.display();
                                    }
                                }
                            ).open();
                        } else {
                            await this.settingsManager.applyPreset(value);
                            new Notice(t('Preset applied.', { presetName: value }));
                            this.display();
                        }
                    });
            });

        // Preset management buttons
		const presetManagementSetting = new Setting(containerEl)
            .setName(t('Managing Presets'))
            .setDesc(t('Create or delete presets.'))
            .addButton(button => button
                .setButtonText(t('Create New'))
                .setCta()
                .onClick(() => {
					new SavePresetModal(this.plugin.app, async (presetName) => {
						if (presetName) {
							await this.settingsManager.saveAsNewPreset(presetName);
							new Notice(t('preset Saved', { presetName }));
							this.plugin.settings.lastActivePreset = presetName;
							await this.plugin.saveSettings();
							this.display();
							this.updatePresetSection();
						}
					}, this.plugin).open();
					this.display();
				}));

        // Delete preset button
		presetManagementSetting.addButton(button => button
			.setButtonText(t('Delete'))
			.setWarning()
			.setDisabled(this.plugin.settings.lastActivePreset === 'default')
			.onClick(async () => {
				const currentPreset = this.plugin.settings.lastActivePreset;
				if (currentPreset !== 'default') {
					await this.settingsManager.deletePreset(currentPreset);
					this.plugin.settings.lastActivePreset = 'default';
					await this.plugin.saveSettings();
					new Notice(t('preset Deleted and Default Applied', { presetName: currentPreset }));
					this.updatePresetSection();
				} else {
					new Notice(t('default Preset Cannot Be Deleted'));
				}
				this.display();
			}));

        // Handling modified settings
		const presetModifiedSetting = new Setting(containerEl)
			.setName(t('Handling Modified Settings'))
			.setDesc(t('Current settings are modified from the original preset.'))
			.addButton(button => button
				.setButtonText(t('Update'))
				.setWarning()
				.setDisabled(!this.plugin.settingsManager.isCurrentSettingModified() || this.plugin.settings.lastActivePreset === 'default')
				.onClick(async () => {
				const currentPreset = this.plugin.settings.lastActivePreset;
				if (currentPreset !== 'default') {
					await this.settingsManager.updateCurrentPreset(currentPreset);
					new Notice(t('preset Updated', { presetName: currentPreset }));
					this.updatePresetSection();
				} else {
					new Notice(t('default Preset Cannot Be Modified'));
				}
			this.display();
			}));

        // Revert to original preset button
		presetModifiedSetting.addButton(button => button
			.setButtonText(t('To Original'))
			.setDisabled(!this.plugin.settingsManager.isCurrentSettingModified())
			.onClick(async () => {
			await this.plugin.settingsManager.revertToOriginalPreset();
			new Notice(t('Current preset settings reverted to original values'));
			this.display();
		}));

        // Revert to default settings button
		presetModifiedSetting.addButton(button => button
			.setButtonText(t('To Default'))
			.setDisabled(!this.plugin.settingsManager.isCurrentSettingModified())
			.onClick(async () => {
				await this.settingsManager.revertCurrentPresetToDefault();
				new Notice(t('Current settings reverted to default values'));
				this.display();
			}));
    }

	// Add general settings section
    private addGeneralSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('General Settings'))
            .setHeading();

        const folderSectionEl = containerEl.createDiv('folder-selection-section');
        this.addFolderSelectionSetting(folderSectionEl);
        
        this.addSortSetting(containerEl);
        this.addToggleSettingToSetting(
            new Setting(containerEl)
                .setName(t('Center Active Card on Open'))
                .setDesc(t('Automatically center the active card when opening the Card Navigator')),
            'centerActiveCardOnOpen'
        );
    }

    // Add layout settings section
    private addLayoutSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t('Layout Settings'))
			.setHeading();
	
		const cardWidthThresholdSetting = new Setting(containerEl)
			.setName(t('Card Width Threshold'))
			.setDesc(t('Width threshold for adding/removing columns'));
		this.addNumberSettingToSetting(cardWidthThresholdSetting, 'cardWidthThreshold');
	
		const alignCardHeightSetting = new Setting(containerEl)
			.setName(t('Align Card Height'))
			.setDesc(t('If enabled, all cards will have the same height. If disabled, card height will adjust to content.'));
	
		const cardsPerViewSetting = new Setting(containerEl)
			.setName(t('Cards per view'))
			.setDesc(t('Number of cards to display at once'));
		this.addNumberSettingToSetting(cardsPerViewSetting, 'cardsPerView');
	
		const gridColumnsSetting = new Setting(containerEl)
			.setName(t('Grid Columns'))
			.setDesc(t('Number of columns in grid layout'));
		this.addNumberSettingToSetting(gridColumnsSetting, 'gridColumns');
	
		const masonryColumnsSetting = new Setting(containerEl)
			.setName(t('Masonry Columns'))
			.setDesc(t('Number of columns in masonry layout'));
		this.addNumberSettingToSetting(masonryColumnsSetting, 'masonryColumns');
	
		// Update settings state based on current layout and alignCardHeight
		const updateSettingsState = (layout: CardNavigatorSettings['defaultLayout'], alignCardHeight: boolean) => {
			const updateSettingState = (setting: Setting, isEnabled: boolean) => {
				setting.setDisabled(!isEnabled);
				if (isEnabled) {
					setting.settingEl.removeClass('setting-disabled');
				} else {
					setting.settingEl.addClass('setting-disabled');
				}
			};
	
			updateSettingState(cardWidthThresholdSetting, layout === 'auto');
			updateSettingState(gridColumnsSetting, layout === 'grid');
			updateSettingState(masonryColumnsSetting, layout === 'masonry');
			updateSettingState(alignCardHeightSetting, layout === 'auto' || layout === 'list');
			updateSettingState(cardsPerViewSetting, (layout === 'auto' || layout === 'list') && alignCardHeight);
		};
	
		// Default Layout setting
        const defaultLayoutSetting = new Setting(containerEl)
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
                        updateSettingsState(layout, this.plugin.settings.alignCardHeight);
                        this.updateLayoutSection();
						this.updatePresetSection();
                    });
            });
	
		// Move Default Layout setting to the top
		containerEl.insertBefore(defaultLayoutSetting.settingEl, cardWidthThresholdSetting.settingEl);
	
		// Add toggle to Align Card Height setting
		alignCardHeightSetting.addToggle(toggle => toggle
			.setValue(this.plugin.settings.alignCardHeight)
			.onChange(async (value) => {
				await this.settingsManager.updateBooleanSetting('alignCardHeight', value);
				updateSettingsState(this.plugin.settings.defaultLayout, value);
                this.updatePresetSection();
			})
		);
	
		// Set initial state
		updateSettingsState(this.plugin.settings.defaultLayout, this.plugin.settings.alignCardHeight);
	}

	// Add card display settings section
	private addCardDisplaySettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t('Card Display Settings'))
			.setHeading();
	
		// Card display settings
		displaySettings.forEach(({ key, name, description }) => {
			this.addToggleSettingToSetting(
				new Setting(containerEl)
					.setName(t(name))
					.setDesc(t(description)),
				key
			);
		});
	
    // Body length settings
    const bodyLengthLimitSetting = new Setting(containerEl)
        .setName(t('Body Length Limit'))
        .setDesc(t('Toggle between limited and unlimited body length'));
    
    const bodyLengthSetting = new Setting(containerEl)
        .setName(t('Body Length'))
        .setDesc(t('Set the maximum body length displayed on each card when body length is limited.'));
    
    this.addNumberSettingToSetting(bodyLengthSetting, 'bodyLength');

    // Update Body Length setting state
    const updateBodyLengthState = (isLimited: boolean) => {
        bodyLengthSetting.setDisabled(!isLimited);
        if (isLimited) {
            bodyLengthSetting.settingEl.removeClass('setting-disabled');
        } else {
            bodyLengthSetting.settingEl.addClass('setting-disabled');
        }
    };

    // Set initial state of Body Length setting
    updateBodyLengthState(this.plugin.settings.isBodyLengthLimited);

    // Add toggle to Body Length Limit setting
    bodyLengthLimitSetting.addToggle(toggle => toggle
        .setValue(this.plugin.settings.isBodyLengthLimited)
        .onChange(async (value) => {
            await this.settingsManager.updateBooleanSetting('isBodyLengthLimited', value);
            updateBodyLengthState(value);
            this.updatePresetSection();
        })
    );
}

	// Add card styling settings section
	private addCardStylingSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t('Card Styling Settings'))
			.setHeading();
	
		fontSizeSettings.forEach(({ key, name, description }) => {
			if (key === 'fileNameFontSize' || key === 'firstHeaderFontSize' || key === 'bodyFontSize') {
				this.addNumberSettingToSetting(
					new Setting(containerEl)
						.setName(t(name))
						.setDesc(t(description)),
					key
				);
			}
		});
	}

	// Add advanced settings section
	private addAdvancedSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t('Advanced Settings'))
			.setHeading();

		this.addToggleSettingToSetting(
			new Setting(containerEl)
				.setName(t('Render Content as HTML'))
				.setDesc(t('If enabled, card content will be rendered as HTML')),
			'renderContentAsHtml'
		);

		this.addToggleSettingToSetting(
			new Setting(containerEl)
				.setName(t('Drag and Drop Content'))
				.setDesc(t('When enabled, dragging a card will insert the note content instead of a link.')),
			'dragDropContent'
		);
	}

	// Add keyboard shortcuts information section
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

	// Add folder selection settings
	private addFolderSelectionSetting(parentEl: HTMLElement): void {
		const folderSettingEl = new Setting(parentEl)
			.setName(t('Folder Selection'))
			.setDesc(t('Choose whether to use the active file\'s folder or a selected folder'))
			.addDropdown(dropdown => dropdown
				.addOption('active', t('Active Folder'))
				.addOption('selected', t('Selected Folder'))
				.setValue(this.plugin.settings.useSelectedFolder ? 'selected' : 'active')
				.onChange(async (value) => {
					await this.settingsManager.updateBooleanSetting('useSelectedFolder', value === 'selected');
					this.updateFolderSelectionSection();
					this.updatePresetSection();
				})).settingEl;

		folderSettingEl.addClass('setting-folder-selection');

		if (this.plugin.settings.useSelectedFolder) {
			this.addFolderSetting(parentEl);
		}
	}

	// Add folder selection button when 'Selected Folder' is chosen
	private addFolderSetting(parentEl: HTMLElement): void {
		new Setting(parentEl)
			.setName(t('Select Folder'))
			.setDesc(t('Choose a folder for Card Navigator'))
			.setDisabled(!this.plugin.settings.useSelectedFolder)
			.addButton(button => button
				.setButtonText(this.plugin.settings.selectedFolder || t('Choose folder'))
				.onClick(() => {
					new FolderSuggestModal(this.plugin, async (folder) => {
						await this.settingsManager.updateSelectedFolder(folder);
						this.updateFolderSelectionSection();
						this.updatePresetSection();
					}).open();
				}));
	}

	// Add sorting settings
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

	// Add toggle setting to a Setting object
	private addToggleSettingToSetting(setting: Setting, key: keyof CardNavigatorSettings): void {
		setting.addToggle(toggle => toggle
			.setValue(this.plugin.settings[key] as boolean)
			.onChange(async (value) => {
				await this.settingsManager.updateBooleanSetting(key, value);
				this.updatePresetSection();
			})
		);
	}

	// Add number setting to a Setting object
	private addNumberSettingToSetting(setting: Setting, key: NumberSettingKey): void {
		const config = this.settingsManager.getNumberSettingConfig(key);
		setting.addSlider(slider => slider
			.setLimits(config.min, config.max, config.step)
			.setValue(this.plugin.settings[key])
			.setDynamicTooltip()
			.onChange(async (value) => {
				// Check if the setting should be updated based on other settings
				if ((key === 'bodyLength' && !this.plugin.settings.isBodyLengthLimited) ||
					(key === 'cardsPerView' && !this.plugin.settings.alignCardHeight)) {
					return;
				}
				
				await this.settingsManager.updateNumberSetting(key, value);
				
				// Update layout if necessary
				if (key === 'gridColumns' || key === 'masonryColumns') {
					this.plugin.updateCardNavigatorLayout(this.plugin.settings.defaultLayout);
				}
				
				this.plugin.triggerRefresh();
				this.updatePresetSection();
			})
		);
	
		// Disable bodyLength setting if body length is not limited
		if (key === 'bodyLength') {
			setting.setDisabled(!this.plugin.settings.isBodyLengthLimited);
		}
	}
}

// Modal for saving a new preset
class SavePresetModal extends Modal {
	private result = '';
	private existingPresets: string[];
	private warningEl: HTMLParagraphElement;
	private inputEl: HTMLInputElement;

	constructor(
		app: App,
		private onSubmit: (result: string) => void,
		private plugin: CardNavigatorPlugin
	) {
		super(app);
		this.existingPresets = Object.keys(this.plugin.settingsManager.getPresets());
		// Initialize with dummy elements
		this.warningEl = document.createElement('p');
		this.inputEl = document.createElement('input');
	}

	// Open the modal
	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: t("Save New Preset") });

		new Setting(contentEl)
			.setName(t("Preset Name"))
			.addText((text) => {
				this.inputEl = text.inputEl;
				text.onChange((value) => {
					this.result = value;
				});
				this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this.savePreset();
					}
				});
			});

		this.warningEl = contentEl.createEl("p", { cls: "preset-warning", text: "" });
		this.warningEl.style.color = "var(--text-error)";
		this.warningEl.style.display = "none";

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText(t("Save"))
					.setCta()
					.onClick(() => {
						this.savePreset();
					}));
	}

	// Save the preset
	private savePreset() {
		if (this.result.trim() === '') {
			this.warningEl.textContent = t("Preset name cannot be empty.");
			this.warningEl.style.display = "block";
		} else if (this.existingPresets.includes(this.result)) {
			this.warningEl.textContent = t("A preset with this name already exists. Please use the Update button to modify existing presets.");
			this.warningEl.style.display = "block";
		} else {
			this.close();
			this.onSubmit(this.result);
		}
	}

	// Close the modal
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Modal for confirming actions when switching presets
class ConfirmationModal extends Modal {
	constructor(app: App, private message: string, private onChoose: (choice: 'update' | 'switch' | 'cancel') => void) {
		super(app);
	}

	// Open the modal
	onOpen() {
		const {contentEl} = this;
		contentEl.setText(this.message);
		new Setting(contentEl)
			.addButton(btn => btn.setButtonText(t('Update and Switch')).onClick(() => {
				this.close();
				this.onChoose('update');
			}))
			.addButton(btn => btn.setButtonText(t('Switch without Saving')).onClick(() => {
				this.close();
				this.onChoose('switch');
			}))
			.addButton(btn => btn.setButtonText(t('Cancel')).onClick(() => {
				this.close();
				this.onChoose('cancel');
			}));
	}

	// Close the modal
	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
