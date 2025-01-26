import { WorkspaceLeaf, TFile, TFolder, debounce } from 'obsidian';
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
    private containerEl: HTMLElement;
    public cardMaker: CardMaker;
    private cardRenderer: CardRenderer;
    private layoutStrategy: LayoutStrategy;
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    public isVertical: boolean;
    private cardGap: number;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private cards: Card[] = [];
    private resizeObserver: ResizeObserver;
    private focusedCardId: string | null = null;

    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        // leaf의 view를 통해 컨테이너 요소에 접근
        const leafView = this.leaf.view;
        if (!leafView || !leafView.containerEl) {
            throw new Error('Invalid leaf view or container');
        }
    
        // 새로운 div 요소를 생성하고 leaf의 컨테이너에 추가
        this.containerEl = leafView.containerEl.createDiv('card-navigator-container');
        
        if (!this.containerEl) {
            throw new Error('Failed to create container element');
        }
    
        this.cardMaker = new CardMaker(
            this.plugin
        );
    
        this.isVertical = this.calculateIsVertical();
        this.cardGap = this.getCSSVariable('--card-navigator-gap', 10);
        
        try {
            this.layoutStrategy = this.determineAutoLayout();
        } catch (error) {
            console.error('Failed to determine layout strategy:', error);
            this.layoutStrategy = new ListLayout(this.isVertical, this.cardGap, this.plugin.settings.alignCardHeight);
        }

        if (this.layoutStrategy instanceof MasonryLayout && this.containerEl) {
            this.layoutStrategy.setContainer(this.containerEl);
        }

        this.cardRenderer = new CardRenderer(
            this.containerEl,
            this.cardMaker,
            this.layoutStrategy,
            this.plugin.settings.alignCardHeight,
            this.plugin.settings.cardsPerView
        );
    
        this.resizeObserver = new ResizeObserver(debounce(() => {
            this.handleResize();
        }, 100));

        // ResizeObserver 설정
        this.setupResizeObserver();
    
        // 키보드 네비게이터 초기화
        this.initializeKeyboardNavigator();

        this.currentLayout = this.plugin.settings.defaultLayout; // 초기 레이아웃 설정
    }
    
    private setupResizeObserver() {
        if (this.containerEl) {
            this.resizeObserver.observe(this.containerEl);
        }
    }
    
    private initializeKeyboardNavigator() {
        if (this.containerEl) {
            this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
        } else {
            console.warn('Container element not available for KeyboardNavigator');
        }
    }

    // Determines whether the container should be considered vertical
    private calculateIsVertical(): boolean {
        if (!this.containerEl) return true;
        const { width, height } = this.containerEl.getBoundingClientRect();
        return height > width;
    }

    // Retrieves the value of a CSS variable, or returns a default value if not found
    private getCSSVariable(variableName: string, defaultValue: number): number {
        if (!this.containerEl) return defaultValue;
        const valueStr = getComputedStyle(this.containerEl).getPropertyValue(variableName).trim();
        return parseInt(valueStr) || defaultValue;
    }

    // Initializes the card container with necessary settings and prepares it for use
    async initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        
        // 먼저 컨테이너 스타일 설정
        this.updateContainerStyle();
        
        // 컨테이너 크기가 계산될 때까지 대기
        await this.waitForContainerSize();
        
        // 레이아웃 전략 결정 전에 CSS 변수가 적용되도록 보장
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // 레이아웃 전략 설정
        this.layoutStrategy = this.determineAutoLayout();
        
        // cardRenderer 초기화 (이미 스타일이 적용된 상태)
        this.cardRenderer = new CardRenderer(
            this.containerEl,
            this.cardMaker,
            this.layoutStrategy,
            this.plugin.settings.alignCardHeight,
            this.plugin.settings.cardsPerView
        );
        
        // 키보드 네비게이터 초기화
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
        
        // 리사이즈 옵저버 설정 (레이아웃이 완전히 초기화된 후)
        this.setupResizeObserver();
    }
    
    private waitForContainerSize(): Promise<void> {
        return new Promise((resolve) => {
            if (this.containerEl && 
                this.containerEl.offsetWidth > 0 && 
                this.containerEl.offsetHeight > 0 &&
                getComputedStyle(this.containerEl).getPropertyValue('--cards-per-view')) {
                resolve();
                return;
            }

            const observer = new ResizeObserver(() => {
                if (this.containerEl && 
                    this.containerEl.offsetWidth > 0 && 
                    this.containerEl.offsetHeight > 0 &&
                    getComputedStyle(this.containerEl).getPropertyValue('--cards-per-view')) {
                    observer.disconnect();
                    resolve();
                }
            });

            if (this.containerEl) {
                observer.observe(this.containerEl);
            }
        });
    }

    // Updates the container's styles based on the current plugin settings
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
    
    // Updates the container settings based on the provided partial settings
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

    // Handle resize event
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
            this.cardRenderer.setLayoutStrategy(this.layoutStrategy);
            
            // Card[]를 TFile[]로 변환하여 카드 다시 표시
            const files = this.cards.map(card => card.file);
            this.displayCards(files);
        }

        this.keyboardNavigator?.updateLayout(this.layoutStrategy);
    }

    // Update layout when needed
    private updateLayout() {
        if (!this.containerEl) return;
        const newIsVertical = this.calculateIsVertical();
        const previousIsVertical = this.isVertical;
        this.isVertical = newIsVertical;
    
        if (this.plugin.settings.defaultLayout === 'auto' || 
            this.plugin.settings.defaultLayout === 'list' || 
            previousIsVertical !== this.isVertical) {
            this.layoutStrategy = this.determineAutoLayout();
            this.cardRenderer.setLayoutStrategy(this.layoutStrategy);
        }
    
        this.keyboardNavigator?.updateLayout(this.layoutStrategy);
    }

    // Returns the current layout strategy
    public getLayoutStrategy(): LayoutStrategy {
        return this.layoutStrategy;
    }

    // Sets the layout strategy based on the provided layout type
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
        this.cardRenderer.setLayoutStrategy(this.layoutStrategy);
        
        // 키보드 내비게이터 업데이트
        this.keyboardNavigator?.updateLayout(this.layoutStrategy);
        
        // 현재 카드 다시 표시
        const files = this.cards.map(card => card.file);
        this.displayCards(files);
    }

    // Displays the cards based on the filtered files
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

    // Creates card data objects for a list of files
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

    // Renders the card elements inside the container
    private async renderCards(cardsData: Card[]) {
        if (!cardsData || cardsData.length === 0) {
            console.debug('The card data is empty.');
            return;
        }

        this.cards = cardsData; // cards 배열 업데이트
        const activeFile = this.plugin.app.workspace.getActiveFile();
        await this.cardRenderer.renderCards(cardsData, this.focusedCardId, activeFile);
        
        const newActiveCardIndex = Array.from(this.containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );

        if (newActiveCardIndex !== -1) {
            this.scrollToActiveCard(false);
        }
    }

    public focusCard(cardId: string) {
        this.focusedCardId = cardId;
        this.updateFocusedCard();
    }

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

    // Clears the 'focused' status from all card elements
    public clearFocusedCards() {
        this.cardRenderer.clearFocusedCards();
    }

    // Scrolls to the currently active card, centering it within the container
    private scrollToActiveCard(animate = true) {
        if (!this.containerEl) return;
        const activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement | null;
        if (!activeCard) return;

        this.centerCard(activeCard, animate);
    }

    // Centers a specific card within the container, either horizontally or vertically
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

        if (animate) {
            this.smoothScroll(scrollProperty, newScrollPosition);
        } else {
            this.containerEl[scrollProperty] = newScrollPosition;
        }
    }

    // Smoothly scrolls to a target position in the container
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

    // Retrieves the size of the card elements, including the gap between them
    private getCardSize(): { width: number, height: number } {
        return this.cardRenderer.getCardSize();
    }

    // Scrolls the container in the specified direction by a given number of cards
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
                    targetScroll = Math.min(totalSize - containerSize, (currentEdgeCard + 1) * cardSize);
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

        this.containerEl.scrollTo({
            [isVertical ? 'top' : 'left']: targetScroll,
            behavior: 'smooth'
        });
    }

    // Scrolls the container upwards by a specified number of cards
    scrollUp(count = 1) {
        this.scrollInDirection('up', count);
    }

    // Scrolls the container downwards by a specified number of cards
    scrollDown(count = 1) {
        this.scrollInDirection('down', count);
    }

    // Scrolls the container to the left by a specified number of cards
    scrollLeft(count = 1) {
        this.scrollInDirection('left', count);
    }

    // Scrolls the container to the right by a specified number of cards
    scrollRight(count = 1) {
        this.scrollInDirection('right', count);
    }

    // Searches for cards by file body or file name and displays them
    public async searchCards(searchTerm: string) {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const filteredFiles = await this.filterFilesByContent(files, searchTerm);

        await this.displayCards(filteredFiles);
    }

    // Filters files based on their body or name
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

    // Displays cards for a specific folder
    public async displayCardsForFolder(folder: TFolder) {
        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        await this.displayCards(files);
    }

    // Sorts the cards based on a given criterion and order
    public async sortCards(criterion: SortCriterion, order: SortOrder) {
        this.plugin.settings.sortCriterion = criterion;
        this.plugin.settings.sortOrder = order;
        await this.plugin.saveSettings();
        // refresh 대신 CardNavigatorView의 리프레시 시스템 사용
        const view = this.leaf.view;
        if (view instanceof CardNavigatorView) {
            view.refresh(RefreshType.CONTENT);
        }
    }

    // Retrieves the current folder from which to display cards, either selected or active
    private async getCurrentFolder(): Promise<TFolder | null> {
        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
        }
    }

    // Retrieves the file associated with a given card element
    public getFileFromCard(cardElement: HTMLElement): TFile | null {
        return this.cardRenderer.getFileFromCard(cardElement, this.cards);
    }

    // Focuses on the keyboard navigator to allow keyboard-based navigation
    public focusNavigator() {
        this.keyboardNavigator?.focusNavigator();
    }
    
    // Removes focus from the keyboard navigator
    public blurNavigator() {
        this.keyboardNavigator?.blurNavigator();
    }

    // Cleans up event listeners when the card container is closed
    onClose() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    // Determines the appropriate layout strategy based on the container size and plugin settings
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
}

