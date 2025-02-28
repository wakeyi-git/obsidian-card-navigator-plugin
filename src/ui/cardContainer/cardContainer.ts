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
import { CardInteractionManager } from './cardInteractionManager';
import { Menu } from 'obsidian';

// Main class for managing the card container and its layout
export class CardContainer {
    //#region 클래스 속성
    private app: App;
    public containerEl!: HTMLElement; // 느낌표로 초기화 보장
    public cardMaker: CardMaker;
    public cardRenderer: CardRenderer | null = null;
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
    private lastWidth = 0;
    private lastHeight = 0;
    private cardListManager: CardListManager;
    private settings: CardNavigatorSettings;
    public isInitialized: boolean = false;
    public isSearchMode = false;
    private isVertical: boolean = true; // 방향 속성 추가
    private eventListeners: Record<string, Array<() => void>> = {};
    private cardInteractionManager: CardInteractionManager | null = null;
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
    /**
     * 카드 컨테이너를 초기화합니다.
     */
    async initialize(): Promise<void> {
        const layoutConfig = new LayoutConfig(this.settings);
        this.layoutManager = new LayoutManager(this.settings, this.cardMaker);
        
        this.cardInteractionManager = new CardInteractionManager(
            (file: TFile) => this.app.workspace.openLinkText(file.path, '', false),
            (cardEl: HTMLElement, card: Card, event: MouseEvent) => {
                const menu = new Menu();
                
                // 기본 Obsidian 컨텍스트 메뉴 항목 추가
                this.app.workspace.trigger('file-menu', menu, card.file, 'more-options');
                
                // 구분선 추가
                menu.addSeparator();
                
                // 링크 복사 메뉴 항목 추가
                menu.addItem((item) => {
                    item
                        .setTitle(t('COPY_AS_LINK'))
                        .setIcon('link')
                        .onClick(() => {
                            if (card.file) {
                                this.cardMaker.copyLink(card.file);
                            }
                        });
                });
                
                // 내용 복사 메뉴 항목 추가
                menu.addItem((item) => {
                    item
                        .setTitle(t('COPY_CARD_CONTENT'))
                        .setIcon('file-text')
                        .onClick(async () => {
                            if (card.file) {
                                await this.cardMaker.copyCardContent(card.file);
                            }
                        });
                });
                
                menu.showAtMouseEvent(event);
            },
            (event: DragEvent, card: Card) => {
                // 드래그 시작 시 데이터 설정
                if (card.file) {
                    // CardMaker의 setupDragData 메서드 사용
                    this.cardMaker.setupDragData(event, card);
                }
            },
            (event: DragEvent) => {
                // 드래그 오버 시 기본 동작 방지
                event.preventDefault();
                event.dataTransfer!.dropEffect = 'copy';
                
                // 드래그 오버 스타일 적용
                const target = event.target as HTMLElement;
                const cardEl = target.closest('.card-navigator-card');
                if (cardEl) {
                    cardEl.classList.add('drag-over');
                    
                    // 이전에 드래그 오버된 다른 카드의 스타일 제거
                    const allCards = this.containerEl.querySelectorAll('.card-navigator-card');
                    allCards.forEach(card => {
                        if (card !== cardEl) {
                            card.classList.remove('drag-over');
                        }
                    });
                    
                    // 드래그 리브 이벤트 리스너 추가
                    const dragLeaveHandler = () => {
                        cardEl.classList.remove('drag-over');
                        cardEl.removeEventListener('dragleave', dragLeaveHandler);
                    };
                    cardEl.addEventListener('dragleave', dragLeaveHandler, { once: true });
                }
            },
            (event: DragEvent, targetCard: Card) => {
                // 드롭 처리 (필요한 경우 구현)
                event.preventDefault();
                
                // 드래그 오버 스타일 제거
                const allCards = this.containerEl.querySelectorAll('.card-navigator-card');
                allCards.forEach(card => {
                    card.classList.remove('drag-over');
                });
            }
        );
        
        this.cardRenderer = new CardRenderer(
            this.containerEl,
            this.cardMaker,
            this.layoutManager,
            this.plugin,
            this.cardInteractionManager
        );
        
        this.keyboardNavigator = new KeyboardNavigator(
            this.plugin,
            this,
            this.containerEl
        );
        
        this.scroller = new Scroller(
            this.containerEl,
            this.settings,
            () => this.isVertical,
            () => this.cards.length
        );
        
        this.containerEl.classList.add('card-container');
        await this.layoutManager.setContainer(this.containerEl);
        this.setupResizeObserver();
        this.isInitialized = true;
    }

    /**
     * 파일을 로드하여 카드로 변환합니다.
     */
    async loadFiles(files: TFile[]): Promise<void> {
        try {
            const cards = await Promise.all(files.map(file => this.cardMaker.createCard(file)));
            this.cards = cards.filter(card => card !== null);
            
            if (this.cardRenderer) {
                this.cardRenderer.renderCards(this.cards);
            }
        } catch (error) {
            console.error('파일 로드 중 오류 발생:', error);
        }
    }

    // 리소스 정리 메서드
    private cleanup() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.pendingResizeFrame !== null) {
            cancelAnimationFrame(this.pendingResizeFrame);
            this.pendingResizeFrame = null;
        }
        
        this.containerEl?.removeEventListener('scroll', this.handleScroll);

        if (this.cardRenderer) {
            this.cardRenderer.cleanup?.();
            this.cardRenderer = null;
        }
        
        if (this.cardInteractionManager) {
            // 모든 카드의 상호작용 제거
            this.cards.forEach(card => {
                if (card && card.id) {
                    this.cardInteractionManager?.removeInteractions(card.id);
                }
            });
            this.cardInteractionManager = null;
        }
        
        if (this.keyboardNavigator) {
            this.keyboardNavigator.cleanup?.();
            this.keyboardNavigator = null;
        }
        
        if (this.containerEl) {
            this.containerEl.empty();
        }

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
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            this.resizeObserver = new ResizeObserver((entries) => {
                if (this.isResizing) return;
                
                if (this.pendingResizeFrame !== null) {
                    cancelAnimationFrame(this.pendingResizeFrame);
                }
                
                this.pendingResizeFrame = requestAnimationFrame(() => {
                    const entry = entries[0];
                    if (entry && entry.contentRect) {
                        const width = entry.contentRect.width;
                        const height = entry.contentRect.height;
                        
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
            
            this.resizeObserver.observe(this.containerEl);
        }
    }
    //#endregion

    //#region 컨테이너 스타일 및 레이아웃 관리
    /**
     * 컨테이너 스타일을 업데이트합니다.
     */
    private updateContainerStyle() {
        if (!this.containerEl) return;
        
        if (this.layoutManager) {
            this.isVertical = this.layoutManager.getLayoutDirection() === 'vertical';
        }
        
        this.containerEl.classList.toggle('vertical-layout', this.isVertical);
        this.containerEl.classList.toggle('horizontal-layout', !this.isVertical);
        this.containerEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
        this.containerEl.classList.toggle('flexible-height', !this.plugin.settings.alignCardHeight);
        this.containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerColumn.toString());
        
        if (this.layoutConfig) {
            this.containerEl.style.setProperty('--card-gap', `${this.layoutConfig.getCardGap()}px`);
            this.containerEl.style.setProperty('--container-padding', `${this.layoutConfig.getContainerPadding()}px`);
            this.containerEl.style.setProperty('--columns', `${this.layoutConfig.getColumns()}`);
        } else {
            this.containerEl.style.setProperty('--card-gap', '10px');
            this.containerEl.style.setProperty('--container-padding', '10px');
            this.containerEl.style.setProperty('--columns', '1');
        }
    }
    
    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
        this.layoutManager.updateSettings(settings);
        this.cardMaker.updateSettings(settings);
        
        if (this.cardRenderer) {
            this.cardRenderer.updateCardSettings(settings.alignCardHeight, settings.cardsPerColumn);
        }
        
        this.updateContainerStyle();
    }

    /**
     * 리사이즈 이벤트 핸들러
     * 컨테이너 크기가 변경되었을 때 레이아웃을 업데이트합니다.
     */
    public handleResize = (): void => {
        if (!this.isInitialized || !this.containerEl || !document.body.contains(this.containerEl)) {
            return;
        }
        
        if (this.isResizing) {
            return;
        }
        
        this.isResizing = true;
        
        try {
            const rect = this.containerEl.getBoundingClientRect();
            let width = rect.width;
            let height = rect.height;
            
            if (width <= 0 || height <= 0) {
                width = this.containerEl.offsetWidth;
                height = this.containerEl.offsetHeight;
                
                if (width <= 0 || height <= 0) {
                    width = Math.max(400, Math.floor(window.innerWidth * 0.8));
                    height = Math.max(600, Math.floor(window.innerHeight * 0.8));
                }
            }
            
            if (width === this.lastWidth && height === this.lastHeight && this.cards.length > 0) {
                this.isResizing = false;
                return;
            }
            
            this.lastWidth = width;
            this.lastHeight = height;
            
            this.containerEl.style.setProperty('--container-width', `${width}px`);
            this.containerEl.style.setProperty('--container-height', `${height}px`);
            
            if (this.layoutManager) {
                const layoutConfig = this.layoutManager.getLayoutConfig();
                if (layoutConfig) {
                    const direction = layoutConfig.getLayoutDirection();
                    this.isVertical = direction === 'vertical';
                    
                    this.containerEl.classList.toggle('vertical', this.isVertical);
                    this.containerEl.classList.toggle('horizontal', !this.isVertical);
                    this.containerEl.style.setProperty('--is-vertical', this.isVertical ? '1' : '0');
                }
                
                this.layoutManager.updateLayout(width, height);
                this.layoutManager.refreshLayout();
            }
            
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
     * @param files 표시할 파일 목록
     * @param activeFile 활성화된 파일 (선택 사항)
     */
    public async displayFilesAsCards(files: TFile[], activeFile?: TFile): Promise<void> {
        try {
            if (!this.containerEl) {
                this.showEmptyState(t('ERROR_CONTAINER_NOT_INITIALIZED'));
                return;
            }
            
            if (!files || files.length === 0) {
                this.showEmptyState(t('NO_CARDS_FOUND'));
                return;
            }
            
            this.removeEmptyState();
            
            const cards = await this.createCardsData(files);
            this.cards = cards;
            
            let activeCardId: string | null = null;
            if (activeFile) {
                activeCardId = activeFile.path;
                this.focusedCardId = activeCardId;
            }
            
            if (this.cardRenderer) {
                await this.cardRenderer.renderCards(cards, this.focusedCardId, activeFile);
            }
        } catch (error) {
            console.error('카드 표시 중 오류 발생:', error);
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
        } catch (error) {
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
        this.scroller.scrollUp(count);
    }

    public scrollDown(count = 1) {
        this.scroller.scrollDown(count);
    }

    public scrollLeft(count = 1) {
        this.scroller.scrollLeft(count);
    }

    public scrollRight(count = 1) {
        this.scroller.scrollRight(count);
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
            const activeFile = this.app.workspace.getActiveFile();
            let files: TFile[] = [];
            
            if (context?.searchTerm) {
                this.isSearchMode = true;
                files = await this.cardListManager.getCardList(context.searchTerm);
                this.setSearchResults(files);
            } else if (context?.folder) {
                this.isSearchMode = false;
                files = this.cardListManager.getFilesInFolder(context.folder);
                this.setSearchResults(null);
            } else if (this.isSearchMode && this.searchResults) {
                files = this.searchResults;
            } else {
                this.isSearchMode = false;
                const currentFolder = await this.getCurrentFolder();
                if (currentFolder) {
                    files = this.cardListManager.getFilesInFolder(currentFolder);
                }
            }
            
            if (context?.folder && this.cardRenderer) {
                this.cardRenderer.resetCardElements();
            }
            
            await this.displayFilesAsCards(files, activeFile || undefined);
        } catch (error) {
            console.error('카드 로드 중 오류 발생:', error);
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
    //#endregion

    //#region 검색 결과 관리
    /**
     * 검색 결과를 설정합니다.
     * @param results 검색 결과 파일 배열 또는 null
     */
    public setSearchResults(results: TFile[] | null): void {
        this.searchResults = results;
        this.isSearchMode = results !== null;
        
        // 검색 모드 상태 변경 이벤트 발생
        this.plugin.events.trigger('searchModeChanged', this.isSearchMode);
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
        const buffer = containerRect.height * 1.5;
        
        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const isInViewport = cardRect.top < (containerRect.bottom + buffer) && 
                               cardRect.bottom > (containerRect.top - buffer);
            
            if (isInViewport) {
                const markdownContainer = card.querySelector('.markdown-rendered') as HTMLElement;
                
                const needsRendering = !markdownContainer || 
                                      markdownContainer.children.length === 0 || 
                                      markdownContainer.classList.contains('loading') ||
                                      markdownContainer.innerHTML.trim() === '';
                
                if (needsRendering && !card.hasAttribute('data-rendering')) {
                    card.setAttribute('data-rendering', 'true');
                    
                    requestAnimationFrame(() => {
                        this.cardMaker.ensureCardRendered(card);
                    });
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
        if (!this.containerEl || !document.body.contains(this.containerEl)) {
            return;
        }
        
        try {
            this.containerEl.style.height = `${height}px`;
            this.containerEl.style.minHeight = `${Math.min(height, 300)}px`;
            
            void this.containerEl.offsetHeight;
            
            if (this.layoutManager) {
                const rect = this.containerEl.getBoundingClientRect();
                this.layoutManager.updateLayout(rect.width, height);
                
                if (this.cards.length === 0) {
                    this.loadCards();
                } else {
                    this.handleResize();
                }
            }
        } catch (error) {
            console.error('컨테이너 높이 설정 중 오류 발생:', error);
        }
    }

    // 파일 열림 이벤트 등록
    private registerFileOpenEvent() {
        this.plugin.registerEvent(
            this.app.workspace.on('file-open', async (file) => {
                if (this.cardRenderer && file) {
                    if (this.cards.length === 0) {
                        await this.loadCards();
                    }
                    
                    await this.cardRenderer.renderCards(this.cards, this.focusedCardId || undefined, file || undefined);
                    
                    requestAnimationFrame(() => {
                        this.scrollToActiveCard(true);
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

