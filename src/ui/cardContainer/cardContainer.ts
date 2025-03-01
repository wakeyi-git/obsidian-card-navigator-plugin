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
    private eventListeners: Record<string, Array<() => void>> = {};
    private cardInteractionManager: CardInteractionManager | null = null;
    private app: App;

    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        this.app = this.plugin.app;
        this.cardMaker = new CardMaker(this.plugin);
        this.cardListManager = new CardListManager(this.plugin);
        this.settings = this.plugin.settings;
        
        // ResizeObserver 초기화
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    }

    /**
     * 컨테이너를 초기화합니다.
     * @param containerEl 컨테이너 요소
     */
    public initialize(containerEl: HTMLElement): void {
        if (this.isInitialized) {
            this.cleanup();
        }
        
        this.containerEl = containerEl;
        this.containerEl.empty();
        this.containerEl.classList.add('card-navigator-container');
        
        // 레이아웃 설정 초기화
        this.layoutConfig = new LayoutConfig(this.settings);
        
        // 레이아웃 매니저 초기화
        this.initLayoutManager();
        
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
        
        // ResizeObserver 설정
        this.resizeObserver.observe(this.containerEl);
        
        // 초기화 완료
        this.isInitialized = true;
        
        // 카드 로드
        this.loadCards();
    }

    /**
     * 레이아웃 매니저를 초기화합니다.
     */
    private initLayoutManager(): void {
        // 레이아웃 설정 초기화
        this.layoutConfig = new LayoutConfig(this.settings);
        
        // 레이아웃 매니저 초기화
        this.layoutManager = new LayoutManager(this.settings);
        this.layoutManager.setContainer(this.containerEl);
        
        // 메이슨리 레이아웃 전략 설정
        const layoutStrategy = new MasonryLayoutStrategy();
        this.layoutManager.setStrategy(layoutStrategy);
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
     * 리사이즈 이벤트를 처리합니다.
     */
    private handleResize(entries: ResizeObserverEntry[]): void {
        if (this.isResizing) return;
        
        const entry = entries[0];
        if (!entry) return;
        
        const { width, height } = entry.contentRect;
        
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
        }
        
        // 새 프레임 요청
        this.pendingResizeFrame = requestAnimationFrame(() => {
            this.refreshLayout();
            this.isResizing = false;
            this.pendingResizeFrame = null;
        });
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
        await this.loadFiles(files);
    }

    /**
     * 리소스를 정리합니다.
     */
    public cleanup(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        if (this.cardRenderer) {
            this.cardRenderer.cleanup();
            this.cardRenderer = null;
        }
        
        if (this.cardInteractionManager) {
            // 이벤트 리스너 제거
            this.cards.forEach(card => {
                if (card.id) {
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

    /**
     * 컨테이너를 닫습니다.
     */
    onClose(): void {
        this.cleanup();
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
     * 카드를 로드합니다.
     * @returns 로드된 카드 목록
     */
    async loadCards(): Promise<Card[]> {
        try {
            // 현재 폴더 가져오기
            const folder = await this.getCurrentFolder();
            
            // 폴더가 없으면 빈 배열 반환
            if (!folder) {
                console.log('[CardContainer] 현재 폴더를 찾을 수 없습니다.');
                return [];
            }
            
            // 카드 목록 관리자를 통해 파일 목록 가져오기
            const files = await this.cardListManager.getCardList();
            
            // 파일을 카드로 변환하여 표시
            await this.displayFilesAsCards(files);
            
            return this.cards;
        } catch (error) {
            console.error('카드 로드 중 오류 발생:', error);
            return [];
        }
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
     * 카드를 중앙에 배치합니다.
     * @param cardElement 중앙에 배치할 카드 요소
     * @param smooth 부드러운 스크롤 여부
     */
    centerCard(cardElement: HTMLElement, smooth: boolean = true): void {
        if (!cardElement || !this.containerEl || !this.scroller) return;
        
        // Scroller 클래스의 scrollToCard 메서드를 활용
        this.scroller.scrollToCard(cardElement, smooth);
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
        const containerRect = this.containerEl.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
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
}

