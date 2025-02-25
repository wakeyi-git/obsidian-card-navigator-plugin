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
        // 여기서는 이벤트를 트리거하지 않음
    }
    //#endregion

    //#region 뷰 관리
    // 카드 네비게이터 뷰 활성화 메서드
    async activateView() {
        console.log('[CardNavigator] activateView 호출됨');
        const { workspace } = this.app;
        let leaf: WorkspaceLeaf | null = null;
    
        const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];
        
        if (existingLeaf) {
            console.log('[CardNavigator] 기존 뷰 발견, 단순 표시만 수행');
            // 이미 존재하는 뷰인 경우 단순히 표시만 하고 리프레시는 하지 않음
            leaf = existingLeaf;
            workspace.revealLeaf(leaf);
            
            // 이미 초기화된 뷰인 경우 프리셋 적용
            if (leaf.view instanceof CardNavigatorView && 
                leaf.view.cardContainer && 
                typeof leaf.view.cardContainer.setLayout === 'function') {
                console.log('[CardNavigator] 기존 뷰에 프리셋 적용');
                await this.selectAndApplyPresetForCurrentFile();
            } else {
                console.log('[CardNavigator] 기존 뷰가 아직 초기화되지 않음, 프리셋 적용 건너뜀');
            }
        } else {
            console.log('[CardNavigator] 새 뷰 생성 시작');
            // 새로운 뷰를 생성하는 경우
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                console.log('[CardNavigator] 뷰 상태 설정 전');
                
                // 뷰 초기화 완료 이벤트를 위한 프로미스 생성
                const viewInitialized = new Promise<void>((resolve) => {
                    // 이벤트 리스너 등록
                    const onViewInitialized = () => {
                        console.log('[CardNavigator] 뷰 초기화 완료 이벤트 수신');
                        this.events.off('view-initialized', onViewInitialized);
                        resolve();
                    };
                    this.events.on('view-initialized', onViewInitialized);
                    
                    // 타임아웃 설정 (10초 후 자동 해제)
                    setTimeout(() => {
                        this.events.off('view-initialized', onViewInitialized);
                        console.log('[CardNavigator] 뷰 초기화 타임아웃, 계속 진행');
                        resolve();
                    }, 10000);
                });
                
                // 뷰 상태 설정 - 이 과정에서 onOpen이 호출되어 초기화됨
                await leaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
                console.log('[CardNavigator] 뷰 상태 설정 완료');
                workspace.revealLeaf(leaf);
                
                // 뷰 초기화 완료 이벤트 대기
                console.log('[CardNavigator] 뷰 초기화 완료 이벤트 대기 시작');
                await viewInitialized;
                console.log('[CardNavigator] 뷰 초기화 완료 이벤트 대기 종료');
                
                // 추가 안전 장치: 뷰가 실제로 초기화되었는지 확인
                if (leaf.view instanceof CardNavigatorView) {
                    const view = leaf.view;
                    let attempts = 0;
                    const maxAttempts = 20;
                    
                    // 카드 컨테이너가 초기화될 때까지 대기
                    while (attempts < maxAttempts && !view.isInitialized()) {
                        console.log(`[CardNavigator] 카드 컨테이너 초기화 대기 중... (시도 ${attempts + 1}/${maxAttempts})`);
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }
                    
                    if (view.isInitialized()) {
                        console.log('[CardNavigator] 카드 컨테이너가 완전히 초기화됨, 프리셋 적용 진행');
                    } else {
                        console.log('[CardNavigator] 카드 컨테이너 초기화 실패, 프리셋 적용 시도는 계속 진행');
                    }
                }
                
                // 현재 파일에 맞는 프리셋 적용
                console.log('[CardNavigator] 프리셋 적용 시작');
                await this.selectAndApplyPresetForCurrentFile();
                console.log('[CardNavigator] 프리셋 적용 완료');
            }
        }
        console.log('[CardNavigator] activateView 완료');
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
        // layout-change 이벤트 핸들러에 디바운스 적용
        const processLayoutChange = debounce(() => {
            console.log('[CardNavigator] layout-change 이벤트 처리 시작');
            
            // 약간의 지연 후 레이아웃 업데이트 실행
            setTimeout(() => {
                // 모든 카드 네비게이터 뷰 가져오기
                const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
                
                // 초기화 중인 뷰가 있는지 확인
                const hasInitializingView = leaves.some(leaf => 
                    leaf.view instanceof CardNavigatorView && 
                    !leaf.view.isInitialized()
                );
                
                if (hasInitializingView) {
                    console.log('[CardNavigator] 초기화 중인 뷰가 있음, 레이아웃 업데이트 지연');
                    // 초기화 중인 뷰가 있으면 이벤트 처리를 지연 (500ms 후 재시도)
                    setTimeout(() => processLayoutChange(), 500);
                    return;
                }
                
                // 초기화된 뷰가 있는지 확인 - 더 엄격한 검사 추가
                const hasInitializedView = leaves.some(leaf => {
                    if (leaf.view instanceof CardNavigatorView) {
                        // 카드 컨테이너가 존재하고, 필요한 메서드가 있으며, 
                        // 카드 렌더러가 초기화되었는지 확인
                        return leaf.view.cardContainer && 
                               typeof leaf.view.cardContainer.setLayout === 'function' &&
                               leaf.view.isInitialized();
                    }
                    return false;
                });
                
                if (hasInitializedView) {
                    console.log('[CardNavigator] 완전히 초기화된 뷰 발견, 레이아웃 업데이트 실행');
                    this.refreshAllViews(RefreshType.LAYOUT);
                } else {
                    console.log('[CardNavigator] 완전히 초기화된 뷰 없음, 레이아웃 업데이트 건너뜀');
                }
                
                console.log('[CardNavigator] layout-change 이벤트 처리 완료');
            }, 300); // 뷰가 초기화될 시간을 주기 위해 300ms 지연
        }, 300); // 디바운스 시간을 200ms에서 300ms로 증가

        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                console.log('[CardNavigator] layout-change 이벤트 발생');
                processLayoutChange();
            })
        );

        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                this.handleFileChange(file);
            })
        );

        // 설정 업데이트 이벤트 처리를 디바운스하고 배치로 처리
        let pendingSettingsUpdate = false;
        const processSettingsUpdate = debounce(() => {
            if (pendingSettingsUpdate) {
                this.refreshAllViews(RefreshType.SETTINGS);
                pendingSettingsUpdate = false;
            }
        }, 50); // 디바운스 시간을 50ms로 감소

        this.events.on('settings-updated', () => {
            pendingSettingsUpdate = true;
            processSettingsUpdate();
        });

        this.registerEvent(
            this.app.vault.on('modify', () => {
                this.refreshAllViews(RefreshType.CONTENT);
            })
        );
    }

    // 모든 뷰 새로고침 메서드
    private refreshAllViews(type: RefreshType) {
        console.log(`[CardNavigator] refreshAllViews 호출됨, 타입: ${type}`);
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                // 뷰가 초기화되었는지 확인
                const view = leaf.view;
                
                // 뷰가 완전히 초기화되었는지 확인
                const isInitialized = view.isInitialized();
                
                if (isInitialized) {
                    console.log(`[CardNavigator] 뷰 리프레시 실행, 타입: ${type}`);
                    view.refreshBatch([type]);
                } else {
                    console.log(`[CardNavigator] 뷰가 완전히 초기화되지 않음, 리프레시 중단`);
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
        console.log('[CardNavigator] CardNavigatorPlugin.updateLayout 호출됨, 레이아웃:', layout);
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                const view = leaf.view;
                if (view.cardContainer && typeof view.cardContainer.setLayout === 'function') {
                    console.log('[CardNavigator] 카드 컨테이너 setLayout 호출');
                    view.cardContainer.setLayout(layout);
                    console.log('[CardNavigator] 카드 컨테이너 setLayout 완료');
                } else {
                    console.log('[CardNavigator] 카드 컨테이너가 초기화되지 않음, 레이아웃 업데이트 중단');
                }
                // 설정 저장만 하고 리프레시는 settingsManager에서 처리
                this.saveData(this.settings);
            }
        });
        console.log('[CardNavigator] CardNavigatorPlugin.updateLayout 완료');
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
