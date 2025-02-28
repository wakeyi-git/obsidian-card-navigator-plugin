import { WorkspaceLeaf, TFile, TFolder, debounce, App} from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { CardRenderer } from './cardRenderer';
import { LayoutManager } from 'layouts/layoutManager';
import { KeyboardNavigator } from './keyboardNavigator';
import { CardNavigatorSettings } from "common/types";
import { Card } from 'common/types';
import { t } from "i18next";
import { Scroller } from './scroller';
import { LayoutConfig } from 'layouts/layoutConfig';
import { CardListManager } from './cardListManager';
import { SearchInput } from '../toolbar/search/SearchInput';

// Main class for managing the card container and its layout
export class CardContainer {
    //#region 클래스 속성
    private app: App;
    private containerEl!: HTMLElement; // 느낌표로 초기화 보장
    public cardMaker: CardMaker;
    private cardRenderer: CardRenderer | null = null;
    public layoutManager!: LayoutManager;
    private layoutConfig!: LayoutConfig;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private scroller!: Scroller;
    public cards: Card[] = [];
    private resizeObserver: ResizeObserver;
    private focusedCardId: string | null = null;
    private searchResults: TFile[] | null = null;
    private isResizing = false;
    private pendingResizeFrame: number | null = null;
    private isDisplayingCards = false;
    private lastWidth = 0;
    private lastHeight = 0;
    private cardListManager: CardListManager;
    private settings: CardNavigatorSettings;
    public isInitialized: boolean = false;
    private currentFolder: TFolder | null = null;
    private isSearchMode = false;
    private isVertical: boolean = true; // 방향 속성 추가
    private eventListeners: Record<string, Array<() => void>> = {};
    //#endregion

    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        this.app = this.plugin.app;
        this.cardMaker = new CardMaker(this.plugin);
        this.cardListManager = new CardListManager(this.plugin);
        this.settings = this.plugin.settings;
        
        // 리소스 관리용 옵저버 초기화
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));

        // 파일 열림 이벤트 등록
        this.registerFileOpenEvent();
        
        // 스크롤 이벤트 핸들러 바인딩
        this.handleScroll = this.handleScroll.bind(this);
    }

    //#region 초기화 및 정리
    // 생성자: 기본 컴포넌트 초기화
    async initialize(containerEl: HTMLElement) {
        this.cleanup();
        
        this.containerEl = containerEl;
        
        try {
            // CSS 클래스 추가
            this.containerEl.classList.add('card-navigator-container');
            
            // 레이아웃 설정 초기화
            this.layoutConfig = new LayoutConfig(this.plugin.settings);
            this.layoutConfig.setContainer(containerEl);
            
            // 레이아웃 매니저 초기화
            this.layoutManager = new LayoutManager(this.plugin.settings, this.cardMaker);
            this.layoutManager.setContainer(containerEl);
            
            // 뷰포트 크기 기반으로 초기화 - layoutManager 초기화 후에 호출
            this.initializeWithViewportSize();
            
            this.scroller = new Scroller(
                containerEl,
                this.plugin,
                this.layoutManager,
                () => this.getCardSize()
            );
            
            this.updateContainerStyle();
            
            this.cardRenderer = new CardRenderer(
                this.containerEl,
                this.cardMaker,
                this.layoutManager,
                this.plugin
            );

            this.initializeKeyboardNavigator();
            this.setupResizeObserver();
            
            // 스크롤 이벤트 리스너 추가
            this.containerEl.addEventListener('scroll', this.handleScroll);
            
            // 초기화 완료 표시
            this.isInitialized = true;
            console.log('[CardContainer] 초기화 완료');
            
            // 초기 레이아웃 업데이트 강제 실행
            this.handleResize();
        } catch (error) {
            console.error('카드 컨테이너 초기화 중 오류 발생:', error);
            throw error;
        }
    }

    /**
     * 뷰포트 크기로 초기화합니다.
     */
    public initializeWithViewportSize(): void {
        if (!this.containerEl) {
            console.warn('[CardContainer] 컨테이너 요소가 없어 초기화할 수 없습니다.');
            return;
        }
        
        // 마지막 너비와 높이 계산
        this.lastWidth = this.containerEl.offsetWidth;
        this.lastHeight = this.containerEl.offsetHeight;
        
        // 컨테이너 크기와 방향 초기화
        this.initializeContainerSizeAndOrientation();
        
        // 초기화 완료 표시
        this.isInitialized = true;
        
        // 초기화 완료 이벤트 발생
        this.dispatchEvent('initialized');
        
        console.log(`[CardContainer] 뷰포트 크기로 초기화됨: ${this.lastWidth}x${this.lastHeight}`);
    }

    /**
     * 컨테이너 크기와 방향을 초기화합니다.
     */
    private initializeContainerSizeAndOrientation(): void {
        if (!this.containerEl) return;
        
        // 컨테이너 CSS 속성 설정
        this.containerEl.style.setProperty('--container-width', `${this.lastWidth}px`);
        this.containerEl.style.setProperty('--container-height', `${this.lastHeight}px`);
        
        // 레이아웃 방향 계산
        if (this.layoutManager) {
            const { isVertical } = this.layoutManager.getLayoutConfig().calculateContainerOrientation();
            this.isVertical = isVertical;
            
            // 방향에 따른 클래스 설정
            if (this.isVertical) {
                this.containerEl.classList.add('vertical-layout');
                this.containerEl.classList.remove('horizontal-layout');
            } else {
                this.containerEl.classList.add('horizontal-layout');
                this.containerEl.classList.remove('vertical-layout');
            }
            
            // 레이아웃 업데이트
            this.layoutManager.updateLayout(this.lastWidth, this.lastHeight);
        } else {
            // layoutManager가 초기화되지 않은 경우 기본값 사용
            this.isVertical = true;
            this.containerEl.classList.add('vertical-layout');
            this.containerEl.classList.remove('horizontal-layout');
            console.log('[CardContainer] layoutManager가 초기화되지 않아 기본 방향(수직)을 사용합니다.');
        }
    }

    // 리소스 정리 메서드
    private cleanup() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // 추가: 대기 중인 애니메이션 프레임 취소
        if (this.pendingResizeFrame !== null) {
            cancelAnimationFrame(this.pendingResizeFrame);
            this.pendingResizeFrame = null;
        }
        
        // 추가: 이벤트 리스너 정리
        this.containerEl?.removeEventListener('scroll', this.handleScroll);

        // 기존 cleanup 로직
        if (this.cardRenderer) {
            this.cardRenderer.cleanup?.();
            this.cardRenderer = null;
        }
        if (this.keyboardNavigator) {
            this.keyboardNavigator.cleanup?.();
            this.keyboardNavigator = null;
        }
        if (this.containerEl) {
            this.containerEl.empty();
        }

        // 추가: 참조 정리
        this.cards = [];
        this.focusedCardId = null;
        this.isInitialized = false;
    }

    // 컨테이너 닫기 메서드
    onClose() {
        this.cleanup();
    }

    // 리사이즈 옵저버 설정 메서드
    private setupResizeObserver() {
        if (this.containerEl) {
            // 기존 옵저버가 있으면 정리
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            // 새 리사이즈 옵저버 생성
            this.resizeObserver = new ResizeObserver((entries) => {
                // 이미 리사이징 중이면 추가 처리 방지
                if (this.isResizing) return;
                
                // 애니메이션 프레임 사용하여 성능 최적화
                if (this.pendingResizeFrame !== null) {
                    cancelAnimationFrame(this.pendingResizeFrame);
                }
                
                this.pendingResizeFrame = requestAnimationFrame(() => {
                    const entry = entries[0];
                    if (entry && entry.contentRect) {
                        const width = entry.contentRect.width;
                        const height = entry.contentRect.height;
                        
                        // 의미 있는 크기 변경이 있을 때만 처리 (임계값 증가: 5px → 10px)
                        if (width > 0 && height > 0 && 
                            (Math.abs(this.lastWidth - width) > 10 || 
                             Math.abs(this.lastHeight - height) > 10)) {
                            
                            this.lastWidth = width;
                            this.lastHeight = height;
                            this.handleResize();
                        }
                    }
                    this.pendingResizeFrame = null;
                });
            });
            
            // 컨테이너 관찰 시작
            this.resizeObserver.observe(this.containerEl);
        }
    }
    
    // 키보드 네비게이터 초기화 메서드
    private initializeKeyboardNavigator() {
        if (this.containerEl) {
            this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
        } else {
            // console.warn 제거
        }
    }
    //#endregion

    //#region 컨테이너 스타일 및 레이아웃 관리
    /**
     * 컨테이너 스타일을 업데이트합니다.
     */
    private updateContainerStyle() {
        if (!this.containerEl) return;
        
        // 레이아웃 매니저에서 방향 정보 가져오기
        if (this.layoutManager) {
            this.isVertical = this.layoutManager.getIsVertical();
        }
        
        // 컨테이너 방향 클래스 설정
        this.containerEl.classList.toggle('vertical-layout', this.isVertical);
        this.containerEl.classList.toggle('horizontal-layout', !this.isVertical);
        
        // 높이 정렬 클래스 설정
        this.containerEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
        this.containerEl.classList.toggle('flexible-height', !this.plugin.settings.alignCardHeight);

        // CSS 변수 설정
        this.containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerColumn.toString());
        
        // layoutConfig가 초기화되었는지 확인
        if (this.layoutConfig) {
            this.containerEl.style.setProperty('--card-gap', `${this.layoutConfig.getCardGap()}px`);
            this.containerEl.style.setProperty('--container-padding', `${this.layoutConfig.getContainerPadding()}px`);
            this.containerEl.style.setProperty('--columns', `${this.layoutConfig.getColumns()}`);
        } else {
            // 기본값 사용
            this.containerEl.style.setProperty('--card-gap', '10px');
            this.containerEl.style.setProperty('--container-padding', '10px');
            this.containerEl.style.setProperty('--columns', '1');
        }
    }
    
    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings): void {
        console.log(`[CardContainer] 설정 업데이트 - cardsPerColumn: ${settings.cardsPerColumn}, 이전: ${this.settings.cardsPerColumn}`);
        this.settings = settings;
        this.layoutManager.updateSettings(settings);
        this.cardMaker.updateSettings(settings);
        
        // cardRenderer 설정 업데이트 추가
        if (this.cardRenderer) {
            console.log(`[CardContainer] cardRenderer 설정 업데이트 - cardsPerColumn: ${settings.cardsPerColumn}`);
            this.cardRenderer.updateCardSettings(settings.alignCardHeight, settings.cardsPerColumn);
        }
        
        // 컨테이너 스타일 업데이트
        this.updateContainerStyle();
    }

    /**
     * 리사이즈 이벤트 핸들러
     * 컨테이너 크기가 변경되었을 때 레이아웃을 업데이트합니다.
     */
    public handleResize = (): void => {
        // 초기화되지 않았거나 DOM에 추가되지 않은 경우 무시
        if (!this.isInitialized || !this.containerEl || !document.body.contains(this.containerEl)) {
            console.debug('[CardContainer] 리사이즈 무시: 컨테이너가 초기화되지 않았거나 DOM에 없음');
            return;
        }
        
        // 이미 리사이징 중이면 무시
        if (this.isResizing) {
            return;
        }
        
        this.isResizing = true;
        
        try {
            // 컨테이너 크기 측정
            const rect = this.containerEl.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            // 크기가 변경되지 않았으면 무시
            if (width === this.lastWidth && height === this.lastHeight && this.cards.length > 0) {
                this.isResizing = false;
                return;
            }
            
            // 크기 업데이트
            this.lastWidth = width;
            this.lastHeight = height;
            
            // 컨테이너 크기 및 방향 업데이트
            this.updateContainerSizeAndOrientation(width, height);
            
            // 레이아웃 새로고침
            if (this.layoutManager) {
                this.layoutManager.refreshLayout();
            } else {
                console.warn('[CardContainer] layoutManager가 초기화되지 않아 레이아웃 새로고침을 건너뜁니다.');
            }
            
            // 카드가 있으면 다시 렌더링
            if (this.cards.length > 0 && this.cardRenderer) {
                const activeFile = this.app.workspace.getActiveFile();
                this.cardRenderer.renderCards(this.cards, this.focusedCardId || undefined, activeFile || undefined);
            }
        } catch (error) {
            console.error('리사이즈 처리 중 오류 발생:', error);
        } finally {
            this.isResizing = false;
        }
    };

    /**
     * 컨테이너 크기 및 방향 업데이트 로직
     */
    private updateContainerSizeAndOrientation(width: number, height: number): void {
        if (!this.containerEl) return;
        
        this.lastWidth = width;
        this.lastHeight = height;
        
        this.containerEl.style.setProperty('--container-width', `${width}px`);
        this.containerEl.style.setProperty('--container-height', `${height}px`);
        
        // 방향 계산 및 업데이트
        if (this.layoutConfig) {
            const { ratio, isVertical } = this.layoutConfig.calculateContainerOrientation();
            this.isVertical = isVertical;
            
            console.log(`[CardNavigator] 방향 업데이트 - 컨테이너: ${width}x${height}, 비율: ${ratio}, 수직: ${isVertical}`);
        } else {
            // 레이아웃 설정이 없는 경우 기본 계산 수행
            this.isVertical = this.calculateOrientation(width, height);
            
            console.log(`[CardNavigator] 방향 업데이트(기본) - 컨테이너: ${width}x${height}, 비율: ${width/height}, 수직: ${this.isVertical}`);
        }
        
        // 방향에 따른 CSS 클래스 설정
        if (this.isVertical) {
            this.containerEl.classList.add('vertical');
            this.containerEl.classList.remove('horizontal');
        } else {
            this.containerEl.classList.add('horizontal');
            this.containerEl.classList.remove('vertical');
        }
        
        // 방향 정보를 CSS 변수로 설정
        this.containerEl.style.setProperty('--is-vertical', this.isVertical ? '1' : '0');
    }

    /**
     * 컨테이너 방향을 계산합니다.
     * @param width 컨테이너 너비
     * @param height 컨테이너 높이
     * @returns 수직 방향 여부
     */
    private calculateOrientation(width: number, height: number): boolean {
        // LayoutConfig의 calculateContainerOrientation 메서드 사용
        if (this.layoutManager) {
            return this.layoutManager.getLayoutConfig().isVerticalContainer();
        }
        // layoutManager가 초기화되지 않은 경우 기본값 반환
        return true; // 기본적으로 수직 방향 사용
    }

    /**
     * 레이아웃 타입을 설정합니다.
     * 통합 레이아웃에서는 레이아웃 타입을 직접 설정하지 않고,
     * 방향(수직/수평)과 열 수만 변경합니다.
     */
    public setLayout(layout: string) {
        // 레이아웃 설정 요청 로그 기록
        console.log(`레이아웃 설정 요청 (${layout})이 통합 레이아웃 컨텍스트에서 무시됨`);
        
        // 레이아웃 새로고침 트리거
        if (this.layoutManager) {
            this.layoutManager.refreshLayout();
        }
    }
    //#endregion

    //#region 카드 표시 및 렌더링
    /**
     * 파일 목록을 카드로 표시합니다.
     * CardContainer의 핵심 메서드로, 파일 목록을 받아 카드로 변환하고 표시합니다.
     * @param files 표시할 파일 목록
     * @param activeFile 활성 파일
     */
    public async displayFilesAsCards(files: TFile[], activeFile?: TFile): Promise<void> {
        if (!this.containerEl) {
            console.warn('[CardContainer] 컨테이너가 초기화되지 않았습니다.');
            return;
        }
        
        try {
            // 파일이 없는 경우 빈 상태 표시
            if (!files || files.length === 0) {
                this.showEmptyState(t('NO_FILES_FOUND'));
                this.cards = [];
                return;
            }
            
            // 카드 데이터 생성
            const cards = await this.createCardsData(files);
            
            // 카드 렌더러가 초기화되지 않은 경우 초기화
            if (!this.cardRenderer) {
                console.log('[CardContainer] 카드 렌더러 초기화');
                this.cardRenderer = new CardRenderer(
                    this.containerEl,
                    this.cardMaker,
                    this.layoutManager,
                    this.plugin
                );
            }
            
            // 카드 목록 저장
            this.cards = cards;
            
            // 카드가 없는 경우 빈 상태 표시
            if (cards.length === 0) {
                this.showEmptyState(t('NO_CARDS_FOUND'));
                return;
            }
            
            // 빈 상태 제거
            this.removeEmptyState();
            
            // 카드 렌더링
            await this.cardRenderer.renderCards(cards, this.focusedCardId, activeFile);
            
            // 카드 표시 상태 업데이트
            this.isDisplayingCards = true;
        } catch (error) {
            console.error('[CardContainer] 파일을 카드로 표시하는 중 오류 발생:', error);
            this.showEmptyState(t('ERROR_DISPLAYING_CARDS'));
        }
    }
    
    // 빈 상태 표시 헬퍼 메서드
    private showEmptyState(message: string = t('NO_CARDS_FOUND')): void {
        if (!this.containerEl) return;
        
        this.containerEl.innerHTML = `
            <div class="card-navigator-empty-state">
                <div class="card-navigator-empty-message">
                    ${message}
                </div>
            </div>`;
    }

    // 빈 상태 제거 헬퍼 메서드
    private removeEmptyState(): void {
        if (!this.containerEl) return;
        
        const emptyState = this.containerEl.querySelector('.card-navigator-empty-state');
        if (emptyState) {
            emptyState.remove();
        }
    }

    // 카드 데이터 생성 메서드
    private async createCardsData(files: TFile[]): Promise<Card[]> {
        if (!files || files.length === 0) {
            return [];
        }

        const mdFiles = files.filter(file => file.extension === 'md');
        if (mdFiles.length === 0) {
            return [];
        }

        try {
            const cards = await Promise.all(mdFiles.map(file => this.cardMaker.createCard(file)));
            return cards.filter(card => card !== null);
        } catch (error: unknown) {
            console.error('카드 데이터 생성 중 오류 발생:', error);
            return [];
        }
    }
    //#endregion

    //#region 카드 포커스 관리
    // 카드 포커스 설정 메서드
    public focusCard(cardId: string) {
        this.focusedCardId = cardId;
        this.updateFocusedCard();
    }

    // 포커스된 카드 업데이트 메서드
    private updateFocusedCard() {
        if (!this.containerEl || !this.focusedCardId) return;
        
        const cards = this.containerEl.querySelectorAll('.card-navigator-card');
        cards.forEach(card => {
            if (card instanceof HTMLElement) {
                if (card.dataset.cardId === this.focusedCardId) {
                    card.classList.add('card-navigator-focused');
                } else {
                    card.classList.remove('card-navigator-focused');
                }
            }
        });
    }

    // 포커스된 카드 초기화 메서드
    public clearFocusedCards() {
        this.cardRenderer?.clearFocusedCards();
    }
    //#endregion

    //#region 스크롤 관리
    // 스크롤 관련 메서드들을 Scroller로 위임
    public scrollUp(count = 1) {
        this.scroller.scrollUp(count, this.cards.length);
    }

    public scrollDown(count = 1) {
        this.scroller.scrollDown(count, this.cards.length);
    }

    public scrollLeft(count = 1) {
        this.scroller.scrollLeft(count, this.cards.length);
    }

    public scrollRight(count = 1) {
        this.scroller.scrollRight(count, this.cards.length);
    }

    public scrollToActiveCard(animate = true) {
        this.scroller.scrollToActiveCard(animate);
    }

    public centerCard(card: HTMLElement, animate = true) {
        this.scroller.centerCard(card, animate);
    }
    //#endregion

    //#region 카드 검색 및 정렬
    /**
     * 현재 컨텍스트에 맞는 카드를 로드하고 표시합니다.
     * 이 메서드는 CardListManager를 통해 현재 컨텍스트(폴더, 검색 등)에 맞는 파일 목록을 가져와 표시합니다.
     * @param context 선택적 컨텍스트 정보 (폴더, 검색어 등)
     * 
     * 참고: 이전에는 searchCards 메서드를 통해 검색을 수행했지만, 
     * 이제는 이 메서드에 searchTerm을 직접 전달하여 검색을 수행합니다.
     * 예: loadCards({ searchTerm: "검색어" })
     */
    public async loadCards(context?: { folder?: TFolder, searchTerm?: string }): Promise<void> {
        if (!this.containerEl || !this.isInitialized) {
            return;
        }
        
        try {
            // 현재 활성 파일 가져오기
            const activeFile = this.app.workspace.getActiveFile();
            
            // 컨텍스트에 따라 파일 목록 가져오기
            let files: TFile[] = [];
            
            if (context?.searchTerm) {
                // 검색어가 제공된 경우 검색 결과 가져오기
                this.isSearchMode = true;
                files = await this.cardListManager.getCardList(context.searchTerm);
                this.setSearchResults(files);
            } else if (context?.folder) {
                // 폴더가 제공된 경우 해당 폴더의 파일 가져오기
                this.isSearchMode = false;
                this.currentFolder = context.folder;
                files = this.cardListManager.getFilesInFolder(context.folder);
                this.setSearchResults(null);
            } else if (this.isSearchMode && this.searchResults) {
                // 현재 검색 모드인 경우 검색 결과 사용
                files = this.searchResults;
            } else {
                // 기본: 현재 설정된 카드 세트 타입에 따라 파일 가져오기
                this.isSearchMode = false;
                const currentFolder = await this.getCurrentFolder();
                if (currentFolder) {
                    files = this.cardListManager.getFilesInFolder(currentFolder);
                }
            }
            
            // 카드 렌더러 초기화 (필요한 경우)
            if (context?.folder && this.cardRenderer) {
                this.cardRenderer.resetCardElements();
            }
            
            // 파일 목록을 카드로 표시
            await this.displayFilesAsCards(files, activeFile || undefined);
        } catch (error) {
            console.error('[CardContainer] 카드 로드 중 오류 발생:', error);
        }
    }
    //#endregion

    //#region 유틸리티 메서드
    /**
     * 현재 폴더를 가져옵니다.
     */
    public async getCurrentFolder(): Promise<TFolder | null> {
        return this.cardListManager.getCurrentFolder();
    }

    /**
     * 카드에서 파일을 가져옵니다.
     */
    public getFileFromCard(cardElement: HTMLElement): TFile | null {
        return this.cardRenderer?.getFileFromCard(cardElement, this.cards) || null;
    }

    /**
     * 키보드 네비게이터에 포커스합니다.
     */
    public focusNavigator() {
        this.keyboardNavigator?.focusNavigator();
    }
    
    /**
     * 키보드 네비게이터에서 포커스를 해제합니다.
     */
    public blurNavigator() {
        this.keyboardNavigator?.blurNavigator();
    }

    /**
     * 카드 크기를 가져옵니다.
     */
    private getCardSize(): { width: number, height: number } {
        return this.cardRenderer?.getCardSize() || { width: 0, height: 0 };
    }
    //#endregion

    //#region 검색 결과 관리
    /**
     * 검색 결과를 설정합니다.
     */
    public setSearchResults(files: TFile[] | null) {
        this.searchResults = files;
    }

    /**
     * 검색 결과를 가져옵니다.
     */
    public getSearchResults(): TFile[] | null {
        return this.searchResults;
    }
    //#endregion

    private handleScroll = debounce(() => {
        if (!this.containerEl || !this.plugin.settings.renderContentAsHtml) return;
        
        const cards = Array.from(this.containerEl.children) as HTMLElement[];
        const containerRect = this.containerEl.getBoundingClientRect();
        const buffer = containerRect.height * 1.5; // 버퍼 영역 확대
        
        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const isInViewport = cardRect.top < (containerRect.bottom + buffer) && 
                               cardRect.bottom > (containerRect.top - buffer);
            
            // 카드가 뷰포트 내에 있는 경우
            if (isInViewport) {
                // 마크다운 컨테이너 확인
                const markdownContainer = card.querySelector('.markdown-rendered') as HTMLElement;
                
                // 렌더링이 필요한 경우 (컨테이너가 없거나, 내용이 비어있거나, 로딩 중인 경우)
                const needsRendering = !markdownContainer || 
                                      markdownContainer.children.length === 0 || 
                                      markdownContainer.classList.contains('loading') ||
                                      markdownContainer.innerHTML.trim() === '';
                
                // 렌더링 상태를 체크하여 진행 중인 렌더링이 없을 때만 실행
                if (needsRendering && !card.hasAttribute('data-rendering')) {
                    card.setAttribute('data-rendering', 'true');
                    
                    // 약간의 지연을 두고 렌더링 (스크롤 성능 향상을 위해)
                    setTimeout(() => {
                        this.cardMaker.ensureCardRendered(card);
                    }, 10);
                }
            }
        });
    }, 100);

    // 컨테이너 요소를 가져오는 public 메서드 추가
    public getContainerElement(): HTMLElement | null {
        return this.containerEl || null;
    }

    /**
     * 컨테이너의 높이를 설정합니다.
     * @param height 설정할 높이(픽셀)
     */
    public setContainerHeight(height: number): void {
        // 초기화되지 않았거나 DOM에 추가되지 않은 경우 무시
        if (!this.isInitialized || !this.containerEl || !document.body.contains(this.containerEl)) {
            console.debug('[CardContainer] 높이 설정 무시: 컨테이너가 초기화되지 않았거나 DOM에 없음');
            return;
        }
        
        // 컨테이너 높이 설정
        this.containerEl.style.height = `${height}px`;
        
        // CSS 변수로도 설정
        this.containerEl.style.setProperty('--container-height', `${height}px`);
        
        // 높이가 변경되었으므로 레이아웃 업데이트
        this.lastHeight = height;
        
        // 레이아웃 업데이트 트리거
        if (!this.isResizing) {
            this.handleResize();
        }
    }

    // 파일 열림 이벤트 등록
    private registerFileOpenEvent() {
        this.plugin.registerEvent(
            this.app.workspace.on('file-open', async (file) => {
                console.log(`[CardContainer] 파일 열림 이벤트 - 파일: ${file?.path || 'none'}`);
                
                if (this.cardRenderer && file) {
                    // 현재 카드 목록이 비어있으면 카드를 다시 로드
                    if (this.cards.length === 0) {
                        console.log('[CardContainer] 카드 목록이 비어있어 다시 로드합니다.');
                        await this.loadCards();
                    }
                    
                    // 카드 다시 렌더링
                    await this.cardRenderer.renderCards(this.cards, this.focusedCardId || undefined, file || undefined);
                    
                    // DOM 업데이트 후 스크롤 실행
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            this.scrollToActiveCard(true);
                        }, 50);
                    });
                }
            })
        );
    }

    /**
     * 이벤트 리스너를 등록합니다.
     * @param event 이벤트 이름
     * @param callback 콜백 함수
     */
    public addEventListener(event: string, callback: () => void): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    /**
     * 이벤트를 발생시킵니다.
     * @param event 이벤트 이름
     */
    public dispatchEvent(event: string): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            listeners.forEach(callback => callback());
        }
    }
    
    /**
     * 이벤트 리스너를 제거합니다.
     * @param event 이벤트 이름
     * @param callback 콜백 함수
     */
    public removeEventListener(event: string, callback: () => void): void {
        const listeners = this.eventListeners[event];
        if (listeners) {
            this.eventListeners[event] = listeners.filter(cb => cb !== callback);
        }
    }

    /**
     * 현재 필터링된 파일 목록을 반환합니다.
     * 검색 모드인 경우 검색 결과를, 그렇지 않은 경우 현재 폴더의 파일 목록을 반환합니다.
     * @returns 필터링된 파일 목록
     */
    public async getFilteredFiles(): Promise<TFile[]> {
        if (this.isSearchMode && this.searchResults) {
            return this.searchResults;
        } else {
            const currentFolder = await this.getCurrentFolder();
            if (currentFolder) {
                return this.cardListManager.getFilesInFolder(currentFolder);
            }
            return [];
        }
    }
}

