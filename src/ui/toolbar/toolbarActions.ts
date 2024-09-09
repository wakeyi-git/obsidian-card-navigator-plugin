//src/ui/toolbar/toolbarActions.ts

import { TFolder, FuzzySuggestModal, Setting, SliderComponent } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SortCriterion, SortOrder, ToolbarMenu, CardNavigatorSettings, NumberSettingKey } from '../../common/types';
import { SettingsManager } from '../../common/settingsManager';
import { t } from 'i18next';

let currentPopup: { element: HTMLElement, type: ToolbarMenu } | null = null;

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    constructor(private plugin: CardNavigatorPlugin, private onSelect: (folder: TFolder) => void) {
        super(plugin.app);
    }

    getItems(): TFolder[] {
        return this.plugin.app.vault.getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder);
    }

    getItemText(folder: TFolder): string {
        return folder.path;
    }

    onChooseItem(folder: TFolder): void {
        this.onSelect(folder);
    }
}

function createPopup(className: string, type: ToolbarMenu): HTMLElement {
    closeCurrentPopup();
    const popup = createDiv(className);
    const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
    if (toolbarEl) {
        toolbarEl.insertAdjacentElement('afterend', popup);
        currentPopup = { element: popup, type };
        document.addEventListener('click', onClickOutside);
    }
    return popup;
}

export function toggleSort(plugin: CardNavigatorPlugin) {
    const sortPopup = createPopup('card-navigator-sort-popup', 'sort');
    const currentSort = `${plugin.settings.sortCriterion}_${plugin.settings.sortOrder}`;

    const sortOptions: Array<{ value: string, label: string }> = [
        { value: 'fileName_asc', label: t('File name (A to Z)') },
        { value: 'fileName_desc', label: t('File name (Z to A)') },
        { value: 'lastModified_desc', label: t('Last modified (newest first)') },
        { value: 'lastModified_asc', label: t('Last modified (oldest first)') },
        { value: 'created_desc', label: t('Created (newest first)') },
        { value: 'created_asc', label: t('Created (oldest first)') },
    ];

    sortOptions.forEach(option => {
        const button = createSortOption(option.value, option.label, currentSort, plugin);
        sortPopup.appendChild(button);
    });

    sortPopup.addEventListener('click', (e) => e.stopPropagation());
}

function createSortOption(value: string, label: string, currentSort: string, plugin: CardNavigatorPlugin): HTMLButtonElement {
    const option = createEl('button', {
        text: label,
        cls: `sort-option${currentSort === value ? ' active' : ''}`
    });
    option.addEventListener('click', async () => {
        const [criterion, order] = value.split('_') as [SortCriterion, SortOrder];
        await updateSortSettings(plugin, criterion, order);
        closeCurrentPopup();
    });
    return option;
}

async function updateSortSettings(plugin: CardNavigatorPlugin, criterion: SortCriterion, order: SortOrder) {
    plugin.settings.sortCriterion = criterion;
    plugin.settings.sortOrder = order;
    await plugin.saveSettings();
    plugin.triggerRefresh();
}

export function toggleSettings(plugin: CardNavigatorPlugin) {
    const settingsPopup = createPopup('card-navigator-settings-popup', 'settings');
    const settingsManager = plugin.settingsManager;

    // Add preset selection dropdown at the top
    addPresetDropdown(settingsPopup, plugin, settingsManager);

    // Container Settings Section
    const containerSection = createCollapsibleSection(settingsPopup, t('Container Settings'));
    addFolderSelectionSetting(containerSection, plugin, settingsManager);
    addNumberSetting('cardsPerView', t('Cards per view'), containerSection, plugin, settingsManager);
    addToggleSetting('alignCardHeight', t('Align Card Height'), containerSection, plugin, settingsManager);

    // Card Settings Section
    const cardSection = createCollapsibleSection(settingsPopup, t('Card Settings'));
    addToggleSetting('renderContentAsHtml', t('Render Content as HTML'), cardSection, plugin, settingsManager);
    addToggleSetting('dragDropContent', t('Drag and Drop Content'), cardSection, plugin, settingsManager);
    addToggleSetting('showFileName', t('Show File Name'), cardSection, plugin, settingsManager);
    addToggleSetting('showFirstHeader', t('Show First Header'), cardSection, plugin, settingsManager);
    addToggleSetting('showContent', t('Show Content'), cardSection, plugin, settingsManager);
    
    // Add content length limit toggle
    addToggleSetting('isContentLengthUnlimited', t('Content Length Limit'), cardSection, plugin, settingsManager);
    
    // Add content length slider
    addNumberSetting('contentLength', t('Content Length'), cardSection, plugin, settingsManager);
    
    addNumberSetting('fileNameFontSize', t('File Name Font Size'), cardSection, plugin, settingsManager);
    addNumberSetting('firstHeaderFontSize', t('First Header Font Size'), cardSection, plugin, settingsManager);
    addNumberSetting('contentFontSize', t('Content Font Size'), cardSection, plugin, settingsManager);

    settingsPopup.addEventListener('click', (e) => e.stopPropagation());
}

function createCollapsibleSection(parentEl: HTMLElement, title: string): HTMLElement {
    const sectionEl = parentEl.createDiv('tree-item graph-control-section');
    const selfEl = sectionEl.createDiv('tree-item-self');
    const iconEl = selfEl.createDiv('tree-item-icon collapse-icon');
    iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>';
    const innerEl = selfEl.createDiv('tree-item-inner');
    innerEl.createEl('header', { text: title, cls: 'graph-control-section-header' });
    const contentEl = sectionEl.createDiv('tree-item-children');

    selfEl.addEventListener('click', () => {
        const isCollapsed = sectionEl.hasClass('is-collapsed');
        sectionEl.toggleClass('is-collapsed', !isCollapsed);
        contentEl.style.display = !isCollapsed ? 'none' : 'block';
    });

    return contentEl;
}

function addPresetDropdown(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager) {
    new Setting(containerEl)
        .setName(t('Select Preset'))
		.setClass('setting-item-dropdown')
        .addDropdown(dropdown => {
            const presets = settingsManager.getPresets();
            Object.keys(presets).forEach(presetName => {
                dropdown.addOption(presetName, presetName);
            });
            dropdown.setValue(plugin.settings.lastActivePreset)
                .onChange(async (value) => {
                    await settingsManager.applyPreset(value);
                    plugin.settings.lastActivePreset = value;
                    await plugin.saveSettings();
                    toggleSettings(plugin);
                });
        });
}

function addFolderSelectionSetting(parentEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    const folderSettingEl = new Setting(parentEl)
        .setName(t('Folder Selection'))
		.setClass('setting-item-dropdown')
        .addDropdown(dropdown => dropdown
            .addOption('active', t('Active File\'s Folder'))
            .addOption('selected', t('Selected Folder'))
            .setValue(plugin.settings.useSelectedFolder ? 'selected' : 'active')
            .onChange(async (value) => {
                await settingsManager.updateBooleanSetting('useSelectedFolder', value === 'selected');
                toggleSettings(plugin);
            })).settingEl;

    folderSettingEl.addClass('setting-folder-selection');

    if (plugin.settings.useSelectedFolder) {
        addFolderSetting(parentEl, plugin, settingsManager);
    }
}

function addFolderSetting(parentEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(parentEl)
        .setName(t('Select Folder'))
        .addButton(button => button
            .setButtonText(plugin.settings.selectedFolder || t('Choose folder'))
            .onClick(() => {
                new FolderSuggestModal(plugin, async (folder) => {
                    await settingsManager.updateSelectedFolder(folder);
                    toggleSettings(plugin);
                }).open();
            }));
}

function addToggleSetting(key: keyof CardNavigatorSettings, name: string, container: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager) {
    new Setting(container)
        .setName(name)
        .setClass('setting-item-toggle')
        .addToggle(toggle => toggle
            .setValue(key === 'isContentLengthUnlimited' ? !plugin.settings[key] : plugin.settings[key] as boolean)
            .onChange(async (value) => {
                if (key === 'isContentLengthUnlimited') {
                    value = !value;  // Invert the value for this specific setting
                }
                await settingsManager.updateBooleanSetting(key, value);
                if (key === 'isContentLengthUnlimited') {
                    const contentLengthSlider = container.querySelector('.setting-item[data-setting="contentLength"]');
                    if (contentLengthSlider) {
                        (contentLengthSlider as HTMLElement).style.opacity = value ? '0.5' : '1';
                        const sliderComponent = (contentLengthSlider as HTMLElement).querySelector('.slider');
                        if (sliderComponent) {
                            (sliderComponent as HTMLInputElement).disabled = value;
                        }
                    }
                }
                plugin.triggerRefresh();
            })
        );
}

function addNumberSetting(key: NumberSettingKey, name: string, parentEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    const config = settingsManager.getNumberSettingConfig(key);

    const setting = new Setting(parentEl)
        .setName(name)
        .setClass('setting-item-slider');

    setting.settingEl.setAttribute('data-setting', key);

    if (key === 'contentLength') {
        setting.setDisabled(plugin.settings.isContentLengthUnlimited);
    }

    setting.addSlider((slider: SliderComponent) => {
        slider
            .setLimits(config.min, config.max, config.step)
            .setValue(plugin.settings[key])
            .setDynamicTooltip()
            .onChange(async (value: number) => {
                if (key === 'contentLength' && plugin.settings.isContentLengthUnlimited) {
                    return;
                }
                await settingsManager.updateNumberSetting(key, value);
                plugin.triggerRefresh();
            });
        return slider;
    });
}

function closeCurrentPopup() {
    if (currentPopup) {
        currentPopup.element.remove();
        currentPopup = null;
        document.removeEventListener('click', onClickOutside);
    }
}

function onClickOutside(event: MouseEvent) {
    const toolbarEl = document.querySelector('.card-navigator-toolbar-container');
    if (currentPopup && !currentPopup.element.contains(event.target as Node) && !toolbarEl?.contains(event.target as Node)) {
        if (currentPopup.type === 'sort' || (currentPopup.type === 'settings' && !event.composedPath().some(el => (el as HTMLElement).classList?.contains('card-navigator-settings-popup')))) {
            closeCurrentPopup();
        }
    }
}
