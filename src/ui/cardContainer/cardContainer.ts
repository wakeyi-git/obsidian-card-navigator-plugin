import { WorkspaceLeaf, TFile, TFolder, debounce, App} from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { CardRenderer } from './cardRenderer';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { ListLayout } from 'layouts/listLayout';
import { GridLayout } from 'layouts/gridLayout';
import { MasonryLayout } from 'layouts/masonryLayout';
import { KeyboardNavigator } from './keyboardNavigator';
import { CardNavigatorSettings } from "common/types";
import { Card, SortCriterion, SortOrder } from 'common/types';
import { t } from "i18next";
import { CardNavigatorView, RefreshType } from 'ui/cardNavigatorView';

// Main class for managing the card container and its layout
export class CardContainer {
    //#region 클래스 속성
    private app: App;
    private containerEl!: HTMLElement; // 느낌표로 초기화 보장
    public cardMaker: CardMaker;
    private cardRenderer: CardRenderer | null = null;
    private layoutStrategy!: LayoutStrategy; // 느낌표로 초기화 보장
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    public isVertical: boolean;
    private cardGap: number;
    private keyboardNavigator: KeyboardNavigator | null = null;
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

        // 기본 레이아웃 전략 설정
        this.layoutStrategy = new ListLayout(this.isVertical, this.cardGap, this.plugin.settings.alignCardHeight);
    }

    // 컨테이너 초기화 메서드
    async initialize(containerEl: HTMLElement) {
        // 이전 리소스 정리
        this.cleanup();
        
        // 컨테이너 초기화
        this.containerEl = containerEl;
        
        try {
            // 기본 설정
            this.isVertical = this.calculateIsVertical();
            this.cardGap = this.getCSSVariable('--card-navigator-gap', 10);
            
            // 레이아웃 전략 초기화
            this.layoutStrategy = this.determineAutoLayout();
            if (!this.layoutStrategy) {
                throw new Error('레이아웃 전략 초기화 실패');
            }

            // UI 관련 초기화
            this.updateContainerStyle();
            
            // 컨테이너 크기가 설정될 때까지 대기
            await this.waitForContainerSize();
            
            // 카드 렌더러 초기화 (레이아웃 전략이 완전히 초기화된 후)
            this.cardRenderer = new CardRenderer(
                this.containerEl,
                this.cardMaker,
                this.layoutStrategy,
                this.plugin.settings.alignCardHeight,
                this.plugin.settings.cardsPerView
            );

            // 키보드 네비게이터 초기화
            this.initializeKeyboardNavigator();
            
            // 리사이즈 옵저버 설정
            this.setupResizeObserver();
        } catch (error) {
            console.error('카드 컨테이너 초기화 중 오류 발생:', error);
            // 기본 레이아웃으로 폴백
            this.layoutStrategy = new ListLayout(this.isVertical, this.cardGap, this.plugin.settings.alignCardHeight);
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
    // 컨테이너 방향 계산 메서드
    private calculateIsVertical(): boolean {
        if (!this.containerEl) return true;
        const { width, height } = this.containerEl.getBoundingClientRect();
        return height > width;
    }

    // CSS 변수 값 가져오기 메서드
    private getCSSVariable(variableName: string, defaultValue: number): number {
        if (!this.containerEl) return defaultValue;
        const valueStr = getComputedStyle(this.containerEl).getPropertyValue(variableName).trim();
        return parseInt(valueStr) || defaultValue;
    }

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
            this.containerEl.classList.toggle('vertical', this.isVertical);
            this.containerEl.classList.toggle('horizontal', !this.isVertical);
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
        
        const newIsVertical = this.calculateIsVertical();
        const previousIsVertical = this.isVertical;
        this.isVertical = newIsVertical;

        // 레이아웃 업데이트가 필요한 경우:
        // 1. 오토 레이아웃일 때
        // 2. 방향이 변경되었을 때
        // 3. 그리드나 메이슨리 레이아웃일 때 (카드 크기 조정 필요)
        // 4. 리스트 레이아웃일 때 (카드 높이 정렬이 활성화된 경우)
        if (this.currentLayout === 'auto' || 
            previousIsVertical !== this.isVertical ||
            this.currentLayout === 'grid' ||
            this.currentLayout === 'masonry' ||
            (this.currentLayout === 'list' && this.plugin.settings.alignCardHeight)) {
            
            this.layoutStrategy = this.determineAutoLayout();
            this.cardRenderer?.setLayoutStrategy(this.layoutStrategy);
            
            // Card[]를 TFile[]로 변환하여 카드 다시 표시
            const files = this.cards.map(card => card.file);
            this.displayCards(files);
        }

        this.keyboardNavigator?.updateLayout(this.layoutStrategy);
    }

    // 레이아웃 업데이트 메서드
    private updateLayout() {
        if (!this.containerEl) return;
        const newIsVertical = this.calculateIsVertical();
        const previousIsVertical = this.isVertical;
        this.isVertical = newIsVertical;
    
        if (this.plugin.settings.defaultLayout === 'auto' || 
            this.plugin.settings.defaultLayout === 'list' || 
            previousIsVertical !== this.isVertical) {
            this.layoutStrategy = this.determineAutoLayout();
            this.cardRenderer?.setLayoutStrategy(this.layoutStrategy);
        }
    
        this.keyboardNavigator?.updateLayout(this.layoutStrategy);
    }

    // 현재 레이아웃 전략 반환 메서드
    public getLayoutStrategy(): LayoutStrategy {
        return this.layoutStrategy;
    }

    // 레이아웃 설정 메서드
    setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        // 현재 레이아웃을 업데이트
        this.currentLayout = layout;

        const containerStyle = window.getComputedStyle(this.containerEl);
        const containerWidth = this.containerEl.offsetWidth;
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const availableWidth = containerWidth - paddingLeft - paddingRight;

        if (layout === 'auto') {
            this.layoutStrategy = this.determineAutoLayout();
        } else {
            switch (layout) {
                case 'list': {
                    const listLayout = new ListLayout(this.isVertical, this.cardGap, this.plugin.settings.alignCardHeight);
                    listLayout.setCardWidth(availableWidth);
                    this.layoutStrategy = listLayout;
                    break;
                }
                case 'grid': {
                    const gridLayout = new GridLayout(this.plugin.settings.gridColumns, this.cardGap, this.plugin.settings);
                    const cardWidth = Math.floor((availableWidth - (this.plugin.settings.gridColumns - 1) * this.cardGap) / this.plugin.settings.gridColumns);
                    gridLayout.setCardWidth(cardWidth);
                    this.layoutStrategy = gridLayout;
                    break;
                }
                case 'masonry': {
                    const masonryLayout = new MasonryLayout(
                        this.plugin.settings.masonryColumns,
                        this.cardGap,
                        this.plugin.settings,
                        this.cardMaker
                    );
                    if (this.containerEl) {
                        masonryLayout.setContainer(this.containerEl);
                        const cardWidth = Math.floor((availableWidth - (this.plugin.settings.masonryColumns - 1) * this.cardGap) / this.plugin.settings.masonryColumns);
                        masonryLayout.setCardWidth(cardWidth);
                    }
                    this.layoutStrategy = masonryLayout;
                    break;
                }
            }
        }
        
        // 레이아웃 전략 업데이트
        this.cardRenderer?.setLayoutStrategy(this.layoutStrategy);
        
        // 키보드 내비게이터 업데이트
        this.keyboardNavigator?.updateLayout(this.layoutStrategy);
        
        // 현재 카드 다시 표시
        // const files = this.cards.map(card => card.file);
        // this.displayCards(files);
    }
    //#endregion

    //#region 카드 표시 및 렌더링
    // 카드 표시 메서드
    public async displayCards(files: TFile[]) {
        if (!this.containerEl) return;
        
        if (!files || files.length === 0) {
            // 빈 상태 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('No cards to display')}
                    </div>
                </div>`;
            return;
        }
        
        this.updateContainerStyle();
        const cardsData = await this.createCardsData(files);
        
        if (cardsData.length === 0) {
            // 마크다운 파일이 없는 경우 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('No markdown files found')}
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
    // 활성 카드로 스크롤 메서드
    private scrollToActiveCard(animate = true) {
        if (!this.containerEl) return;
        const activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement | null;
        if (!activeCard) return;

        this.centerCard(activeCard, animate);
    }

    // 카드 중앙 정렬 메서드
    public centerCard(card: HTMLElement, animate = true) {
        if (!this.containerEl) return;

        const containerRect = this.containerEl.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        let offset = 0;
        let scrollProperty: 'scrollTop' | 'scrollLeft';

        if (this.isVertical) {
            const containerVisibleHeight = containerRect.height;
            offset = cardRect.top - containerRect.top - (containerVisibleHeight - cardRect.height) / 2;
            scrollProperty = 'scrollTop';
        } else {
            const containerVisibleWidth = containerRect.width;
            offset = cardRect.left - containerRect.left - (containerVisibleWidth - cardRect.width) / 2;
            scrollProperty = 'scrollLeft';
        }

        const newScrollPosition = this.containerEl[scrollProperty] + offset;

        if (animate && this.plugin.settings.enableScrollAnimation) {
            this.smoothScroll(scrollProperty, newScrollPosition);
        } else {
            this.containerEl[scrollProperty] = newScrollPosition;
        }
    }

    // 부드러운 스크롤 메서드
    private smoothScroll(scrollProperty: 'scrollTop' | 'scrollLeft', targetPosition: number) {
        if (!this.containerEl) return;

        const startPosition = this.containerEl[scrollProperty];
        const distance = targetPosition - startPosition;
        const duration = 300; // ms
        let startTime: number | null = null;

        const animation = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

            if (this.containerEl) {
                this.containerEl[scrollProperty] = startPosition + distance * easeProgress;
            }

            if (timeElapsed < duration && this.containerEl) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    // 방향별 스크롤 메서드
    private scrollInDirection(direction: 'up' | 'down' | 'left' | 'right', count = 1) {
        if (!this.containerEl) return;
        const { width, height } = this.getCardSize();
        const cardsPerView = this.plugin.settings.cardsPerView;
        const totalCards = this.cards.length;
        const isVertical = this.layoutStrategy.getScrollDirection() === 'vertical';
        
        const cardSize = isVertical ? height : width;
        const currentScroll = isVertical ? this.containerEl.scrollTop : this.containerEl.scrollLeft;
        const totalSize = totalCards * cardSize;
        const containerSize = isVertical ? this.containerEl.clientHeight : this.containerEl.clientWidth;
        
        let targetScroll;
        if (count === cardsPerView) { // Page Up/Left or Page Down/Right
            const currentEdgeCard = Math.floor((currentScroll + (direction === 'down' || direction === 'right' ? containerSize : 0)) / cardSize);
            if (direction === 'up' || direction === 'left') {
                if (currentEdgeCard < cardsPerView) {
                    targetScroll = 0; // Scroll to the very start
                } else {
                    targetScroll = Math.max(0, (currentEdgeCard - cardsPerView) * cardSize);
                }
            } else { // down or right
                if (totalCards - currentEdgeCard < cardsPerView) {
                    targetScroll = totalSize - containerSize; // Scroll to the very end
                } else {
                    targetScroll = currentEdgeCard * cardSize;
                }
            }
        } else {
            const scrollAmount = cardSize * count;
            if (direction === 'up' || direction === 'left') {
                targetScroll = Math.max(0, currentScroll - scrollAmount);
            } else {
                targetScroll = Math.min(totalSize - containerSize, currentScroll + scrollAmount);
            }
        }

        if (this.plugin.settings.enableScrollAnimation) {
            this.containerEl.scrollTo({
                [isVertical ? 'top' : 'left']: targetScroll,
                behavior: 'smooth'
            });
        } else {
            this.containerEl[isVertical ? 'scrollTop' : 'scrollLeft'] = targetScroll;
        }
    }

    // 위로 스크롤 메서드
    scrollUp(count = 1) {
        this.scrollInDirection('up', count);
    }

    // 아래로 스크롤 메서드
    scrollDown(count = 1) {
        this.scrollInDirection('down', count);
    }

    // 왼쪽으로 스크롤 메서드
    scrollLeft(count = 1) {
        this.scrollInDirection('left', count);
    }

    // 오른쪽으로 스크롤 메서드
    scrollRight(count = 1) {
        this.scrollInDirection('right', count);
    }
    //#endregion

    //#region 카드 검색 및 정렬
    // 카드 검색 메서드
    public async searchCards(searchTerm: string) {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const filteredFiles = await this.filterFilesByContent(files, searchTerm);

        await this.displayCards(filteredFiles);
    }

    // 파일 내용 기반 필터링 메서드
    private async filterFilesByContent(files: TFile[], searchTerm: string): Promise<TFile[]> {
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        const filteredFiles = [];
        for (const file of files) {
            const content = await this.plugin.app.vault.cachedRead(file);
            if (file.basename.toLowerCase().includes(lowercaseSearchTerm) ||
                content.toLowerCase().includes(lowercaseSearchTerm)) {
                filteredFiles.push(file);
            }
        }
        return filteredFiles;
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
        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
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

    // 자동 레이아웃 결정 메서드
    private determineAutoLayout(): LayoutStrategy {
        if (!this.containerEl) {
            throw new Error('Container element is not initialized');
        }

        const containerStyle = window.getComputedStyle(this.containerEl);
        const containerWidth = this.containerEl.offsetWidth;
        const containerHeight = this.containerEl.offsetHeight;
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const availableWidth = containerWidth - paddingLeft - paddingRight;
        
        const {
            alignCardHeight,
            cardWidthThreshold,
            defaultLayout,
            gridColumns,
            masonryColumns,
            cardsPerView
        } = this.plugin.settings;

        // 자동이 아닌 레이아웃의 경우 해당 레이아웃 전략 반환
        if (defaultLayout !== 'auto') {
            switch (defaultLayout) {
                case 'list': {
                    // 리스트 레이아웃에서는 컨테이너 너비에 맞춰 카드 너비 조정
                    const listLayout = new ListLayout(this.isVertical, this.cardGap, alignCardHeight);
                    listLayout.setCardWidth(availableWidth);
                    return listLayout;
                }
                case 'grid': {
                    // 그리드 레이아웃에서는 컨테이너 너비에 맞춰 카드 너비 조정
                    const gridLayout = new GridLayout(gridColumns, this.cardGap, this.plugin.settings);
                    const cardWidth = Math.floor((availableWidth - (gridColumns - 1) * this.cardGap) / gridColumns);
                    gridLayout.setCardWidth(cardWidth);
                    return gridLayout;
                }
                case 'masonry': {
                    // 메이슨리 레이아웃에서는 컨테이너 너비에 맞춰 카드 너비 조정
                    const masonryLayout = new MasonryLayout(
                        masonryColumns,
                        this.cardGap,
                        this.plugin.settings,
                        this.cardMaker
                    );
                    if (this.containerEl) {
                        masonryLayout.setContainer(this.containerEl);
                        const cardWidth = Math.floor((availableWidth - (masonryColumns - 1) * this.cardGap) / masonryColumns);
                        masonryLayout.setCardWidth(cardWidth);
                    }
                    return masonryLayout;
                }
            }
        }

        // 오토 레이아웃의 경우 컨테이너 너비에 따라 동적으로 결정
        const columns = Math.max(1, Math.floor((availableWidth + this.cardGap) / (cardWidthThreshold + this.cardGap)));
        const cardWidth = Math.floor((availableWidth - (columns - 1) * this.cardGap) / columns);

        if (columns === 1) {
            // 리스트 레이아웃으로 결정된 경우
            const listLayout = new ListLayout(this.isVertical, this.cardGap, alignCardHeight);
            listLayout.setCardWidth(cardWidth);
            return listLayout;
        } else if (alignCardHeight) {
            // 그리드 레이아웃으로 결정된 경우
            const gridLayout = new GridLayout(columns, this.cardGap, this.plugin.settings);
            gridLayout.setCardWidth(cardWidth);
            return gridLayout;
        } else {
            // 메이슨리 레이아웃으로 결정된 경우
            const masonryLayout = new MasonryLayout(columns, this.cardGap, this.plugin.settings, this.cardMaker);
            if (this.containerEl) {
                masonryLayout.setContainer(this.containerEl);
                masonryLayout.setCardWidth(cardWidth);
            }
            return masonryLayout;
        }
    }

    // 카드 크기 가져오기 메서드
    private getCardSize(): { width: number, height: number } {
        return this.cardRenderer?.getCardSize() || { width: 0, height: 0 };
    }
    //#endregion
}

