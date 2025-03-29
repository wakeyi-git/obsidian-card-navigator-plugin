import { Plugin, Events, TFile, debounce, moment, WorkspaceLeaf, App, PluginSettingTab, Setting, PluginManifest } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR } from './presentation/views/CardNavigatorView';
import { SettingTab } from './presentation/views/settings/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder, DEFAULT_SETTINGS, RefreshType } from './domain/models/types';
import { SettingsManager } from './presentation/views/settings/settingsManager';
import { PresetManager } from './presentation/views/settings/PresetManager';
import i18next from 'i18next';
import { t } from 'i18next';
import { CardNavigatorViewModel } from './presentation/viewModels/CardNavigatorViewModel';
import { CardUseCase } from './application/useCases/CardUseCase';
import { ObsidianCardRepository } from './infrastructure/obsidian/ObsidianCardRepository';
import { CardSetUseCase } from './application/useCases/CardSetUseCase';
import { ObsidianCardSetRepository } from './infrastructure/obsidian/ObsidianCardSetRepository';
import { EventInitializer } from './infrastructure/events/EventInitializer';
import { IEventStore } from './domain/events/IEventStore';
import { ObsidianEventStore } from './infrastructure/events/ObsidianEventStore';
import { ObsidianLogger } from './infrastructure/logging/Logger';
import { DomainEventDispatcher } from './domain/events/DomainEventDispatcher';
import { ExtendedApp } from './domain/models/types';
import { CardEventHandler } from './domain/events/handlers/CardEventHandler';

// 다국어 지원을 위한 언어 리소스 정의
export const languageResources = {
    en: () => import('./locales/en.json'),
    ko: () => import('./locales/ko.json'),
} as const;

// 사용자 로케일에 기반한 번역 언어 설정 (기본값: 영어)
export const translationLanguage = Object.keys(languageResources).includes(moment.locale()) ? moment.locale() : "en";

// 플러그인 클래스 정의
export class CardNavigatorPlugin extends Plugin {
    //#region 클래스 속성
    public settings: CardNavigatorSettings = DEFAULT_SETTINGS;
    public settingsManager!: SettingsManager;
    public presetManager!: PresetManager;
    public settingTab!: SettingTab;
    private ribbonIconEl: HTMLElement | null = null;
    public events: Events = new Events();
    private view: CardNavigatorView | null = null;
    private viewModel: CardNavigatorViewModel | null = null;
    
    // 이벤트 시스템 관련 속성
    private eventInitializer!: EventInitializer;
    private eventStore!: IEventStore;
    private logger!: ObsidianLogger;
    private eventDispatcher!: DomainEventDispatcher;
    public app!: ExtendedApp;
    //#endregion

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.app = app as ExtendedApp;
    }

    //#region 초기화 및 설정 관리
    // 플러그인 로드 시 실행되는 메서드
    async onload() {
        await this.loadSettings();
        await this.initializeI18n();
        
        // 이벤트 시스템 초기화
        this.logger = new ObsidianLogger(this.app);
        this.eventDispatcher = new DomainEventDispatcher();
        this.eventStore = new ObsidianEventStore(this.app, this.eventDispatcher);
        this.eventInitializer = new EventInitializer(this.app, this.eventStore, this.logger);
        await this.eventInitializer.initialize();
        
        // 의존성 초기화
        this.presetManager = new PresetManager(this.app, this, this.settings);
        this.settingsManager = new SettingsManager(this);
        
        // 프리셋 초기화
        await this.presetManager.initialize();
        
        // 뷰모델 초기화
        const cardRepository = new ObsidianCardRepository(this.app);
        const cardUseCase = new CardUseCase(cardRepository, this.app, this.eventDispatcher);
        const cardSetRepository = new ObsidianCardSetRepository(this.app, cardRepository);
        const cardSetUseCase = new CardSetUseCase(cardSetRepository, this.app);
        this.viewModel = new CardNavigatorViewModel(this.app, this);

        // 기본 카드셋 생성
        const defaultCardSet = await this.viewModel.createCardSet({
            name: 'Default',
            type: this.settings.cardSetType,
            source: this.settings.selectedFolder || '',
            filter: { type: 'search', criteria: { value: '' } },
            sort: { criterion: 'fileName', order: 'asc' }
        });
        this.viewModel.selectCardSet(defaultCardSet.getId());

        // UI 초기화
        this.addRibbonIcon('layers-3', t('OPEN_CARD_NAVIGATOR'), () => {
            this.activateView();
        });

        // 뷰 등록
        if (!this.viewModel) {
            throw new Error('ViewModel is not initialized');
        }
        const viewModel = this.viewModel; // 타입 추론을 위한 변수 할당
        this.registerView(VIEW_TYPE_CARD_NAVIGATOR, (leaf) => new CardNavigatorView(leaf, viewModel));

        // 설정 탭 추가
        this.settingTab = new SettingTab(this.app, this);
        this.addSettingTab(this.settingTab);

        // 명령어 추가
        this.addCommands();

        // 이벤트 등록
        this.registerCentralizedEvents();
    }

    // 플러그인 언로드 시 실행되는 메서드
    async onunload() {
        // 이벤트 시스템 정리
        if (this.eventStore) {
            await this.eventStore.deleteAll();
        }
        
        if (this.ribbonIconEl) {
            this.ribbonIconEl.detach();
        }
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
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
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    // 설정 저장 메서드
    async saveSettings() {
        await this.saveData(this.settings);
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

    /**
     * 현재 활성화된 카드 네비게이터 뷰를 반환합니다.
     */
    private getView(): CardNavigatorView | null {
        return this.getActiveCardNavigator();
    }
    //#endregion

    //#region 이벤트 처리
    private registerCentralizedEvents() {
        // 기존 이벤트 등록
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshAllViews(RefreshType.FULL);
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
                this.refreshAllViews(RefreshType.FULL);
                pendingSettingsUpdate = false;
            }
        }, 250);

        this.events.on('settings-updated', () => {
            pendingSettingsUpdate = true;
            processSettingsUpdate();
        });

        // 파일 시스템 이벤트 등록
        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile) {
                    await this.handleFileModify(file);
                }
            })
        );

        // 도메인 이벤트 핸들러 등록
        const cardEventHandler = new CardEventHandler(this);
        this.eventDispatcher.register('CardEvent', cardEventHandler);
    }

    /**
     * 파일 수정 이벤트를 처리합니다.
     */
    private async handleFileModify(file: TFile): Promise<void> {
        try {
            if (!this.viewModel) return;
            
            const cardUseCase = this.viewModel.getCardUseCase();
            const card = await cardUseCase.findCardByFile(file);
            
            if (card) {
                // 파일 내용이 변경되었으므로 카드 내용 업데이트
                await cardUseCase.updateCardContent(card);
                // 카드 업데이트 이벤트 발생
                await cardUseCase.updateCard(card);
            }
        } catch (error) {
            console.error(`[CardNavigator] 파일 수정 이벤트 처리 중 오류 발생: ${file.path}`, error);
        }
    }

    // 모든 뷰 새로고침 메서드
    public refreshAllViews(type: RefreshType) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            const view = leaf.view as CardNavigatorView;
            if (view instanceof CardNavigatorView) {
                view.refreshBatch([type]);
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
                await this.updateViewForFile(file);
            } catch (error) {
                console.error('[카드 네비게이터] 뷰 업데이트 실패:', error);
            }
        }
    }

    /**
     * 파일 변경에 따라 뷰를 업데이트합니다.
     */
    private async updateViewForFile(file: TFile): Promise<void> {
        const view = this.getView();
        if (!view) return;

        try {
            const currentFolderPath = await view.getCurrentFolderPath();
            if (!currentFolderPath) {
                console.warn('[CardNavigator] 현재 폴더 경로를 가져올 수 없습니다.');
                return;
            }

            if (file.path.startsWith(currentFolderPath)) {
                await view.refresh(RefreshType.CONTENT);
            }
        } catch (error) {
            console.error('[CardNavigator] 뷰 업데이트 실패:', error);
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

    /**
     * 레이아웃 업데이트
     * @param layout 새로운 레이아웃 설정
     */
    public updateLayout(layout: CardNavigatorSettings['defaultLayout']): void {
        this.settings.defaultLayout = layout;
        this.saveSettings();
        this.refreshAllViews(RefreshType.FULL);
    }

    /**
     * ViewModel 반환
     */
    public getViewModel(): CardNavigatorViewModel {
        if (!this.viewModel) {
            throw new Error('ViewModel is not initialized');
        }
        return this.viewModel;
    }

    //#region 이벤트 디스패처 접근자
    /**
     * 이벤트 디스패처를 반환합니다.
     */
    public getEventDispatcher(): DomainEventDispatcher {
        return this.eventDispatcher;
    }

    /**
     * 이벤트 저장소를 반환합니다.
     */
    public getEventStore(): IEventStore {
        return this.eventStore;
    }

    /**
     * 로거를 반환합니다.
     */
    public getLogger(): ObsidianLogger {
        return this.logger;
    }
    //#endregion
}

// 기본 내보내기
export default CardNavigatorPlugin;