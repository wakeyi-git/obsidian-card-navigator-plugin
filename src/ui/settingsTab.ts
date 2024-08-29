// src/ui/settingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { FolderSuggestModal } from './toolbar/toolbarActions';
import { SortCriterion } from '../common/types';

export class SettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Cards per view')
            .setDesc('Number of cards to display at once')
            .addSlider(slider => slider
                .setLimits(3, 9, 1)
                .setValue(this.plugin.settings.cardsPerView)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.cardsPerView = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews();
                }));

		new Setting(containerEl)
		.setName('Folder Selection')
		.setDesc('Choose whether to use the active file\'s folder or a selected folder')
		.addDropdown(dropdown => dropdown
			.addOption('active', 'Active File\'s Folder')
			.addOption('selected', 'Selected Folder')
			.setValue(this.plugin.settings.useSelectedFolder ? 'selected' : 'active')
			.onChange(async (value) => {
				this.plugin.settings.useSelectedFolder = value === 'selected';
				await this.plugin.saveSettings();
				this.display(); // 설정 변경 시 화면 새로고침
			}));

		if (this.plugin.settings.useSelectedFolder) {
			new Setting(containerEl)
				.setName('Select Folder')
				.setDesc('Choose a folder for Card Navigator')
				.addButton(button => button
					.setButtonText(this.plugin.settings.selectedFolder || 'Choose folder')
					.onClick(() => {
						new FolderSuggestModal(this.plugin, (folder) => {
							this.plugin.settings.selectedFolder = folder.path;
							this.plugin.saveSettings();
							this.display(); // 폴더 선택 후 화면 새로고침
						}).open();
					}));
		}

        new Setting(containerEl)
            .setName('Default sort method')
            .setDesc('Choose the default sorting method for cards')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('fileName_asc', 'File name (A to Z)')
                    .addOption('fileName_desc', 'File name (Z to A)')
                    .addOption('lastModified_desc', 'Last modified (newest first)')
                    .addOption('lastModified_asc', 'Last modified (oldest first)')
                    .addOption('created_desc', 'Created (newest first)')
                    .addOption('created_asc', 'Created (oldest first)')
                    .setValue(`${this.plugin.settings.sortCriterion}_${this.plugin.settings.sortOrder}`)
                    .onChange(async (value) => {
                        const [criterion, order] = value.split('_') as [SortCriterion, 'asc' | 'desc'];
                        this.plugin.settings.sortCriterion = criterion;
                        this.plugin.settings.sortOrder = order;
                        await this.plugin.saveSettings();
                        this.plugin.refreshViews();
                    });
            });

		new Setting(containerEl)
			.setName('Fixed Card Height')
			.setDesc('If enabled, all cards will have the same height. If disabled, card height will adjust to content.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.fixedCardHeight)
				.onChange(async (value) => {
				this.plugin.settings.fixedCardHeight = value;
				await this.plugin.saveSettings();
				this.plugin.refreshViews();
				}));

		new Setting(containerEl)
			.setName('Render Content as HTML')
			.setDesc('If enabled, card content will be rendered as HTML')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.renderContentAsHtml)
				.onChange(async (value) => {
					this.plugin.settings.renderContentAsHtml = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}));

		new Setting(containerEl)
		.setName('Center Card Method')
		.setDesc('Choose how to center the active card in the view')
		.addDropdown(dropdown => dropdown
			.addOption('scroll', 'Scroll to active card')
			.addOption('centered', 'Render the active card centered')
			.setValue(this.plugin.settings.centerCardMethod)
			.onChange(async (value) => {
				this.plugin.settings.centerCardMethod = value as 'scroll' | 'centered';
				await this.plugin.saveSettings();
				this.plugin.refreshViews();
				this.display(); // 설정 변경 시 화면 새로고침
			}));

		if (this.plugin.settings.centerCardMethod === 'centered') {
			new Setting(containerEl)
				.setName('Animation Duration')
				.setDesc('Set the duration of the card animation (in milliseconds)')
				.addSlider(slider => slider
					.setLimits(0, 1000, 50)
					.setValue(this.plugin.settings.animationDuration)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.animationDuration = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
		.setName('Drag and Drop Content')
		.setDesc('When enabled, dragging a card will insert the note content instead of a link.')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.dragDropContent)
			.onChange(async (value) => {
				this.plugin.settings.dragDropContent = value;
				await this.plugin.saveSettings();
				this.plugin.refreshViews();
			}));

		containerEl.createEl('h3', { text: 'Display items Settings' });


		new Setting(containerEl)
		.setName('Show File Name')
		.setDesc('Toggle to display or hide the file name on cards')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.showFileName)
			.onChange(async (value) => {
				this.plugin.settings.showFileName = value;
				await this.plugin.saveSettings();
				this.plugin.refreshViews();
			}));

		new Setting(containerEl)
			.setName('File Name Size')
			.setDesc('Set the font size for the file name')
			.addSlider(slider => slider
				.setLimits(15, 25, 1)
				.setValue(this.plugin.settings.fileNameSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.fileNameSize = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}));

		new Setting(containerEl)
			.setName('Show First Header')
			.setDesc('Toggle to display or hide the first header on cards')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showFirstHeader)
				.onChange(async (value) => {
					this.plugin.settings.showFirstHeader = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}));

		new Setting(containerEl)
			.setName('First Header Size')
			.setDesc('Set the font size for the first header')
			.addSlider(slider => slider
				.setLimits(15, 25, 1)
				.setValue(this.plugin.settings.firstHeaderSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.firstHeaderSize = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}));

		new Setting(containerEl)
			.setName('Show Content')
			.setDesc('Toggle to display or hide the content on cards')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showContent)
				.onChange(async (value) => {
					this.plugin.settings.showContent = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}));

		new Setting(containerEl)
			.setName('Content Size')
			.setDesc('Set the font size for the content')
			.addSlider(slider => slider
				.setLimits(10, 20, 1)
				.setValue(this.plugin.settings.contentSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.contentSize = value;
					await this.plugin.saveSettings();
					this.plugin.refreshViews();
				}));

		new Setting(containerEl)
		.setName('Content Length')
		.setDesc('Maximum content length displayed on each card')
		.addSlider(slider => slider
			.setLimits(1, 10, 1)
			.setValue(this.plugin.settings.contentLength)
			.setDynamicTooltip()
			.onChange(async (value) => {
				this.plugin.settings.contentLength = value;
				await this.plugin.saveSettings();
				this.plugin.refreshViews();
			}));
    }
}
