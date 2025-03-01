import { ItemView, WorkspaceLeaf, Menu, TFile, debounce } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { sortFiles } from 'common/utils';
import { t } from 'i18next';
import { ResizeService } from 'common/ResizeService';

// 카드 네비게이터 뷰의 고유 식별자
export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

// 리프레시 유형을 정의하는 enum
export enum RefreshType {
    LAYOUT = 'layout',    // 레이아웃/리사이즈 관련 리프레시
    CONTENT = 'content',  // 파일 내용 변경 관련 리프레시
    SETTINGS = 'settings', // 설정 변경 관련 리프레시
    ALL = 'all'           // 전체 업데이트
}

/**
 * 카드 네비게이터 뷰 클래스
 * 
 * 이 클래스는 Obsidian의 ItemView를 확장하여 카드 네비게이터 기능을 제공합니다.
 * 툴바와 카드 컨테이너를 관리하고 뷰의 생명주기를 처리합니다.
 */
export class CardNavigatorView extends ItemView {
    //#region 클래스 속성
    public toolbar!: Toolbar;
    public cardContainer: CardContainer;
    private isRefreshInProgress = false;
    private pendingRefreshTypes = new Set<RefreshType>();
    private refreshTimeout: number | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_COOLDOWN = 50; // 50ms 쿨다운
    private lastContainerHeight: number | null = null;
    private toolbarContainerEl!: HTMLElement;
    private cardContainerEl!: HTMLElement;
    private navigatorEl!: HTMLElement;
    private resizeService: ResizeService;
    private navigatorId: string = '';
    //#endregion

    //#region 초기화 및 기본 메서드
    // 생성자
    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
        this.resizeService = ResizeService.getInstance();
        // 툴바는 onOpen에서 초기화됩니다.
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

    /**
     * 뷰가 열릴 때 호출됩니다.
     */
    async onOpen(): Promise<void> {
        try {
            const { contentEl } = this;
            contentEl.empty();
            
            // DOM 요소 생성
            this.navigatorEl = contentEl.createDiv('card-navigator');
            this.toolbarContainerEl = this.navigatorEl.createDiv('card-navigator-toolbar');
            this.cardContainerEl = this.navigatorEl.createDiv('card-navigator-container');
            
            // 고유 ID 생성
            this.navigatorId = `card-navigator-${Date.now()}`;
            
            // 카드 컨테이너 초기화 (DOM 비의존적 초기화)
            this.cardContainer = new CardContainer(
                this.plugin,
                this.leaf
            );
            
            // DOM 요소 설정 및 초기화 (DOM 의존적 초기화)
            this.cardContainer.containerEl = this.cardContainerEl;
            await this.cardContainer.initialize(this.cardContainerEl);
            
            // 툴바 초기화
            this.toolbar = new Toolbar(
                this.plugin,
                this,
                this.cardContainer
            );
            
            await this.toolbar.initialize(this.toolbarContainerEl);
            
            // 카드 로드
            await this.loadCards();
            
            // ResizeService 설정
            this.setupResizeObserver();
            
            // 이벤트 등록
            this.registerEvents();
        } catch (error) {
            console.error('뷰 열기 중 오류 발생:', error);
        }
    }

    /**
     * 이벤트 리스너를 등록합니다.
     */
    private registerEvents(): void {
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('file-open', async () => {
                if (this.cardContainer && this.cardContainer.isInitialized) {
                    // 활성 파일이 변경되면 해당 카드를 강조하고 중앙에 표시
                    this.cardContainer.highlightActiveCard();
                    // 컨텐츠 새로고침은 필요하지 않음 - 활성 카드만 강조하면 됨
                }
            })
        );
        
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        this.plugin.registerEvent(
            this.plugin.app.vault.on('create', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        this.plugin.registerEvent(
            this.plugin.app.vault.on('delete', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.refresh(RefreshType.CONTENT);
                }
            })
        );
    }
    
    /**
     * ResizeService를 설정합니다.
     */
    private setupResizeObserver(): void {
        if (!this.navigatorEl || !document.body.contains(this.navigatorEl)) {
            return;
        }
        
        // ResizeService에 등록
        this.resizeService.observe(this.navigatorId, this.navigatorEl);
        
        // 크기 변경 이벤트 구독
        this.resizeService.events.on('resize', (elementId: any, size: any) => {
            if (elementId === this.navigatorId) {
                this.updateContainerSizeAndOrientation();
            }
        });
    }

    // 뷰 닫기 메서드
    async onClose() {
        // 툴바 정리
        if (this.toolbar) {
            this.toolbar.onClose();
        }
        
        // 카드 컨테이너 정리
        if (this.cardContainer) {
            this.cardContainer.cleanup();
        }
        
        // ResizeService에서 제거
        if (this.navigatorId) {
            this.resizeService.unobserve(this.navigatorId);
        }
        
        // 이벤트 리스너 제거
        this.resizeService.events.off('resize', null as any);
        
        // 컨텐츠 요소 비우기
        this.contentEl.empty();
    }
    //#endregion

    //#region 폴더 및 파일 관리
    // 현재 폴더 경로 반환 메서드
    public async getCurrentFolderPath(): Promise<string | null> {
        const folder = await this.cardContainer.getCurrentFolder();
        return folder?.path || null;
    }

    /**
     * 정렬된 파일 목록을 가져옵니다.
     */
    private async getSortedFiles(): Promise<TFile[]> {
        const folder = await this.cardContainer.getCurrentFolder();
        if (!folder) return [];
        
        // 마크다운 파일만 필터링
        const files = this.plugin.app.vault.getMarkdownFiles().filter(file => {
            return file.path.startsWith(folder.path);
        });
        
        // utils.ts의 sortFiles 함수 직접 사용
        return sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
    }
    //#endregion

    //#region 카드 컨테이너 관리
    // 카드 컨테이너 컨텐츠 업데이트 메서드
    private async updateCardContainerContent() {
        await this.cardContainer.loadCards();
    }

    /**
     * 카드를 로드합니다.
     */
    async loadCards(): Promise<void> {
        try {
            await this.cardContainer.loadFiles(await this.getSortedFiles());
        } catch (error) {
            console.error('카드 로드 중 오류 발생:', error);
        }
    }
    //#endregion

    //#region 카드 상호작용
    // 컨텍스트 메뉴 열기 메서드
    public openContextMenu() {
        const focusedCard = this.getFocusedCard();
        if (!focusedCard) return;

        const cardId = focusedCard.dataset.cardId;
        if (!cardId) return;
        
        const card = this.cardContainer.cards.find(c => c.id === cardId);
        if (!card || !card.file) return;

        const menu = new Menu();

        this.plugin.app.workspace.trigger('file-menu', menu, card.file, 'more-options');

        menu.addSeparator();

        menu.addItem((item) => {
            item
                .setTitle(t('COPY_AS_LINK'))
                .setIcon('link')
                .onClick(() => {
                    this.cardContainer.cardMaker.copyLink(card.file);
                });
        });

        menu.addItem((item) => {
            item
                .setTitle(t('COPY_CARD_CONTENT'))
                .setIcon('file-text')
                .onClick(async () => {
                    await this.cardContainer.cardMaker.copyCardContent(card.file);
                });
        });

        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

    // 키보드 네비게이터 포커스 메서드
    public focusNavigator() {
        this.cardContainer.focusKeyboardNavigator();
    }

    // 포커스된 카드 요소 반환 메서드
    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-focused');
    }
    //#endregion

    //#region 리프레시 관리
    /**
     * 여러 리프레시 타입을 배치로 처리하는 메서드
     * @param types 리프레시 타입 배열
     */
    public async refreshBatch(types: RefreshType[]): Promise<void> {
        if (types.length === 0) return;
        
        try {
            // 이미 리프레시가 진행 중이면 대기 큐에 추가
            if (this.isRefreshInProgress) {
                types.forEach(type => this.pendingRefreshTypes.add(type));
                return;
            }
            
            this.isRefreshInProgress = true;
            
            // 쿨다운 체크
            const now = Date.now();
            const timeSinceLastRefresh = now - this.lastRefreshTime;
            
            if (timeSinceLastRefresh < this.REFRESH_COOLDOWN) {
                // 쿨다운 시간이 지나지 않았으면 대기 큐에 추가하고 타임아웃 설정
                types.forEach(type => this.pendingRefreshTypes.add(type));
                
                if (this.refreshTimeout === null) {
                    this.refreshTimeout = window.setTimeout(() => {
                        this.refreshTimeout = null;
                        const pendingTypes = Array.from(this.pendingRefreshTypes);
                        this.pendingRefreshTypes.clear();
                        this.refreshBatch(pendingTypes);
                    }, this.REFRESH_COOLDOWN - timeSinceLastRefresh);
                }
                
                this.isRefreshInProgress = false;
                return;
            }
            
            this.lastRefreshTime = now;
            
            // 컨테이너 요소 확인
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) {
                this.isRefreshInProgress = false;
                return;
            }

            // 가장 우선순위가 높은 리프레시 타입 결정
            let refreshType = RefreshType.CONTENT;
            if (types.includes(RefreshType.ALL)) {
                refreshType = RefreshType.ALL;
            } else if (types.includes(RefreshType.SETTINGS)) {
                refreshType = RefreshType.SETTINGS;
            } else if (types.includes(RefreshType.LAYOUT)) {
                refreshType = RefreshType.LAYOUT;
            }

            try {
                // 리프레시 타입에 따라 직접 처리
                await this.refreshByType(refreshType);
            } catch (error) {
                console.error('리프레시 중 오류 발생:', error);
            } finally {
                this.isRefreshInProgress = false;
                
                // 대기 중인 리프레시가 있으면 처리
                if (this.pendingRefreshTypes.size > 0) {
                    const pendingTypes = Array.from(this.pendingRefreshTypes);
                    this.pendingRefreshTypes.clear();
                    this.refreshBatch(pendingTypes);
                }
            }
        } catch (error) {
            console.error('리프레시 준비 중 오류 발생:', error);
            this.isRefreshInProgress = false;
        }
    }

    // 단일 리프레시 실행 메서드
    public async refresh(type: RefreshType = RefreshType.CONTENT) {
        await this.refreshBatch([type]);
    }

    private async refreshByType(type: RefreshType) {
        if (!this.cardContainer) return;

        try {
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) return;
            
            // 컨테이너 크기가 유효한지 확인
            const width = containerEl.offsetWidth;
            const height = containerEl.offsetHeight;
            
            if (width === 0 || height === 0) {
                // 크기가 유효하지 않으면 로그 출력 후 종료
                console.log('[CardNavigatorView] 컨테이너 크기가 유효하지 않아 리프레시를 건너뜁니다.');
                return;
            }
            
            // 리프레시 타입에 따라 적절한 작업 수행
            switch (type) {
                case RefreshType.ALL:
                    // 모든 카드 다시 로드
                    await this.cardContainer.loadCards();
                    break;
                case RefreshType.SETTINGS:
                    // 설정 업데이트 후 카드 다시 로드
                    this.cardContainer.updateSettings(this.plugin.settings);
                    
                    // 설정 변경 후 카드 로드 (직접 호출)
                    await this.cardContainer.loadCards();
                    break;
                case RefreshType.LAYOUT:
                    // 레이아웃만 업데이트 (직접 호출)
                    this.cardContainer.refreshLayout();
                    break;
                case RefreshType.CONTENT:
                    // 카드 목록을 완전히 새로고침
                    console.log('[CardNavigatorView] 컨텐츠 새로고침 - 카드 목록 다시 로드');
                    
                    // 카드 목록 관리자의 캐시를 초기화하고 카드 다시 로드 (직접 호출)
                    await this.cardContainer.loadCards();
                    
                    // 카드 로드 후 활성 카드 강조 (즉시 실행)
                    this.cardContainer.highlightActiveCard();
                    break;
            }
        } catch (error) {
            console.error(`${type} 리프레시 중 오류 발생:`, error);
        }
    }
    //#endregion

    // 검색 입력에 포커스 설정
    public focusSearch(): void {
        this.toolbar.focusSearch();
    }

    // 검색 입력 필드에 포커스 설정 (명령어용)
    public focusSearchInput(): void {
        this.focusSearch();
    }

    // 검색어 설정
    public setSearchTerm(searchTerm: string): void {
        this.toolbar.setSearchTerm(searchTerm);
    }

    /**
     * 컨테이너 크기와 방향을 업데이트합니다.
     */
    private updateContainerSizeAndOrientation() {
        if (!this.cardContainer || !this.cardContainer.isInitialized) {
            return;
        }

        if (!this.navigatorEl || !document.body.contains(this.navigatorEl)) {
            return;
        }

        try {
            // ResizeService에서 크기 가져오기
            const navigatorSize = this.resizeService.getElementSize(this.navigatorId);
            if (!navigatorSize) return;
            
            const navigatorWidth = navigatorSize.width;
            const navigatorHeight = navigatorSize.height;

            const toolbarEl = this.toolbarContainerEl;
            const toolbarHeight = toolbarEl ? toolbarEl.offsetHeight : 0;

            const containerHeight = Math.max(300, navigatorHeight - toolbarHeight);
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) {
                return;
            }

            // 크기 변경이 충분히 큰 경우에만 업데이트 (30px 이상 차이만 반응)
            if (!this.lastContainerHeight || Math.abs(this.lastContainerHeight - containerHeight) > 30) {
                console.log(`[CardNavigatorView] 컨테이너 높이 업데이트: ${this.lastContainerHeight || 0}px -> ${containerHeight}px`);
                this.lastContainerHeight = containerHeight;

                // CSS 업데이트 (스타일 변경 최소화)
                requestAnimationFrame(() => {
                    containerEl.style.height = `${containerHeight}px`;
                    containerEl.style.minHeight = `${Math.min(containerHeight, 300)}px`;
                    containerEl.style.setProperty('--container-width', `${navigatorWidth}px`);
                    containerEl.style.setProperty('--container-height', `${containerHeight}px`);
                });

                // 레이아웃 매니저 업데이트
                requestAnimationFrame(() => {
                    if (this.cardContainer.layoutManager) {
                        this.cardContainer.layoutManager.setContainer(containerEl);

                        const layoutConfig = this.cardContainer.layoutManager.getLayoutConfig();
                        if (layoutConfig) {
                            const { isVertical } = layoutConfig.calculateContainerOrientation();

                            // classList 변경 최소화
                            if (isVertical !== (containerEl.classList.contains('vertical'))) {
                                containerEl.classList.toggle('vertical', isVertical);
                                containerEl.classList.toggle('horizontal', !isVertical);
                                containerEl.style.setProperty('--is-vertical', isVertical ? '1' : '0');
                            }

                            // 레이아웃 업데이트 (최적화)
                            this.cardContainer.layoutManager.updateLayout(
                                this.cardContainer.cards,
                                navigatorWidth,
                                containerHeight
                            );
                        }
                    }

                    // 컨테이너 높이 설정
                    this.cardContainer.setContainerHeight(containerHeight);
                });
            }
        } catch (error) {
            console.error('컨테이너 높이 업데이트 중 오류 발생:', error);
        }
    }

    /**
     * 특정 파일의 내용이 변경되었을 때 해당 카드만 업데이트합니다.
     * @param file 변경된 파일
     */
    public refreshFileContent(file: TFile): void {
        if (!this.cardContainer || !file) return;
        
        // 파일 경로를 카드 ID로 사용하여 해당 카드만 업데이트 (직접 호출)
        this.cardContainer.updateCardContent(file.path);
    }
}