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
import { getSearchService } from 'ui/toolbar/search';

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
    private cardGap: number;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private scroller!: Scroller;
    private cards: Card[] = [];
    private resizeObserver: ResizeObserver;
    private focusedCardId: string | null = null;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 기본 컴포넌트 초기화
    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        // 기본 컴포넌트만 초기화
        this.app = this.plugin.app;
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = true; // 기본값
        this.cardGap = 10; // 기본값
        this.currentLayout = this.plugin.settings.defaultLayout;
        
        // 리소스 관리용 옵저버 초기화
        this.resizeObserver = new ResizeObserver(debounce(() => {
            this.handleResize();
        }, 100));
    }

    // 컨테이너 초기화 메서드
    async initialize(containerEl: HTMLElement) {
        this.cleanup();
        
        this.containerEl = containerEl;
        
        try {
            this.layoutManager = new LayoutManager(this.plugin, containerEl, this.cardMaker);
            
            this.scroller = new Scroller(
                containerEl,
                this.plugin,
                () => this.layoutManager.getLayoutStrategy(),
                () => this.getCardSize()
            );
            
            this.updateContainerStyle();
            
            await this.waitForContainerSize();
            
            this.cardRenderer = new CardRenderer(
                this.containerEl,
                this.cardMaker,
                this.layoutManager,
                this.plugin.settings.alignCardHeight,
                this.plugin.settings.cardsPerView
            );

            this.initializeKeyboardNavigator();
            
            this.setupResizeObserver();
        } catch (error) {
            console.error('카드 컨테이너 초기화 중 오류 발생:', error);
            throw error;
        }
    }

    // 리소스 정리 메서드
    private cleanup() {
        // 리사이즈 옵저버 정리
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // 카드 렌더러 정리
        if (this.cardRenderer) {
            this.cardRenderer.cleanup?.();
            this.cardRenderer = null;
        }

        // 키보드 네비게이터 정리
        if (this.keyboardNavigator) {
            this.keyboardNavigator.cleanup?.();
            this.keyboardNavigator = null;
        }

        // 컨테이너 정리
        if (this.containerEl) {
            this.containerEl.empty();
        }
    }

    // 컨테이너 닫기 메서드
    onClose() {
        this.cleanup();
    }

    // 리사이즈 옵저버 설정 메서드
    private setupResizeObserver() {
        if (this.containerEl) {
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
            this.containerEl.classList.add('card-navigator-container');
            const isVertical = this.layoutManager.getLayoutStrategy().getScrollDirection() === 'vertical';
            this.containerEl.classList.toggle('vertical', isVertical);
            this.containerEl.classList.toggle('horizontal', !isVertical);
            this.containerEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
            this.containerEl.classList.toggle('flexible-height', !this.plugin.settings.alignCardHeight);

            this.containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerView.toString());
        }
    }
    
    // 설정 업데이트 메서드
    updateSettings(settings: Partial<CardNavigatorSettings>) {
        if (settings.alignCardHeight !== undefined) {
            this.plugin.settings.alignCardHeight = settings.alignCardHeight;
        }
        if (settings.bodyLengthLimit !== undefined) {
            this.plugin.settings.bodyLengthLimit = settings.bodyLengthLimit;
        }
        if (settings.bodyLength !== undefined) {
            this.plugin.settings.bodyLength = settings.bodyLength;
        }
    }

    // 리사이즈 처리 메서드
    public handleResize() {
        if (!this.containerEl) return;
        
        this.layoutManager.updateLayout();
        this.cardRenderer?.setLayoutStrategy(this.layoutManager.getLayoutStrategy());
        
        const files = this.cards.map(card => card.file);
        this.displayCards(files);

        this.keyboardNavigator?.updateLayout(this.layoutManager.getLayoutStrategy());
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

        // files가 비어있거나 전달되지 않은 경우, 또는 vault 모드인 경우
        if (!files || files.length === 0 || this.plugin.settings.cardSetType === 'vault') {
            if (this.plugin.settings.cardSetType === 'vault') {
                // 전체 볼트 모드에서는 모든 하위 폴더의 파일들을 가져옴
                displayFiles = this.getAllMarkdownFiles(folder);
            } else {
                // 활성 폴더나 선택된 폴더 모드에서는 해당 폴더의 파일들을 가져옴
                displayFiles = folder.children
                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
            }
        } else {
            // 전달받은 파일 목록 사용 (검색 결과 등)
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

        this.cards = cardsData; // cards 배열 업데이트
        const activeFile = this.plugin.app.workspace.getActiveFile();
        await this.cardRenderer?.renderCards(cardsData, this.focusedCardId, activeFile);
        
        const newActiveCardIndex = Array.from(this.containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );

        if (newActiveCardIndex !== -1) {
            this.scrollToActiveCard(false);
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
    // 카드 검색 메서드
    public async searchCards(searchTerm: string) {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        // 검색어가 없으면 현재 표시된 카드를 기준으로 검색
        if (!searchTerm) {
            await this.displayCards([]);
            return;
        }

        const searchService = getSearchService(this.plugin);
        let filesToSearch: TFile[];

        // 이미 로드된 카드가 있다면 해당 카드들을 대상으로 검색
        if (this.cards.length > 0) {
            filesToSearch = this.cards.map(card => card.file);
        } else {
            // 카드가 없는 경우에만 새로 파일을 가져옴
            if (this.plugin.settings.cardSetType === 'vault') {
                filesToSearch = searchService.getAllMarkdownFiles(folder);
            } else {
                filesToSearch = folder.children
                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
            }
        }

        const filteredFiles = await searchService.searchFiles(filesToSearch, searchTerm);
        await this.displayCards(filteredFiles);
    }

    // 폴더별 카드 표시 메서드
    public async displayCardsForFolder(folder: TFolder) {
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
}

