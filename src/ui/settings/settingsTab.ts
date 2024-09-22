import { App, PluginSettingTab } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { addPresetSettings } from './presetSettings';
import { addLayoutSettings } from './layoutSettings';
import { addContainerSettings } from './containerSettings';
import { addCardStylingSettings } from './cardStyleSettings';
import { addCardContentSettings } from './cardContentSettings';
import { addKeyboardShortcutsInfo } from './keyboardShortcutsInfo';
import { CardNavigatorSettings } from '../../common/types';

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
        addPresetSettings(this.sections.preset, this.plugin, this.settingsManager);
    }

    updateContainerSettings(): void {
        this.sections.container.empty();
        addContainerSettings(this.sections.container, this.plugin, this.settingsManager);
    }

    updateLayoutSettings(): void {
        this.sections.layout.empty();
        addLayoutSettings(this.sections.layout, this.plugin, this.settingsManager);
    }

    updateCardContentSettings(): void {
        this.sections.cardContent.empty();
        addCardContentSettings(this.sections.cardContent, this.plugin, this.settingsManager);
    }

    updateCardStylingSettings(): void {
        this.sections.cardStyling.empty();
        addCardStylingSettings(this.sections.cardStyling, this.plugin, this.settingsManager);
    }

    updateKeyboardShortcutsInfo(): void {
        this.sections.keyboardShortcuts.empty();
        addKeyboardShortcutsInfo(this.sections.keyboardShortcuts);
    }

    refreshSettingsUI(changedSetting: keyof CardNavigatorSettings): void {
        switch (changedSetting) {
            case 'lastActivePreset':
            case 'presets':
            case 'folderPresets':
            case 'activeFolderPresets':
                this.updatePresetSettings();
                break;
            case 'useSelectedFolder':
            case 'selectedFolder':
            case 'sortCriterion':
            case 'sortOrder':
            case 'centerActiveCardOnOpen':
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
}
