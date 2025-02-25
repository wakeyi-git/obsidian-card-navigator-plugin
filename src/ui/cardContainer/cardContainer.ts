import { WorkspaceLeaf, TFile, TFolder, debounce, App} from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { CardRenderer } from './cardRenderer';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { KeyboardNavigator } from './keyboardNavigator';
import { CardNavigatorSettings } from "common/types";
import { Card, SortCriterion, SortOrder } from 'common/types';
import { t } from "i18next";
import { LayoutManager } from 'layouts/layoutManager';
import { Scroller } from './scroller';
import { getSearchService } from 'ui/toolbar/search/';
import { LayoutConfig } from 'layouts/layoutConfig';

// Main class for managing the card container and its layout
export class CardContainer {
    //#region 클래스 속성
    private app: App;
    private containerEl!: HTMLElement; // 느낌표로 초기화 보장
    public cardMaker: CardMaker;
    private cardRenderer: CardRenderer | null = null;
    private layoutManager!: LayoutManager;
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    public isVertical: boolean;
    private layoutConfig!: LayoutConfig;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private scroller!: Scroller;
    private cards: Card[] = [];
    private resizeObserver: ResizeObserver;
    private focusedCardId: string | null = null;
    private searchResults: TFile[] | null = null;
    private isResizing = false;
    private pendingResizeFrame: number | null = null;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 기본 컴포넌트 초기화
    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        // 기본 컴포넌트만 초기화
        this.app = this.plugin.app;
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = true; // 기본값
        this.currentLayout = this.plugin.settings.defaultLayout;
        
        // 리소스 관리용 옵저버 초기화
        this.resizeObserver = new ResizeObserver(debounce(() => {
            this.handleResize();
        }, 100));

        // 파일 열림 이벤트 등록
        this.plugin.registerEvent(
            this.app.workspace.on('file-open', async (file) => {
                if (this.cardRenderer && file) {
                    await this.cardRenderer.renderCards(this.cards, this.focusedCardId, file);
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

    // 컨테이너 초기화 메서드
    async initialize(containerEl: HTMLElement) {
        this.cleanup();
        
        this.containerEl = containerEl;
        
        try {
            // CSS 클래스 추가
            this.containerEl.classList.add('card-navigator-container');
            
            // 컨테이너 크기가 설정될 때까지 대기
            await this.waitForContainerSize();
            
            this.layoutConfig = new LayoutConfig(this.app, containerEl, this.plugin.settings);
            this.layoutManager = new LayoutManager(this.plugin, containerEl, this.cardMaker);
            
            this.scroller = new Scroller(
                containerEl,
                this.plugin,
                () => this.layoutManager.getLayoutStrategy(),
                () => this.getCardSize()
            );
            
            this.updateContainerStyle();
            
            this.cardRenderer = new CardRenderer(
                this.containerEl,
                this.cardMaker,
                this.layoutManager,
                this.plugin.settings.alignCardHeight,
                this.plugin.settings.cardsPerView,
                this.plugin
            );

            this.initializeKeyboardNavigator();
            this.setupResizeObserver();
            
            // 스크롤 이벤트 리스너 추가
            this.containerEl.addEventListener('scroll', this.handleScroll);
            
            // 초기 레이아웃 업데이트 강제 실행
            await new Promise(resolve => setTimeout(resolve, 100));
            this.handleResize();
        } catch (error) {
            console.error('카드 컨테이너 초기화 중 오류 발생:', error);
            throw error;
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
        this.searchResults = null;
        this.focusedCardId = null;
    }

    // 컨테이너 닫기 메서드
    onClose() {
        this.cleanup();
    }

    // 리사이즈 옵저버 설정 메서드
    private setupResizeObserver() {
        if (this.containerEl) {
            this.resizeObserver = new ResizeObserver(
                debounce(() => {
                    if (!this.isResizing) {
                        this.handleResize();
                    }
                }, 100)
            );
            this.resizeObserver.observe(this.containerEl);
        }
    }
    
    // 키보드 네비게이터 초기화 메서드
    private initializeKeyboardNavigator() {
        if (this.containerEl) {
            this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
        } else {
            console.warn('Container element not available for KeyboardNavigator');
        }
    }
    //#endregion

    //#region 컨테이너 스타일 및 레이아웃 관리
    // 컨테이너 크기 대기 메서드
    private waitForContainerSize(): Promise<void> {
        if (this.containerEl && 
            this.containerEl.offsetWidth > 0 && 
            this.containerEl.offsetHeight > 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const observer = new ResizeObserver(() => {
                if (this.containerEl && 
                    this.containerEl.offsetWidth > 0 && 
                    this.containerEl.offsetHeight > 0) {
                    observer.disconnect();
                    resolve();
                }
            });

            if (this.containerEl) {
                observer.observe(this.containerEl);
            }
        });
    }

    // 컨테이너 스타일 업데이트 메서드
    private updateContainerStyle() {
        if (this.containerEl) {
            const isVertical = this.layoutManager.getLayoutStrategy().getScrollDirection() === 'vertical';
            this.containerEl.classList.toggle('vertical', isVertical);
            this.containerEl.classList.toggle('horizontal', !isVertical);
            this.containerEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
            this.containerEl.classList.toggle('flexible-height', !this.plugin.settings.alignCardHeight);

            this.containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerView.toString());
            this.containerEl.style.setProperty('--card-navigator-gap', `${this.layoutConfig.getCardGap()}px`);
            this.containerEl.style.setProperty('--card-navigator-container-padding', `${this.layoutConfig.getContainerPadding()}px`);
        }
    }
    
    // 설정 업데이트 메서드
    updateSettings(settings: Partial<CardNavigatorSettings>) {
        const needsLayoutUpdate = 
            settings.alignCardHeight !== undefined || 
            settings.cardsPerView !== undefined;

        const needsContentUpdate = 
            settings.bodyLengthLimit !== undefined ||
            settings.bodyLength !== undefined ||
            settings.showFileName !== undefined ||
            settings.showFirstHeader !== undefined ||
            settings.showBody !== undefined ||
            settings.renderContentAsHtml !== undefined;

        // 설정값 업데이트
        if (settings.alignCardHeight !== undefined) {
            this.plugin.settings.alignCardHeight = settings.alignCardHeight;
        }
        if (settings.bodyLengthLimit !== undefined) {
            this.plugin.settings.bodyLengthLimit = settings.bodyLengthLimit;
        }
        if (settings.bodyLength !== undefined) {
            this.plugin.settings.bodyLength = settings.bodyLength;
        }
        if (settings.cardsPerView !== undefined) {
            this.plugin.settings.cardsPerView = settings.cardsPerView;
        }

        // 컨텐츠 관련 설정이 변경된 경우 캐시 초기화
        if (needsContentUpdate) {
            this.cardMaker.clearCache();
        }

        // 레이아웃 매니저 설정 업데이트
        if (needsLayoutUpdate) {
            // 컨테이너 스타일 업데이트
            this.updateContainerStyle();
            
            // 레이아웃 매니저 업데이트
            this.layoutManager.updateSettings(this.plugin.settings);
            
            // CardRenderer 설정 업데이트
            if (this.cardRenderer) {
                this.cardRenderer.updateSettings(
                    this.plugin.settings.alignCardHeight,
                    this.plugin.settings.cardsPerView
                );
                
                // 레이아웃 전략 업데이트
                const newLayoutStrategy = this.layoutManager.getLayoutStrategy();
                this.cardRenderer.setLayoutStrategy(newLayoutStrategy);

                // 현재 스크롤 위치 저장
                const scrollPosition = {
                    top: this.containerEl?.scrollTop || 0,
                    left: this.containerEl?.scrollLeft || 0
                };

                // 카드 다시 렌더링
                if (this.cards.length > 0) {
                    const activeFile = this.app.workspace.getActiveFile();
                    this.cardRenderer.renderCards(this.cards, this.focusedCardId, activeFile);

                    // 스크롤 위치 복원
                    requestAnimationFrame(() => {
                        if (this.containerEl) {
                            this.containerEl.scrollTop = scrollPosition.top;
                            this.containerEl.scrollLeft = scrollPosition.left;
                        }
                    });
                }
            }
        }
    }

    // 리사이즈 처리 메서드
    public handleResize() {
        if (!this.containerEl) return;
        
        if (this.isResizing) {
            if (this.pendingResizeFrame === null) {
                // 리사이징 중에도 컨테이너 너비 변화는 실시간으로 업데이트
                this.layoutManager.updateContainerWidth();
                
                this.pendingResizeFrame = requestAnimationFrame(() => this.handleResize());
            }
            return;
        }
        
        this.isResizing = true;
        
        try {
            // 현재 스크롤 위치와 활성 파일 저장
            const currentScrollTop = this.containerEl.scrollTop;
            const currentScrollLeft = this.containerEl.scrollLeft;
            const activeFile = this.app.workspace.getActiveFile();
            
            // 이전 레이아웃 상태 저장
            const previousStrategy = this.layoutManager.getLayoutStrategy();
            const previousColumns = previousStrategy.getColumnsCount();
            
            // 이전 카드 크기 저장
            const previousCardWidth = this.layoutConfig.calculateCardWidth(previousColumns);
            
            // 먼저 컨테이너 너비 변화에 대한 실시간 업데이트 시도
            this.layoutManager.updateContainerWidth();
            
            // 레이아웃 타입 변경이 필요한지 확인 (예: auto 모드에서 열 수 변경)
            const shouldUpdateLayoutType = this.shouldUpdateLayoutType(previousStrategy);
            
            if (shouldUpdateLayoutType) {
                // 레이아웃 타입 변경이 필요한 경우에만 전체 레이아웃 업데이트
                this.layoutManager.updateLayout();
                const newLayoutStrategy = this.layoutManager.getLayoutStrategy();
                const currentColumns = newLayoutStrategy.getColumnsCount();
                
                // 새로운 카드 크기 계산
                const currentCardWidth = this.layoutConfig.calculateCardWidth(currentColumns);
                const cardWidthChanged = Math.abs(currentCardWidth - previousCardWidth) > 1; // 1px 오차 허용
                
                // 레이아웃 변경 감지
                const isLayoutTypeChanged = previousStrategy.constructor !== newLayoutStrategy.constructor;
                const isColumnsChanged = previousColumns !== currentColumns;
                const needsFullRerender = isLayoutTypeChanged || isColumnsChanged || cardWidthChanged;
                
                if (needsFullRerender) {
                    // 레이아웃 전략 업데이트
                    this.cardRenderer?.setLayoutStrategy(newLayoutStrategy);
                    
                    // 전체 레이아웃 재렌더링
                    this.cardRenderer?.renderCards(this.cards, this.focusedCardId, activeFile);
                    
                    // 키보드 네비게이터 업데이트
                    this.keyboardNavigator?.updateLayout(newLayoutStrategy);
                    
                    // 스크롤 위치 복원
                    requestAnimationFrame(() => {
                        if (this.containerEl) {
                            this.containerEl.scrollTop = currentScrollTop;
                            this.containerEl.scrollLeft = currentScrollLeft;
                        }
                    });
                }
            }
        } finally {
            this.isResizing = false;
            
            if (this.pendingResizeFrame !== null) {
                cancelAnimationFrame(this.pendingResizeFrame);
                this.pendingResizeFrame = null;
            }
        }
    }

    /**
     * 레이아웃 타입 업데이트가 필요한지 확인합니다.
     * auto 모드에서 열 수 변경이 필요한 경우 등을 감지합니다.
     */
    private shouldUpdateLayoutType(currentStrategy: LayoutStrategy): boolean {
        // auto 모드에서만 레이아웃 타입이 변경될 수 있음
        if (this.plugin.settings.defaultLayout !== 'auto') {
            return false;
        }
        
        // 현재 사용 가능한 너비
        const availableWidth = this.layoutConfig.getAvailableWidth();
        
        // 현재 열 수
        const currentColumns = currentStrategy.getColumnsCount();
        
        // 새로운 열 수 계산
        const newColumns = this.layoutConfig.calculateAutoColumns();
        
        // 열 수가 변경되었는지 확인
        const columnsChanged = currentColumns !== newColumns;
        
        // 열 수가 변경되었거나, 1열에서 다열로 또는 다열에서 1열로 변경되는 경우
        const layoutTypeChangeNeeded = columnsChanged && (
            (currentColumns === 1 && newColumns > 1) || 
            (currentColumns > 1 && newColumns === 1)
        );
        
        return layoutTypeChangeNeeded;
    }

    // 현재 레이아웃 전략 반환 메서드
    public getLayoutStrategy(): LayoutStrategy {
        return this.layoutManager.getLayoutStrategy();
    }

    // 레이아웃 설정 메서드
    setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        this.layoutManager.setLayout(layout);
        this.cardRenderer?.setLayoutStrategy(this.layoutManager.getLayoutStrategy());
        this.keyboardNavigator?.updateLayout(this.layoutManager.getLayoutStrategy());
    }
    //#endregion

    //#region 카드 표시 및 렌더링
    // 폴더의 모든 마크다운 파일을 재귀적으로 가져오는 메서드
    private getAllMarkdownFiles(folder: TFolder): TFile[] {
        let files: TFile[] = [];
        
        // 현재 폴더의 파일들을 처리
        folder.children.forEach(child => {
            if (child instanceof TFile && child.extension === 'md') {
                files.push(child);
            } else if (child instanceof TFolder) {
                // 하위 폴더의 파일들을 재귀적으로 가져와서 배열에 추가
                files = files.concat(this.getAllMarkdownFiles(child));
            }
        });
        
        return files;
    }

    // 카드 표시 메서드
    public async displayCards(files: TFile[]) {
        if (!this.containerEl) return;

        let displayFiles: TFile[] = [];
        const folder = await this.getCurrentFolder();
        
        if (!folder) {
            // 폴더를 찾을 수 없는 경우 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('No cards to display')}
                    </div>
                </div>`;
            return;
        }

        // 검색 결과가 있으면 그것을 우선 사용
        if (this.searchResults) {
            displayFiles = this.searchResults;
        }
        // 검색 결과가 없는 경우에만 기존 로직 사용
        else if (!files || files.length === 0 || this.plugin.settings.cardSetType === 'vault') {
            if (this.plugin.settings.cardSetType === 'vault') {
                displayFiles = this.getAllMarkdownFiles(folder);
            } else {
                displayFiles = folder.children
                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
            }
        } else {
            displayFiles = files;
        }
        
        if (displayFiles.length === 0) {
            // 빈 상태 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('No markdown files found')}
                    </div>
                </div>`;
            return;
        }
        
        this.updateContainerStyle();
        const cardsData = await this.createCardsData(displayFiles);
        
        if (cardsData.length === 0) {
            // 카드 데이터를 생성할 수 없는 경우 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('Failed to create cards')}
                    </div>
                </div>`;
            return;
        }
        
        await this.renderCards(cardsData);
    }

    // 카드 데이터 생성 메서드
    private async createCardsData(files: TFile[]): Promise<Card[]> {
        if (!files || files.length === 0) {
            console.debug('No files provided to create cards');
            return [];
        }

        const mdFiles = files.filter(file => file.extension === 'md');
        if (mdFiles.length === 0) {
            console.debug('No markdown files found');
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

    // 카드 렌더링 메서드
    private async renderCards(cardsData: Card[]) {
        if (!cardsData || cardsData.length === 0) {
            console.debug('The card data is empty.');
            return;
        }

        // 변경된 카드만 업데이트하도록 최적화
        const changedCards = cardsData.filter(card => {
            const existingCard = this.cards.find(c => c.file.path === card.file.path);
            return !existingCard || existingCard.file.stat.mtime !== card.file.stat.mtime;
        });

        if (changedCards.length === 0 && this.cards.length === cardsData.length) {
            return; // 변경사항이 없으면 렌더링 스킵
        }

        this.cards = cardsData;
        const activeFile = this.plugin.app.workspace.getActiveFile();

        // 카드 렌더링
        await this.cardRenderer?.renderCards(cardsData, this.focusedCardId, activeFile);

        // DOM이 업데이트될 때까지 기다린 후 스크롤 위치 조정
        requestAnimationFrame(() => {
            const newActiveCardIndex = Array.from(this.containerEl.children).findIndex(
                child => child.classList.contains('card-navigator-active')
            );

            if (newActiveCardIndex !== -1) {
                // 약간의 지연 후 스크롤 실행
                setTimeout(() => {
                    this.scrollToActiveCard(false);
                }, 50);
            }
        });
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
    // 현재 필터링된 파일 목록 가져오기
    public async getFilteredFiles(): Promise<TFile[]> {
        const folder = await this.getCurrentFolder();
        if (!folder) return [];

        // 현재 표시된 카드가 있다면 해당 파일들 반환
        if (this.cards.length > 0) {
            return this.cards.map(card => card.file);
        }

        // 카드가 없는 경우 현재 설정에 따라 파일 목록 반환
        if (this.plugin.settings.cardSetType === 'vault') {
            return this.getAllMarkdownFiles(folder);
        } else {
            return folder.children
                .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        }
    }

    // 카드 검색 메서드
    public async searchCards(searchTerm: string) {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const searchService = getSearchService(this.plugin);
        
        // 캐시 최적화
        const cacheKey = `${folder.path}:${searchTerm}`;
        const cachedResults = searchService.getFromCache(cacheKey);
        if (cachedResults) {
            this.setSearchResults(cachedResults);
            await this.displayCards(cachedResults);
            return;
        }

        // 기존 검색 로직
        if (!searchTerm) {
            searchService.clearCache();
            this.setSearchResults(null);
            await this.displayCards([]);
            return;
        }

        let filesToSearch: TFile[];
        if (this.cards.length > 0) {
            filesToSearch = this.cards.map(card => card.file);
        } else {
            filesToSearch = this.plugin.settings.cardSetType === 'vault' 
                ? searchService.getAllMarkdownFiles(folder)
                : folder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        }

        const filteredFiles = await searchService.searchFiles(filesToSearch, searchTerm);
        searchService.addToCache(cacheKey, filteredFiles);
        await this.displayCards(filteredFiles);
    }

    // 폴더별 카드 표시 메서드
    public async displayCardsForFolder(folder: TFolder) {
        // 폴더 변경 시 검색 캐시 초기화
        const searchService = getSearchService(this.plugin);
        searchService.clearCache();
        this.setSearchResults(null);
        
        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        await this.displayCards(files);
    }
    //#endregion

    //#region 유틸리티 메서드
    // 현재 폴더 가져오기 메서드
    private async getCurrentFolder(): Promise<TFolder | null> {
        switch (this.plugin.settings.cardSetType) {
            case 'activeFolder':
                const activeFile = this.plugin.app.workspace.getActiveFile();
                return activeFile?.parent || null;
                
            case 'selectedFolder':
                if (this.plugin.settings.selectedFolder) {
                    const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
                    return abstractFile instanceof TFolder ? abstractFile : null;
                }
                return null;
                
            case 'vault':
                return this.plugin.app.vault.getRoot();
                
            default:
                return null;
        }
    }

    // 카드에서 파일 가져오기 메서드
    public getFileFromCard(cardElement: HTMLElement): TFile | null {
        return this.cardRenderer?.getFileFromCard(cardElement, this.cards) || null;
    }

    // 키보드 네비게이터 포커스 메서드
    public focusNavigator() {
        this.keyboardNavigator?.focusNavigator();
    }
    
    // 키보드 네비게이터 블러 메서드
    public blurNavigator() {
        this.keyboardNavigator?.blurNavigator();
    }

    // 카드 크기 가져오기 메서드
    private getCardSize(): { width: number, height: number } {
        return this.cardRenderer?.getCardSize() || { width: 0, height: 0 };
    }
    //#endregion

    //#region 검색 결과 관리
    // 검색 결과 설정 메서드
    public setSearchResults(files: TFile[] | null) {
        this.searchResults = files;
    }

    // 검색 결과 가져오기 메서드
    public getSearchResults(): TFile[] | null {
        return this.searchResults;
    }
    //#endregion

    private handleScroll = debounce(() => {
        if (!this.containerEl || !this.plugin.settings.renderContentAsHtml) return;
        
        const cards = Array.from(this.containerEl.children) as HTMLElement[];
        const containerRect = this.containerEl.getBoundingClientRect();
        const buffer = containerRect.height; // 버퍼 영역 추가
        
        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const isInViewport = cardRect.top < (containerRect.bottom + buffer) && 
                               cardRect.bottom > (containerRect.top - buffer);
            
            // 이미 렌더링된 카드는 건너뜁니다
            const markdownContainer = card.querySelector('.markdown-rendered') as HTMLElement;
            if (!markdownContainer || markdownContainer.children.length > 0) return;
            
            if (isInViewport) {
                // 렌더링 상태를 체크하여 진행 중인 렌더링이 없을 때만 실행
                if (!card.hasAttribute('data-rendering')) {
                    card.setAttribute('data-rendering', 'true');
                    this.cardMaker.ensureCardRendered(card);
                }
            }
        });
    }, 100);

    // 컨테이너 요소를 가져오는 public 메서드 추가
    public getContainerElement(): HTMLElement | null {
        return this.containerEl || null;
    }
}

