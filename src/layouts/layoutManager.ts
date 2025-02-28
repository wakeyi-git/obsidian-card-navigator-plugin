import { CardNavigatorSettings } from 'common/types';
import { Card } from 'common/types';
import { CardMaker } from 'ui/cardContainer/cardMaker';
import { CardPosition, LayoutStrategy } from './layoutStrategy';
import { LayoutConfig } from './layoutConfig';
import { LayoutStyleManager } from './layoutStyleManager';

/**
 * 레이아웃 관리자 클래스
 * 
 * 이 클래스는 카드 레이아웃을 관리하고 적용합니다.
 * 통합 레이아웃 전략을 사용하여 다양한 레이아웃 경험을 제공합니다.
 */
export class LayoutManager implements LayoutStrategy {
    private container: HTMLElement | null = null;
    private layoutConfig: LayoutConfig;
    private layoutStyleManager: LayoutStyleManager;
    
    // 레이아웃 관련 속성들
    private cardWidth: number = 0;
    private columns: number = 1;
    private isVertical: boolean = true;
    private cardElements: Map<string, HTMLElement> = new Map();
    private cardPositionsCache: Map<string, CardPosition> = new Map();
    
    constructor(private settings: CardNavigatorSettings, private cardMaker: CardMaker) {
        this.layoutConfig = new LayoutConfig(settings);
        this.layoutStyleManager = new LayoutStyleManager(settings);
        this.isVertical = true;
        this.cardWidth = this.calculateCardWidth();
    }

    /**
     * LayoutConfig 인스턴스에 접근하기 위한 getter
     */
    public getLayoutConfig(): LayoutConfig {
        return this.layoutConfig;
    }

    /**
     * 컨테이너를 설정합니다.
     */
    async setContainer(container: HTMLElement): Promise<void> {
        this.container = container;
        
        // layoutConfig에 컨테이너 설정 (비동기 처리)
        await this.layoutConfig.setContainer(container);
        
        // 컨테이너 크기 및 방향 업데이트
        this.updateContainerSizeAndOrientation();
        
        // 컨테이너 스타일 업데이트
        this.updateContainerStyle();
    }

    /**
     * 컨테이너가 설정되어 있는지 확인합니다.
     */
    hasContainer(): boolean {
        return this.container !== null && document.body.contains(this.container);
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
        this.layoutConfig.updateSettings(settings);
        this.layoutStyleManager.updateSettings(settings);
        this.refreshLayout();
    }

    /**
     * 레이아웃을 업데이트합니다.
     * @param width 컨테이너 너비
     * @param height 컨테이너 높이
     */
    updateLayout(width: number, height: number): void {
        if (!this.container || !this.layoutConfig) return;
        
        // 컨테이너 크기 업데이트
        this.container.style.setProperty('--container-width', `${width}px`);
        this.container.style.setProperty('--container-height', `${height}px`);
        
        // 방향 계산
        this.isVertical = this.layoutConfig.isVerticalContainer();
        
        // 열 수 계산
        this.columns = this.layoutConfig.getColumns();
        
        // 카드 너비 계산
        this.cardWidth = this.layoutConfig.calculateCardWidth(this.columns);
        
        // 레이아웃 스타일 업데이트
        this.layoutStyleManager.updateLayoutStyles(this.isVertical, this.columns, this.cardWidth);
        
        // 레이아웃 새로고침
        this.refreshLayout();
    }

    /**
     * 컨테이너 너비를 업데이트합니다.
     */
    updateContainerWidth(newWidth: number = 0): void {
        if (!this.container) return;
        
        if (newWidth === 0 && this.container) {
            newWidth = this.container.offsetWidth;
        }
        
        // 컨테이너 너비 변경 시 레이아웃 재계산이 필요할 수 있음
        // 하지만 전체 레이아웃 새로고침은 필요하지 않을 수 있음
        this.refreshLayout();
    }

    /**
     * 컨테이너가 수직 방향인지 확인합니다.
     */
    getIsVertical(): boolean {
        return this.layoutConfig.isVerticalContainer();
    }

    /**
     * 스크롤 방향을 가져옵니다.
     */
    getScrollDirection(): 'vertical' | 'horizontal' {
        return this.getIsVertical() ? 'vertical' : 'horizontal';
    }

    /**
     * 컨테이너 스타일을 가져옵니다.
     */
    getContainerStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutStyleManager.getContainerStyle(this.isVertical);
    }

    /**
     * 카드 스타일을 가져옵니다.
     */
    getCardStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutStyleManager.getCardStyle();
    }
    
    /**
     * 열 수를 가져옵니다.
     */
    getColumnsCount(): number {
        return this.columns;
    }
    
    /**
     * 카드 레이아웃을 계산합니다.
     */
    async calculateLayout(cards: Card[]): Promise<void> {
        if (!this.container || !cards || cards.length === 0) return;
        
        // 카드 요소 맵 업데이트
        this.updateCardElementsMap(cards);
        
        // 카드 배치
        const positions = await this.arrange(cards);
        
        // 위치 등록
        this.registerCardPositionsWithCache(positions);
    }
    
    /**
     * 카드 위치를 등록하고 캐시에 저장합니다.
     * @param positions 등록할 카드 위치 목록
     */
    registerCardPositionsWithCache(positions: CardPosition[]): void {
        if (!positions || positions.length === 0) return;
        
        // 각 위치를 캐시에 저장
        positions.forEach(position => {
            if (position && position.id) {
                // 위치 정보를 캐시에 저장
                this.cardPositionsCache.set(position.id, position);
                
                // 카드 요소가 없는 경우 DOM에서 찾기 시도
                if (!this.cardElements.has(position.id) && this.container) {
                    const cardElement = this.container.querySelector(`[data-card-id="${position.id}"]`) as HTMLElement;
                    if (cardElement) {
                        this.cardElements.set(position.id, cardElement);
                    }
                }
            }
        });
    }

    /**
     * 카드 요소 맵을 업데이트합니다.
     */
    private updateCardElementsMap(cards: Card[] | NodeListOf<HTMLElement>): void {
        if (!this.container) return;
        
        // NodeList인 경우 처리
        if (cards instanceof NodeList) {
            Array.from(cards).forEach(element => {
                const cardId = element.getAttribute('data-card-id');
                if (cardId && !this.cardElements.has(cardId)) {
                    this.cardElements.set(cardId, element as HTMLElement);
                }
            });
            return;
        }
        
        // Card[] 배열인 경우 처리
        cards.forEach(card => {
            if (this.cardElements.has(card.id)) return;
            
            if (this.container) {
                // 1. 먼저 data-safe-id 속성으로 시도
                const safeId = card.id.replace(/[^\w-]/g, '_');
                let cardElement = this.container.querySelector(`[data-safe-id="${safeId}"]`) as HTMLElement;
                
                // 2. data-card-id로 시도
                if (!cardElement) {
                    try {
                        const escapedId = CSS.escape(card.id);
                        cardElement = this.container.querySelector(`[data-card-id="${escapedId}"]`) as HTMLElement;
                    } catch (error) {
                        // 3. 파일 경로로 시도
                        if (card.file && card.file.path) {
                            cardElement = this.container.querySelector(`[data-original-path="${card.file.path}"]`) as HTMLElement;
                        }
                    }
                }
                
                if (cardElement) {
                    this.cardElements.set(card.id, cardElement);
                }
            }
        });
    }

    /**
     * 카드를 배치합니다.
     * LayoutStrategy 인터페이스 구현
     */
    arrange(cards: Card[], containerWidth?: number): CardPosition[] {
        if (!cards || cards.length === 0) {
            return [];
        }
        
        // 컨테이너 너비 사용 또는 현재 사용 가능한 너비 사용
        const width = containerWidth || (this.layoutConfig ? this.layoutConfig.getContainerSize().width : 0);
        
        // 간단한 위치 정보 배열 생성
        const positions: CardPosition[] = cards.map((card, index) => {
            // 기존 위치 정보 가져오기 또는 새로 생성
            return this.cardPositionsCache.get(card.id) || this.generateDefaultPosition(card.id, index);
        });
        
        return positions;
    }

    /**
     * 레이아웃 전략을 가져옵니다.
     */
    getLayout(): LayoutStrategy {
        return this;
    }

    /**
     * 카드 크기를 가져옵니다.
     * @returns 카드 크기 (너비, 높이)
     */
    getCardSize(): { width: number, height: number } {
        // layoutConfig의 getCardSize 메서드를 호출하여 카드 크기를 가져옵니다.
        return this.layoutConfig.getCardSize();
    }

    /**
     * 카드 설정을 업데이트합니다.
     * 이 메서드는 CardRenderer와의 호환성을 위해 추가되었습니다.
     */
    updateCardSettings(alignCardHeight: boolean, cardsPerColumn: number): void {
        // 설정 업데이트 후 레이아웃 새로고침
        if (this.settings) {
            this.settings.alignCardHeight = alignCardHeight;
            this.settings.cardsPerColumn = cardsPerColumn;
            this.layoutConfig.updateSettings(this.settings);
            this.layoutStyleManager.updateSettings(this.settings);
            this.refreshLayout();
        }
    }

    /**
     * 카드 스타일을 적용합니다.
     */
    private applyCardStyles(): void {
        if (!this.container) return;
        
        // 컨테이너에 열 수 속성 설정
        this.container.style.setProperty('--columns', this.columns.toString());
    }

    /**
     * 레이아웃을 카드 요소에 적용합니다.
     */
    applyLayout(): void {
        // 간단한 구현
        this.applyCardStyles();
    }
    
    /**
     * 카드 요소를 등록합니다.
     */
    registerCardElement(cardId: string, cardElement: HTMLElement): void {
        if (!cardId || !cardElement) return;
        
        // 카드 요소 맵에 추가
        this.cardElements.set(cardId, cardElement);
    }

    /**
     * 컨테이너 스타일을 업데이트합니다.
     */
    private updateContainerStyle(): void {
        if (!this.container) return;
        
        // 레이아웃 스타일 매니저에 컨테이너 설정
        this.layoutStyleManager.setContainer(this.container);
        
        // 레이아웃 새로고침
        this.refreshLayout();
    }
    
    /**
     * 컨테이너 크기 및 방향을 업데이트합니다.
     */
    private updateContainerSizeAndOrientation(): void {
        if (!this.container) return;
        
        // 방향 업데이트
        if (this.layoutConfig) {
            const { isVertical } = this.layoutConfig.calculateContainerOrientation();
            this.isVertical = isVertical;
            
            // 컨테이너에 방향 클래스 설정
            this.container.classList.toggle('vertical', isVertical);
            this.container.classList.toggle('horizontal', !isVertical);
        }
    }

    /**
     * 카드 너비를 계산합니다.
     */
    private calculateCardWidth(): number {
        return this.layoutConfig.calculateCardWidth(this.columns);
    }
    
    /**
     * 레이아웃을 새로고침합니다.
     */
    public refreshLayout(): void {
        if (!this.container) return;
        
        // 새 값 계산
        const { isVertical } = this.layoutConfig.calculateContainerOrientation();
        this.isVertical = isVertical;
        
        // 열 수 계산
        this.columns = this.layoutConfig.getColumns();
        
        // 카드 너비 계산
        this.cardWidth = this.calculateCardWidth();
        
        // 컨테이너 스타일 적용
        this.layoutStyleManager.applyContainerStyle(this.isVertical);
        
        // 카드 위치 캐시 초기화
        this.cardPositionsCache.clear();
        
        // 컨테이너에 있는 모든 카드 요소 가져오기
        const cardElementsList = this.container.querySelectorAll('.card-navigator-card');
        const cardElements = Array.from(cardElementsList).filter(el => el instanceof HTMLElement) as HTMLElement[];
        
        // 카드 요소 맵 업데이트
        cardElements.forEach(element => {
            const cardId = element.getAttribute('data-card-id');
            if (cardId && !this.cardElements.has(cardId)) {
                this.cardElements.set(cardId, element);
            }
        });
        
        // 카드 요소가 있는 경우 위치 재계산
        if (cardElements.length > 0) {
            // 카드 ID 배열 생성
            const cardIds = cardElements.map(el => el.getAttribute('data-card-id') || '').filter(id => id);
            
            // 각 카드 ID에 대한 위치 생성
            const positions: CardPosition[] = cardIds.map((id, index) => {
                return this.generateDefaultPosition(id, index);
            });
            
            // 위치 등록
            this.registerCardPositionsWithCache(positions);
        }
        
        // 카드 스타일 적용
        this.applyCardStyles();
    }

    /**
     * 카드 ID에 해당하는 위치를 가져옵니다.
     */
    getCardPosition(cardId: string): CardPosition | null {
        // 등록된 위치에서 찾기
        const position = this.cardPositionsCache.get(cardId);
        if (position) {
            return position;
        }
        
        // 컨테이너나 카드 요소가 없는 경우 기본 위치 생성
        if (!this.container || !document.body.contains(this.container)) {
            return this.generateDefaultPosition(cardId, 0);
        }
        
        // 카드 요소 찾기
        const cardElement = this.cardElements.get(cardId);
        if (!cardElement) {
            return this.generateDefaultPosition(cardId, 0);
        }
        
        // 기본 위치 계산
        return this.generateDefaultPosition(cardId, this.cardElements.size);
    }
    
    /**
     * 기본 카드 위치를 생성합니다.
     */
    generateDefaultPosition(cardId: string, index: number): CardPosition {
        // 컨테이너 크기 가져오기
        const containerSize = this.layoutConfig.getContainerSize();
        
        // 기본 카드 크기 설정
        const cardWidth = 250;
        const cardHeight = 150;
        
        // 인덱스에 따라 위치 계산
        const columns = Math.max(1, Math.floor(containerSize.width / cardWidth));
        const row = Math.floor(index / columns);
        const col = index % columns;
        
        // 위치 계산
        const left = col * (cardWidth + 10);
        const top = row * (cardHeight + 10);
        
        // 위치 정보 생성 및 캐싱
        const position: CardPosition = {
            id: cardId,
            left,
            top,
            width: cardWidth,
            height: cardHeight
        };
        
        this.cardPositionsCache.set(cardId, position);
        return position;
    }
} 