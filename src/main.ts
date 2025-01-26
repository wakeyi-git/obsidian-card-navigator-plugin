import { Plugin, Events, TFile, debounce, moment, WorkspaceLeaf  } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR, RefreshType } from './ui/cardNavigatorView';
import { SettingTab } from './ui/settings/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder, DEFAULT_SETTINGS } from './common/types';
import { SettingsManager } from './ui/settings/settingsManager';
import { PresetManager } from './ui/settings/PresetManager';
import i18next from 'i18next';
import { t } from 'i18next';

// Define language resources for internationalization
export const languageResources = {
    en: () => import('./locales/en.json'),
    ko: () => import('./locales/ko.json'),
} as const;

// Set the translation language based on the user's locale, defaulting to English if not available
export const translationLanguage = Object.keys(languageResources).includes(moment.locale()) ? moment.locale() : "en";

export default class CardNavigatorPlugin extends Plugin {
    //#region Class Properties
    settings: CardNavigatorSettings = DEFAULT_SETTINGS;
    selectedFolder: string | null = null;
    settingsManager!: SettingsManager;
    presetManager!: PresetManager;
    settingTab!: SettingTab;
    private ribbonIconEl: HTMLElement | null = null;
    public events: Events = new Events();
    //#endregion

    //#region Lifecycle Methods
    async onload() {
        await this.loadSettings();
        this.presetManager = new PresetManager(this.app, this, this.settings);
        this.settingsManager = new SettingsManager(this, this.presetManager);
        await this.presetManager.initialize();
        await this.initializePlugin();
    
        this.addRibbonIcon('layers-3', t('OPEN_CARD_NAVIGATOR'), () => {
            this.activateView();
        });
    
        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                if (file instanceof TFile) {
                    this.selectAndApplyPreset(file);
                }
            })
        );
    }

    async onunload() {
        // 이벤트 핸들러는 Plugin 클래스에서 자동으로 정리됨
        if (this.ribbonIconEl) {
            this.ribbonIconEl.detach();
        }
    }
    //#endregion

    //#region Settings Management
    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.events.trigger('settings-updated');
    }
    //#endregion

    //#region Plugin Initialization
    private async initializePlugin() {
        await this.initializeI18n();

        this.settingTab = new SettingTab(this.app, this);
        this.addSettingTab(this.settingTab);

        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigatorView(leaf, this)
        );

        this.addCommands();
        this.addScrollCommands();

        this.registerCentralizedEvents();
    }

    private async initializeI18n() {
        const resources = await this.loadLanguageResources();
        await i18next.init({
            lng: translationLanguage,
            fallbackLng: "en",
            resources,
        });
    }

    private async loadLanguageResources() {
        const [en, ko] = await Promise.all([
            languageResources.en(),
            languageResources.ko()
        ]);
        return {
            en: { translation: en.default },
            ko: { translation: ko.default },
        };
    }
    //#endregion

    //#region View Management
    async activateView() {
        const { workspace } = this.app;
        let leaf: WorkspaceLeaf | null = null;
    
        const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];
        if (existingLeaf) {
            leaf = existingLeaf;
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
            }
        }
    
        if (leaf) {
            workspace.revealLeaf(leaf);
            await leaf.setViewState(leaf.getViewState());
        } else {
            console.error("Failed to activate Card Navigator view");
        }
    }

    private getFirstCardNavigator(): CardNavigatorView | null {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        for (const leaf of leaves) {
            if (leaf.view instanceof CardNavigatorView) {
                return leaf.view;
            }
        }
        return null;
    }

    private getActiveCardNavigator(): CardNavigatorView | null {
        return this.app.workspace.getActiveViewOfType(CardNavigatorView);
    }

    displayFilteredCards(filteredFiles: TFile[]) {
        const cardNavigator = this.app.workspace.getActiveViewOfType(CardNavigatorView);
        if (cardNavigator) {
            cardNavigator.cardContainer.displayCards(filteredFiles);
        }
    }
    //#endregion

    //#region Card Operations
    sortCards(criterion: SortCriterion, order: SortOrder) {
        const cardNavigator = this.app.workspace.getActiveViewOfType(CardNavigatorView);
        if (cardNavigator) {
            cardNavigator.cardContainer.sortCards(criterion, order);
        }
    }

    scrollCards(direction: ScrollDirection, count: number) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                const { cardContainer } = leaf.view;
                const isVertical = cardContainer.isVertical;
    
                switch (direction) {
                    case 'up':
                        isVertical ? cardContainer.scrollUp(count) : cardContainer.scrollLeft(count);
                        break;
                    case 'down':
                        isVertical ? cardContainer.scrollDown(count) : cardContainer.scrollRight(count);
                        break;
                    case 'left':
                        cardContainer.scrollLeft(count);
                        break;
                    case 'right':
                        cardContainer.scrollRight(count);
                        break;
                }
            }
        });
    }
    //#endregion

    //#region Event Handlers
    private registerCentralizedEvents() {
        // 레이아웃 변경 이벤트
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshAllViews(RefreshType.LAYOUT);
            })
        );

        // 활성 리프 변경 이벤트
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.handleFileChange(this.app.workspace.getActiveFile());
            })
        );

        // 파일 열기 이벤트
        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                this.handleFileChange(file);
            })
        );

        // 설정 업데이트 이벤트
        this.events.on('settings-updated', () => {
            this.refreshAllViews(RefreshType.SETTINGS);
        });

        // 파일 수정 이벤트
        this.registerEvent(
            this.app.vault.on('modify', () => {
                this.refreshAllViews(RefreshType.CONTENT);
            })
        );
    }

    // 모든 카드 네비게이터 뷰 리프레시
    private refreshAllViews(type: RefreshType) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                // 레이아웃 변경 시에는 레이아웃만 리프레시
                if (type === RefreshType.LAYOUT) {
                    leaf.view.refresh(RefreshType.LAYOUT);
                }
                // 설정 변경 시에는 설정과 컨텐츠를 함께 리프레시
                else if (type === RefreshType.SETTINGS) {
                    leaf.view.refreshBatch([RefreshType.SETTINGS, RefreshType.CONTENT]);
                }
                // 컨텐츠 변경 시에는 컨텐츠만 리프레시
                else {
                    leaf.view.refresh(RefreshType.CONTENT);
                }
            }
        });
    }

    // 파일 변경 처리
    private async handleFileChange(file: TFile | null) {
        // 선택된 폴더 사용 중이면 무시
        if (this.settings.useSelectedFolder) return;
        
        // 파일이 없거나 마크다운이 아니면 무시
        if (!file || !(file instanceof TFile) || file.extension !== 'md') return;

        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        for (const leaf of leaves) {
            if (!(leaf.view instanceof CardNavigatorView)) continue;

            try {
                await this.updateViewForFile(leaf.view, file);
            } catch (error) {
                console.error('[카드 네비게이터] 뷰 업데이트 실패:', error);
            }
        }
    }

    // 파일에 따른 뷰 업데이트
    private async updateViewForFile(view: CardNavigatorView, file: TFile) {
        const currentFolderPath = await view.getCurrentFolderPath();
        if (!currentFolderPath || !file.parent) return;

        if (currentFolderPath === file.parent.path) {
            // 같은 폴더면 컨텐츠만 리프레시
            view.refresh(RefreshType.CONTENT);
        } else {
            // 다른 폴더로 이동할 때만 전체 리프레시
            view.refreshBatch([RefreshType.LAYOUT, RefreshType.SETTINGS, RefreshType.CONTENT]);
        }
    }
    //#endregion

    //#region Layout Management
    public updateLayout(layout: CardNavigatorSettings['defaultLayout']) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                leaf.view.cardContainer.setLayout(layout);
                this.saveSettings();
                // 레이아웃과 설정을 함께 리프레시
                leaf.view.refreshBatch([RefreshType.LAYOUT, RefreshType.SETTINGS]);
            }
        });
    }

    refreshSettingsTab() {
        if (this.settingTab instanceof SettingTab) {
            this.settingTab.display();
        }
    }
    //#endregion

    //#region Commands
    private addCommands() {
        this.addCommand({
            id: 'open-card-navigator',
            name: t('OPEN_CARD_NAVIGATOR'),
            callback: () => this.activateView(),
        });

        this.addCommand({
            id: 'focus-card-navigator',
            name: t('MOVE_FOCUS_TO_CARD_NAVIGATOR'),
            callback: async () => {
                const cardNavigator = this.getFirstCardNavigator();
                if (cardNavigator) {
                    const leaf = this.app.workspace.getLeaf();
                    if (leaf) {
                        leaf.view.containerEl.focus();
                        await new Promise(resolve => setTimeout(resolve, 0));
                        cardNavigator.focusNavigator();
                    }
                }
            }
        });

        this.addCommand({
            id: 'open-card-context-menu',
            name: t('OPEN_CARD_CONTEXT_MENU'),
            callback: () => {
                const cardNavigator = this.getActiveCardNavigator();
                if (cardNavigator) {
                    cardNavigator.openContextMenu();
                }
            }
        });
    }

    private addScrollCommands() {
        const scrollCommands = [
            { id: 'scroll-up-one-card', name: t('SCROLL_UP_ONE_CARD'), direction: 'up', count: 1 },
            { id: 'scroll-down-one-card', name: t('SCROLL_DOWN_ONE_CARD'), direction: 'down', count: 1 },
            { id: 'scroll-left-one-card', name: t('SCROLL_LEFT_ONE_CARD'), direction: 'left', count: 1 },
            { id: 'scroll-right-one-card', name: t('SCROLL_RIGHT_ONE_CARD'), direction: 'right', count: 1 },
            { id: 'scroll-up-page', name: t('SCROLL_UP_LEFT_ONE_PAGE'), direction: 'up', count: this.settings.cardsPerView },
            { id: 'scroll-down-page', name: t('SCROLL_DOWN_RIGHT_ONE_PAGE'), direction: 'down', count: this.settings.cardsPerView }
        ];

        scrollCommands.forEach(command => {
            this.addCommand({
                id: command.id,
                name: command.name,
                callback: () => {
                    this.scrollCards(command.direction as ScrollDirection, command.count);
                }
            });
        });
    }
    //#endregion

    //#region Preset Management
    private async selectAndApplyPreset(file: TFile) {
        if (this.settings.autoApplyPresets) {
            if (this.settings.autoApplyFolderPresets && file.parent) {
                await this.presetManager.applyFolderPreset(file.parent.path);
            } else {
                await this.presetManager.applyGlobalPreset(this.settings.GlobalPreset);
            }
        }
    }

    async selectAndApplyPresetForCurrentFile() {
        const currentFile = this.app.workspace.getActiveFile();
        if (currentFile) {
            await this.selectAndApplyPreset(currentFile);
        }
    }
    //#endregion
}
