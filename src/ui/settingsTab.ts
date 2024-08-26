// src/ui/settingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../main';

export class SettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Card Navigator Settings' });

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

		// new Setting(containerEl)
		// 	.setName('Center Card Method')
		// 	.setDesc('Choose how to center the active card in the view')
		// 	.addDropdown(dropdown => dropdown
		// 		.addOption('scroll', 'Scroll to active card')
		// 		.addOption('centered', 'Render the active card centred')
		// 		.setValue(this.plugin.settings.centerCardMethod)
		// 		.onChange(async (value) => {
		// 			const method = value as 'scroll' | 'centered';
		// 			this.plugin.settings.centerCardMethod = method;
		// 			await this.plugin.saveSettings();
		// 			this.plugin.refreshViews();
		// 		}));

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
