// settingsTab.ts
import { App, PluginSettingTab, Setting, Modal, Notice, DropdownComponent, FuzzySuggestModal } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { FolderSuggestModal } from './toolbar/toolbarActions';
import { 
    SortCriterion, 
    CardNavigatorSettings, 
    NumberSettingKey,
    contentSettings,
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
    private presetSettingsSection: HTMLElement;
    private modifiedSettingsSection: HTMLElement;

    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
        this.settingsManager = plugin.settingsManager;
        this.presetSettingsSection = document.createElement('div');
        this.modifiedSettingsSection = document.createElement('div');
    }

    // Update the preset section of the settings tab
    private updatePresetSettings(): void {
        const presetSectionEl = this.containerEl.querySelector('.preset-section');
        if (presetSectionEl) {
            presetSectionEl.empty();
            this.addPresetSettings(presetSectionEl as HTMLElement);
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
        this.addPresetSettings(presetSectionEl);

        this.addContainerSettings(containerEl);
        
        const layoutSectionEl = containerEl.createDiv('layout-section');
        this.addLayoutSettings(layoutSectionEl);
        
        this.addCardContentSettings(containerEl);
        this.addCardStylingSettings(containerEl);
        this.addKeyboardShortcutsInfo(containerEl);
    }

    // Add preset management section
    private addPresetSettings(containerEl: HTMLElement): void {
        const presets = this.settingsManager.getPresets();
    
        // Preset selection dropdown
		new Setting(containerEl)
        .setName(t('Select preset'))
        .setDesc(t('Select a preset created by the user to load the settings.'))
        .addDropdown(dropdown => {
            Object.keys(presets).forEach(presetName => {
                dropdown.addOption(presetName, presetName);
            });
            dropdown.setValue(this.settingsManager.getCurrentActivePreset())
                .onChange(async (newValue) => {
                const currentPreset = this.plugin.settings.lastActivePreset;
                if (this.plugin.settingsManager.isCurrentSettingModified()) {
                    new ConfirmationModal(this.app, 
                        t('You have unsaved changes. Do you want to update the current preset before switching?'),
                        async (choice) => {
                            try {
                                if (choice === 'update') {
                                    await this.settingsManager.updateCurrentPreset(currentPreset);
                                    await this.settingsManager.applyPreset(newValue);
                                    new Notice(t('Preset updated and applied.', { presetName: newValue }));
                                    this.updatePresetSettings(); // 변경된 부분만 업데이트
                                } else if (choice === 'switch') {
                                    await this.settingsManager.applyPreset(newValue);
                                    new Notice(t('Preset applied without saving changes.', { presetName: newValue }));
                                    this.updatePresetSettings(); // 변경된 부분만 업데이트
                                } else {
                                    dropdown.setValue(currentPreset);
                                }
                            } catch (error) {
                                console.error("Failed to apply preset:", error);
                                new Notice(t('Failed to apply preset.'));
                            }
                        }
                    ).open();
                } else {
                    try {
                        await this.settingsManager.applyPreset(newValue);
                        new Notice(t('Preset applied.', { presetName: newValue }));
                        this.updatePresetSettings(); // 변경된 부분만 업데이트
                    } catch (error) {
                        console.error("Failed to apply preset:", error);
                        new Notice(t('Failed to apply preset.'));
                    }
                }
            });
        });

        // Preset management buttons
		const presetManagementSetting = new Setting(containerEl)
        .setName(t('Managing presets'))
        .setDesc(t('Create or delete presets.'))
        .addButton(button => button
            .setButtonText(t('Create new'))
            .setCta()
            .onClick(() => {
                new SavePresetModal(this.plugin.app, async (presetName) => {
                    if (presetName) {
                        try {
                            await this.settingsManager.saveAsNewPreset(presetName);
                            new Notice(t('Preset saved', { presetName }));
                            this.plugin.settings.lastActivePreset = presetName;
                            await this.plugin.saveSettings();
                            this.updatePresetSettings(); // 변경된 부분만 업데이트
                        } catch (error) {
                            console.error("Failed to save preset:", error);
                            new Notice(t('Failed to save preset.'));
                        }
                    }
                }, this.plugin).open();
            }));

        // Delete preset button
		presetManagementSetting.addButton(button => button
			.setButtonText(t('Delete'))
			.setWarning()
			.setDisabled(this.plugin.settings.lastActivePreset === 'default')
			.onClick(async () => {
				const currentPreset = this.plugin.settings.lastActivePreset;
				if (currentPreset !== 'default') {
					try {
						await this.settingsManager.deletePreset(currentPreset);
						this.plugin.settings.lastActivePreset = 'default';
						await this.plugin.saveSettings();
						new Notice(t('Preset deleted and default applied.', { presetName: currentPreset }));
						this.updatePresetSettings(); // 변경된 부분만 업데이트
					} catch (error) {
						console.error("Failed to delete preset:", error);
						new Notice(t('Failed to delete preset.'));
					}
				} else {
					new Notice(t('default preset cannot be deleted'));
                }
            }));

        // Handling modified settings
		const presetModifiedSetting = new Setting(containerEl)
        .setName(t('Handling modified settings'))
        .setDesc(t('Current settings are modified from the original preset.'))
        .addButton(button => button
            .setButtonText(t('Update'))
            .setCta()
            .setDisabled(!this.plugin.settingsManager.isCurrentSettingModified() || this.plugin.settings.lastActivePreset === 'default')
            .onClick(async () => {
            const currentPreset = this.plugin.settings.lastActivePreset;
            if (currentPreset !== 'default') {
                try {
                    await this.settingsManager.updateCurrentPreset(currentPreset);
                    new Notice(t('Preset updated', { presetName: currentPreset }));
                    this.updatePresetSettings(); // 변경된 부분만 업데이트
                } catch (error) {
                    console.error("Failed to update preset:", error);
                    new Notice(t('Failed to update preset.'));
                }
            } else {
                new Notice(t('default preset cannot be modified'));
            }
        }));

        // Revert to original preset button
		presetModifiedSetting.addButton(button => button
			.setButtonText(t('To original'))
			.setDisabled(!this.plugin.settingsManager.isCurrentSettingModified())
			.onClick(async () => {
				try {
					await this.plugin.settingsManager.revertToOriginalPreset();
					this.updatePresetSettings(); // 변경된 부분만 업데이트
				} catch (error) {
					console.error("Failed to revert to original preset:", error);
					new Notice(t('Failed to revert to original preset.'));
				}
			}));

			new Setting(containerEl)
			.setName(t('Auto apply folder\'s presets'))
			.setDesc(t('Folder\'s presets are automatically applied when you change folders. If disabled, the preset currently being applied will be retained even if the active note\'s folder changes.'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoApplyPresets)
				.onChange(async (value) => {
					try {
						await this.settingsManager.toggleAutoApplyPresets(value);
					} catch (error) {
						console.error("Failed to toggle auto apply presets:", error);
						new Notice(t('Failed to toggle auto apply presets.'));
					}
				})
			);
	
			new Setting(containerEl)
			.setName(t('Add folder\'s presets'))
			.setDesc(t('Select a folder to add a folder preset.'))
			.addButton(button => button
				.setButtonText(t('Add'))
				.onClick(() => {
					new FolderSuggestModal(this.plugin, async (folder) => {
						const presetNames = Object.keys(this.plugin.settings.presets);
						if (presetNames.length > 0) {
							new PresetSuggestModal(this.plugin, presetNames, async (presetName) => {
								try {
									await this.settingsManager.addPresetToFolder(folder.path, presetName);
									this.plugin.settings.lastActivePreset = presetName;
									await this.plugin.saveSettings();
									this.updatePresetSettings(); // 변경된 부분만 업데이트
									new Notice(t('Preset added to folder. You can set it as default in the folder settings.'));
								} catch (error) {
									console.error("Failed to add preset to folder:", error);
									new Notice(t('Failed to add preset to folder.'));
								}
							}).open();
						} else {
							new Notice(t('No presets available. Please create a preset first.'));
						}
					}).open();
				})
			);

		const folderPresets = this.settingsManager.getFolderPresets();
		for (const [folderPath, presets] of Object.entries(folderPresets)) {
			const folderSetting = new Setting(containerEl)
				.setName(t('folder_label', { folderPath }))
				.setDesc(t('presets_label', { presets: presets.join(', ') }));
	
			folderSetting.addDropdown(dropdown => {
				presets.forEach(preset => dropdown.addOption(preset, preset));
				const defaultPreset = this.settingsManager.getDefaultPresetForFolder(folderPath);
				if (defaultPreset) dropdown.setValue(defaultPreset);
				dropdown.onChange(async (value) => {
					try {
						await this.settingsManager.setDefaultPresetForFolder(folderPath, value);
					} catch (error) {
						console.error("Failed to set default preset for folder:", error);
						new Notice(t('Failed to set default preset for folder.'));
					}
				});
			});
	
			folderSetting.addButton(button => button
				.setIcon('trash')
				.setTooltip(t('Remove preset from folder'))
				.onClick(async () => {
					const currentPreset = this.settingsManager.getDefaultPresetForFolder(folderPath);
					if (currentPreset) {
						try {
							await this.settingsManager.removePresetFromFolder(folderPath, currentPreset);
							this.updatePresetSettings(); // 변경된 부분만 업데이트
						} catch (error) {
							console.error("Failed to remove preset from folder:", error);
							new Notice(t('Failed to remove preset from folder.'));
						}
					}
				})
			);
		}
	}

    // Add general settings section
    private addContainerSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('Container settings'))
            .setHeading();

		const folderSectionEl = containerEl.createDiv('folder-selection-section');
        this.addFolderSelectionSetting(folderSectionEl);
        
        this.addSortSetting(containerEl);
        this.addToggleSettingToSetting(
            new Setting(containerEl)
                .setName(t('Center active card on open'))
                .setDesc(t('Automatically center the active card when opening the Card Navigator')),
            'centerActiveCardOnOpen'
        );
    }

    // Add layout settings section
    private addLayoutSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('Layout settings'))
            .setHeading();
    
        const cardWidthThresholdSetting = new Setting(containerEl)
            .setName(t('Card width threshold'))
            .setDesc(t('Width threshold for adding/removing columns'));
        this.addNumberSettingToSetting(cardWidthThresholdSetting, 'cardWidthThreshold');
    
        const alignCardHeightSetting = new Setting(containerEl)
            .setName(t('Align card height'))
            .setDesc(t('If enabled, all cards will have the same height. If disabled, card height will adjust to content.'));
    
        const cardsPerViewSetting = new Setting(containerEl)
            .setName(t('Cards per view'))
            .setDesc(t('Number of cards to display at once'));
        this.addNumberSettingToSetting(cardsPerViewSetting, 'cardsPerView');
    
        const gridColumnsSetting = new Setting(containerEl)
            .setName(t('Grid columns'))
            .setDesc(t('Number of columns in grid layout'));
        this.addNumberSettingToSetting(gridColumnsSetting, 'gridColumns');
    
        const gridCardHeightSetting = new Setting(containerEl)
            .setName(t('Grid card height'))
            .setDesc(t('Card height in grid layout'));
        this.addNumberSettingToSetting(gridCardHeightSetting, 'gridCardHeight');

        const masonryColumnsSetting = new Setting(containerEl)
            .setName(t('Masonry columns'))
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
            updateSettingState(gridCardHeightSetting, layout === 'auto' || layout === 'grid');
            updateSettingState(masonryColumnsSetting, layout === 'masonry');
            updateSettingState(alignCardHeightSetting, layout === 'auto' || layout === 'list');
            updateSettingState(cardsPerViewSetting, (layout === 'auto' || layout === 'list') && alignCardHeight);
        };
    
        // Default Layout setting
        const defaultLayoutSetting = new Setting(containerEl)
            .setName(t('Default layout'))
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
                        this.updatePresetSettings();
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
                this.updatePresetSettings();
            })
        );
    
        // Set initial state
        updateSettingsState(this.plugin.settings.defaultLayout, this.plugin.settings.alignCardHeight);
    }

    // Add card display settings section
    private addCardContentSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('Card content settings'))
            .setHeading();

        this.addToggleSettingToSetting(
            new Setting(containerEl)
                .setName(t('Render content as HTML'))
                .setDesc(t('If enabled, card content will be rendered as HTML.')),
            'renderContentAsHtml'
        );
    
        this.addToggleSettingToSetting(
            new Setting(containerEl)
                .setName(t('Drag and drop content'))
                .setDesc(t('When enabled, dragging a card will insert the note content instead of a link.')),
            'dragDropContent'
        );

        // Card content settings
        contentSettings.forEach(({ key, name, description }) => {
            this.addToggleSettingToSetting(
                new Setting(containerEl)
                    .setName(t(name))
                    .setDesc(t(description)),
                key
            );
        });
    
        // Body length settings
        const bodyLengthLimitSetting = new Setting(containerEl)
            .setName(t('Body length limit'))
            .setDesc(t('Toggle between limited and unlimited body length.'));
        
        const bodyLengthSetting = new Setting(containerEl)
            .setName(t('Body length'))
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
        updateBodyLengthState(this.plugin.settings.bodyLengthLimit);

        // Add toggle to Body Length Limit setting
        bodyLengthLimitSetting.addToggle(toggle => toggle
            .setValue(this.plugin.settings.bodyLengthLimit)
            .onChange(async (value) => {
                await this.settingsManager.updateBooleanSetting('bodyLengthLimit', value);
                updateBodyLengthState(value);
                this.updatePresetSettings();
            })
        );
    }

    // Add card styling settings section
    private addCardStylingSettings(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('Card styling settings'))
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

    // Add keyboard shortcuts information section
    private addKeyboardShortcutsInfo(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('Keyboard shortcuts'))
            .setHeading();

        const shortcutDesc = containerEl.createEl('p', { cls: 'keyboard-shortcuts-description' });
        shortcutDesc.setText(t('Card Navigator provides the following features that can be assigned keyboard shortcuts. You can set these up in Obsidian\'s Hotkeys settings:'));

        const tableContainer = containerEl.createEl('div', { cls: 'keyboard-shortcuts-table-container' });
        const table = tableContainer.createEl('table', { cls: 'keyboard-shortcuts-table' });
        
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: t('Command') });
        headerRow.createEl('th', { text: t('Description') });

        const tbody = table.createEl('tbody');
        keyboardShortcuts.forEach(({ name, description }) => {
            const row = tbody.createEl('tr');
            row.createEl('td', { text: t(name), cls: 'keyboard-shortcut-name' });
            row.createEl('td', { text: t(description), cls: 'keyboard-shortcut-description' });
        });

        const customizeNote = containerEl.createEl('p', { cls: 'keyboard-shortcuts-note' });
        customizeNote.setText(t('To set up shortcuts for these actions, go to Settings → Hotkeys and search for "Card Navigator". You can then assign your preferred key combinations for each action.'));

        const additionalNote = containerEl.createEl('p', { cls: 'keyboard-shortcuts-note' });
        additionalNote.setText(t('Note: Some shortcuts like arrow keys for navigation and Enter for opening cards are built-in and cannot be customized.'));
    }


    // Add folder selection settings
    private addFolderSelectionSetting(containerEl: HTMLElement): void {
		const folderSettingEl = new Setting(containerEl)
            .setName(t('Source folder'))
            .setDesc(t('Choose whether to use the active file\'s folder or the selected folder in the card navigator.'))
            .addDropdown(dropdown => dropdown
                .addOption('active', t('Active folder'))
                .addOption('selected', t('Selected folder'))
                .setValue(this.plugin.settings.useSelectedFolder ? 'selected' : 'active')
                .onChange(async (value) => {
                    await this.settingsManager.updateBooleanSetting('useSelectedFolder', value === 'selected');
                    this.updateFolderSelectionSection();
                    this.updatePresetSettings();
                })).settingEl;

		folderSettingEl.addClass('setting-folder-selection');

        if (this.plugin.settings.useSelectedFolder) {
            this.addFolderSetting(containerEl);
        }
    }

    // Add folder selection button when 'Selected Folder' is chosen
    private addFolderSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('Select folder'))
            .setDesc(t('Choose a folder for Card Navigator'))
            .setDisabled(!this.plugin.settings.useSelectedFolder)
            .addButton(button => button
                .setButtonText(this.plugin.settings.selectedFolder || t('Choose folder'))
                .onClick(() => {
                    new FolderSuggestModal(this.plugin, async (folder) => {
                        await this.settingsManager.updateSelectedFolder(folder);
                        this.updateFolderSelectionSection();
                        this.updatePresetSettings();
                    }).open();
                }));
    }

    // Add sorting settings
    private addSortSetting(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName(t('Default sort method'))
            .setDesc(t('Choose the default sorting method for cards.'))
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
    }

    // Add toggle setting to a Setting object
    private addToggleSettingToSetting(setting: Setting, key: keyof CardNavigatorSettings): void {
        setting.addToggle(toggle => toggle
            .setValue(this.plugin.settings[key] as boolean)
            .onChange(async (value) => {
                await this.settingsManager.updateBooleanSetting(key, value);
                this.updatePresetSettings();
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
                if ((key === 'bodyLength' && !this.plugin.settings.bodyLengthLimit) ||
                    (key === 'cardsPerView' && !this.plugin.settings.alignCardHeight)) {
                    return;
                }
                
                await this.settingsManager.updateNumberSetting(key, value);
                
                // Update layout if necessary
                if (key === 'gridColumns' || key === 'masonryColumns') {
                    this.plugin.updateCardNavigatorLayout(this.plugin.settings.defaultLayout);
                }
                
                this.plugin.triggerRefresh();
                this.updatePresetSettings();
            })
        );
    
        // Disable bodyLength setting if body length is not limited
        if (key === 'bodyLength') {
            setting.setDisabled(!this.plugin.settings.bodyLengthLimit);
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
        this.warningEl = this.containerEl.win.document.createElement('p');
        this.inputEl = this.containerEl.win.document.createElement('input');
    }

    // Open the modal
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        // Replaced <h2> with a setting heading
        new Setting(contentEl)
            .setName(t("Save new preset"))
            .setHeading();

        new Setting(contentEl)
            .setName(t("Preset name"))
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
    private result: 'update' | 'switch' | 'cancel' = 'cancel';

    constructor(app: App, private message: string, private onChoose: (choice: 'update' | 'switch' | 'cancel') => void) {
        super(app);
    }

    // Open the modal
    onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        // Replaced text with a setting heading
        new Setting(contentEl)
            .setName(this.message)
            .setHeading();

        new Setting(contentEl)
            .addButton(btn => btn.setButtonText(t('Update and switch')).onClick(() => {
                this.result = 'update';
                this.close();
            }))
            .addButton(btn => btn.setButtonText(t('Switch without saving')).onClick(() => {
                this.result = 'switch';
                this.close();
            }))
            .addButton(btn => btn.setButtonText(t('Cancel')).onClick(() => {
                this.result = 'cancel';
                this.close();
            }));
    }

    // Close the modal
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
        this.onChoose(this.result);
    }
}

class PresetSuggestModal extends FuzzySuggestModal<string> {
    constructor(
        private plugin: CardNavigatorPlugin,
        private presetNames: string[],
        private onChoose: (result: string) => void
    ) {
        super(plugin.app);
    }

    getItems(): string[] {
        return this.presetNames;
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(item: string): void {
        this.onChoose(item);
    }
}
