import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from 'ui/cardContainer/cardMaker';
import { LayoutConfig } from './layoutConfig';

/**
 * 메이슨리 레이아웃 전략을 구현하는 클래스
 * 카드를 다양한 높이를 가진 열 형태로 배열합니다.
 */
export class MasonryLayout implements LayoutStrategy {
    //#region 클래스 속성
    private container: HTMLElement | null = null;
    private columnElements: HTMLElement[] = [];
    private cardWidth: number = 0;
    private layoutConfig: LayoutConfig;
    //#endregion

    //#region 초기화 및 설정
    // 생성자: 메이슨리 레이아웃 초기화
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
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width || this.layoutConfig.calculateCardWidth(this.columns);
    }

    // 컨테이너 설정
    setContainer(container: HTMLElement) {
        this.container = container;
        // 컨테이너 클래스 설정만 여기서 수행
        if (this.container) {
            this.container.className = 'masonry-layout';
        }
    }

    // 컨테이너 초기 설정
    private setupContainer() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.className = 'masonry-layout';
        this.container.style.setProperty('--column-count', this.columns.toString());
        this.container.style.setProperty('--card-gap', `${this.layoutConfig.getCardGap()}px`);
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
    arrange(cards: Card[], containerWidth: number): CardPosition[] {
        if (!this.container) return [];

        const container = this.container; // null이 아닌 컨테이너 참조 저장

        // 컨테이너 초기화 및 CSS 변수 설정
        container.empty();
        container.style.setProperty('--column-count', this.columns.toString());
        container.style.setProperty('--card-gap', `${this.layoutConfig.getCardGap()}px`);
        container.style.setProperty('--card-width', `${this.cardWidth}px`);

        // 컬럼 생성
        this.columnElements = Array.from({ length: this.columns }, () => 
            container.createDiv({ cls: 'masonry-column' })
        );

        const cardPositions: CardPosition[] = [];
        const containerRect = container.getBoundingClientRect();
        const cardWidth = this.cardWidth || this.layoutConfig.calculateCardWidth(this.columns);

        // 포커스된 카드 상태 저장
        const focusedCards = new Set(
            Array.from(container.querySelectorAll('.card-navigator-focused'))
                .map(el => (el as HTMLElement).dataset.path)
        );

        cards.forEach((card, index) => {
            const columnIndex = index % this.columns;
            const cardElement = this.cardMaker.createCardElement(card);

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
                width: cardWidth,
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

    getContainerStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutConfig.getContainerStyle(this.getScrollDirection() === 'vertical');
    }

    getCardStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutConfig.getCardStyle(
            this.getScrollDirection() === 'vertical',
            this.settings.alignCardHeight
        );
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
