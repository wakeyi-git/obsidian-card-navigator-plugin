// src/ui/settingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { FolderSuggestModal } from './toolbar/toolbarActions';
import { SortCriterion, CardNavigatorSettings } from '../common/types';
import { t } from 'i18next';

export class SettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const createSetting = (name: string, desc: string, settingKey: keyof CardNavigatorSettings) => {
            return new Setting(containerEl)
                .setName(t(name))
                .setDesc(t(desc));
        };

		const updateSetting = async <K extends keyof CardNavigatorSettings>(
            settingKey: K,
            value: CardNavigatorSettings[K]
        ) => {
            this.plugin.settings[settingKey] = value;
            await this.plugin.saveSettings();
            this.plugin.triggerRefresh();
        };

        createSetting(t('Cards per view'), t('Number of cards to display at once'), t('cardsPerView'))
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.cardsPerView)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await updateSetting('cardsPerView', value);
                }));

        createSetting(t('Folder Selection'), t('Choose whether to use the active file\'s folder or a selected folder'), t('useSelectedFolder'))
            .addDropdown(dropdown => dropdown
                .addOption(t('active'), t('Active File\'s Folder'))
                .addOption(t('selected'), t('Selected Folder'))
                .setValue(this.plugin.settings.useSelectedFolder ? t('selected') : t('active'))
                .onChange(async (value) => {
                    await updateSetting('useSelectedFolder', value === t('selected'));
                    this.display();
                }));

        if (this.plugin.settings.useSelectedFolder) {
            createSetting(t('Select Folder'), t('Choose a folder for Card Navigator'), t('selectedFolder'))
                .addButton(button => button
                    .setButtonText(this.plugin.settings.selectedFolder || t('Choose folder'))
                    .onClick(() => {
                        new FolderSuggestModal(this.plugin, async (folder) => {
                            await updateSetting('selectedFolder', folder.path);
                            this.display();
                        }).open();
                    }));
        }

        createSetting(t('Default sort method'), t('Choose the default sorting method for cards'), t('sortCriterion'))
            .addDropdown(dropdown => {
                dropdown
                    .addOption(t('fileName_asc'), t('File name (A to Z)'))
                    .addOption(t('fileName_desc'), t('File name (Z to A)'))
                    .addOption(t('lastModified_desc'), t('Last modified (newest first)'))
                    .addOption(t('lastModified_asc'), t('Last modified (oldest first)'))
                    .addOption(t('created_desc'), t('Created (newest first)'))
                    .addOption(t('created_asc'), t('Created (oldest first)'))
                    .setValue(`${this.plugin.settings.sortCriterion}_${this.plugin.settings.sortOrder}`)
                    .onChange(async (value) => {
                        const [criterion, order] = value.split('_') as [SortCriterion, 'asc' | 'desc'];
                        await updateSetting('sortCriterion', criterion);
                        await updateSetting('sortOrder', order);
                    });
            });

        createSetting(t('Fixed Card Height'), t('If enabled, all cards will have the same height. If disabled, card height will adjust to content.'), t('fixedCardHeight'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.fixedCardHeight)
                .onChange(async (value) => {
                    await updateSetting('fixedCardHeight', value);
                }));

        createSetting(t('Render Content as HTML'), t('If enabled, card content will be rendered as HTML'), t('renderContentAsHtml'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.renderContentAsHtml)
                .onChange(async (value) => {
                    await updateSetting('renderContentAsHtml', value);
                }));

        createSetting(t('Center Active Card on Open'), t('Automatically center the active card when opening the Card Navigator'), t('centerActiveCardOnOpen'))
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.centerActiveCardOnOpen)
			.onChange(async (value) => {
				this.plugin.settings.centerActiveCardOnOpen = value;
				await this.plugin.saveSettings();
			}));

        createSetting(t('Drag and Drop Content'), t('When enabled, dragging a card will insert the note content instead of a link.'), t('dragDropContent'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.dragDropContent)
                .onChange(async (value) => {
                    await updateSetting('dragDropContent', value);
                }));

        containerEl.createEl('h3', { text: t('Display items Settings') });

        const displaySettings = [
            { name: t('Show File Name'), key: 'showFileName' },
            { name: t('Show First Header'), key: 'showFirstHeader' },
            { name: t('Show Content'), key: 'showContent' },
        ] as const;

        displaySettings.forEach(({ name, key }) => {
            createSetting(name, t(`Toggle to display or hide the ${name.toLowerCase()} on cards`), key)
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings[key])
                    .onChange(async (value) => {
                        await updateSetting(key, value);
                    }));
        });

        const fontSizeSettings = [
            { name: t('File Name Size'), key: 'fileNameSize', min: 15, max: 25 },
            { name: t('First Header Size'), key: 'firstHeaderSize', min: 15, max: 25 },
            { name: t('Content Size'), key: 'contentSize', min: 10, max: 20 },
        ] as const;

        fontSizeSettings.forEach(({ name, key, min, max }) => {
            createSetting(name, t(`Set the font size for the ${name.toLowerCase()}`), key)
                .addSlider(slider => slider
                    .setLimits(min, max, 1)
                    .setValue(this.plugin.settings[key])
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await updateSetting(key, value);
                    }));
        });

        createSetting(t('Content Length'), t('Maximum content length displayed on each card'), t('contentLength'))
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.contentLength)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    await updateSetting('contentLength', value);
                }));

				containerEl.createEl('h3', { text: t('Keyboard Shortcuts') });

				const shortcutDesc = containerEl.createEl('p');
				shortcutDesc.setText(t('Card Navigator provides the following features that can be assigned keyboard shortcuts. You can set these up in Obsidian\'s Hotkeys settings:'));
				
				const shortcutList = containerEl.createEl('ul');
				[
					{ name: t('Scroll Up One Card') },
					{ name: t('Scroll Down One Card') },
					{ name: t('Scroll Left One Card') },
					{ name: t('Scroll Right One Card') },
					{ name: t('Scroll Up One Page') },
					{ name: t('Scroll Down One Page') },
					{ name: t('Center Active Card') }
				].forEach(({ name }) => {
					const item = shortcutList.createEl('li');
					item.setText(name);
				});
				
				const customizeNote = containerEl.createEl('p');
				customizeNote.setText(t('To set up shortcuts for these actions, go to Settings → Hotkeys and search for "Card Navigator". You can then assign your preferred key combinations for each action.'));
    }
}
