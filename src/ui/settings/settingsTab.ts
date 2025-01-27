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

/**
 * Card Navigator의 설정 탭을 관리하는 클래스입니다.
 * 모든 설정 UI와 상호작용을 처리합니다.
 */
export class SettingTab extends PluginSettingTab {
    //#region 클래스 속성
    private settingsManager: SettingsManager;
    private sections: Record<string, HTMLElement> = {};
    //#endregion

    //#region 초기화
    /**
     * 설정 탭 생성자
     * 플러그인과 설정 관리자를 초기화합니다.
     */
    constructor(app: App, private plugin: CardNavigatorPlugin) {
        super(app, plugin);
        this.settingsManager = plugin.settingsManager;
    }

    /**
     * 설정 UI를 표시합니다.
     * 모든 설정 섹션을 생성하고 초기화합니다.
     */
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
    //#endregion

    //#region 섹션 업데이트
    /**
     * 모든 설정 섹션을 업데이트합니다.
     */
    updateAllSections(): void {
        this.updatePresetSettings();
        this.updateContainerSettings();
        this.updateLayoutSettings();
        this.updateCardContentSettings();
        this.updateCardStylingSettings();
        this.updateKeyboardShortcutsInfo();
    }

    /**
     * 프리셋 설정 섹션을 업데이트합니다.
     */
    updatePresetSettings(): void {
        this.sections.preset.empty();
        addPresetSettings(this.sections.preset, this.plugin, this.settingsManager, this);
    }

    /**
     * 컨테이너 설정 섹션을 업데이트합니다.
     */
    updateContainerSettings(): void {
        this.sections.container.empty();
        addContainerSettings(this.sections.container, this.plugin, this.settingsManager, this);
    }

    /**
     * 레이아웃 설정 섹션을 업데이트합니다.
     */
    updateLayoutSettings(): void {
        this.sections.layout.empty();
        addLayoutSettings(this.sections.layout, this.plugin, this.settingsManager, this);
    }

    /**
     * 카드 내용 설정 섹션을 업데이트합니다.
     */
    updateCardContentSettings(): void {
        this.sections.cardContent.empty();
        addCardContentSettings(this.sections.cardContent, this.plugin, this.settingsManager, this);
    }

    /**
     * 카드 스타일 설정 섹션을 업데이트합니다.
     */
    updateCardStylingSettings(): void {
        this.sections.cardStyling.empty();
        addCardStylingSettings(this.sections.cardStyling, this.plugin, this.settingsManager, this);
    }

    /**
     * 키보드 단축키 정보 섹션을 업데이트합니다.
     */
    updateKeyboardShortcutsInfo(): void {
        this.sections.keyboardShortcuts.empty();
        addKeyboardShortcutsInfo(this.sections.keyboardShortcuts);
    }
    //#endregion

    //#region 설정 UI 새로고침
    /**
     * 변경된 설정에 따라 특정 설정 UI를 새로고침합니다.
     * @param changedSetting - 변경된 설정의 키
     */
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
    //#endregion

    //#region 설정 컴포넌트 생성
    /**
     * 토글 설정을 추가합니다.
     * @param containerEl - 설정을 추가할 컨테이너 요소
     * @param key - 설정 키
     * @param name - 설정 이름
     * @param desc - 설정 설명
     */
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

    /**
     * 슬라이더 설정을 추가합니다.
     * @param containerEl - 설정을 추가할 컨테이너 요소
     * @param key - 설정 키
     * @param name - 설정 이름
     * @param desc - 설정 설명
     */
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

    /**
     * 드롭다운 설정을 추가합니다.
     * @param containerEl - 설정을 추가할 컨테이너 요소
     * @param key - 설정 키
     * @param name - 설정 이름
     * @param desc - 설정 설명
     */
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
    //#endregion
}

