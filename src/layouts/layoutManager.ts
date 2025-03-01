import { CardNavigatorSettings, Card } from 'common/types';
import { LayoutConfig } from './layoutConfig';
import { LayoutDirection, LayoutStrategy } from './layoutStrategy';
import { LayoutStyleManager } from './layoutStyleManager';
import { CardPosition } from 'common/interface';
import { ResizeService } from 'common/ResizeService';

/**
 * 레이아웃 관리 클래스
 * 
 * 이 클래스는 카드 레이아웃을 관리하고 계산하는 역할을 담당합니다.
 * 레이아웃 전략을 사용하여 카드 위치를 계산하고 적용합니다.
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
    private isUpdating: boolean = false; // 업데이트 중복 방지 플래그
    private containerWidth: number = 0;
    private containerHeight: number = 0;
    private containerId: string = '';
    private resizeService: ResizeService;
    private isInitialized: boolean = false;
    
    // 성능 최적화를 위한 추가 속성
    private positionCache: Map<string, CardPosition> = new Map();
    private cardSizeCache: { width: number, height: number | 'auto' } = { width: 0, height: 0 };
    private layoutCalculationTimeout: NodeJS.Timeout | null = null;
    private isLayoutDirty: boolean = true;
    private lastCalculationTime: number = 0;
    private calculationThrottleTime: number = 100; // ms

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
        this.layoutConfig = new LayoutConfig(settings);
        this.layoutStyleManager = new LayoutStyleManager(settings, this.layoutConfig);
        this.resizeService = ResizeService.getInstance();
        
        // 디버그 로그
        this.logDebug('LayoutManager 초기화');
    }

    /**
     * 초기화 메서드 - DOM 의존적인 초기화를 분리
     */
    public initialize(): void {
        if (this.isInitialized) return;
        
        // ResizeService 이벤트 구독
        this.resizeService.events.on('resize', (elementId: any, size: any) => {
            if (elementId === this.containerId && this.container) {
                this.handleContainerResize();
            }
        });
        
        this.isInitialized = true;
        this.logDebug('LayoutManager 초기화 완료');
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
        
        // 캐시 초기화
        this.positionCache.clear();
        this.isLayoutDirty = true;
        
        // 설정이 변경되면 레이아웃 다시 계산
        if (this.container && this.cards.length > 0) {
            this.refreshLayout();
        }
    }

    /**
     * 레이아웃을 업데이트합니다.
     * 
     * @param cards 카드 배열
     * @param containerWidth 컨테이너 너비
     * @param containerHeight 컨테이너 높이
     */
    updateLayout(cards: Card[], containerWidth: number, containerHeight: number): void {
        // 이미 업데이트 중이면 중복 실행 방지
        if (this.isUpdating) {
            this.logDebug('이미 업데이트 중이므로 중복 실행 방지');
            return;
        }
        
        try {
            this.isUpdating = true;
            
            // 컨테이너 크기 업데이트
            this.containerWidth = containerWidth;
            this.containerHeight = containerHeight;
            this.containerSize = { width: containerWidth, height: containerHeight };
            
            // 카드 배열 업데이트
            this.cards = [...cards];
            
            // 레이아웃 설정 업데이트
            this.layoutConfig.updateContainerSize(containerWidth, containerHeight);
            
            // 카드 크기 캐시 업데이트
            this.updateCardSizeCache();
            
            // 레이아웃 계산이 필요한지 확인
            if (this.isLayoutCalculationNeeded()) {
                // 스로틀링 적용 - 짧은 시간 내에 여러 번 호출되는 것 방지
                const now = Date.now();
                if (now - this.lastCalculationTime < this.calculationThrottleTime) {
                    // 이전 타임아웃 취소
                    if (this.layoutCalculationTimeout) {
                        clearTimeout(this.layoutCalculationTimeout);
                    }
                    
                    // 새 타임아웃 설정
                    this.layoutCalculationTimeout = setTimeout(() => {
                        this.performLayoutCalculation();
                    }, this.calculationThrottleTime);
                } else {
                    // 바로 계산 수행
                    this.performLayoutCalculation();
                    this.lastCalculationTime = now;
                }
            } else {
                this.logDebug('레이아웃 계산이 필요하지 않음');
            }
        } catch (error) {
            console.error('[LayoutManager] 레이아웃 업데이트 중 오류 발생:', error);
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * 레이아웃 계산을 수행합니다.
     */
    private performLayoutCalculation(): void {
        // 레이아웃 계산 및 적용
        this.calculateLayout();
        this.arrange();
        
        // 마지막 계산 정보 업데이트
        this.lastCardsHash = this.calculateCardsHash(this.cards);
        this.lastContainerWidth = this.containerWidth;
        this.lastContainerHeight = this.containerHeight;
        this.isLayoutDirty = false;
        
        this.logDebug('레이아웃 업데이트 완료', {
            containerWidth: this.containerWidth,
            containerHeight: this.containerHeight,
            cardCount: this.cards.length
        });
    }

    /**
     * 카드 크기 캐시를 업데이트합니다.
     */
    private updateCardSizeCache(): void {
        const width = this.layoutConfig.getCardWidth();
        const height = this.layoutConfig.getCardHeight();
        
        // 카드 크기가 변경되었는지 확인
        if (width !== this.cardSizeCache.width || height !== this.cardSizeCache.height) {
            this.cardSizeCache = { width, height };
            this.isLayoutDirty = true;
        }
    }

    /**
     * 컨테이너를 설정합니다.
     * 
     * @param container 컨테이너 요소
     */
    setContainer(container: HTMLElement): void {
        // 이전 컨테이너가 있으면 ResizeService에서 제거
        if (this.containerId && this.container) {
            this.resizeService.unobserve(this.containerId);
        }
        
        this.container = container;
        
        if (container) {
            // 고유 ID 생성
            this.containerId = `layout-container-${Date.now()}`;
            
            // 컨테이너 크기 초기화
            this.containerWidth = container.offsetWidth;
            this.containerHeight = container.offsetHeight;
            this.containerSize = { width: this.containerWidth, height: this.containerHeight };
            
            // 레이아웃 설정 업데이트
            this.layoutConfig.updateContainerSize(this.containerWidth, this.containerHeight);
            
            // CSS 변수 로드 (DOM이 준비된 후)
            this.layoutConfig.loadCssVariables();
            
            // 레이아웃 스타일 업데이트
            this.layoutStyleManager.updateLayoutStyles(container);
            
            // ResizeService에 컨테이너 등록
            this.resizeService.observe(this.containerId, container);
            
            // 레이아웃 다시 계산 필요 표시
            this.isLayoutDirty = true;
            
            this.logDebug('컨테이너 설정됨', {
                width: this.containerWidth,
                height: this.containerHeight
            });
        }
    }

    /**
     * 카드 배열을 설정합니다.
     * 
     * @param cards 카드 배열
     */
    setCards(cards: Card[]): void {
        // 카드 목록이 변경되었는지 확인
        const newCardsHash = this.calculateCardsHash(cards);
        const cardsChanged = newCardsHash !== this.lastCardsHash;
        
        if (cardsChanged) {
            this.cards = [...cards];
            this.isLayoutDirty = true;
            
            // 카드가 변경되면 레이아웃 다시 계산
            if (this.container) {
                this.refreshLayout();
            }
        }
    }

    /**
     * 레이아웃 전략을 설정합니다.
     * 
     * @param strategy 레이아웃 전략
     */
    setStrategy(strategy: LayoutStrategy): void {
        this.layoutStrategy = strategy;
        
        // 캐시 초기화
        this.positionCache.clear();
        this.isLayoutDirty = true;
        
        // 전략이 변경되면 레이아웃 다시 계산
        if (this.container && this.cards.length > 0) {
            this.refreshLayout();
        }
    }

    /**
     * 카드 위치를 가져옵니다.
     * 
     * @param cardId 카드 ID
     */
    getCardPosition(cardId: string): CardPosition | undefined {
        // 캐시된 위치가 있으면 사용
        const cachedPosition = this.positionCache.get(cardId);
        if (cachedPosition) {
            return cachedPosition;
        }
        
        // 캐시된 위치가 없으면 계산된 위치 사용
        const position = this.cardPositions.get(cardId);
        
        // 위치가 있으면 캐시에 저장
        if (position) {
            this.positionCache.set(cardId, position);
        }
        
        return position;
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
        return this.cardSizeCache.width || this.layoutConfig.getCardWidth();
    }

    /**
     * 카드 높이를 가져옵니다.
     */
    getCardHeight(): number | 'auto' {
        return this.cardSizeCache.height || this.layoutConfig.getCardHeight();
    }

    /**
     * 열 수를 가져옵니다.
     */
    getColumns(): number {
        return this.layoutConfig.getColumns();
    }

    /**
     * 레이아웃 계산이 필요한지 확인합니다.
     */
    public isLayoutCalculationNeeded(): boolean {
        // 레이아웃이 더티 상태면 계산 필요
        if (this.isLayoutDirty) {
            return true;
        }
        
        // 카드가 없으면 계산 필요 없음
        if (this.cards.length === 0) {
            return false;
        }
        
        // 컨테이너가 없으면 계산 필요
        if (!this.container) {
            return true;
        }
        
        // 카드 위치가 없으면 계산 필요
        if (this.cardPositions.size === 0) {
            return true;
        }
        
        // 카드 목록 해시 계산
        const currentCardsHash = this.calculateCardsHash(this.cards);
        
        // 컨테이너 크기 가져오기
        const containerWidth = this.containerWidth;
        const containerHeight = this.containerHeight;
        
        // 카드 목록, 컨테이너 크기, 설정이 변경되었는지 확인
        const isChanged = 
            currentCardsHash !== this.lastCardsHash ||
            Math.abs(containerWidth - this.lastContainerWidth) > 1 ||
            Math.abs(containerHeight - this.lastContainerHeight) > 1;
            
        if (isChanged) {
            this.logDebug('레이아웃 계산 필요', {
                cardsHashChanged: currentCardsHash !== this.lastCardsHash,
                widthChanged: Math.abs(containerWidth - this.lastContainerWidth) > 1,
                heightChanged: Math.abs(containerHeight - this.lastContainerHeight) > 1,
                currentWidth: containerWidth,
                currentHeight: containerHeight
            });
            
            this.isLayoutDirty = true;
        }
            
        return isChanged;
    }

    /**
     * 카드 배열의 해시를 계산합니다.
     */
    private calculateCardsHash(cards: Card[]): string {
        return cards.map(card => card.id).join(',');
    }

    /**
     * 레이아웃을 계산합니다.
     */
    calculateLayout(): void {
        if (this.layoutStrategy) {
            const startTime = performance.now();
            
            // 레이아웃 계산
            this.cardPositions = this.layoutStrategy.calculatePositions(this.cards, this.layoutConfig);
            
            // 계산된 위치를 캐시에 저장
            this.positionCache.clear();
            this.cardPositions.forEach((position, cardId) => {
                this.positionCache.set(cardId, position);
            });
            
            this.logDebug(`레이아웃 계산 완료 (${Math.round(performance.now() - startTime)}ms)`);
        }
    }

    /**
     * 카드를 배치합니다.
     */
    arrange(): void {
        if (!this.container) return;
        
        // 카드 요소 가져오기
        const cardElements = this.container.querySelectorAll('.card-navigator-card');
        
        // 카드 위치 적용
        Array.from(cardElements).forEach((cardEl) => {
            const htmlCardEl = cardEl as HTMLElement;
            const cardId = htmlCardEl.dataset.cardId;
            if (!cardId) return;
            
            const position = this.cardPositions.get(cardId);
            if (!position) return;
            
            // 카드 위치 스타일 적용
            this.applyCardStyle(htmlCardEl, cardId);
        });
        
        // 컨테이너 크기 계산
        this.calculateContainerSize();
        
        // 컨테이너 크기 적용
        if (this.container) {
            const containerHeight = this.containerHeight;
            
            // 컨테이너 높이 설정
            if (this.getLayoutDirection() === 'vertical') {
                // 세로 레이아웃의 경우 컨테이너 높이 자동 조정
                const maxCardBottom = Math.max(...Array.from(this.cardPositions.values())
                    .map(pos => pos.top + (typeof pos.height === 'number' ? pos.height : 0)));
                
                // 패딩 추가
                const containerPadding = this.layoutConfig.getContainerPadding();
                const totalHeight = maxCardBottom + containerPadding;
                
                // 컨테이너 높이 설정 (최소 높이 보장)
                this.container.style.minHeight = `${Math.max(300, totalHeight)}px`;
            } else {
                // 가로 레이아웃의 경우 컨테이너 높이 고정
                this.container.style.height = `${containerHeight}px`;
            }
        }
    }

    /**
     * 카드를 비동기적으로 배치합니다.
     * 
     * @param callback 배치 완료 후 호출할 콜백 함수
     */
    arrangeAsync(callback?: () => void): void {
        if (!this.container) {
            if (callback) callback();
            return;
        }
        
        // requestAnimationFrame을 사용하여 다음 프레임에서 배치
        requestAnimationFrame(() => {
            this.arrange();
            if (callback) callback();
        });
    }

    /**
     * 카드 스타일을 적용합니다.
     * 
     * @param cardElement 카드 요소
     * @param cardId 카드 ID
     */
    applyCardStyle(cardElement: HTMLElement, cardId: string): void {
        const position = this.cardPositions.get(cardId);
        if (!position) return;
        
        // 카드 위치 스타일 적용
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
     * 
     * @param cardElement 카드 요소
     * @param isFocused 포커스 여부
     */
    applyCardFocusStyle(cardElement: HTMLElement, isFocused: boolean): void {
        this.layoutStyleManager.applyCardFocusStyle(cardElement, isFocused);
    }

    /**
     * 카드 활성화 스타일을 적용합니다.
     * 
     * @param cardElement 카드 요소
     * @param isActive 활성화 여부
     */
    applyCardActiveStyle(cardElement: HTMLElement, isActive: boolean): void {
        this.layoutStyleManager.applyCardActiveStyle(cardElement, isActive);
    }

    /**
     * 레이아웃 스타일 매니저를 가져옵니다.
     */
    getLayoutStyleManager(): LayoutStyleManager {
        return this.layoutStyleManager;
    }

    /**
     * 레이아웃 설정을 가져옵니다.
     */
    getLayoutConfig(): LayoutConfig {
        return this.layoutConfig;
    }

    /**
     * 카드 크기를 가져옵니다.
     */
    public getCardSize(): { width: number, height: number | 'auto' } {
        return {
            width: this.getCardWidth(),
            height: this.getCardHeight()
        };
    }

    /**
     * 컨테이너 크기를 가져옵니다.
     */
    public getContainerSize(): { width: number, height: number } | null {
        return this.containerSize;
    }

    /**
     * 카드 설정을 업데이트합니다.
     * 
     * @param alignCardHeight 카드 높이 정렬 여부
     * @param cardsPerColumn 열당 카드 수
     */
    public updateCardSettings(alignCardHeight: boolean, cardsPerColumn: number): void {
        // 설정 업데이트
        this.settings.alignCardHeight = alignCardHeight;
        this.settings.cardsPerColumn = cardsPerColumn;
        
        // 레이아웃 설정 업데이트
        this.layoutConfig.updateSettings(this.settings);
        
        // 레이아웃 다시 계산
        if (this.container && this.cards.length > 0) {
            this.refreshLayout();
        }
    }

    /**
     * 레이아웃을 새로고침합니다.
     */
    public refreshLayout(): void {
        if (!this.container || this.cards.length === 0) return;
        
        try {
            // 컨테이너 크기 가져오기
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            
            // 레이아웃 업데이트
            this.updateLayout(this.cards, containerWidth, containerHeight);
        } catch (error) {
            console.error('[LayoutManager] 레이아웃 새로고침 중 오류 발생:', error);
        }
    }

    /**
     * 컨테이너 크기를 계산합니다.
     */
    private calculateContainerSize(): void {
        if (!this.container) return;
        
        try {
            // 모든 카드 위치 가져오기
            const positions = Array.from(this.cardPositions.values());
            
            if (positions.length === 0) return;
            
            // 최대 위치 계산
            let maxRight = 0;
            let maxBottom = 0;
            
            positions.forEach(pos => {
                const right = pos.left + (typeof pos.width === 'number' ? pos.width : 0);
                const bottom = pos.top + (typeof pos.height === 'number' ? pos.height : 0);
                
                maxRight = Math.max(maxRight, right);
                maxBottom = Math.max(maxBottom, bottom);
            });
            
            // 패딩 추가
            const containerPadding = this.layoutConfig.getContainerPadding();
            const totalWidth = maxRight + containerPadding;
            const totalHeight = maxBottom + containerPadding;
            
            // 컨테이너 크기 설정
            if (this.getLayoutDirection() === 'vertical') {
                // 세로 레이아웃의 경우 너비는 컨테이너 너비, 높이는 계산된 높이
                this.containerSize = {
                    width: this.containerWidth,
                    height: Math.max(300, totalHeight) // 최소 높이 300px
                };
            } else {
                // 가로 레이아웃의 경우 너비는 계산된 너비, 높이는 컨테이너 높이
                this.containerSize = {
                    width: Math.max(300, totalWidth), // 최소 너비 300px
                    height: this.containerHeight
                };
            }
            
            this.logDebug('컨테이너 크기 계산됨', this.containerSize);
        } catch (error) {
            console.error('[LayoutManager] 컨테이너 크기 계산 중 오류 발생:', error);
        }
    }

    /**
     * 리소스를 정리합니다.
     */
    public dispose(): void {
        // 타임아웃 정리
        if (this.layoutCalculationTimeout) {
            clearTimeout(this.layoutCalculationTimeout);
            this.layoutCalculationTimeout = null;
        }
        
        // ResizeService에서 컨테이너 제거
        if (this.containerId) {
            this.resizeService.unobserve(this.containerId);
        }
        
        // 이벤트 리스너 제거
        this.resizeService.events.off('resize', null as any);
        
        // 캐시 정리
        this.positionCache.clear();
        
        this.container = null;
        this.cards = [];
        this.cardPositions.clear();
        this.isInitialized = false;
        
        this.logDebug('LayoutManager 정리됨');
    }

    /**
     * 컨테이너 크기 변경 처리 메서드
     */
    private handleContainerResize = (): void => {
        if (!this.container || !document.body.contains(this.container)) return;
        
        try {
            // 컨테이너 크기 가져오기
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            
            // 크기가 변경되었는지 확인
            const isWidthChanged = Math.abs(this.containerWidth - containerWidth) > 1;
            const isHeightChanged = Math.abs(this.containerHeight - containerHeight) > 1;
            
            if (isWidthChanged || isHeightChanged) {
                this.logDebug('컨테이너 크기 변경 감지', {
                    prevWidth: this.containerWidth,
                    newWidth: containerWidth,
                    prevHeight: this.containerHeight,
                    newHeight: containerHeight
                });
                
                // 레이아웃 업데이트 - 스로틀링 적용
                const now = Date.now();
                if (now - this.lastCalculationTime < this.calculationThrottleTime) {
                    // 이전 타임아웃 취소
                    if (this.layoutCalculationTimeout) {
                        clearTimeout(this.layoutCalculationTimeout);
                    }
                    
                    // 새 타임아웃 설정
                    this.layoutCalculationTimeout = setTimeout(() => {
                        this.updateLayout(this.cards, containerWidth, containerHeight);
                    }, this.calculationThrottleTime);
                } else {
                    // 바로 업데이트 수행
                    this.updateLayout(this.cards, containerWidth, containerHeight);
                    this.lastCalculationTime = now;
                }
            }
        } catch (error) {
            console.error('[LayoutManager] 컨테이너 크기 변경 처리 중 오류 발생:', error);
        }
    };
}