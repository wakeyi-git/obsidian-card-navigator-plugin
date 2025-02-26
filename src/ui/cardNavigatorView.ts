import { ItemView, WorkspaceLeaf, Menu, TFile, TFolder } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { sortFiles } from 'common/utils';
import { t } from 'i18next';

// 카드 네비게이터 뷰의 고유 식별자
export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

// 리프레시 유형을 정의하는 enum
export enum RefreshType {
    LAYOUT = 'layout',    // 레이아웃/리사이즈 관련 리프레시
    CONTENT = 'content',  // 파일 내용 변경 관련 리프레시
    SETTINGS = 'settings', // 설정 변경 관련 리프레시
    ALL = 'all'           // 전체 업데이트
}

export class CardNavigatorView extends ItemView {
    //#region 클래스 속성
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private refreshDebounceTimers: Map<RefreshType, NodeJS.Timeout> = new Map();
    private isRefreshInProgress = false;
    private pendingRefreshTypes = new Set<RefreshType>();
    private refreshTimeout: NodeJS.Timeout | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_COOLDOWN = 50; // 50ms 쿨다운
    private _initialized = false; // 초기화 완료 상태를 추적하는 플래그
    //#endregion

    //#region 초기화 및 기본 메서드
    // 생성자
    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.toolbar = new Toolbar(this.plugin);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
    }

    // 뷰가 완전히 초기화되었는지 확인하는 메서드
    public isInitialized(): boolean {
        const hasCardContainer = !!this.cardContainer;
        const hasSetLayoutMethod = hasCardContainer && typeof this.cardContainer.setLayout === 'function';
        const hasDisplayCardsMethod = hasCardContainer && typeof this.cardContainer.displayCards === 'function';
        const hasLayoutManager = hasCardContainer && !!this.cardContainer['layoutManager'];
        const isLayoutManagerInitialized = hasLayoutManager && 
            typeof this.cardContainer['layoutManager'].getLayoutStrategy === 'function' &&
            typeof this.cardContainer['layoutManager'].setLayout === 'function';
        
        // 디버깅을 위한 로그 추가
        if (!this._initialized || !hasCardContainer || !hasSetLayoutMethod || !hasDisplayCardsMethod || !hasLayoutManager) {
            console.log('[CardNavigator] 뷰 초기화 상태 확인:', 
                        '_initialized =', this._initialized,
                        ', hasCardContainer =', hasCardContainer,
                        ', hasSetLayoutMethod =', hasSetLayoutMethod,
                        ', hasDisplayCardsMethod =', hasDisplayCardsMethod,
                        ', hasLayoutManager =', hasLayoutManager,
                        ', isLayoutManagerInitialized =', isLayoutManagerInitialized);
        }
        
        // 레이아웃 매니저가 초기화되지 않았지만 다른 모든 조건이 충족되는 경우
        // 부분적으로 초기화된 것으로 간주하고 true 반환
        // 이렇게 하면 refreshBatch 등의 메서드가 실행될 수 있고, 그 안에서 레이아웃 매니저 초기화 여부를 다시 확인함
        if (this._initialized && hasCardContainer && hasSetLayoutMethod && hasDisplayCardsMethod) {
            if (!hasLayoutManager || !isLayoutManagerInitialized) {
                console.log('[CardNavigator] 레이아웃 매니저가 초기화되지 않았지만 다른 조건은 충족됨, 부분 초기화로 간주');
                return true;
            }
            return true;
        }
        
        return this._initialized && 
               hasCardContainer && 
               hasSetLayoutMethod &&
               hasDisplayCardsMethod &&
               hasLayoutManager &&
               isLayoutManagerInitialized;
    }

    // 뷰 타입 반환 메서드
    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    // 표시 텍스트 반환 메서드
    getDisplayText(): string {
        return t("CARD_NAVIGATOR");
    }

    // 아이콘 반환 메서드
    getIcon(): string {
        return "layers-3";
    }

    // 뷰 열기 메서드
    async onOpen() {
        console.log('[CardNavigator] CardNavigatorView.onOpen 시작');
        this._initialized = false; // 초기화 시작 시 플래그 재설정
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const navigatorEl = container.createDiv('card-navigator');
        const toolbarEl = navigatorEl.createDiv('card-navigator-toolbar');
        const cardContainerEl = navigatorEl.createDiv('card-navigator-container');

        console.log('[CardNavigator] 툴바 초기화 시작');
        this.toolbar.initialize(toolbarEl);
        console.log('[CardNavigator] 툴바 초기화 완료');
        
        // 뷰가 처음 생성되는 경우인지 확인
        const isNewView = !this.containerEl.closest('.workspace-leaf')?.hasClass('mod-active');
        
        // 컨테이너 초기화 이벤트 리스너 추가
        const containerInitListener = (e: Event) => {
            console.log('[CardNavigator] 컨테이너 초기화 완료 이벤트 수신');
            cardContainerEl.removeEventListener('container-initialized', containerInitListener);
            clearTimeout(initTimeoutId); // 타임아웃 취소
            
            // 이벤트 데이터에서 레이아웃 매니저 초기화 상태 확인
            const customEvent = e as CustomEvent;
            const layoutManagerInitialized = customEvent.detail?.layoutManagerInitialized === true;
            console.log('[CardNavigator] 이벤트에서 레이아웃 매니저 초기화 상태:', layoutManagerInitialized);
            
            // 초기화 완료 플래그 설정
            this._initialized = true;
            console.log('[CardNavigator] 뷰 초기화 완료 플래그 설정됨');
            
            // 초기 카드 표시
            console.log('[CardNavigator] 초기 카드 표시 시작');
            
            // 레이아웃 매니저 초기화 상태에 따라 다른 리프레시 타입 사용
            if (layoutManagerInitialized) {
                // 레이아웃 매니저가 초기화된 경우 전체 리프레시
                this.refresh(RefreshType.CONTENT).then(() => {
                    console.log('[CardNavigator] 초기 카드 표시 완료');
                    
                    // 초기화 완료 이벤트 발생
                    this.plugin.events.trigger('view-initialized', this);
                    console.log('[CardNavigator] 뷰 초기화 완료 이벤트 발생');
                });
            } else {
                // 레이아웃 매니저가 초기화되지 않은 경우 레이아웃 업데이트 없이 컨텐츠만 리프레시
                console.log('[CardNavigator] 레이아웃 매니저가 초기화되지 않음, 레이아웃 업데이트 건너뜀');
                
                // 약간의 지연 후 다시 시도 (레이아웃 매니저 초기화 대기)
                setTimeout(() => {
                    if (this.cardContainer && typeof this.cardContainer.setLayout === 'function') {
                        console.log('[CardNavigator] 레이아웃 매니저가 이제 초기화됨, 리프레시 진행');
                        this.refresh(RefreshType.CONTENT).then(() => {
                            console.log('[CardNavigator] 지연된 초기 카드 표시 완료');
                            
                            // 초기화 완료 이벤트 발생
                            this.plugin.events.trigger('view-initialized', this);
                            console.log('[CardNavigator] 지연된 뷰 초기화 완료 이벤트 발생');
                        });
                    } else {
                        console.log('[CardNavigator] 레이아웃 매니저가 여전히 초기화되지 않음, 컨텐츠만 표시');
                        // 컨텐츠만 표시 (레이아웃 업데이트 없이)
                        this.displayContent().then(() => {
                            console.log('[CardNavigator] 컨텐츠만 표시 완료');
                            
                            // 초기화 완료 이벤트 발생
                            this.plugin.events.trigger('view-initialized', this);
                            console.log('[CardNavigator] 제한된 뷰 초기화 완료 이벤트 발생');
                        });
                    }
                }, 200);
            }
        };
        
        // 초기화 타임아웃 설정 - 새 뷰인 경우 더 짧은 타임아웃 적용
        const timeoutDuration = isNewView ? 1000 : 2000; // 타임아웃 시간 단축
        const initTimeoutId = setTimeout(() => {
            console.log('[CardNavigator] 컨테이너 초기화 이벤트 타임아웃 발생');
            cardContainerEl.removeEventListener('container-initialized', containerInitListener);
            
            // 초기화 완료 플래그 설정
            if (!this._initialized && this.cardContainer) {
                this._initialized = true;
                console.log('[CardNavigator] 타임아웃 후 뷰 초기화 완료 플래그 설정됨');
                
                // 초기 카드 표시
                console.log('[CardNavigator] 타임아웃 후 초기 카드 표시 시작');
                this.refresh(RefreshType.CONTENT).then(() => {
                    console.log('[CardNavigator] 타임아웃 후 초기 카드 표시 완료');
                    
                    // 초기화 완료 이벤트 발생
                    this.plugin.events.trigger('view-initialized', this);
                    console.log('[CardNavigator] 타임아웃 후 뷰 초기화 완료 이벤트 발생');
                });
            }
        }, timeoutDuration);
        
        cardContainerEl.addEventListener('container-initialized', containerInitListener);
        
        console.log('[CardNavigator] 카드 컨테이너 초기화 시작');
        try {
            await this.cardContainer.initialize(cardContainerEl);
            console.log('[CardNavigator] 카드 컨테이너 초기화 완료');
            
            // 새 뷰인 경우 초기화 이벤트를 기다리지 않고 바로 진행
            if (isNewView && !this._initialized) {
                console.log('[CardNavigator] 새 뷰 감지, 초기화 이벤트를 기다리지 않고 바로 진행');
                clearTimeout(initTimeoutId); // 타임아웃 취소
                cardContainerEl.removeEventListener('container-initialized', containerInitListener);
                
                // 초기화 완료 플래그 설정
                this._initialized = true;
                
                // 초기 카드 표시
                console.log('[CardNavigator] 초기 카드 표시 시작 (새 뷰)');
                await this.refresh(RefreshType.CONTENT);
                console.log('[CardNavigator] 초기 카드 표시 완료 (새 뷰)');
                
                // 초기화 완료 이벤트 발생
                this.plugin.events.trigger('view-initialized', this);
                console.log('[CardNavigator] 뷰 초기화 완료 이벤트 발생 (새 뷰)');
                return;
            }
            
            // 컨테이너 초기화 이벤트가 발생하지 않은 경우를 위한 안전장치
            if (!this._initialized) {
                console.log('[CardNavigator] 컨테이너 초기화 이벤트가 발생하지 않음, 수동으로 초기화 완료 처리');
                clearTimeout(initTimeoutId); // 타임아웃 취소
                cardContainerEl.removeEventListener('container-initialized', containerInitListener);
                
                // 초기화 완료 플래그 설정
                this._initialized = true;
                
                // 초기 카드 표시
                console.log('[CardNavigator] 초기 카드 표시 시작 (수동)');
                await this.refresh(RefreshType.CONTENT);
                console.log('[CardNavigator] 초기 카드 표시 완료 (수동)');
                
                // 초기화 완료 이벤트 발생
                this.plugin.events.trigger('view-initialized', this);
                console.log('[CardNavigator] 뷰 초기화 완료 이벤트 발생 (수동)');
            }
        } catch (error) {
            console.error('[CardNavigator] 카드 컨테이너 초기화 중 오류 발생:', error);
            this._initialized = false; // 오류 발생 시 초기화 실패로 표시
            
            // 이벤트 리스너 제거
            cardContainerEl.removeEventListener('container-initialized', containerInitListener);
        }
        
        console.log('[CardNavigator] CardNavigatorView.onOpen 완료');
    }

    // 뷰 닫기 메서드
    async onClose() {
        this.toolbar.onClose();
        this.cardContainer.onClose();
        this._initialized = false; // 뷰 닫힐 때 초기화 상태 재설정
    }
    //#endregion

    //#region 폴더 및 파일 관리
    // 현재 폴더 경로 반환 메서드
    public async getCurrentFolderPath(): Promise<string | null> {
        const folder = await this.getCurrentFolder();
        return folder?.path || null;
    }

    // 현재 폴더 반환 메서드
    private async getCurrentFolder(): Promise<TFolder | null> {
        if (this.plugin.settings.cardSetType === 'selectedFolder' && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else if (this.plugin.settings.cardSetType === 'vault') {
            return this.plugin.app.vault.getRoot();
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
        }
    }

    // 파일 정렬 메서드
    private sortFiles(files: TFile[]): TFile[] {
        const mdFiles = files.filter(file => file.extension === 'md');
        return sortFiles(mdFiles, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
    }
    //#endregion

    //#region 카드 컨테이너 관리
    // 카드 컨테이너 컨텐츠 업데이트 메서드
    private async updateCardContainerContent() {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const files = folder.children.filter((file: any): file is TFile => file instanceof TFile);
        const mdFiles = files.filter(file => file.extension === 'md');
        const sortedFiles = this.sortFiles(mdFiles);
        await this.cardContainer.displayCards(sortedFiles);
    }

    // 레이아웃 설정 업데이트 메서드
    private updateLayout() {
        console.log('[CardNavigator] updateLayout 호출됨');
        
        // 더 엄격한 검사: 초기화 상태와 필요한 메서드 확인
        if (!this.cardContainer) {
            console.log('[CardNavigator] 카드 컨테이너가 없음, 레이아웃 업데이트 중단');
            return;
        }
        
        if (typeof this.cardContainer.setLayout !== 'function') {
            console.log('[CardNavigator] setLayout 메서드가 없음, 레이아웃 업데이트 중단');
            return;
        }
        
        // 레이아웃 매니저가 초기화되었는지 확인
        const hasLayoutManager = !!this.cardContainer['layoutManager'];
        const isLayoutManagerInitialized = hasLayoutManager && 
            typeof this.cardContainer['layoutManager'].getLayoutStrategy === 'function' &&
            typeof this.cardContainer['layoutManager'].setLayout === 'function';
            
        if (!isLayoutManagerInitialized) {
            console.log('[CardNavigator] 레이아웃 매니저가 초기화되지 않음, 레이아웃 설정 중단');
            
            // 레이아웃 매니저가 초기화되지 않은 경우 지연 후 다시 시도
            setTimeout(() => {
                const isInitializedNow = !!this.cardContainer && 
                    !!this.cardContainer['layoutManager'] &&
                    typeof this.cardContainer['layoutManager'].getLayoutStrategy === 'function' &&
                    typeof this.cardContainer['layoutManager'].setLayout === 'function';
                    
                if (isInitializedNow) {
                    console.log('[CardNavigator] 레이아웃 매니저가 이제 초기화됨, 레이아웃 업데이트 재시도');
                    this.updateLayout();
                } else {
                    console.log('[CardNavigator] 레이아웃 매니저가 여전히 초기화되지 않음, 레이아웃 업데이트 포기');
                }
            }, 200);
            
            return;
        }
        
        try {
            const settings = this.plugin.settings;
            if (settings.defaultLayout) {
                console.log('[CardNavigator] 레이아웃 설정:', settings.defaultLayout);
                this.cardContainer.setLayout(settings.defaultLayout);
            } else {
                console.log('[CardNavigator] 기본 레이아웃 사용: auto');
                this.cardContainer.setLayout('auto');
            }
            console.log('[CardNavigator] updateLayout 완료');
        } catch (error) {
            console.error('[CardNavigator] 레이아웃 업데이트 중 오류 발생:', error);
        }
    }
    //#endregion

    //#region 카드 상호작용
    // 컨텍스트 메뉴 열기 메서드
    public openContextMenu() {
        const focusedCard = this.getFocusedCard();
        if (!focusedCard) return;

        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (!file) return;

        const menu = new Menu();

        this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

        menu.addSeparator();

        menu.addItem((item) => {
            item
                .setTitle(t('COPY_AS_LINK'))
                .setIcon('link')
                .onClick(() => {
                    this.cardContainer.cardMaker.copyLink(file);
                });
        });

        menu.addItem((item) => {
            item
                .setTitle(t('COPY_CARD_CONTENT'))
                .setIcon('file-text')
                .onClick(async () => {
                    await this.cardContainer.cardMaker.copyCardContent(file);
                });
        });

        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

    // 키보드 네비게이터 포커스 메서드
    public focusNavigator() {
        this.cardContainer.focusNavigator();
    }

    // 포커스된 카드 요소 반환 메서드
    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-navigator-focused');
    }
    //#endregion

    //#region 리프레시 관리
    // 배치 리프레시 실행 메서드
    public async refreshBatch(types: RefreshType[]) {
        console.log('[CardNavigator] refreshBatch 호출됨, 타입:', types);
        
        // 뷰가 초기화되었는지 더 엄격하게 확인
        if (!this.isInitialized()) {
            console.log('[CardNavigator] 뷰가 완전히 초기화되지 않음, refreshBatch 중단');
            console.log('[CardNavigator] 초기화 상태: cardContainer 존재 =', !!this.cardContainer, 
                        ', setLayout 메서드 존재 =', !!(this.cardContainer && typeof this.cardContainer.setLayout === 'function'),
                        ', displayCards 메서드 존재 =', !!(this.cardContainer && typeof this.cardContainer.displayCards === 'function'));
            
            // 초기화되지 않은 경우 나중에 다시 시도하도록 타이머 설정
            setTimeout(() => {
                if (this.isInitialized()) {
                    console.log('[CardNavigator] 뷰가 이제 초기화됨, refreshBatch 재시도');
                    this.refreshBatch(types);
                } else {
                    console.log('[CardNavigator] 뷰가 여전히 초기화되지 않음, refreshBatch 포기');
                }
            }, 500);
            
            return;
        }
        
        if (!this.cardContainer) {
            console.log('[CardNavigator] 카드 컨테이너가 없음, 리프레시 중단');
            return;
        }
        
        // 현재 시간과 마지막 리프레시 시간을 비교
        const now = Date.now();
        if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
            // 쿨다운 중이면 타입을 병합하고 대기
            types.forEach(type => this.pendingRefreshTypes.add(type));
            console.log('[CardNavigator] 쿨다운 중, 대기 중인 타입:', Array.from(this.pendingRefreshTypes));
            
            // 이미 대기 중인 타이머가 있다면 취소
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout);
                console.log('[CardNavigator] 기존 타이머 취소');
            }
            
            // 새로운 타이머 설정
            console.log('[CardNavigator] 새 타이머 설정');
            this.refreshTimeout = setTimeout(() => {
                this.refreshTimeout = null;
                const pendingTypes = Array.from(this.pendingRefreshTypes);
                this.pendingRefreshTypes.clear();
                console.log('[CardNavigator] 쿨다운 후 리프레시 실행, 타입:', pendingTypes);
                if (pendingTypes.length > 0) {
                    this.refreshBatch(pendingTypes);
                }
            }, this.REFRESH_COOLDOWN);
            
            return;
        }

        // 이미 진행 중인 리프레시가 있으면 타입을 병합하고 대기
        if (this.isRefreshInProgress) {
            types.forEach(type => this.pendingRefreshTypes.add(type));
            console.log('[CardNavigator] 이미 리프레시 진행 중, 대기 중인 타입:', Array.from(this.pendingRefreshTypes));
            return;
        }

        try {
            this.isRefreshInProgress = true;
            this.lastRefreshTime = now;
            console.log('[CardNavigator] 리프레시 시작');
            
            // 대기 중인 리프레시 타입들을 현재 타입들과 병합
            types.forEach(type => this.pendingRefreshTypes.add(type));
            const refreshTypes = Array.from(this.pendingRefreshTypes);
            this.pendingRefreshTypes.clear();
            console.log('[CardNavigator] 병합된 리프레시 타입:', refreshTypes);

            // 컨테이너 요소 가져오기
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) {
                console.log('[CardNavigator] 컨테이너 요소가 없음, 리프레시 중단');
                return;
            }

            try {
                // 리프레시 타입 최적화 - 중복 작업 제거
                const optimizedTypes = this.optimizeRefreshTypes(refreshTypes);
                console.log('[CardNavigator] 최적화된 리프레시 타입:', optimizedTypes);
                
                // 모든 타입에 대해 리프레시 실행
                console.log('[CardNavigator] refreshByType 호출');
                await this.refreshByType(optimizedTypes);
                console.log('[CardNavigator] refreshByType 완료');
                
                // 짧은 지연 후 레이아웃 재계산
                console.log('[CardNavigator] 레이아웃 재계산 지연 시작');
                await new Promise(resolve => setTimeout(resolve, 50));
                console.log('[CardNavigator] 레이아웃 재계산 지연 완료');
            } catch (error) {
                console.error(`[CardNavigator] 리프레시 중 오류 발생:`, error);
            }
        } finally {
            this.isRefreshInProgress = false;
            this.pendingRefreshTypes.clear();
            console.log('[CardNavigator] refreshBatch 완료');
        }
    }
    
    /**
     * 리프레시 타입을 최적화하여 중복 작업을 제거합니다.
     */
    private optimizeRefreshTypes(types: RefreshType[]): RefreshType[] {
        // 모든 타입이 포함된 경우 ALL만 반환
        if (types.includes(RefreshType.ALL)) {
            return [RefreshType.ALL];
        }
        
        // LAYOUT과 CONTENT가 모두 포함된 경우 ALL로 대체
        if (types.includes(RefreshType.LAYOUT) && types.includes(RefreshType.CONTENT)) {
            return [RefreshType.ALL];
        }
        
        // 중복 제거
        return [...new Set(types)];
    }

    private async refreshByType(types: RefreshType[]) {
        console.log('[CardNavigator] refreshByType 호출됨, 타입:', types);
        if (!this.cardContainer) {
            console.log('[CardNavigator] 카드 컨테이너가 없음, refreshByType 중단');
            return;
        }

        try {
            // 현재 폴더 가져오기
            const folder = await this.getCurrentFolder();
            if (!folder) {
                console.log('[CardNavigator] 현재 폴더를 찾을 수 없음, 리프레시 중단');
                return;
            }
            
            console.log('[CardNavigator] 현재 폴더:', folder.path);
            
            // 설정 업데이트가 필요한지 확인
            const needsSettingsUpdate = types.includes(RefreshType.SETTINGS) || types.includes(RefreshType.ALL);
            
            // 레이아웃 업데이트가 필요한지 확인
            const needsLayoutUpdate = types.includes(RefreshType.LAYOUT) || types.includes(RefreshType.ALL);
            
            // 컨텐츠 업데이트가 필요한지 확인
            const needsContentUpdate = types.includes(RefreshType.CONTENT) || types.includes(RefreshType.ALL);
            
            // 1. 설정 업데이트
            if (needsSettingsUpdate) {
                console.log('[CardNavigator] 설정 업데이트 시작');
                if (this.cardContainer && typeof this.cardContainer.updateSettings === 'function') {
                    this.cardContainer.updateSettings(this.plugin.settings);
                    console.log('[CardNavigator] 설정 업데이트 완료');
                } else {
                    console.log('[CardNavigator] updateSettings 메서드가 없음, 설정 업데이트 중단');
                }
            }
            
            // 2. 레이아웃 업데이트
            if (needsLayoutUpdate) {
                console.log('[CardNavigator] 레이아웃 업데이트 시작');
                // 레이아웃 매니저가 초기화되었는지 확인
                if (this.cardContainer && typeof this.cardContainer.setLayout === 'function') {
                    // 레이아웃 매니저 존재 여부 확인
                    const hasLayoutManager = !!this.cardContainer['layoutManager'];
                    
                    // 레이아웃 매니저가 완전히 초기화되었는지 추가 확인
                    const isLayoutManagerInitialized = hasLayoutManager && 
                        typeof this.cardContainer['layoutManager'].getLayoutStrategy === 'function' &&
                        typeof this.cardContainer['layoutManager'].setLayout === 'function';
                    
                    if (isLayoutManagerInitialized) {
                        this.updateLayout();
                        console.log('[CardNavigator] 레이아웃 업데이트 완료');
                        
                        // 레이아웃 업데이트 후 컨텐츠 업데이트가 필요하지 않은 경우 리턴
                        // 레이아웃 업데이트 내부에서 이미 카드를 다시 렌더링하기 때문
                        if (!needsContentUpdate) {
                            console.log('[CardNavigator] 레이아웃 업데이트 후 컨텐츠 업데이트 건너뜀');
                            return;
                        }
                    } else {
                        console.log('[CardNavigator] 레이아웃 매니저가 완전히 초기화되지 않음, 레이아웃 업데이트 중단');
                        
                        // 레이아웃 매니저가 초기화되지 않은 경우 지연 후 다시 시도
                        setTimeout(() => {
                            const isInitializedNow = !!this.cardContainer && 
                                !!this.cardContainer['layoutManager'] &&
                                typeof this.cardContainer['layoutManager'].getLayoutStrategy === 'function' &&
                                typeof this.cardContainer['layoutManager'].setLayout === 'function';
                                
                            if (isInitializedNow) {
                                console.log('[CardNavigator] 레이아웃 매니저가 이제 초기화됨, 레이아웃 업데이트 재시도');
                                this.updateLayout();
                            } else {
                                console.log('[CardNavigator] 레이아웃 매니저가 여전히 초기화되지 않음, 레이아웃 업데이트 포기');
                            }
                        }, 200);
                    }
                } else {
                    console.log('[CardNavigator] 레이아웃 매니저가 초기화되지 않음, 레이아웃 업데이트 중단');
                }
            }
            
            // 3. 컨텐츠 업데이트
            if (needsContentUpdate) {
                console.log('[CardNavigator] 컨텐츠 업데이트 시작');
                if (this.cardContainer && typeof this.cardContainer.displayCards === 'function') {
                    // 폴더의 마크다운 파일 가져오기
                    const files = folder.children
                        .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
                    
                    // 카드 표시
                    await this.cardContainer.displayCards(files);
                    console.log('[CardNavigator] 컨텐츠 업데이트 완료');
                } else {
                    console.log('[CardNavigator] displayCards 메서드가 없음, 컨텐츠 업데이트 중단');
                }
            }
        } catch (error) {
            console.error('[CardNavigator] refreshByType 중 오류 발생:', error);
        }
    }

    // 단일 리프레시 실행 메서드
    public async refresh(type: RefreshType = RefreshType.CONTENT) {
        await this.refreshBatch([type]);
    }

    // 레이아웃 업데이트 없이 컨텐츠만 표시하는 메서드
    private async displayContent(): Promise<void> {
        console.log('[CardNavigator] displayContent 호출됨');
        if (!this.cardContainer) {
            console.log('[CardNavigator] 카드 컨테이너가 없음, displayContent 중단');
            return;
        }

        try {
            // 현재 폴더 가져오기
            const folder = await this.getCurrentFolder();
            if (folder) {
                console.log('[CardNavigator] 현재 폴더:', folder.path);
                
                // 폴더의 마크다운 파일 가져오기
                const files = folder.children
                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
                
                // 카드 컨테이너의 displayCards 메서드가 있는지 확인
                if (typeof this.cardContainer.displayCards === 'function') {
                    console.log('[CardNavigator] 카드 표시 시작 (레이아웃 업데이트 없이)');
                    await this.cardContainer.displayCards(files);
                    console.log('[CardNavigator] 카드 표시 완료 (레이아웃 업데이트 없이)');
                } else {
                    console.log('[CardNavigator] displayCards 메서드가 없음, 컨텐츠 표시 중단');
                }
            } else {
                console.log('[CardNavigator] 현재 폴더를 찾을 수 없음, 컨텐츠 표시 중단');
            }
        } catch (error) {
            console.error('[CardNavigator] 컨텐츠 표시 중 오류 발생:', error);
        }
    }
}
