// src/ui/settingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { FolderSuggestModal } from './toolbar/toolbarActions';
import { SortCriterion, CardNavigatorSettings } from '../common/types';

export class SettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const createSetting = (name: string, desc: string, settingKey: keyof CardNavigatorSettings) => {
            return new Setting(containerEl)
                .setName(name)
                .setDesc(desc);
        };

		const updateSetting = async <K extends keyof CardNavigatorSettings>(
            settingKey: K,
            value: CardNavigatorSettings[K]
        ) => {
            this.plugin.settings[settingKey] = value;
            await this.plugin.saveSettings();
            this.plugin.triggerRefresh();
        };

        createSetting('Cards per view', 'Number of cards to display at once', 'cardsPerView')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.cardsPerView)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await updateSetting('cardsPerView', value);
                }));

        createSetting('Folder Selection', 'Choose whether to use the active file\'s folder or a selected folder', 'useSelectedFolder')
            .addDropdown(dropdown => dropdown
                .addOption('active', 'Active File\'s Folder')
                .addOption('selected', 'Selected Folder')
                .setValue(this.plugin.settings.useSelectedFolder ? 'selected' : 'active')
                .onChange(async (value) => {
                    await updateSetting('useSelectedFolder', value === 'selected');
                    this.display();
                }));

        if (this.plugin.settings.useSelectedFolder) {
            createSetting('Select Folder', 'Choose a folder for Card Navigator', 'selectedFolder')
                .addButton(button => button
                    .setButtonText(this.plugin.settings.selectedFolder || 'Choose folder')
                    .onClick(() => {
                        new FolderSuggestModal(this.plugin, async (folder) => {
                            await updateSetting('selectedFolder', folder.path);
                            this.display();
                        }).open();
                    }));
        }

        createSetting('Default sort method', 'Choose the default sorting method for cards', 'sortCriterion')
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
                        await updateSetting('sortCriterion', criterion);
                        await updateSetting('sortOrder', order);
                    });
            });

        createSetting('Fixed Card Height', 'If enabled, all cards will have the same height. If disabled, card height will adjust to content.', 'fixedCardHeight')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.fixedCardHeight)
                .onChange(async (value) => {
                    await updateSetting('fixedCardHeight', value);
                }));

        createSetting('Render Content as HTML', 'If enabled, card content will be rendered as HTML', 'renderContentAsHtml')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.renderContentAsHtml)
                .onChange(async (value) => {
                    await updateSetting('renderContentAsHtml', value);
                }));

        createSetting('Center Active Card on Open', 'Automatically center the active card when opening the Card Navigator', 'centerActiveCardOnOpen')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.centerActiveCardOnOpen)
			.onChange(async (value) => {
				this.plugin.settings.centerActiveCardOnOpen = value;
				await this.plugin.saveSettings();
			}));

        createSetting('Center Card Method', 'Choose how to center the active card in the view', 'centerCardMethod')
            .addDropdown(dropdown => dropdown
                .addOption('scroll', 'Scroll to active card')
                .addOption('centered', 'Render the active card centered')
                .setValue(this.plugin.settings.centerCardMethod)
                .onChange(async (value) => {
                    await updateSetting('centerCardMethod', value as 'scroll' | 'centered');
                    this.display();
                }));

        if (this.plugin.settings.centerCardMethod === 'centered') {
            createSetting('Animation Duration', 'Set the duration of the card animation (in milliseconds)', 'animationDuration')
                .addSlider(slider => slider
                    .setLimits(0, 1000, 50)
                    .setValue(this.plugin.settings.animationDuration)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await updateSetting('animationDuration', value);
                    }));
        }

        createSetting('Drag and Drop Content', 'When enabled, dragging a card will insert the note content instead of a link.', 'dragDropContent')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.dragDropContent)
                .onChange(async (value) => {
                    await updateSetting('dragDropContent', value);
                }));

        containerEl.createEl('h3', { text: 'Display items Settings' });

        const displaySettings = [
            { name: 'Show File Name', key: 'showFileName' },
            { name: 'Show First Header', key: 'showFirstHeader' },
            { name: 'Show Content', key: 'showContent' },
        ] as const;

        displaySettings.forEach(({ name, key }) => {
            createSetting(name, `Toggle to display or hide the ${name.toLowerCase()} on cards`, key)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings[key])
                    .onChange(async (value) => {
                        await updateSetting(key, value);
                    }));
        });

        const fontSizeSettings = [
            { name: 'File Name Size', key: 'fileNameSize', min: 15, max: 25 },
            { name: 'First Header Size', key: 'firstHeaderSize', min: 15, max: 25 },
            { name: 'Content Size', key: 'contentSize', min: 10, max: 20 },
        ] as const;

        fontSizeSettings.forEach(({ name, key, min, max }) => {
            createSetting(name, `Set the font size for the ${name.toLowerCase()}`, key)
                .addSlider(slider => slider
                    .setLimits(min, max, 1)
                    .setValue(this.plugin.settings[key])
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await updateSetting(key, value);
                    }));
        });

        createSetting('Content Length', 'Maximum content length displayed on each card', 'contentLength')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.contentLength)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await updateSetting('contentLength', value);
                }));
    }
}
