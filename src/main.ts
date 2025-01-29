import { Plugin, Events, TFile, debounce, moment, WorkspaceLeaf  } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR, RefreshType } from './ui/cardNavigatorView';
import { SettingTab } from './ui/settings/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder, DEFAULT_SETTINGS } from './common/types';
import { SettingsManager } from './ui/settings/settingsManager';
import { PresetManager } from './ui/settings/PresetManager';
import i18next from 'i18next';
import { t } from 'i18next';
import { SearchService } from 'ui/toolbar/search/';

// 다국어 지원을 위한 언어 리소스 정의
export const languageResources = {
    en: () => import('./locales/en.json'),
    ko: () => import('./locales/ko.json'),
} as const;

// 사용자 로케일에 기반한 번역 언어 설정 (기본값: 영어)
export const translationLanguage = Object.keys(languageResources).includes(moment.locale()) ? moment.locale() : "en";

export default class CardNavigatorPlugin extends Plugin {
    //#region 클래스 속성
    public settings: CardNavigatorSettings = DEFAULT_SETTINGS;
    public settingsManager!: SettingsManager;
    public searchService!: SearchService;
    selectedFolder: string | null = null;
    presetManager!: PresetManager;
    settingTab!: SettingTab;
    private ribbonIconEl: HTMLElement | null = null;
    public events: Events = new Events();
    //#endregion

    //#region 초기화 및 설정 관리
    // 플러그인 로드 시 실행되는 메서드
    async onload() {
        await this.loadSettings();
        this.presetManager = new PresetManager(this.app, this, this.settings);
        this.settingsManager = new SettingsManager(this, this.presetManager);
        this.searchService = new SearchService(this);
        await this.presetManager.initialize();
        await this.initializePlugin();
    
        this.addRibbonIcon('layers-3', t('OPEN_CARD_NAVIGATOR'), () => {
            this.activateView();
        });
    }

    // 플러그인 언로드 시 실행되는 메서드
    async onunload() {
        if (this.ribbonIconEl) {
            this.ribbonIconEl.detach();
        }
    }

    // 플러그인 초기화 메서드
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

    // i18n 초기화 메서드
    private async initializeI18n() {
        const resources = await this.loadLanguageResources();
        await i18next.init({
            lng: translationLanguage,
            fallbackLng: "en",
            resources,
        });
    }

    // 언어 리소스 로드 메서드
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

    // 설정 로드 메서드
    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    }

    // 설정 저장 메서드
    async saveSettings() {
        await this.saveData(this.settings);
        this.events.trigger('settings-updated');
    }
    //#endregion

    //#region 뷰 관리
    // 카드 네비게이터 뷰 활성화 메서드
    async activateView() {
        const { workspace } = this.app;
        let leaf: WorkspaceLeaf | null = null;
    
        const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];
        
        if (existingLeaf) {
            leaf = existingLeaf;
            workspace.revealLeaf(leaf);
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
                workspace.revealLeaf(leaf);
            }
        }
    }

    // 첫 번째 카드 네비게이터 뷰 반환 메서드
    private getFirstCardNavigator(): CardNavigatorView | null {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        for (const leaf of leaves) {
            if (leaf.view instanceof CardNavigatorView) {
                return leaf.view;
            }
        }
        return null;
    }

    // 활성화된 카드 네비게이터 뷰 반환 메서드
    private getActiveCardNavigator(): CardNavigatorView | null {
        return this.app.workspace.getActiveViewOfType(CardNavigatorView);
    }
    //#endregion

    //#region 카드 조작
    // 카드 스크롤 메서드
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

    //#region 이벤트 처리
    // 중앙 이벤트 등록 메서드
    private registerCentralizedEvents() {
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshAllViews(RefreshType.LAYOUT);
            })
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.handleFileChange(this.app.workspace.getActiveFile());
            })
        );

        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                this.handleFileChange(file);
            })
        );

        this.events.on('settings-updated', () => {
            this.refreshAllViews(RefreshType.SETTINGS);
        });

        this.registerEvent(
            this.app.vault.on('modify', () => {
                this.refreshAllViews(RefreshType.CONTENT);
            })
        );
    }

    // 모든 뷰 새로고침 메서드
    private refreshAllViews(type: RefreshType) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                if (type === RefreshType.LAYOUT) {
                    leaf.view.refresh(RefreshType.LAYOUT);
                }
                else if (type === RefreshType.SETTINGS) {
                    leaf.view.refreshBatch([RefreshType.SETTINGS, RefreshType.CONTENT]);
                }
                else {
                    leaf.view.refresh(RefreshType.CONTENT);
                }
            }
        });
    }

    // 파일 변경 처리 메서드
    private async handleFileChange(file: TFile | null) {
        // 프리셋 적용
        if (file instanceof TFile) {
            await this.selectAndApplyPreset(file);
        }

        // 폴더 기반 카드 표시 처리
        if (this.settings.cardSetType !== 'activeFolder') return;
        
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

    // 파일에 따른 뷰 업데이트 메서드
    private async updateViewForFile(view: CardNavigatorView, file: TFile) {
        const currentFolderPath = await view.getCurrentFolderPath();
        if (!currentFolderPath || !file.parent) return;

        if (currentFolderPath === file.parent.path) {
            view.refresh(RefreshType.CONTENT);
        } else {
            view.refreshBatch([RefreshType.LAYOUT, RefreshType.SETTINGS, RefreshType.CONTENT]);
        }
    }
    //#endregion

    //#region 레이아웃 관리
    // 레이아웃 업데이트 메서드
    public updateLayout(layout: CardNavigatorSettings['defaultLayout']) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                leaf.view.cardContainer.setLayout(layout);
                this.saveSettings();
                leaf.view.refreshBatch([RefreshType.LAYOUT, RefreshType.SETTINGS]);
            }
        });
    }

    // 설정 탭 새로고침 메서드
    refreshSettingsTab() {
        if (this.settingTab instanceof SettingTab) {
            this.settingTab.display();
        }
    }
    //#endregion

    //#region 명령어 관리
    // 기본 명령어 추가 메서드
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

    // 스크롤 명령어 추가 메서드
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

    //#region 프리셋 관리
    // 프리셋 선택 및 적용 메서드
    private async selectAndApplyPreset(file: TFile) {
        if (this.settings.autoApplyPresets) {
            if (this.settings.autoApplyFolderPresets && file.parent) {
                await this.presetManager.applyFolderPreset(file.parent.path);
            } else {
                await this.presetManager.applyGlobalPreset(this.settings.GlobalPreset);
            }
        }
    }

    // 현재 파일에 대한 프리셋 선택 및 적용 메서드
    async selectAndApplyPresetForCurrentFile() {
        const currentFile = this.app.workspace.getActiveFile();
        if (currentFile) {
            await this.selectAndApplyPreset(currentFile);
        }
    }
    //#endregion
}
