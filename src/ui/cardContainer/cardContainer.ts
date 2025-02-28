import { WorkspaceLeaf, TFile, TFolder, debounce, App, Menu } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { CardRenderer } from './cardRenderer';
import { LayoutManager } from 'layouts/layoutManager';
import { KeyboardNavigator, KeyboardNavigationHost } from './keyboardNavigator';
import { CardNavigatorSettings } from "common/types";
import { Card } from 'common/types';
import { t } from "i18next";
import { Scroller } from './scroller';
import { LayoutConfig } from 'layouts/layoutConfig';
import { CardListManager } from './cardListManager';
import { CardInteractionManager } from './cardInteractionManager';
import { MasonryLayoutStrategy } from 'layouts/layoutStrategy';
import { sortFiles } from 'common/utils';
import { ResizeService } from 'common/ResizeService';

/**
 * 카드 컨테이너 클래스
 * 
 * 이 클래스는 카드 컨테이너와 관련된 모든 구성 요소를 관리합니다.
 * 레이아웃 관리, 카드 렌더링, 키보드 내비게이션, 스크롤 등의 기능을 조정합니다.
 */
export class CardContainer implements KeyboardNavigationHost {
    public containerEl!: HTMLElement;
    public cardMaker: CardMaker;
    public cardRenderer: CardRenderer | null = null;
    public layoutManager!: LayoutManager;
    private layoutConfig!: LayoutConfig;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private scroller!: Scroller;
    public cards: Card[] = [];
    private focusedCardId: string | null = null;
    private searchResults: TFile[] | null = null;
    private isResizing = false;
    private pendingResizeFrame: number | null = null;
    private lastWidth = 0;
    private lastHeight = 0;
    private cardListManager: CardListManager;
    private settings: CardNavigatorSettings;
    public isInitialized: boolean = false;
    public isInitializedCore: boolean = false;
    public isSearchMode = false;
    private eventListeners: Record<string, Array<() => void>> = {};
    private cardInteractionManager: CardInteractionManager | null = null;
    private app: App;
    private resizeService: ResizeService;
    private containerId: string;

    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        this.app = this.plugin.app;
        this.cardMaker = new CardMaker(this.plugin);
        this.cardListManager = new CardListManager(this.plugin);
        this.settings = this.plugin.settings;
        this.resizeService = ResizeService.getInstance();
        this.containerId = `card-container-${Date.now()}`;
        
        // 코어 초기화 (DOM에 의존하지 않는 부분)
        this.initializeCore();
    }

    /**
     * 코어 구성 요소를 초기화합니다 (DOM에 의존하지 않는 부분).
     * 이 메서드는 DOM 요소가 준비되기 전에 호출될 수 있습니다.
     */
    private initializeCore(): void {
        if (this.isInitializedCore) return;
        
        // 레이아웃 설정 초기화
        this.layoutConfig = new LayoutConfig(this.settings);
        
        // 레이아웃 매니저 초기화 (DOM에 의존하지 않는 부분)
        this.layoutManager = new LayoutManager(this.settings);
        
        // 메이슨리 레이아웃 전략 설정
        const layoutStrategy = new MasonryLayoutStrategy();
        this.layoutManager.setStrategy(layoutStrategy);
        
        // 코어 초기화 완료
        this.isInitializedCore = true;
    }

    /**
     * 컨테이너를 초기화합니다.
     * @param containerEl 컨테이너 요소
     */
    public initialize(containerEl: HTMLElement): void {
        if (this.isInitialized) {
            this.cleanup();
        }
        
        // 코어 초기화가 되지 않았다면 먼저 초기화
        if (!this.isInitializedCore) {
            this.initializeCore();
        }
        
        this.containerEl = containerEl;
        this.containerEl.empty();
        this.containerEl.classList.add('card-navigator-container');
        this.containerEl.setAttribute('data-container-id', this.containerId);
        
        // 레이아웃 설정의 CSS 변수 로드
        this.layoutConfig.loadCssVariables();
        
        // 레이아웃 매니저에 컨테이너 설정 (DOM 의존적인 부분)
        this.layoutManager.setContainer(this.containerEl);
        
        // 스크롤러 초기화
        this.scroller = new Scroller(
            this.containerEl,
            this.settings,
            this.layoutConfig,
            this.layoutManager
        );
        
        // 카드 렌더러 초기화
        this.cardRenderer = new CardRenderer(
            this.containerEl,
            this.settings,
            this.layoutManager,
            this.cardMaker
        );
        
        // 카드 상호작용 관리자 초기화
        this.initCardInteractionManager();
        
        // 카드 렌더러에 상호작용 관리자 설정
        if (this.cardRenderer && this.cardInteractionManager) {
            this.cardRenderer.setCardInteractionManager(this.cardInteractionManager);
        }
        
        // 키보드 내비게이터 초기화
        this.keyboardNavigator = new KeyboardNavigator(
            this.plugin,
            this,
            this.containerEl
        );
        
        // ResizeService를 사용하여 컨테이너 크기 변경 감지
        this.setupResizeObserver();
        
        // 초기화 완료
        this.isInitialized = true;
        
        // 카드 로드
        this.loadCards();
    }

    /**
     * ResizeService를 사용하여 컨테이너 크기 변경을 감지합니다.
     */
    private setupResizeObserver(): void {
        if (!this.containerEl || !document.body.contains(this.containerEl)) {
            return;
        }
        
        // 컨테이너 ID 설정
        this.containerId = `card-container-${Date.now()}`;
        
        // ResizeService에 등록
        this.resizeService.observe(this.containerId, this.containerEl);
        
        // 이벤트 리스너 등록
        this.resizeService.events.on('resize', (elementId: any, size: any) => {
            if (elementId === this.containerId) {
                this.handleContainerResize(size.width, size.height);
            }
        });
    }

    /**
     * 컨테이너 크기 변경 이벤트를 처리합니다.
     */
    private handleContainerResize(width: number, height: number): void {
        if (this.isResizing) return;
        
        // 크기가 변경되지 않았으면 무시
        if (width === this.lastWidth && height === this.lastHeight) {
            return;
        }
        
        this.lastWidth = width;
        this.lastHeight = height;
        
        // 리사이즈 중 플래그 설정
        this.isResizing = true;
        
        // 이전 프레임 취소
        if (this.pendingResizeFrame !== null) {
            cancelAnimationFrame(this.pendingResizeFrame);
            this.pendingResizeFrame = null;
        }
        
        // 직접 레이아웃 업데이트 수행
        this.refreshLayout();
        this.isResizing = false;
    }

    /**
     * 카드 상호작용 관리자를 초기화합니다.
     */
    private initCardInteractionManager(): void {
        this.cardInteractionManager = new CardInteractionManager(
            // 파일 열기 콜백
            (file: TFile) => {
                this.openFile(file);
            },
            // 메뉴 표시 콜백
            (cardEl: HTMLElement, card: Card, event: MouseEvent) => {
                this.showCardMenu(cardEl, card, event);
            },
            // 드래그 시작 콜백
            (event: DragEvent, card: Card) => {
                if (event.dataTransfer && card.file) {
                    this.cardMaker.setupDragData(event, card);
                }
            },
            // 드래그 오버 콜백
            (event: DragEvent) => {
                event.preventDefault();
                event.dataTransfer!.dropEffect = 'link';
            },
            // 드롭 콜백
            (event: DragEvent, targetCard: Card) => {
                event.preventDefault();
                
                const sourceFilePath = event.dataTransfer!.getData('text/plain');
                if (!sourceFilePath || !targetCard.file) return;
                
                const sourceFile = this.app.vault.getAbstractFileByPath(sourceFilePath);
                if (sourceFile instanceof TFile) {
                    // 링크 생성 로직
                    this.createLink(sourceFile, targetCard.file);
                }
            }
        );
    }

    /**
     * 리소스를 정리합니다.
     */
    public cleanup(): void {
        // 이미 정리되었으면 무시
        if (!this.isInitialized) {
            return;
        }
        
        // 카드 컨테이너 초기화 상태 변경
        this.isInitialized = false;
        this.isInitializedCore = false;
        
        // 이벤트 리스너 제거
        this.resizeService.events.off('resize', null as any);
        
        if (this.layoutManager) {
            this.layoutManager.dispose();
        }
        
        // 키보드 내비게이터 정리
        if (this.keyboardNavigator) {
            this.keyboardNavigator.cleanup();
            this.keyboardNavigator = null;
        }
        
        // 카드 렌더러 정리
        if (this.cardRenderer) {
            this.cardRenderer.cleanup();
            this.cardRenderer = null;
        }
        
        // 카드 인터랙션 매니저 정리
        if (this.cardInteractionManager) {
            this.cardInteractionManager.cleanup();
            this.cardInteractionManager = null;
        }
        
        // ResizeService에서 제거
        this.resizeService.unobserve(this.containerId);
        
        // 컨테이너 요소 비우기
        if (this.containerEl) {
            this.containerEl.empty();
        }
        
        // 카드 목록 초기화
        this.cards = [];
        this.searchResults = null;
        this.focusedCardId = null;
        
        // 애니메이션 프레임 취소
        if (this.pendingResizeFrame !== null) {
            cancelAnimationFrame(this.pendingResizeFrame);
            this.pendingResizeFrame = null;
        }
    }

    /**
     * 레이아웃을 새로고침합니다.
     */
    public refreshLayout(): void {
        if (!this.isInitialized || !this.containerEl) return;
        
        // 레이아웃 매니저 업데이트
        this.layoutManager.updateLayout(
            this.cards,
            this.containerEl.clientWidth,
            this.containerEl.clientHeight
        );
        
        // 카드 렌더링
        if (this.cardRenderer) {
            this.cardRenderer.renderCards();
        }
    }

    /**
     * 카드를 로드합니다.
     * @returns 로드된 카드 목록
     */
    async loadCards(): Promise<Card[]> {
        try {
            console.log('[CardContainer] 카드 로드 시작');
            
            // 현재 폴더 가져오기
            const folder = await this.getCurrentFolder();
            
            // 폴더가 없으면 빈 배열 반환
            if (!folder) {
                console.log('[CardContainer] 현재 폴더를 찾을 수 없습니다.');
                return [];
            }
            
            console.log(`[CardContainer] 현재 폴더: ${folder.path}`);
            
            // 카드 목록 관리자를 통해 파일 목록 가져오기
            console.log('[CardContainer] 카드 목록 관리자에서 파일 목록 가져오기');
            const files = await this.cardListManager.getCardList();
            console.log(`[CardContainer] 로드된 파일 수: ${files.length}`);
            
            // 파일을 카드로 변환하여 표시
            console.log('[CardContainer] 파일을 카드로 변환하여 표시');
            await this.displayFilesAsCards(files);
            
            // 활성 파일 확인 및 해당 카드 강조
            this.highlightActiveCard();
            
            return this.cards;
        } catch (error) {
            console.error('카드 로드 중 오류 발생:', error);
            return [];
        }
    }

    /**
     * 파일을 카드로 로드합니다.
     * @param files 로드할 파일 목록
     */
    public async loadFiles(files: TFile[]): Promise<void> {
        try {
            // 카드 생성
            const cards = await Promise.all(
                files.map(file => this.cardMaker.createCard(file))
            );
            
            // null 값 제거
            this.cards = cards.filter(card => card !== null) as Card[];
            
            // 카드 렌더러에 카드 설정
            if (this.cardRenderer) {
                this.cardRenderer.setCards(this.cards);
                await this.cardRenderer.renderCards();
            }
        } catch (error) {
            console.error('파일 로드 중 오류 발생:', error);
        }
    }

    /**
     * 검색 결과를 설정합니다.
     * @param files 검색 결과 파일 목록
     */
    public async setSearchResults(files: TFile[] | null): Promise<void> {
        this.searchResults = files;
        this.isSearchMode = !!files;
        
        if (files) {
            // 검색 결과가 있으면 해당 파일들을 카드로 표시
            await this.loadFiles(files);
        } else {
            // 검색 결과가 없으면 일반 카드 로드
            await this.loadCards();
        }
    }

    /**
     * 검색 결과를 가져옵니다.
     * @returns 검색 결과 파일 목록
     */
    public getSearchResults(): TFile[] | null {
        return this.searchResults;
    }

    /**
     * 파일을 카드로 표시합니다.
     * @param files 표시할 파일 목록
     */
    public async displayFilesAsCards(files: TFile[]): Promise<void> {
        try {
            console.log(`[CardContainer] 파일을 카드로 표시: ${files.length}개 파일`);
            
            // 카드 생성 시작 시간 기록
            const startTime = performance.now();
            
            // 카드 생성
            const cards = await Promise.all(
                files.map(file => this.cardMaker.createCard(file))
            );
            
            // null 값 제거
            this.cards = cards.filter(card => card !== null) as Card[];
            
            console.log(`[CardContainer] 카드 생성 완료: ${this.cards.length}개 카드 (${Math.round(performance.now() - startTime)}ms)`);
            
            // 카드 렌더러에 카드 설정
            if (this.cardRenderer) {
                console.log('[CardContainer] 카드 렌더러에 카드 설정');
                this.cardRenderer.setCards(this.cards);
                
                // 카드 렌더링
                console.log('[CardContainer] 카드 렌더링 시작');
                const renderStartTime = performance.now();
                await this.cardRenderer.renderCards();
                console.log(`[CardContainer] 카드 렌더링 완료 (${Math.round(performance.now() - renderStartTime)}ms)`);
            }
        } catch (error) {
            console.error('파일을 카드로 표시하는 중 오류 발생:', error);
        }
    }

    /**
     * 휴성 카드를 설정합니다.
     */
    setActiveCard(cardId: string | null): void {
        if (this.cardRenderer) {
            this.cardRenderer.setActiveCard(cardId);
        }
    }

    /**
     * 포커스 카드를 설정합니다.
     */
    setFocusedCard(cardId: string | null): void {
        this.focusedCardId = cardId;
        
        if (this.cardRenderer) {
            this.cardRenderer.setFocusedCard(cardId);
        }
    }

    /**
     * 카드 요소를 가져옵니다.
     */
    getCardElement(cardId: string): HTMLElement | undefined {
        return this.cardRenderer?.getCardElement(cardId);
    }

    /**
     * 카드 메뉴를 표시합니다.
     */
    private showCardMenu(cardEl: HTMLElement, card: Card, event: MouseEvent): void {
        if (!card.file) return;
        
        const menu = new Menu();
        
        // 옵시디언 기본 컨텍스트 메뉴 표시
        this.app.workspace.trigger('file-menu', menu, card.file, 'card-navigator-context-menu', null);
        
        // 구분선 추가
        menu.addSeparator();
        
        // 플러그인 컨텍스트 메뉴 추가
        // 파일 열기
        menu.addItem((item) => {
            item.setTitle(t('OPEN_FILE'))
                .setIcon('file-text')
                .onClick(() => {
                    this.openFile(card.file!);
                });
        });
        
        // 새 탭에서 열기
        menu.addItem((item) => {
            item.setTitle(t('OPEN_IN_NEW_TAB'))
                .setIcon('file-plus')
                .onClick(() => {
                    this.app.workspace.getLeaf('tab').openFile(card.file!);
                });
        });
        
        // 분할 창에서 열기
        menu.addItem((item) => {
            item.setTitle(t('OPEN_IN_SPLIT'))
                .setIcon('separator-vertical')
                .onClick(() => {
                    this.app.workspace.getLeaf('split').openFile(card.file!);
                });
        });
        
        menu.addSeparator();
        
        // 링크 복사
        menu.addItem((item) => {
            item.setTitle(t('COPY_LINK'))
                .setIcon('link')
                .onClick(() => {
                    this.cardMaker.copyLink(card.file!);
                });
        });
        
        // 내용 복사
        menu.addItem((item) => {
            item.setTitle(t('COPY_CONTENT'))
                .setIcon('copy')
                .onClick(() => {
                    this.cardMaker.copyCardContent(card.file!);
                });
        });
        
        // 메뉴 표시
        menu.showAtMouseEvent(event);
    }

    /**
     * 카드 요소에 해당하는 파일을 가져옵니다.
     * @param cardElement 카드 요소
     * @returns 카드에 해당하는 파일 또는 null
     */
    getFileFromCard(cardElement: HTMLElement): TFile | null {
        if (!cardElement || !cardElement.dataset.cardId) return null;
        
        const cardId = cardElement.dataset.cardId;
        const card = this.cards.find(c => c.id === cardId);
        
        return card?.file || null;
    }
    
    /**
     * 현재 폴더를 가져옵니다.
     * @returns 현재 폴더
     */
    async getCurrentFolder(): Promise<TFolder | null> {
        return this.cardListManager.getCurrentFolder();
    }
    
    /**
     * 두 파일 간에 링크를 생성합니다.
     * @param sourceFile 소스 파일
     * @param targetFile 대상 파일
     */
    private async createLink(sourceFile: TFile, targetFile: TFile): Promise<void> {
        try {
            // 소스 파일 내용 읽기
            const content = await this.app.vault.read(sourceFile);
            
            // 링크 생성
            const linkText = this.app.fileManager.generateMarkdownLink(targetFile, sourceFile.path);
            
            // 파일 끝에 링크 추가
            const newContent = content + '\n' + linkText;
            
            // 파일 업데이트
            await this.app.vault.modify(sourceFile, newContent);
        } catch (error) {
            console.error('링크 생성 중 오류 발생:', error);
        }
    }
    
    /**
     * 특정 카드를 중앙에 배치합니다.
     * @param cardElement 중앙에 배치할 카드 요소
     * @param smooth 부드러운 스크롤 여부
     */
    centerCard(cardElement: HTMLElement, smooth: boolean = true): void {
        if (!this.scroller || !cardElement) return;
        
        // 스크롤러를 사용하여 카드를 중앙에 배치
        this.scroller.scrollToCard(cardElement, this.settings.enableScrollAnimation);
    }
    
    /**
     * 파일을 엽니다.
     * @param file 열 파일
     */
    openFile(file: TFile): void {
        this.app.workspace.openLinkText(file.path, '', false);
    }
    
    /**
     * 레이아웃 매니저를 가져옵니다.
     * @returns 레이아웃 매니저
     */
    getLayoutManager(): LayoutManager {
        return this.layoutManager;
    }
    
    /**
     * 컨테이너 요소를 가져옵니다.
     * @returns 컨테이너 요소
     */
    getContainerElement(): HTMLElement {
        return this.containerEl;
    }

    /**
     * 키보드 네비게이터에 포커스를 설정합니다.
     */
    focusKeyboardNavigator(): void {
        if (this.keyboardNavigator) {
            this.keyboardNavigator.focusNavigator();
        }
    }

    /**
     * 위로 스크롤합니다.
     * @param count 스크롤할 카드 수
     */
    scrollUp(count: number = 1): void {
        this.scroller.scrollUp(count);
    }

    /**
     * 아래로 스크롤합니다.
     * @param count 스크롤할 카드 수
     */
    scrollDown(count: number = 1): void {
        this.scroller.scrollDown(count);
    }

    /**
     * 왼쪽으로 스크롤합니다.
     * @param count 스크롤할 카드 수
     */
    scrollLeft(count: number = 1): void {
        this.scroller.scrollLeft(count);
    }

    /**
     * 오른쪽으로 스크롤합니다.
     * @param count 스크롤할 카드 수
     */
    scrollRight(count: number = 1): void {
        this.scroller.scrollRight(count);
    }

    /**
     * 레이아웃을 업데이트합니다.
     */
    async updateLayout(): Promise<void> {
        if (!this.layoutManager || !this.containerEl) return;
        
        // 컨테이너 크기 가져오기
        const containerWidth = this.containerEl.clientWidth;
        const containerHeight = this.containerEl.clientHeight;
        
        // 카드 목록 가져오기
        const files = await this.cardListManager.getCardList();
        
        // TFile[]을 Card[]로 변환
        await this.loadFiles(files);
        
        // 레이아웃 매니저를 통해 레이아웃 업데이트
        this.layoutManager.updateLayout(this.cards, containerWidth, containerHeight);
    }

    /**
     * 컨테이너 높이를 설정합니다.
     * @param height 설정할 높이
     */
    public setContainerHeight(height: number): void {
        if (this.containerEl) {
            this.containerEl.style.height = `${height}px`;
            this.containerEl.style.minHeight = `${Math.min(height, 300)}px`;
        }
    }

    /**
     * 설정을 업데이트합니다.
     * @param settings 새 설정
     */
    public updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
        
        // 레이아웃 설정 업데이트
        if (this.layoutConfig) {
            this.layoutConfig.updateSettings(settings);
        }
        
        // 레이아웃 매니저 업데이트
        if (this.layoutManager) {
            this.layoutManager.updateSettings(settings);
        }
        
        // 스크롤러 업데이트
        if (this.scroller) {
            this.scroller.updateSettings(settings);
        }
        
        // 카드 렌더러 업데이트
        if (this.cardRenderer) {
            this.cardRenderer.updateSettings(settings);
        }
        
        // 카드 메이커 업데이트 - 카드 내용 표시 관련 설정 전파
        if (this.cardMaker) {
            // CardMaker의 updateSettings 메서드 직접 호출
            this.cardMaker.updateSettings(settings);
            
            // 설정 변경 시에는 모든 카드를 다시 렌더링
            if (this.cardRenderer) {
                // 모든 카드 새로고침
                this.cardRenderer.refreshAllCards();
            }
        }
        
        // 설정 변경 후 레이아웃 새로고침
        this.refreshLayout();
    }
    
    /**
     * 노트 내용이 변경되었을 때 호출되는 메서드
     * @param fileId 변경된 파일의 ID
     */
    public updateCardContent(fileId: string): void {
        if (!this.cardRenderer) return;
        
        // 변경된 파일에 해당하는 카드만 업데이트
        const cardElement = this.cardRenderer.getCardElement(fileId);
        const card = this.cards.find(card => card.id === fileId);
        
        if (cardElement && card) {
            this.cardMaker.updateCardContent(cardElement, card);
        }
    }

    /**
     * 활성 파일에 해당하는 카드를 강조하고 중앙에 표시합니다.
     */
    public highlightActiveCard(): void {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;
        
        console.log(`[CardContainer] 활성 파일 강조: ${activeFile.path}`);
        
        // 모든 카드에서 활성 상태 제거
        if (this.cardRenderer) {
            this.cards.forEach(card => {
                const cardElement = this.cardRenderer?.getCardElement(card.id);
                if (cardElement && card.file?.path !== activeFile.path) {
                    // 모든 활성 클래스 제거
                    cardElement.classList.remove('card-active');
                    cardElement.classList.remove('card-navigator-active');
                    
                    // 스타일 속성 초기화
                    cardElement.style.removeProperty('box-shadow');
                    cardElement.style.removeProperty('z-index');
                    cardElement.style.removeProperty('transform');
                    cardElement.style.removeProperty('transition');
                    
                    // 내부 요소들의 색상 초기화
                    const elements = cardElement.querySelectorAll('.card-navigator-filename, .card-navigator-first-header, .card-navigator-body, .markdown-rendered');
                    elements.forEach(el => {
                        (el as HTMLElement).style.removeProperty('color');
                    });
                    
                    // 레이아웃 매니저를 통한 스타일 초기화
                    this.layoutManager.applyCardActiveStyle(cardElement, false);
                }
            });
        }
        
        // 활성 파일에 해당하는 카드 찾기
        const activeCard = this.cards.find(card => card.file?.path === activeFile.path);
        if (!activeCard) return;
        
        // 활성 카드 설정
        this.setActiveCard(activeCard.id);
        
        // 카드 요소 가져오기
        const cardElement = this.cardRenderer?.getCardElement(activeCard.id);
        if (!cardElement) return;
        
        // 카드를 중앙에 표시
        setTimeout(() => {
            this.centerCard(cardElement, true);
        }, 100); // 약간의 지연을 두어 렌더링이 완료된 후 스크롤
    }

    /**
     * 모든 카드를 제거합니다.
     * 활성 폴더 변경 시 이전 카드를 즉시 제거하기 위해 사용됩니다.
     */
    public clearCards(): void {
        console.log('[CardContainer] 모든 카드 제거');
        
        // 카드 배열 초기화
        this.cards = [];
        
        // 카드 렌더러가 있으면 카드 제거
        if (this.cardRenderer) {
            this.cardRenderer.setCards([]);
            this.cardRenderer.clearAllCards();
        }
        
        // 컨테이너 요소가 있으면 비우기
        if (this.containerEl) {
            // 카드 요소만 제거하고 컨테이너 자체는 유지
            const cardElements = this.containerEl.querySelectorAll('.card-navigator-card');
            cardElements.forEach(el => el.remove());
        }
        
        // 포커스된 카드 ID 초기화
        this.focusedCardId = null;
    }
}

