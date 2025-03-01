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
    private debugMode: boolean = true; // 디버그 모드 활성화
    private resizeObserver: ResizeObserver | null = null; // 컨테이너 크기 변경 감지를 위한 ResizeObserver
    private resizeDebounceTimeout: NodeJS.Timeout | null = null;
    private resizeDebounceDelay: number = 50; // 디바운스 지연 시간 (ms)
    private isUpdating: boolean = false; // 업데이트 중복 방지 플래그
    private containerWidth: number = 0;
    private containerHeight: number = 0;
    private resizeTimeout: NodeJS.Timeout | null = null;

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
        this.layoutConfig = new LayoutConfig(settings);
        this.layoutStyleManager = new LayoutStyleManager(settings, this.layoutConfig);
        this.logDebug('LayoutManager 초기화');
        
        // ResizeObserver 초기화
        this.initResizeObserver();
    }

    /**
     * ResizeObserver를 초기화합니다.
     */
    private initResizeObserver(): void {
        // 이미 존재하는 경우 제거
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // 새 ResizeObserver 생성
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        
        this.logDebug('ResizeObserver 초기화 완료');
    }

    /**
     * 디버그 로그를 출력합니다.
     */
    private logDebug(message: string, data?: any): void {
        if (this.debugMode) {
            console.log(`[LayoutManager] ${message}`, data ? data : '');
        }
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
        // 업데이트 중복 방지
        if (this.isUpdating) {
            this.logDebug('이미 업데이트 중, 요청 무시');
            return;
        }
        
        this.isUpdating = true;
        this.logDebug('레이아웃 업데이트 시작', { 
            cardsCount: cards.length, 
            containerWidth, 
            containerHeight 
        });
        
        try {
            // 카드 저장
            this.cards = cards;
            
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
            
            this.logDebug('레이아웃 옵션', layoutOptions);
            
            // 레이아웃 전략을 사용하여 카드 위치 계산
            if (this.layoutStrategy) {
                const positions = this.layoutStrategy.arrange(layoutOptions);
                
                // 카드 위치 맵 업데이트
                this.cardPositions.clear();
                positions.forEach(position => {
                    this.cardPositions.set(position.cardId, position);
                });
                
                this.logDebug('카드 위치 계산 완료', { positionsCount: positions.length });
            } else {
                this.logDebug('레이아웃 전략이 설정되지 않음');
            }
            
            // 컨테이너 크기 계산
            this.calculateContainerSize();
            
            this.logDebug('레이아웃 업데이트 완료', { 
                containerSize: this.containerSize,
                cardPositionsCount: this.cardPositions.size
            });
        } catch (error) {
            console.error('레이아웃 업데이트 중 오류 발생:', error);
            this.logDebug('레이아웃 업데이트 오류', { error });
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * 컨테이너를 설정합니다.
     */
    setContainer(container: HTMLElement): void {
        // 이전 컨테이너에서 ResizeObserver 제거
        if (this.container && this.resizeObserver) {
            this.resizeObserver.unobserve(this.container);
        }
        
        this.container = container;
        
        // 새 컨테이너에 ResizeObserver 추가
        if (this.resizeObserver) {
            this.resizeObserver.observe(container);
        }
        
        this.logDebug('컨테이너 설정', { 
            containerId: container.id, 
            containerClass: container.className,
            containerSize: { 
                width: container.clientWidth, 
                height: container.clientHeight 
            } 
        });
        
        // 초기 레이아웃 계산을 위해 컨테이너 크기 업데이트
        this.layoutConfig.updateContainerSize(container.clientWidth, container.clientHeight);
    }

    /**
     * 카드 목록을 설정합니다.
     */
    setCards(cards: Card[]): void {
        this.cards = cards;
        this.logDebug('카드 목록 설정', { cardsCount: cards.length });
        
        // 카드 목록이 변경되면 레이아웃 재계산
        if (this.container) {
            this.refreshLayout();
        }
    }

    /**
     * 레이아웃 전략을 설정합니다.
     */
    setStrategy(strategy: LayoutStrategy): void {
        this.layoutStrategy = strategy;
        this.logDebug('레이아웃 전략 설정', { strategyName: strategy.constructor.name });
        
        // 전략이 변경되면 레이아웃 재계산
        if (this.container && this.cards.length > 0) {
            this.refreshLayout();
        }
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
            
        if (isChanged) {
            this.logDebug('레이아웃 계산 필요', {
                cardsHashChanged: currentCardsHash !== this.lastCardsHash,
                widthChanged: containerWidth !== this.lastContainerWidth,
                heightChanged: containerHeight !== this.lastContainerHeight,
                currentWidth: containerWidth,
                currentHeight: containerHeight
            });
        }
            
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
        if (!this.container || !this.layoutStrategy) {
            this.logDebug('카드 배치 실패: 컨테이너 또는 레이아웃 전략이 없음');
            return;
        }
        
        try {
            this.logDebug('카드 배치 시작', { 
                cardsCount: this.cards.length,
                containerWidth: this.container.clientWidth,
                containerHeight: this.container.clientHeight
            });
            
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
            this.layoutStyleManager.updateLayoutStyles(this.container);
            
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
            
            this.logDebug('레이아웃 옵션', options);
            
            // 전략 패턴을 사용하여 카드 위치 계산
            const positions = this.layoutStrategy.arrange(options);
            
            // 카드 위치 맵 업데이트
            this.cardPositions.clear();
            positions.forEach(position => {
                this.cardPositions.set(position.cardId, position);
            });
            
            this.logDebug('카드 배치 완료', { 
                positionsCount: positions.length,
                firstCardPosition: positions.length > 0 ? positions[0] : null,
                lastCardPosition: positions.length > 0 ? positions[positions.length - 1] : null
            });
        } catch (error) {
            console.error('레이아웃 계산 중 오류 발생:', error);
            this.logDebug('레이아웃 계산 오류', { error });
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
        
        this.logDebug('비동기 카드 배치 시작');
        
        setTimeout(() => {
            if (!strategy || !container) {
                this.logDebug('비동기 카드 배치 실패: 전략 또는 컨테이너 없음');
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
                this.layoutStyleManager.updateLayoutStyles(container);
                
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
                
                this.logDebug('비동기 레이아웃 옵션', {
                    direction,
                    cardWidth,
                    cardHeight,
                    columns,
                    cardGap: this.layoutConfig.getCardGap(),
                    containerPadding: this.layoutConfig.getContainerPadding()
                });
                
                // 전략 패턴을 사용하여 카드 위치 계산
                const positions = strategy.arrange(options);
                
                // 카드 위치 맵 업데이트
                this.cardPositions.clear();
                positions.forEach(position => {
                    this.cardPositions.set(position.cardId, position);
                });
                
                this.logDebug('비동기 카드 배치 완료', { positionsCount: positions.length });
                
                if (callback) callback();
            } catch (error) {
                console.error('비동기 레이아웃 계산 중 오류 발생:', error);
                this.logDebug('비동기 레이아웃 계산 오류', { error });
                if (callback) callback();
            }
        }, 0);
    }

    /**
     * 카드 스타일을 적용합니다.
     */
    applyCardStyle(cardElement: HTMLElement, cardId: string): void {
        const position = this.cardPositions.get(cardId);
        if (!position) {
            this.logDebug('카드 스타일 적용 실패: 위치 정보 없음', { cardId });
            return;
        }
        
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
        this.logDebug('카드 설정 업데이트', { alignCardHeight, cardsPerColumn });
        
        // 설정이 변경되면 레이아웃 재계산
        this.refreshLayout();
    }

    /**
     * 레이아웃을 새로고침합니다.
     */
    public refreshLayout(): void {
        if (!this.container || !this.layoutStrategy) {
            this.logDebug('레이아웃 새로고침 실패: 컨테이너 또는 레이아웃 전략이 없음');
            return;
        }
        
        this.logDebug('레이아웃 새로고침 시작');
        
        // 현재 컨테이너 크기 가져오기
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        // 레이아웃 업데이트
        this.updateLayout(this.cards, containerWidth, containerHeight);
        
        this.logDebug('레이아웃 새로고침 완료');
    }

    /**
     * 컨테이너 크기를 계산합니다.
     */
    private calculateContainerSize(): void {
        if (!this.cardPositions.size) {
            this.logDebug('컨테이너 크기 계산 실패: 카드 위치 정보 없음');
            return;
        }
        
        // 모든 카드 위치를 기반으로 컨테이너 크기 계산
        let maxWidth = 0;
        let maxHeight = 0;
        
        this.cardPositions.forEach(position => {
            // 소수점 때문에 흔들리는 문제를 해결하기 위해 Math.floor 사용
            const cardRight = Math.floor(position.left + position.width);
            const cardHeight = position.height === 'auto' ? 0 : Math.floor(position.height);
            const cardBottom = Math.floor(position.top + cardHeight);
            
            maxWidth = Math.max(maxWidth, cardRight);
            maxHeight = Math.max(maxHeight, cardBottom);
        });
        
        // 컨테이너 패딩 가져오기
        const containerPadding = this.layoutConfig.getContainerPadding();
        
        // 컨테이너 크기 설정 (오른쪽과 아래쪽에 패딩 추가)
        this.containerSize = {
            width: Math.floor(maxWidth + containerPadding),
            height: Math.floor(maxHeight + containerPadding)
        };
        
        this.logDebug('컨테이너 크기 계산', { 
            maxWidth, 
            maxHeight, 
            containerPadding,
            containerSize: this.containerSize 
        });
        
        // 컨테이너 DOM 요소가 있는 경우 크기 업데이트
        if (this.container) {
            // 컨테이너 너비를 고정된 값으로 설정
            this.container.style.width = `${this.containerSize.width}px`;
            this.container.style.height = `${this.containerSize.height}px`;
            
            this.logDebug('컨테이너 DOM 크기 업데이트', { 
                width: this.containerSize.width, 
                height: this.containerSize.height 
            });
        }
    }
    
    /**
     * 리소스를 정리합니다.
     */
    public dispose(): void {
        // ResizeObserver 정리
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        this.logDebug('LayoutManager 리소스 정리 완료');
    }

    /**
     * 리사이즈 이벤트 핸들러
     */
    private handleResize(entries: ResizeObserverEntry[]): void {
        // 이미 업데이트 중이면 무시
        if (this.isUpdating) return;
        
        // 디바운스 처리
        if (this.resizeDebounceTimeout) {
            clearTimeout(this.resizeDebounceTimeout);
        }
        
        this.resizeDebounceTimeout = setTimeout(() => {
            const entry = entries[0];
            if (entry && this.container) {
                // 소수점 때문에 흔들리는 문제를 해결하기 위해 Math.floor 사용
                const width = Math.floor(entry.contentRect.width);
                const height = Math.floor(entry.contentRect.height);
                
                // 너비나 높이가 변경된 경우에만 레이아웃 업데이트
                // 작은 변화에도 반응하도록 임계값 조정 (30px → 10px)
                // 하지만 너무 작은 변화(2px 미만)는 무시
                const widthDiff = Math.abs(width - this.lastContainerWidth);
                const heightDiff = Math.abs(height - this.lastContainerHeight);
                
                // 너비/높이 변화율 계산 (%)
                const widthChangePercent = this.lastContainerWidth > 0 ? 
                    (widthDiff / this.lastContainerWidth) * 100 : 0;
                const heightChangePercent = this.lastContainerHeight > 0 ? 
                    (heightDiff / this.lastContainerHeight) * 100 : 0;
                
                // 절대적 변화(10px 이상) 또는 상대적 변화(2% 이상)가 있을 때만 업데이트
                if (widthDiff > 10 || heightDiff > 10 || 
                    widthChangePercent > 2 || heightChangePercent > 2) {
                    
                    this.logDebug('컨테이너 크기 변경 감지', { 
                        prevWidth: this.lastContainerWidth, 
                        newWidth: width,
                        prevHeight: this.lastContainerHeight,
                        newHeight: height,
                        widthDiff,
                        heightDiff,
                        widthChangePercent: widthChangePercent.toFixed(2) + '%',
                        heightChangePercent: heightChangePercent.toFixed(2) + '%'
                    });
                    
                    // 마지막 크기 업데이트
                    this.lastContainerWidth = width;
                    this.lastContainerHeight = height;
                    
                    // 레이아웃 업데이트
                    this.updateLayout(this.cards, width, height);
                }
            }
        }, 150); // 디바운스 지연 시간 조정 (200ms → 150ms)
    }

    /**
     * 컨테이너 크기 변경을 감지하고 처리합니다.
     */
    private handleContainerResize = (): void => {
        if (!this.container) return;
        
        const rect = this.container.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;
        
        // 크기 변경이 충분히 큰 경우에만 레이아웃 업데이트 (작은 변화는 무시)
        const widthChanged = Math.abs(newWidth - this.containerWidth) > 30; // 30px 이상 변경 시에만 업데이트
        const heightChanged = Math.abs(newHeight - this.containerHeight) > 30;
        
        if (widthChanged || heightChanged) {
            this.containerWidth = newWidth;
            this.containerHeight = newHeight;
            
            this.logDebug('컨테이너 크기 변경 감지', {
                newWidth,
                newHeight,
                widthDiff: newWidth - this.containerWidth,
                heightDiff: newHeight - this.containerHeight
            });
            
            // 디바운스 처리로 빈번한 업데이트 방지
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            this.resizeTimeout = setTimeout(() => {
                this.updateLayout(this.cards, this.containerWidth, this.containerHeight);
            }, 200); // 200ms 디바운스 (더 안정적인 업데이트를 위해 지연 시간 증가)
        }
    };
} 