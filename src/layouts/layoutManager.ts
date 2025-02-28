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
    private cardMaker: CardMaker;
    private layoutStyleManager: LayoutStyleManager;
    
    // 레이아웃 관련 속성들
    private cardWidth: number = 0;
    private columns: number = 1;
    private isVertical: boolean = true;
    private cardElements: Map<string, HTMLElement> = new Map();
    
    constructor(private settings: CardNavigatorSettings, cardMaker: CardMaker) {
        this.cardMaker = cardMaker;
        this.layoutConfig = new LayoutConfig(settings);
        this.layoutStyleManager = new LayoutStyleManager(settings);
        
        // 초기화 코드
        this.isVertical = true; // 기본값은 수직 방향
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
    setContainer(container: HTMLElement): void {
        this.container = container;
        this.layoutConfig.setContainer(container);
        this.layoutStyleManager.setContainer(container);
        this.refreshLayout();
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
     * @param cards 카드 목록
     */
    calculateLayout(cards: Card[]): void {
        // 카드 배치 계산
        this.arrange(cards);
    }
    
    /**
     * 카드 위치를 가져옵니다.
     * @param cardId 카드 ID
     * @returns 카드 위치 정보
     */
    getCardPosition(cardId: string): CardPosition | undefined {
        // 컨테이너가 없는 경우 먼저 확인
        if (!this.container) {
            console.warn(`[LayoutManager] 컨테이너가 설정되지 않아 카드 위치를 계산할 수 없습니다. 기본 위치 계산 중...`);
            return this.calculateDefaultPosition(cardId);
        }
        
        // 카드 요소 맵에서 요소 가져오기
        let cardElement = this.cardElements.get(cardId);
        
        // 요소가 없는 경우 DOM에서 직접 찾기 시도
        if (!cardElement) {
            // 카드 ID가 파일 경로인 경우가 많으므로 로그에 표시
            console.warn(`[LayoutManager] 카드 요소를 맵에서 찾을 수 없음: ${cardId}. DOM에서 직접 찾기 시도 중...`);
            
            try {
                // 1. data-card-id 속성으로 찾기
                cardElement = this.container.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
                
                // 2. 찾지 못한 경우 CSS 이스케이프된 ID로 다시 시도
                if (!cardElement) {
                    const safeCardId = CSS.escape(cardId);
                    cardElement = this.container.querySelector(`[data-card-id="${safeCardId}"]`) as HTMLElement;
                }
                
                // 3. 찾지 못한 경우 data-original-path 속성으로 시도
                if (!cardElement) {
                    cardElement = this.container.querySelector(`[data-original-path="${cardId}"]`) as HTMLElement;
                }
                
                // 요소를 찾은 경우 맵에 추가
                if (cardElement) {
                    console.log(`[LayoutManager] 카드 요소를 DOM에서 직접 찾았습니다: ${cardId}`);
                    this.cardElements.set(cardId, cardElement);
                } else {
                    console.warn(`[LayoutManager] 카드 요소를 DOM에서도 찾을 수 없음: ${cardId}. 기본 위치 계산 중...`);
                    return this.calculateDefaultPosition(cardId);
                }
            } catch (error) {
                console.error(`[LayoutManager] 카드 요소 찾기 중 오류 발생: ${cardId}`, error);
                return this.calculateDefaultPosition(cardId);
            }
        }
        
        try {
            // 요소가 DOM에 있는지 확인
            if (!document.body.contains(cardElement)) {
                console.warn(`[LayoutManager] 카드 요소가 DOM에 없음: ${cardId}. 기본 위치 계산 중...`);
                return this.calculateDefaultPosition(cardId);
            }
            
            // 요소의 위치 및 크기 정보 가져오기
            const rect = cardElement.getBoundingClientRect();
            
            // 유효한 크기인지 확인
            if (rect.width <= 0 || rect.height <= 0) {
                console.warn(`[LayoutManager] 카드 요소의 크기가 유효하지 않음: ${cardId}. 기본 위치 계산 중...`);
                return this.calculateDefaultPosition(cardId);
            }
            
            // 컨테이너 기준 상대 위치 계산
            return {
                id: cardId,
                left: cardElement.offsetLeft,
                top: cardElement.offsetTop,
                width: rect.width,
                height: rect.height
            };
        } catch (error) {
            console.error(`[LayoutManager] 카드 위치 계산 중 오류 발생: ${cardId}`, error);
            return this.calculateDefaultPosition(cardId);
        }
    }
    
    /**
     * 카드 위치를 등록합니다.
     * 이 메서드는 CardRenderer에서 계산한 기본 위치를 레이아웃에 등록하여
     * 다음 렌더링에서 사용할 수 있도록 합니다.
     * @param positions 등록할 카드 위치 목록
     */
    registerCardPositions(positions: CardPosition[]): void {
        if (!positions || positions.length === 0) {
            return;
        }
        
        console.log(`[LayoutManager] ${positions.length}개 카드의 위치를 등록합니다.`);
        
        // 각 위치를 cardElements 맵에 등록
        positions.forEach(position => {
            if (position && position.id) {
                // 카드 요소가 없는 경우에도 위치 정보 저장
                if (!this.cardElements.has(position.id) && this.container) {
                    // DOM에서 요소 다시 찾기 시도
                    const cardElement = this.container.querySelector(`[data-card-id="${position.id}"]`) as HTMLElement;
                    if (cardElement) {
                        console.log(`[LayoutManager] 카드 요소를 DOM에서 찾아 등록: ${position.id}`);
                        this.cardElements.set(position.id, cardElement);
                    } else {
                        console.log(`[LayoutManager] 카드 ${position.id}의 위치 정보만 등록 (요소 없음)`);
                        // 위치 정보만 저장하는 로직이 필요하다면 여기에 구현
                    }
                }
            }
        });
    }

    /**
     * 카드 요소 맵을 설정합니다.
     */
    public setCardElements(cardElements: Map<string, HTMLElement>): void {
        // 기존 맵의 참조를 유지하면서 새 맵으로 교체
        if (this.cardElements !== cardElements) {
            // 기존 맵이 비어있지 않은 경우, 새 맵에 기존 맵의 내용을 복사
            if (this.cardElements.size > 0 && cardElements.size === 0) {
                console.debug('[LayoutManager] 기존 카드 요소 맵의 내용을 새 맵으로 복사합니다.');
                this.cardElements.forEach((element, id) => {
                    cardElements.set(id, element);
                });
            }
            
            // 맵 교체
            this.cardElements = cardElements;
            console.debug(`[LayoutManager] 카드 요소 맵이 설정되었습니다. (${this.cardElements.size}개 요소)`);
        }
    }

    /**
     * 카드 요소 맵을 가져옵니다.
     * @returns 카드 요소 맵
     */
    public getCardElements(): Map<string, HTMLElement> {
        return this.cardElements;
    }

    /**
     * 기본 카드 위치를 계산합니다.
     * 레이아웃에서 카드 위치를 찾을 수 없는 경우 사용됩니다.
     * @param cardId 카드 ID
     * @param index 카드 인덱스
     * @returns 계산된 기본 카드 위치
     */
    public calculateDefaultPosition(cardId: string, index: number = -1): CardPosition {
        try {
            // 뷰포트 크기 가져오기 (항상 사용 가능)
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 카드 인덱스 추정 (제공되지 않은 경우)
            if (index < 0) {
                try {
                    // 파일 경로에서 숫자 추출 시도
                    const match = cardId.match(/\d+/g);
                    if (match && match.length > 0) {
                        index = parseInt(match[0], 10);
                    } else {
                        index = 0;
                    }
                } catch (e) {
                    index = 0;
                }
            }
            
            // 컨테이너 크기 및 설정 가져오기
            let containerWidth = 400;
            let containerHeight = 600;
            const padding = this.layoutConfig.getContainerPadding();
            const gap = this.layoutConfig.getCardGap();
            
            // 컨테이너가 있는 경우 실제 크기 사용
            if (this.container) {
                const containerRect = this.container.getBoundingClientRect();
                
                // 유효한 컨테이너 크기인 경우에만 사용
                if (containerRect.width > 0 && containerRect.height > 0) {
                    containerWidth = Math.min(containerRect.width, viewportWidth - containerRect.left);
                    containerHeight = Math.min(containerRect.height, viewportHeight - containerRect.top);
                } else {
                    console.warn('[LayoutManager] 컨테이너 크기가 유효하지 않습니다. 기본 크기 사용: 400x600');
                }
            } else {
                console.warn('[LayoutManager] 컨테이너가 없어 뷰포트 기반으로 기본 위치를 계산합니다.');
                containerWidth = Math.max(400, Math.floor(viewportWidth * 0.8));
                containerHeight = Math.max(600, Math.floor(viewportHeight * 0.8));
            }
            
            // 사용 가능한 영역 계산 (패딩 적용)
            const availableWidth = containerWidth - (padding * 2);
            const availableHeight = containerHeight - (padding * 2);
            
            // 기본 열 수 계산 (최소 1, 최대 4)
            const columns = Math.max(1, Math.min(4, Math.floor(availableWidth / 300)));
            
            // 카드 크기 계산 (간격 고려)
            const totalGapWidth = (columns - 1) * gap;
            const cardWidth = Math.max(200, (availableWidth - totalGapWidth) / columns);
            const cardHeight = Math.min(300, cardWidth * 0.75); // 카드 높이는 너비의 75% 또는 최대 300px
            
            // 카드 위치 계산 (패딩 포함)
            const column = index % columns;
            const row = Math.floor(index / columns);
            
            const left = padding + (column * (cardWidth + gap));
            const top = padding + (row * (cardHeight + gap));
            
            console.log(`[LayoutManager] 카드 ${cardId}에 대한 기본 위치 계산됨: left=${left}, top=${top}, width=${cardWidth}, height=${cardHeight}, 인덱스: ${index}`);
            
            return {
                id: cardId,
                left,
                top,
                width: cardWidth,
                height: cardHeight
            };
        } catch (error) {
            console.error(`[LayoutManager] 기본 위치 계산 중 오류 발생: ${cardId}`, error);
            
            // 오류 발생 시 안전한 기본값 반환
            return {
                id: cardId,
                left: 0,
                top: 0,
                width: this.cardWidth || 300,
                height: 200
            };
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
     * 컨테이너 설정, 설정 업데이트, 레이아웃 업데이트에 공통으로 사용되는 메서드입니다.
     */
    public refreshLayout(): void {
        // 컨테이너가 없으면 처리하지 않음
        if (!this.container) {
            return;
        }
        
        // 이전 상태 저장
        const prevIsVertical = this.isVertical;
        const prevColumns = this.columns;
        const prevCardWidth = this.cardWidth;
        
        // 새 상태 계산
        this.isVertical = this.layoutConfig.isVerticalContainer();
        this.columns = this.layoutConfig.getColumns();
        this.cardWidth = this.calculateCardWidth();
        
        // 상태가 변경되지 않았으면 DOM 업데이트 최소화
        const layoutChanged = 
            prevIsVertical !== this.isVertical || 
            prevColumns !== this.columns || 
            Math.abs(prevCardWidth - this.cardWidth) > 5;
        
        // 컨테이너 스타일 적용 - 변경된 경우에만
        if (layoutChanged) {
            this.layoutStyleManager.applyContainerStyle(this.isVertical);
            this.container.style.setProperty('--columns', this.columns.toString());
            
            // 기존 카드 요소의 너비 업데이트
            const cardElements = this.container.querySelectorAll('.card-navigator-card') as NodeListOf<HTMLElement>;
            
            // 카드 요소가 많은 경우 성능 최적화
            if (cardElements.length > 0) {
                // 높이 계산 - 한 번만 수행
                const cardHeight = this.layoutConfig.calculateCardHeight(this.isVertical);
                const isAutoHeight = cardHeight === 'auto';
                const heightValue = isAutoHeight ? 'auto' : `${cardHeight}px`;
                
                // 배치 처리를 위한 변수
                const batchSize = 20;
                const totalCards = cardElements.length;
                let processedCards = 0;
                
                // 배치 처리 함수
                const processBatch = () => {
                    const endIdx = Math.min(processedCards + batchSize, totalCards);
                    
                    for (let i = processedCards; i < endIdx; i++) {
                        const cardEl = cardElements[i];
                        cardEl.style.width = `${this.cardWidth}px`;
                        
                        // 높이 설정
                        cardEl.style.height = heightValue;
                        
                        // 카드 ID 가져오기
                        const cardId = cardEl.getAttribute('data-card-id');
                        if (cardId && !this.cardElements.has(cardId)) {
                            this.cardElements.set(cardId, cardEl);
                        }
                    }
                    
                    processedCards = endIdx;
                    
                    // 아직 처리할 카드가 남아있으면 다음 프레임에서 계속
                    if (processedCards < totalCards) {
                        requestAnimationFrame(processBatch);
                    } else {
                        // 모든 카드 처리 완료 후 레이아웃 적용
                        this.applyLayout(cardElements);
                    }
                };
                
                // 첫 번째 배치 처리 시작
                processBatch();
            } else {
                // 카드가 없는 경우 바로 레이아웃 적용
                this.applyLayout([]);
            }
        } else {
            // 레이아웃이 변경되지 않았지만 카드 위치 재계산이 필요한 경우
            const cardElements = this.container.querySelectorAll('.card-navigator-card') as NodeListOf<HTMLElement>;
            if (cardElements.length > 0) {
                this.applyLayout(cardElements);
            }
        }
    }
    
    /**
     * 레이아웃을 적용합니다.
     * 카드 요소 처리 후 호출됩니다.
     */
    private applyLayout(cardElements: NodeListOf<HTMLElement> | HTMLElement[]): void {
        // 카드 데이터 수집
        const cards: Card[] = [];
        for (let i = 0; i < cardElements.length; i++) {
            const cardEl = cardElements[i];
            const cardId = cardEl.getAttribute('data-card-id');
            if (cardId) {
                // 간단한 Card 객체 생성 (id만 필요)
                cards.push({ id: cardId } as Card);
            }
        }
        
        if (cards.length > 0 && this.container) {
            // 최적의 위치 계산
            const positions = this.calculateOptimalPositions(cards, this.container.offsetWidth);
            
            // 계산된 위치 적용
            this.applyCalculatedPositions(cards, positions);
        }
    }

    /**
     * 카드를 배치합니다.
     */
    public arrange(cards: Card[], containerWidth?: number, containerHeight?: number): CardPosition[] {
        if (!this.container || cards.length === 0) {
            return [];
        }
        
        // 카드 요소를 찾지 못한 카드 수 추적
        let notFoundCount = 0;
        
        // 카드 요소 맵 업데이트 - 기존 맵을 유지하면서 새 요소 추가
        cards.forEach(card => {
            // 이미 맵에 있는 경우 건너뛰기
            if (this.cardElements.has(card.id)) {
                return;
            }
            
            const cardElement = this.container?.querySelector(`[data-card-id="${card.id}"]`) as HTMLElement;
            if (cardElement) {
                this.cardElements.set(card.id, cardElement);
            } else {
                notFoundCount++;
                // 카드 요소를 찾지 못한 경우 로그 출력 (디버깅 수준 낮춤)
                console.debug(`[LayoutManager] arrange: 카드 요소를 찾지 못함 (${card.id}). 레이아웃 계산 후 위치가 설정될 예정입니다.`);
            }
        });
        
        if (notFoundCount > 0 && notFoundCount === cards.length) {
            // 모든 카드를 찾지 못한 경우에만 경고 로그 출력
            console.warn(`[LayoutManager] arrange: 모든 카드 요소(${notFoundCount}개)를 찾지 못했습니다. 카드가 표시되지 않을 수 있습니다.`);
        } else if (notFoundCount > 0) {
            // 일부 카드만 찾지 못한 경우 정보 로그 출력
            console.debug(`[LayoutManager] arrange: 일부 카드 요소(${notFoundCount}/${cards.length})를 찾지 못했습니다. 레이아웃 계산은 계속 진행됩니다.`);
        }
        
        // 최적의 위치 계산
        const positions = this.calculateOptimalPositions(cards, containerWidth || this.container.offsetWidth);
        
        // 계산된 위치 적용
        this.applyCalculatedPositions(cards, positions);
        
        return positions;
    }

    /**
     * 최적의 카드 위치를 계산합니다.
     * 이 메서드는 중첩 없이 카드를 배치하는 알고리즘을 구현합니다.
     */
    private calculateOptimalPositions(cards: Card[], containerWidth: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const gap = this.layoutConfig.getCardGap();
        const padding = this.layoutConfig.getContainerPadding();
        
        // 사용 가능한 너비 계산
        const availableWidth = containerWidth - (padding * 2);
        
        // 열 수 계산
        const columns = this.columns;
        
        // 카드 너비 계산 (간격 포함)
        const cardWidth = this.cardWidth;
        const cardWidthWithGap = cardWidth + gap;
        
        // 각 열의 현재 높이 추적 - 패딩 값으로 초기화
        const columnHeights: number[] = Array(columns).fill(padding);
        
        // 각 카드에 대해 최적의 위치 계산
        cards.forEach((card, index) => {
            // 카드 높이 계산
            let cardHeight: number;
            const calculatedHeight = this.layoutConfig.calculateCardHeight(this.isVertical, card, cardWidth);
            
            if (calculatedHeight === 'auto') {
                // 자동 높이의 경우 기본값 사용
                const cardElement = this.cardElements.get(card.id);
                cardHeight = cardElement ? cardElement.offsetHeight : 150;
            } else {
                cardHeight = calculatedHeight as number;
            }
            
            // 가장 높이가 낮은 열 찾기
            let minHeightColumn = 0;
            for (let i = 0; i < columns; i++) {
                if (columnHeights[i] < columnHeights[minHeightColumn]) {
                    minHeightColumn = i;
                }
            }
            
            // 카드 위치 계산 - 패딩 포함
            const left = padding + (minHeightColumn * cardWidthWithGap);
            const top = columnHeights[minHeightColumn];
            
            // 위치 정보 저장
            positions.push({
                id: card.id,
                left,
                top,
                width: cardWidth,
                height: cardHeight
            });
            
            // 열 높이 업데이트
            columnHeights[minHeightColumn] = top + cardHeight + gap;
        });
        
        return positions;
    }

    /**
     * 계산된 위치를 카드에 적용합니다.
     */
    private applyCalculatedPositions(cards: Card[], positions: CardPosition[]): void {
        if (!this.container) return;
        
        // 각 카드에 위치 적용
        cards.forEach((card, index) => {
            const position = positions[index];
            const cardElement = this.cardElements.get(card.id);
            
            if (cardElement && position) {
                // 카드 너비 설정
                cardElement.style.width = `${position.width}px`;
                
                // 높이 설정
                if (typeof position.height === 'string' && position.height === 'auto') {
                    cardElement.style.height = 'auto';
                } else {
                    cardElement.style.height = `${position.height}px`;
                }
                
                // 위치 설정 - transform 대신 left/top 속성 사용
                cardElement.style.position = 'absolute';
                cardElement.style.left = `${position.left}px`;
                cardElement.style.top = `${position.top}px`;
                
                // 카드 요소가 보이도록 설정
                cardElement.style.visibility = 'visible';
                cardElement.style.opacity = '1';
                
                // 트랜지션 설정
                cardElement.style.transition = 'left 0.3s ease, top 0.3s ease, opacity 0.3s ease';
            }
        });
        
        // 컨테이너 높이 설정 (모든 카드를 포함할 수 있도록)
        this.updateContainerHeight(positions);
    }

    /**
     * 컨테이너 높이를 업데이트합니다.
     */
    private updateContainerHeight(positions: CardPosition[]): void {
        if (!this.container || positions.length === 0) return;
        
        // 가장 아래에 있는 카드 찾기
        let maxBottom = 0;
        positions.forEach(position => {
            const bottom = position.top + (position.height as number) + this.layoutConfig.getCardGap();
            if (bottom > maxBottom) {
                maxBottom = bottom;
            }
        });
        
        // 컨테이너 최소 높이 설정 - 패딩을 다시 추가하고 최소 높이 보장
        const padding = this.layoutConfig.getContainerPadding();
        const minHeight = Math.max(maxBottom + padding, 300); // 최소 300px 높이 보장
        
        this.container.style.minHeight = `${minHeight}px`;
        
        // 스크롤 가능하도록 overflow 속성 직접 설정
        this.container.style.overflow = 'auto';
        
        // 방향에 따른 스크롤 설정
        if (this.isVertical) {
            this.container.style.overflowX = 'hidden';
            this.container.style.overflowY = 'auto';
        } else {
            this.container.style.overflowX = 'auto';
            this.container.style.overflowY = 'hidden';
        }
    }

    /**
     * 카드 너비를 설정합니다.
     */
    setCardWidth(width?: number): void {
        this.cardWidth = width || this.calculateCardWidth();
    }

    /**
     * 레이아웃 인스턴스를 가져옵니다.
     * 이 메서드는 이전 코드와의 호환성을 위해 추가되었습니다.
     */
    getLayout(): LayoutStrategy {
        return this;
    }

    /**
     * 카드 크기를 가져옵니다.
     * 이 메서드는 CardRenderer와의 호환성을 위해 추가되었습니다.
     */
    getCardSize(): { width: number, height: number } {
        const height = this.layoutConfig.calculateCardHeight(this.isVertical);
        return {
            width: this.cardWidth,
            height: typeof height === 'number' ? height : 200 // 'auto'인 경우 기본값 사용
        };
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
} 