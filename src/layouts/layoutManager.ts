import { Card, CardNavigatorSettings } from 'common/types';
import { LayoutConfig } from './layoutConfig';
import { LayoutStyleManager } from './layoutStyleManager';
import { CardPosition, LayoutDirection, LayoutOptions, LayoutStrategy } from './layoutStrategy';

/**
 * 레이아웃 관리 클래스
 * 
 * 이 클래스는 레이아웃 전략을 구현하고 카드 위치를 관리합니다.
 * LayoutConfig와 LayoutStyleManager 사이의 중재자 역할을 합니다.
 */
export class LayoutManager {
    private settings: CardNavigatorSettings;
    private container: HTMLElement | null = null;
    private cards: Card[] = [];
    private layoutStrategy: LayoutStrategy | null = null;
    private cardPositions: Map<string, CardPosition> = new Map();
    private layoutConfig: LayoutConfig;
    private layoutStyleManager: LayoutStyleManager;
    private lastCardsHash: string = '';
    private lastContainerWidth: number = 0;
    private lastContainerHeight: number = 0;
    private containerSize: { width: number, height: number } | null = null;

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
        this.layoutConfig = new LayoutConfig(settings);
        this.layoutStyleManager = new LayoutStyleManager(settings, this.layoutConfig);
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
        this.layoutConfig.updateSettings(settings);
        this.layoutStyleManager.updateSettings(settings);
    }

    /**
     * 레이아웃을 업데이트합니다.
     * 
     * @param cards 카드 배열
     * @param containerWidth 컨테이너 너비
     * @param containerHeight 컨테이너 높이
     */
    updateLayout(cards: Card[], containerWidth: number, containerHeight: number): void {
        // 컨테이너 크기 업데이트
        this.layoutConfig.updateContainerSize(containerWidth, containerHeight);
        
        // 레이아웃 옵션 설정
        const layoutOptions: LayoutOptions = {
            container: this.container || document.createElement('div'), // null 방지를 위한 기본값 제공
            cards,
            direction: this.layoutConfig.getLayoutDirection(),
            cardWidth: this.layoutConfig.getCardWidth(),
            cardHeight: this.layoutConfig.getCardHeight(),
            columns: this.layoutConfig.getColumns(),
            cardGap: this.layoutConfig.getCardGap(),
            containerPadding: this.layoutConfig.getContainerPadding()
        };
        
        // 레이아웃 전략을 사용하여 카드 위치 계산
        if (this.layoutStrategy) {
            const positions = this.layoutStrategy.arrange(layoutOptions);
            
            // 카드 위치 맵 업데이트
            this.cardPositions.clear();
            positions.forEach(position => {
                this.cardPositions.set(position.cardId, position);
            });
        }
        
        // 컨테이너 크기 계산
        this.calculateContainerSize();
    }

    /**
     * 컨테이너를 설정합니다.
     */
    setContainer(container: HTMLElement): void {
        this.container = container;
    }

    /**
     * 카드 목록을 설정합니다.
     */
    setCards(cards: Card[]): void {
        this.cards = cards;
    }

    /**
     * 레이아웃 전략을 설정합니다.
     */
    setStrategy(strategy: LayoutStrategy): void {
        this.layoutStrategy = strategy;
    }

    /**
     * 카드 위치를 가져옵니다.
     */
    getCardPosition(cardId: string): CardPosition | undefined {
        return this.cardPositions.get(cardId);
    }

    /**
     * 모든 카드 위치를 가져옵니다.
     */
    getAllCardPositions(): Map<string, CardPosition> {
        return this.cardPositions;
    }

    /**
     * 레이아웃 방향을 가져옵니다.
     */
    getLayoutDirection(): LayoutDirection {
        return this.layoutConfig.getLayoutDirection();
    }

    /**
     * 카드 너비를 가져옵니다.
     */
    getCardWidth(): number {
        return this.layoutConfig.getCardWidth();
    }

    /**
     * 카드 높이를 가져옵니다.
     */
    getCardHeight(): number | 'auto' {
        return this.layoutConfig.getCardHeight();
    }

    /**
     * 컬럼 수를 가져옵니다.
     */
    getColumns(): number {
        return this.layoutConfig.getColumns();
    }

    /**
     * 레이아웃 계산이 필요한지 확인합니다.
     */
    isLayoutCalculationNeeded(): boolean {
        if (!this.container || !this.layoutStrategy) return false;
        
        const currentCardsHash = this.calculateCardsHash(this.cards);
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        // 카드 목록, 컨테이너 크기, 설정이 변경되었는지 확인
        const isChanged = 
            currentCardsHash !== this.lastCardsHash ||
            containerWidth !== this.lastContainerWidth ||
            containerHeight !== this.lastContainerHeight;
            
        return isChanged;
    }

    /**
     * 카드 목록의 해시를 계산합니다.
     */
    private calculateCardsHash(cards: Card[]): string {
        return cards.map(card => card.id).join(',');
    }

    /**
     * 레이아웃 계산합니다.
     */
    calculateLayout(): void {
        this.arrange();
    }

    /**
     * 카드를 배치합니다.
     */
    arrange(): void {
        if (!this.container || !this.layoutStrategy) return;
        
        try {
            // 현재 상태 저장
            const currentCardsHash = this.calculateCardsHash(this.cards);
            this.lastCardsHash = currentCardsHash;
            this.lastContainerWidth = this.container.clientWidth;
            this.lastContainerHeight = this.container.clientHeight;
            
            // 컨테이너 크기 업데이트
            this.layoutConfig.updateContainerSize(this.container.clientWidth, this.container.clientHeight);
            
            // 레이아웃 방향 및 카드 크기 계산
            const direction = this.layoutConfig.getLayoutDirection();
            const cardWidth = this.layoutConfig.getCardWidth();
            const cardHeight = this.layoutConfig.getCardHeight();
            const columns = this.layoutConfig.getColumns();
            
            // 레이아웃 스타일 업데이트
            this.layoutStyleManager.updateLayoutStyles(this.container, direction, columns, cardWidth);
            
            // 레이아웃 옵션 생성
            const options: LayoutOptions = {
                container: this.container,
                cards: this.cards,
                direction: direction,
                cardWidth: cardWidth,
                cardHeight: cardHeight,
                columns: columns,
                cardGap: this.layoutConfig.getCardGap(),
                containerPadding: this.layoutConfig.getContainerPadding()
            };
            
            // 전략 패턴을 사용하여 카드 위치 계산
            const positions = this.layoutStrategy.arrange(options);
            
            // 카드 위치 맵 업데이트
            this.cardPositions.clear();
            positions.forEach(position => {
                this.cardPositions.set(position.cardId, position);
            });
        } catch (error) {
            console.error('레이아웃 계산 중 오류 발생:', error);
        }
    }

    /**
     * 카드를 비동기적으로 배치합니다.
     */
    arrangeAsync(callback?: () => void): void {
        // 로컬 변수에 현재 값 저장
        const strategy = this.layoutStrategy;
        const container = this.container;
        const cards = [...this.cards];
        
        if (!this.isLayoutCalculationNeeded()) {
            if (callback) callback();
            return;
        }
        
        setTimeout(() => {
            if (!strategy || !container) {
                if (callback) callback();
                return;
            }
            
            try {
                // 현재 상태 저장
                const currentCardsHash = this.calculateCardsHash(cards);
                this.lastCardsHash = currentCardsHash;
                this.lastContainerWidth = container.clientWidth;
                this.lastContainerHeight = container.clientHeight;
                
                // 컨테이너 크기 업데이트
                this.layoutConfig.updateContainerSize(container.clientWidth, container.clientHeight);
                
                // 레이아웃 방향 및 카드 크기 계산
                const direction = this.layoutConfig.getLayoutDirection();
                const cardWidth = this.layoutConfig.getCardWidth();
                const cardHeight = this.layoutConfig.getCardHeight();
                const columns = this.layoutConfig.getColumns();
                
                // 레이아웃 스타일 업데이트
                this.layoutStyleManager.updateLayoutStyles(container, direction, columns, cardWidth);
                
                // 레이아웃 옵션 생성
                const options: LayoutOptions = {
                    container: container,
                    cards: cards,
                    direction: direction,
                    cardWidth: cardWidth,
                    cardHeight: cardHeight,
                    columns: columns,
                    cardGap: this.layoutConfig.getCardGap(),
                    containerPadding: this.layoutConfig.getContainerPadding()
                };
                
                // 전략 패턴을 사용하여 카드 위치 계산
                const positions = strategy.arrange(options);
                
                // 카드 위치 맵 업데이트
                this.cardPositions.clear();
                positions.forEach(position => {
                    this.cardPositions.set(position.cardId, position);
                });
                
                if (callback) callback();
            } catch (error) {
                console.error('비동기 레이아웃 계산 중 오류 발생:', error);
                if (callback) callback();
            }
        }, 0);
    }

    /**
     * 카드 스타일을 적용합니다.
     */
    applyCardStyle(cardElement: HTMLElement, cardId: string): void {
        const position = this.cardPositions.get(cardId);
        if (!position) return;
        
        this.layoutStyleManager.applyCardPositionStyle(
            cardElement,
            position.left,
            position.top,
            position.width,
            position.height
        );
    }

    /**
     * 카드 포커스 스타일을 적용합니다.
     */
    applyCardFocusStyle(cardElement: HTMLElement, isFocused: boolean): void {
        this.layoutStyleManager.applyCardFocusStyle(cardElement, isFocused);
    }

    /**
     * 카드 활성화 스타일을 적용합니다.
     */
    applyCardActiveStyle(cardElement: HTMLElement, isActive: boolean): void {
        this.layoutStyleManager.applyCardActiveStyle(cardElement, isActive);
    }

    /**
     * LayoutStyleManager를 가져옵니다.
     */
    getLayoutStyleManager(): LayoutStyleManager {
        return this.layoutStyleManager;
    }

    /**
     * LayoutConfig를 가져옵니다.
     */
    getLayoutConfig(): LayoutConfig {
        return this.layoutConfig;
    }

    /**
     * 카드 크기를 가져옵니다.
     */
    public getCardSize(): { width: number, height: number | 'auto' } {
        const width = this.layoutConfig.getCardWidth();
        const height = this.layoutConfig.getCardHeight();
        
        return { width, height };
    }
    
    /**
     * 컨테이너 크기를 가져옵니다.
     */
    public getContainerSize(): { width: number, height: number } | null {
        if (!this.container) return null;
        
        const { width, height } = this.container.getBoundingClientRect();
        return { width, height };
    }

    /**
     * 카드 설정을 업데이트합니다.
     */
    public updateCardSettings(alignCardHeight: boolean, cardsPerColumn: number): void {
        const settings = this.layoutConfig.getSettings();
        settings.alignCardHeight = alignCardHeight;
        settings.cardsPerColumn = cardsPerColumn;
        this.layoutConfig.updateSettings(settings);
    }

    /**
     * 레이아웃을 새로고침합니다.
     */
    public refreshLayout(): void {
        if (!this.container || !this.layoutStrategy) return;
        
        // 현재 컨테이너 크기 가져오기
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        // 레이아웃 업데이트
        this.updateLayout(this.cards, containerWidth, containerHeight);
    }

    /**
     * 컨테이너 크기를 계산합니다.
     */
    private calculateContainerSize(): void {
        if (!this.cardPositions.size) return;
        
        // 모든 카드 위치를 기반으로 컨테이너 크기 계산
        let maxWidth = 0;
        let maxHeight = 0;
        
        this.cardPositions.forEach(position => {
            const cardRight = position.left + position.width;
            const cardHeight = position.height === 'auto' ? 0 : position.height;
            const cardBottom = position.top + cardHeight;
            
            maxWidth = Math.max(maxWidth, cardRight);
            maxHeight = Math.max(maxHeight, cardBottom);
        });
        
        // 컨테이너 크기 설정 (여백 추가)
        const cardGap = this.layoutConfig.getCardGap();
        this.containerSize = {
            width: maxWidth + cardGap,
            height: maxHeight + cardGap
        };
        
        // 컨테이너 DOM 요소가 있는 경우 크기 업데이트
        if (this.container) {
            this.container.style.width = `${this.containerSize.width}px`;
            this.container.style.height = `${this.containerSize.height}px`;
        }
    }
} 