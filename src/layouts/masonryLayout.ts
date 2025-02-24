import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from 'ui/cardContainer/cardMaker';
import { LayoutConfig } from './layoutConfig';
import { debounce } from 'obsidian';

interface CardState extends CardPosition {
    isRendered: boolean;
    isHeightMeasured: boolean;
    hasError: boolean;
    originalTop?: number;
    height: number;
}

interface RenderQueueItem {
    cardId: string;
    priority: number;
}

/**
 * 메이슨리 레이아웃 전략을 구현하는 클래스
 * 카드를 다양한 높이를 가진 열 형태로 배열합니다.
 */
export class MasonryLayout implements LayoutStrategy {
    //#region 클래스 속성
    private container: HTMLElement | null = null;
    private cardWidth: number = 0;
    private layoutConfig: LayoutConfig;
    private columnHeights: number[] = [];
    private cardStates: Map<string, CardState> = new Map();
    private cardHeightCache: Map<string, number> = new Map();
    private visibleCardIds: Set<string> = new Set();
    private pendingUpdates: Set<string> = new Set();
    private resizeObservers: Map<string, ResizeObserver> = new Map();
    private intersectionObserver: IntersectionObserver | null = null;
    private renderQueue: Set<RenderQueueItem> = new Set();
    
    private LAYOUT_UPDATE_DEBOUNCE: number = 100;
    private readonly ESTIMATED_CARD_HEIGHT = 200;
    private readonly PERFORMANCE_METRICS = {
        layoutUpdates: 0,
        averageUpdateTime: 0,
        lastUpdateTimestamp: 0
    };
    //#endregion

    //#region 초기화 및 설정
    constructor(
        private columns: number,
        private cardGap: number,
        private settings: CardNavigatorSettings,
        private cardMaker: CardMaker,
        layoutConfig: LayoutConfig
    ) {
        if (columns <= 0) {
            throw new Error('The number of columns must be greater than 0');
        }
        this.layoutConfig = layoutConfig;
        this.columnHeights = new Array(columns).fill(0);
        this.setupIntersectionObserver();
    }

    private setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(
            (entries) => this.handleVisibilityChange(entries),
            {
                rootMargin: '200px',
                threshold: 0.1
            }
        );
    }

    setCardWidth(width: number): void {
        this.cardWidth = width;
        if (this.container) {
            this.container.style.setProperty('--card-width', `${this.cardWidth}px`);
        }
    }

    setContainer(container: HTMLElement) {
        this.cleanup();
        this.container = container;
        this.setupContainer();
    }

    private setupContainer() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.className = 'masonry-layout';
        this.container.style.setProperty('--column-count', this.columns.toString());
        this.container.style.setProperty('--card-gap', `${this.layoutConfig.getCardGap()}px`);
        this.container.style.setProperty('--card-width', `${this.cardWidth}px`);

        this.columnHeights = new Array(this.columns).fill(0);
    }
    //#endregion

    //#region 카드 높이 관리
    private getInitialCardHeight(card: Card): number {
        // 캐시된 높이가 있으면 사용
        if (this.cardHeightCache.has(card.file.path)) {
            return this.cardHeightCache.get(card.file.path)!;
        }

        // 콘텐츠 타입에 따른 예상 높이 계산
        if (card.firstHeader && card.body) {
            return this.estimateHeightByContent(card);
        }

        return this.ESTIMATED_CARD_HEIGHT;
    }

    private estimateHeightByContent(card: Card): number {
        let estimatedHeight = 0;
        
        // 파일명 높이 추가
        if (this.settings.showFileName) {
            estimatedHeight += this.settings.fileNameFontSize * 1.5;
        }
        
        // 첫 번째 헤더 높이 추가
        if (this.settings.showFirstHeader && card.firstHeader) {
            estimatedHeight += this.settings.firstHeaderFontSize * 1.5;
        }
        
        // 본문 높이 추가
        if (this.settings.showBody && card.body) {
            const lineCount = card.body.split('\n').length;
            estimatedHeight += this.settings.bodyFontSize * lineCount * 1.5;
        }
        
        // 여백 추가
        estimatedHeight += this.layoutConfig.getCardGap() * 2;
        
        return Math.max(estimatedHeight, this.ESTIMATED_CARD_HEIGHT);
    }

    private setupHeightObserver(cardElement: HTMLElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (!cardId) return;

        // 기존 옵저버 제거
        this.resizeObservers.get(cardId)?.disconnect();

        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const newHeight = entry.contentRect.height;
                const currentState = this.cardStates.get(cardId);
                
                if (currentState && Math.abs(currentState.height - newHeight) > 1) {
                    this.updateCardState(cardId, {
                        height: newHeight,
                        isHeightMeasured: true
                    });
                }
            });
        });

        resizeObserver.observe(cardElement);
        this.resizeObservers.set(cardId, resizeObserver);
    }
    //#endregion

    //#region 레이아웃 업데이트
    private updateCardState(cardId: string, updates: Partial<CardState>) {
        const currentState = this.cardStates.get(cardId);
        if (currentState) {
            this.cardStates.set(cardId, { ...currentState, ...updates });
            this.pendingUpdates.add(cardId);
            this.evaluateLayoutUpdate();
        }
    }

    private evaluateLayoutUpdate = debounce(() => {
        if (this.pendingUpdates.size === 0) return;

        const visibleUpdates = Array.from(this.pendingUpdates)
            .filter(cardId => this.visibleCardIds.has(cardId));

        if (visibleUpdates.length > 0) {
            this.measureLayoutPerformance(() => {
                this.updateLayout(visibleUpdates);
            });
        }

        this.pendingUpdates.clear();
    }, this.LAYOUT_UPDATE_DEBOUNCE);

    private updateLayout(updatedCardIds: string[]) {
        if (!this.container) return;

        this.preserveScroll(() => {
            // 컬럼 높이 초기화
            this.columnHeights = new Array(this.columns).fill(0);

            // 모든 카드의 위치 재계산
            Array.from(this.cardStates.values()).forEach(state => {
                const minHeightIndex = this.columnHeights.indexOf(
                    Math.min(...this.columnHeights)
                );

                const x = minHeightIndex * (this.cardWidth + this.cardGap);
                const y = this.columnHeights[minHeightIndex];

                state.x = x;
                state.y = y;
                state.originalTop = y;

                this.columnHeights[minHeightIndex] += (typeof state.height === 'number' ? state.height : 0) + this.cardGap;

                // 카드 요소 업데이트
                const cardElement = this.container!.querySelector(
                    `[data-card-id="${state.card.file.path}"]`
                ) as HTMLElement;

                if (cardElement) {
                    cardElement.style.transform = `translate(${x}px, ${y}px)`;
                }
            });

            // 컨테이너 높이 업데이트
            const maxHeight = Math.max(...this.columnHeights);
            if (this.container) {
                this.container.style.height = `${maxHeight}px`;
            }
        });
    }
    //#endregion

    //#region 가시성 관리
    private handleVisibilityChange(entries: IntersectionObserverEntry[]) {
        entries.forEach(entry => {
            const cardId = entry.target.getAttribute('data-card-id');
            if (!cardId) return;

            if (entry.isIntersecting) {
                this.visibleCardIds.add(cardId);
                this.startCardRendering(cardId);
            } else {
                this.visibleCardIds.delete(cardId);
            }
        });
    }

    private startCardRendering(cardId: string) {
        const state = this.cardStates.get(cardId);
        if (state && !state.isRendered) {
            this.renderQueue.add({
                cardId,
                priority: this.calculateRenderPriority(state)
            });
            this.processRenderQueue();
        }
    }

    private calculateRenderPriority(state: CardState): number {
        // 뷰포트에 더 가까운 카드에 높은 우선순위 부여
        if (!this.container) return 0;
        
        const containerRect = this.container.getBoundingClientRect();
        const distance = Math.abs(state.y - this.container.scrollTop);
        return 1 / (distance + 1);
    }
    //#endregion

    //#region 성능 관리
    private measureLayoutPerformance(layoutFn: () => void) {
        const start = performance.now();
        layoutFn();
        const duration = performance.now() - start;

        this.PERFORMANCE_METRICS.layoutUpdates++;
        this.PERFORMANCE_METRICS.averageUpdateTime = 
            (this.PERFORMANCE_METRICS.averageUpdateTime * 
             (this.PERFORMANCE_METRICS.layoutUpdates - 1) + duration) / 
            this.PERFORMANCE_METRICS.layoutUpdates;
        this.PERFORMANCE_METRICS.lastUpdateTimestamp = Date.now();

        this.adjustLayoutStrategy();
    }

    private adjustLayoutStrategy() {
        // 성능 메트릭에 따라 렌더링 전략 조정
        if (this.PERFORMANCE_METRICS.averageUpdateTime > 16) {
            // 프레임 드롭 발생 시 최적화 조치
            this.LAYOUT_UPDATE_DEBOUNCE = Math.min(
                this.LAYOUT_UPDATE_DEBOUNCE * 1.5,
                500
            );
        }
    }
    //#endregion

    //#region 스크롤 관리
    private preserveScroll(updateFn: () => void) {
        if (!this.container) return;

        const scrollTop = this.container.scrollTop;
        const anchor = this.findScrollAnchor();

        updateFn();

        if (anchor) {
            const newRect = anchor.element.getBoundingClientRect();
            this.container.scrollTop = scrollTop + (newRect.top - anchor.originalTop);
        }
    }

    private findScrollAnchor(): { element: HTMLElement; originalTop: number } | null {
        if (!this.container) return null;

        const containerRect = this.container.getBoundingClientRect();
        const elements = Array.from(
            this.container.querySelectorAll('.card-navigator-card')
        ) as HTMLElement[];

        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.top >= containerRect.top && rect.bottom <= containerRect.bottom) {
                return {
                    element,
                    originalTop: rect.top
                };
            }
        }
        return null;
    }

    private getElementPosition(element: HTMLElement) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left
        };
    }
    //#endregion

    //#region 인터페이스 구현
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        if (!this.container) return [];

        const positions: CardPosition[] = [];
        this.columnHeights = new Array(this.columns).fill(0);

        cards.forEach(card => {
            const cardId = card.file.path;
            const height = this.getInitialCardHeight(card);

            // 가장 낮은 컬럼 찾기
            const minHeightIndex = this.columnHeights.indexOf(
                Math.min(...this.columnHeights)
            );

            // 카드 위치 계산
            const x = minHeightIndex * (this.cardWidth + this.cardGap);
            const y = this.columnHeights[minHeightIndex];

            // 상태 저장
            const position: CardState = {
                card,
                x,
                y,
                width: this.cardWidth,
                height,
                isRendered: false,
                isHeightMeasured: false,
                hasError: false,
                originalTop: y
            };

            this.cardStates.set(cardId, position);
            positions.push(position);

            // 컬럼 높이 업데이트
            this.columnHeights[minHeightIndex] += height + this.cardGap;
        });

        // 컨테이너 높이 설정
        const maxHeight = Math.max(...this.columnHeights);
        this.container.style.height = `${maxHeight}px`;

        return positions;
    }

    getColumnsCount(): number {
        return this.columns;
    }

    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    getContainerStyle(): Partial<CSSStyleDeclaration> {
        return {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden'
        };
    }

    getCardStyle(): Partial<CSSStyleDeclaration> {
        return {
            position: 'absolute',
            width: `${this.cardWidth}px`,
            transition: 'transform 0.3s ease'
        };
    }
    //#endregion

    //#region 리소스 정리
    cleanup() {
        this.resizeObservers.forEach(observer => observer.disconnect());
        this.resizeObservers.clear();
        this.intersectionObserver?.disconnect();
        this.cardStates.clear();
        this.visibleCardIds.clear();
        this.pendingUpdates.clear();
        this.renderQueue.clear();
        this.container = null;
    }

    destroy() {
        this.cleanup();
    }

    updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
    }
    //#endregion

    private processRenderQueue() {
        if (this.renderQueue.size === 0) return;

        // 우선순위에 따라 정렬
        const sortedQueue = Array.from(this.renderQueue)
            .sort((a, b) => b.priority - a.priority);

        // 최대 5개까지만 처리
        const itemsToProcess = sortedQueue.slice(0, 5);
        itemsToProcess.forEach(item => {
            const cardElement = this.container?.querySelector(
                `[data-card-id="${item.cardId}"]`
            ) as HTMLElement;
            
            if (cardElement) {
                this.setupHeightObserver(cardElement);
                const state = this.cardStates.get(item.cardId);
                if (state) {
                    state.isRendered = true;
                }
            }
            
            this.renderQueue.delete(item);
        });
    }
}