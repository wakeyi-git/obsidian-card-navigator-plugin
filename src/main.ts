import { Plugin, Events, TFile, TAbstractFile, debounce, moment  } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR, RefreshType } from './ui/cardNavigatorView';
import { SettingTab } from './ui/settings/settingsTab';
import { CardNavigatorSettings, ScrollDirection, DEFAULT_SETTINGS } from './common/types';
import { SettingsManager } from './ui/settings/settingsManager';
import { PresetManager } from './ui/settings/PresetManager';
import i18next from 'i18next';
import { t } from 'i18next';
import { SearchService } from 'ui/toolbar/search/';
import { ResizeService } from './common/ResizeService';

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
    private resizeService!: ResizeService;
    //#endregion

    //#region 초기화 및 설정 관리
    // 플러그인 로드 시 실행되는 메서드
    async onload() {
        await this.loadSettings();
        
        // ResizeService 초기화
        this.resizeService = ResizeService.getInstance();
        this.resizeService.setDebug(this.settings.debug);
        
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
        // ResizeService 정리
        if (this.resizeService) {
            this.resizeService.disconnect();
        }
        
        // 모든 CardNavigatorView 인스턴스 닫기
        this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR).forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                leaf.view.onClose();
            }
        });
        
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
        // 여기서는 이벤트를 트리거하지 않음
    }
    //#endregion

    //#region 뷰 관리
    // 카드 네비게이터 뷰 활성화 메서드
    async activateView() {
        const { workspace } = this.app;
        
        // 기존 뷰가 있으면 해당 뷰를 활성화
        const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];
        
        if (existingLeaf) {
            workspace.revealLeaf(existingLeaf);
            return;
        }
        
        // 기존 뷰가 없으면 새 뷰 생성
        const leaf = workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
            workspace.revealLeaf(leaf);
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
                const isVertical = cardContainer.layoutManager.getLayoutDirection() === 'vertical';

                // 방향에 따라 적절한 스크롤 메서드 호출
                switch (direction) {
                    case 'up':
                    case 'down':
                        const method = direction === 'up' ? 'scrollUp' : 'scrollDown';
                        isVertical ? cardContainer[method](count) : cardContainer[direction === 'up' ? 'scrollLeft' : 'scrollRight'](count);
                        break;
                    case 'left':
                    case 'right':
                        cardContainer[direction === 'left' ? 'scrollLeft' : 'scrollRight'](count);
                        break;
                }
            }
        });
    }
    //#endregion

    //#region 이벤트 처리
    // 중앙 이벤트 등록 메서드
    private registerCentralizedEvents() {
        // 레이아웃 변경 이벤트
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshAllViews(RefreshType.LAYOUT);
            })
        );

        // 파일 열기 이벤트
        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                this.handleFileChange(file);
            })
        );

        // 활성 폴더 변경 이벤트 처리
        this.events.on('active-folder-changed', async (...data) => {
            const folderPath = data[0] as string;
            const previousFolderPath = data[1] as string;
            console.log(`[CardNavigatorPlugin] 활성 폴더 변경 감지: ${previousFolderPath} -> ${folderPath}`);
            
            if (this.settings.cardSetType === 'activeFolder') {
                // 모든 카드 네비게이터 뷰 강제 새로고침
                const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
                
                // 모든 뷰에 대해 병렬로 처리
                await Promise.all(leaves.map(async (leaf) => {
                    if (leaf.view instanceof CardNavigatorView) {
                        console.log(`[CardNavigatorPlugin] 뷰 강제 새로고침 (활성 폴더 변경: ${folderPath})`);
                        
                        try {
                            // 먼저 카드 컨테이너의 카드를 모두 제거
                            leaf.view.cardContainer.clearCards();
                            
                            // 즉시 새 카드 로드 (비동기 처리)
                            await leaf.view.cardContainer.loadCards();
                            
                            // 새로고침 후 활성 카드 강조
                            leaf.view.cardContainer.highlightActiveCard();
                            
                            // 레이아웃 새로고침
                            leaf.view.cardContainer.refreshLayout();
                        } catch (error) {
                            console.error('[CardNavigatorPlugin] 폴더 변경 처리 중 오류:', error);
                        }
                    }
                }));
            }
        });

        // 설정 업데이트 이벤트 처리를 디바운스
        const processSettingsUpdate = debounce(() => {
            this.refreshAllViews(RefreshType.SETTINGS);
        }, 300); // 디바운스 시간 증가

        this.events.on('settings-updated', processSettingsUpdate);

        // 파일 수정 이벤트를 디바운스
        const processFileModify = debounce((file: TAbstractFile) => {
            if (file instanceof TFile) {
                this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)
                    .forEach(leaf => {
                        if (leaf.view instanceof CardNavigatorView) {
                            // 파일 정보를 전달하여 해당 카드만 업데이트
                            leaf.view.refreshFileContent(file);
                        }
                    });
            }
        }, 300);

        this.registerEvent(
            this.app.vault.on('modify', processFileModify)
        );
    }

    // 모든 뷰 새로고침 메서드
    private refreshAllViews(type: RefreshType) {
        this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)
            .forEach(leaf => {
                if (leaf.view instanceof CardNavigatorView) {
                    leaf.view.refreshBatch([type]);
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
        if (this.settings.cardSetType !== 'activeFolder' || 
            !file || 
            !(file instanceof TFile) || 
            file.extension !== 'md') return;

        // 모든 카드 네비게이터 뷰 업데이트
        this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)
            .forEach(async leaf => {
                if (leaf.view instanceof CardNavigatorView) {
                    try {
                        await this.updateViewForFile(leaf.view, file);
                    } catch (error) {
                        console.error('[카드 네비게이터] 뷰 업데이트 실패:', error);
                    }
                }
            });
    }

    // 파일에 따른 뷰 업데이트 메서드
    private async updateViewForFile(view: CardNavigatorView, file: TFile) {
        const currentFolderPath = await view.getCurrentFolderPath();
        if (!currentFolderPath || !file.parent) return;

        // 현재 폴더와 파일의 부모 폴더가 같은 경우에만 내용 새로고침
        // 다른 경우에는 레이아웃, 설정, 내용을 모두 새로고침
        if (currentFolderPath === file.parent.path) {
            view.refresh(RefreshType.CONTENT);
        } else {
            view.refreshBatch([RefreshType.LAYOUT, RefreshType.CONTENT]);
        }
    }
    //#endregion

    //#region 레이아웃 관리
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
                } else {
                    // 카드 네비게이터가 없으면 먼저 열고 포커스 설정
                    this.activateView().then(async () => {
                        const newCardNavigator = this.getFirstCardNavigator();
                        if (newCardNavigator) {
                            const leaf = this.app.workspace.getLeaf();
                            if (leaf) {
                                leaf.view.containerEl.focus();
                                await new Promise(resolve => setTimeout(resolve, 100)); // 뷰가 완전히 로드될 시간을 주기 위한 지연
                                newCardNavigator.focusNavigator();
                            }
                        }
                    });
                }
            }
        });

        this.addCommand({
            id: 'focus-search-input',
            name: t('MOVE_FOCUS_TO_SEARCH_INPUT'),
            callback: async () => {
                const cardNavigator = this.getFirstCardNavigator();
                if (cardNavigator) {
                    const leaf = this.app.workspace.getLeaf();
                    if (leaf) {
                        leaf.view.containerEl.focus();
                        await new Promise(resolve => setTimeout(resolve, 0));
                        cardNavigator.focusSearchInput();
                    }
                } else {
                    // 카드 네비게이터가 없으면 먼저 열고 포커스 설정
                    this.activateView().then(async () => {
                        const newCardNavigator = this.getFirstCardNavigator();
                        if (newCardNavigator) {
                            const leaf = this.app.workspace.getLeaf();
                            if (leaf) {
                                leaf.view.containerEl.focus();
                                await new Promise(resolve => setTimeout(resolve, 100)); // 뷰가 완전히 로드될 시간을 주기 위한 지연
                                newCardNavigator.focusSearchInput();
                            }
                        }
                    });
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
            { id: 'scroll-up-page', name: t('SCROLL_UP_LEFT_ONE_PAGE'), direction: 'up', count: this.settings.cardsPerColumn },
            { id: 'scroll-down-page', name: t('SCROLL_DOWN_RIGHT_ONE_PAGE'), direction: 'down', count: this.settings.cardsPerColumn }
        ];

        scrollCommands.forEach(({ id, name, direction, count }) => {
            this.addCommand({
                id,
                name,
                callback: () => this.scrollCards(direction as ScrollDirection, count)
            });
        });
    }
    //#endregion

    //#region 프리셋 관리
    // 프리셋 선택 및 적용 메서드
    private async selectAndApplyPreset(file: TFile) {
        if (!this.settings.autoApplyPresets) return;
        
        if (this.settings.autoApplyFolderPresets && file.parent) {
            await this.presetManager.applyFolderPreset(file.parent.path);
        } else {
            await this.presetManager.applyGlobalPreset(this.settings.GlobalPreset);
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
