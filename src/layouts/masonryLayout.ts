import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from 'ui/cardContainer/cardMaker';

/**
 * 메이슨리 레이아웃 전략을 구현하는 클래스
 * 카드를 다양한 높이를 가진 열 형태로 배열합니다.
 */
export class MasonryLayout implements LayoutStrategy {
    //#region 클래스 속성
    private container: HTMLElement | null = null;
    private columnElements: HTMLElement[] = [];
    private cardWidth: number = 0;
    //#endregion

    //#region 초기화 및 설정
    // 생성자: 메이슨리 레이아웃 초기화
    constructor(
        private columns: number,
        private cardGap: number,
        private settings: CardNavigatorSettings,
        private cardMaker: CardMaker
    ) {
        if (columns <= 0) {
            throw new Error('The number of columns must be greater than 0');
        }
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width;
    }

    // 컨테이너 설정
    setContainer(container: HTMLElement) {
        this.container = container;
        this.setupContainer();
    }

    // 컨테이너 초기 설정
    private setupContainer() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.className = 'masonry-layout';
        this.container.style.setProperty('--column-count', this.columns.toString());
        this.container.style.setProperty('--card-gap', `${this.cardGap}px`);
        this.container.style.setProperty('--card-width', `${this.cardWidth}px`);

        this.columnElements = [];
        for (let i = 0; i < this.columns; i++) {
            const column = document.createElement('div');
            column.className = 'masonry-column';
            this.container.appendChild(column);
            this.columnElements.push(column);
        }
    }
    //#endregion

    //#region 카드 배치 및 레이아웃 관리
    // 카드를 메이슨리 형태로 배치
    arrange(cards: Card[], containerWidth: number, _containerHeight: number, _cardsPerView: number): CardPosition[] {
        if (!this.container) {
            console.warn('Container is not set. Please call setContainer before arrange.');
            return [];
        }

        this.setupContainer();

        const cardPositions: CardPosition[] = [];
        const containerRect = this.container.getBoundingClientRect();
        const totalGapWidth = this.cardGap * (this.columns - 1);
        const calculatedCardWidth = this.cardWidth || (containerWidth - totalGapWidth) / this.columns;

        // 포커스된 카드 상태 저장
        const focusedCards = new Set(Array.from(this.container.querySelectorAll('.card-navigator-focused'))
            .map(el => (el as HTMLElement).dataset.cardId));

        // 기존 카드 제거
        this.columnElements.forEach(column => column.innerHTML = '');

        // 카드 배치
        cards.forEach((card, index) => {
            const columnIndex = index % this.columns;
            const cardElement = this.cardMaker.createCardElement(card);
            cardElement.classList.add('masonry-card');
            cardElement.style.width = `${calculatedCardWidth}px`;
            
            // 포커스 상태 복원
            if (focusedCards.has(card.file.path)) {
                cardElement.classList.add('card-navigator-focused');
            }
            
            this.columnElements[columnIndex].appendChild(cardElement);

            const rect = cardElement.getBoundingClientRect();
            cardPositions.push({
                card,
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
                width: calculatedCardWidth,
                height: rect.height
            });
        });

        return cardPositions;
    }
    //#endregion

    //#region 레이아웃 속성 조회
    // 열 수 반환
    getColumnsCount(): number {
        return this.columns;
    }

    // 스크롤 방향 반환 (항상 수직)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }
    //#endregion

    //#region 리소스 정리
    // 레이아웃 정리
    destroy() {
        this.container = null;
        this.columnElements = [];
    }
    //#endregion
}
