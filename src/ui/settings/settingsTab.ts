import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { addPresetSettings } from './presetSettings';
import { addLayoutSettings } from './layoutSettings';
import { addContainerSettings } from './containerSettings';
import { addCardStylingSettings } from './cardStyleSettings';
import { addCardContentSettings } from './cardContentSettings';
import { addKeyboardShortcutsInfo } from './keyboardShortcutsInfo';
import { CardNavigatorSettings, NumberSettingKey, SortCriterion, SortOrder, sortOptions } from '../../common/types';
import { t } from 'i18next';

export class SettingTab extends PluginSettingTab {
    private settingsManager: SettingsManager;
    private sections: Record<string, HTMLElement> = {};

    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
        this.settingsManager = plugin.settingsManager;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.sections = {
            preset: containerEl.createDiv('preset-section'),
            container: containerEl.createDiv('container-section'),
            layout: containerEl.createDiv('layout-section'),
            cardContent: containerEl.createDiv('card-content-section'),
            cardStyling: containerEl.createDiv('card-styling-section'),
            keyboardShortcuts: containerEl.createDiv('keyboard-shortcuts-section')
        };

        this.updateAllSections();
    }

    updateAllSections(): void {
        this.updatePresetSettings();
        this.updateContainerSettings();
        this.updateLayoutSettings();
        this.updateCardContentSettings();
        this.updateCardStylingSettings();
        this.updateKeyboardShortcutsInfo();
    }

	updatePresetSettings(): void {
		this.sections.preset.empty();
		addPresetSettings(this.sections.preset, this.plugin, this.settingsManager, this);
	}

    updateContainerSettings(): void {
        this.sections.container.empty();
        addContainerSettings(this.sections.container, this.plugin, this.settingsManager, this);
    }

    updateLayoutSettings(): void {
        this.sections.layout.empty();
        addLayoutSettings(this.sections.layout, this.plugin, this.settingsManager, this);
    }

    updateCardContentSettings(): void {
        this.sections.cardContent.empty();
        addCardContentSettings(this.sections.cardContent, this.plugin, this.settingsManager, this);
    }

    updateCardStylingSettings(): void {
        this.sections.cardStyling.empty();
        addCardStylingSettings(this.sections.cardStyling, this.plugin, this.settingsManager, this);
    }

    updateKeyboardShortcutsInfo(): void {
        this.sections.keyboardShortcuts.empty();
        addKeyboardShortcutsInfo(this.sections.keyboardShortcuts);
    }

    refreshSettingsUI(changedSetting: keyof CardNavigatorSettings): void {
        switch (changedSetting) {
            case 'lastActivePreset':
            case 'folderPresets':
            case 'activeFolderPresets':
                this.updatePresetSettings();
                break;
            case 'useSelectedFolder':
            case 'selectedFolder':
            case 'sortCriterion':
            case 'sortOrder':
                this.updateContainerSettings();
                break;
            case 'defaultLayout':
            case 'cardWidthThreshold':
            case 'alignCardHeight':
            case 'cardsPerView':
            case 'gridColumns':
            case 'gridCardHeight':
            case 'masonryColumns':
                this.updateLayoutSettings();
                break;
            case 'renderContentAsHtml':
            case 'dragDropContent':
            case 'showFileName':
            case 'showFirstHeader':
            case 'showBody':
            case 'bodyLengthLimit':
            case 'bodyLength':
                this.updateCardContentSettings();
                break;
            case 'fileNameFontSize':
            case 'firstHeaderFontSize':
            case 'bodyFontSize':
                this.updateCardStylingSettings();
                break;
            default:
                this.updateAllSections();
        }
    }



    addToggleSetting(
        containerEl: HTMLElement,
        key: keyof CardNavigatorSettings,
        name: string,
        desc: string
    ): Setting {
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings[key] as boolean)
                .onChange(async (value: boolean) => {
                    await this.settingsManager.updateBooleanSetting(key, value);
                })
            );
    }

    addSliderSetting(
        containerEl: HTMLElement,
        key: NumberSettingKey,
        name: string,
        desc: string
    ): Setting {
        const config = this.settingsManager.getNumberSettingConfig(key);
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addSlider(slider => slider
                .setLimits(config.min, config.max, config.step)
                .setValue(this.plugin.settings[key] as number)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    await this.settingsManager.updateSetting(key, value);
                })
            );
    }

    addDropdownSetting(
        containerEl: HTMLElement,
        key: 'sortMethod',
        name: string,
        desc: string
    ): Setting {
        return new Setting(containerEl)
            .setName(t(name))
            .setDesc(t(desc))
            .addDropdown(dropdown => {
                sortOptions.forEach(option => {
                    dropdown.addOption(option.value, t(option.label));
                });
                dropdown
                    .setValue(`${this.plugin.settings.sortCriterion}_${this.plugin.settings.sortOrder}`)
                    .onChange(async (value: string) => {
                        const [criterion, order] = value.split('_') as [SortCriterion, SortOrder];
                        await this.settingsManager.updateSetting('sortCriterion', criterion);
                        await this.settingsManager.updateSetting('sortOrder', order);
                    });
            });
    }
}

