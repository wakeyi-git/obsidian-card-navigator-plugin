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
    private cardWidth: number = 0;
    private layoutConfig: LayoutConfig;
    private columnHeights: number[] = [];
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
        this.columnHeights = new Array(columns).fill(0);
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width;
        if (this.container) {
            this.container.style.setProperty('--card-width', `${this.cardWidth}px`);
        }
    }

    // 컨테이너 설정
    setContainer(container: HTMLElement) {
        this.container = container;
        this.container.classList.add('masonry-layout');
        this.container.style.setProperty('--card-width', `${this.cardWidth}px`);
        this.container.style.setProperty('--card-gap', `${this.cardGap}px`);
    }

    // 컨테이너 초기 설정
    private setupContainer() {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.container.className = 'masonry-layout';
        this.container.style.setProperty('--column-count', this.columns.toString());
        this.container.style.setProperty('--card-gap', `${this.layoutConfig.getCardGap()}px`);
        this.container.style.setProperty('--card-width', `${this.cardWidth}px`);

        this.columnHeights = new Array(this.columns).fill(0);
        for (let i = 0; i < this.columns; i++) {
            const column = document.createElement('div');
            column.className = 'masonry-column';
            this.container.appendChild(column);
        }
    }
    //#endregion

    //#region 카드 배치 및 레이아웃 관리
    // 카드를 메이슨리 형태로 배치
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        if (!this.container) return [];

        // 컬럼 높이 초기화
        this.columnHeights = new Array(this.columns).fill(0);
        const positions: CardPosition[] = [];
        const containerPadding = this.layoutConfig.getContainerPadding();

        cards.forEach((card) => {
            // 임시 카드 생성하여 높이 측정
            const tempCard = this.cardMaker.createCardElement(card);
            tempCard.style.position = 'absolute';
            tempCard.style.visibility = 'hidden';
            tempCard.style.width = `${this.cardWidth}px`;
            this.container!.appendChild(tempCard);
            
            const cardHeight = tempCard.offsetHeight;
            this.container!.removeChild(tempCard);

            // 가장 낮은 컬럼 찾기
            const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
            
            // 카드 위치 계산
            const x = minHeightIndex * (this.cardWidth + this.cardGap);
            const y = this.columnHeights[minHeightIndex];

            // 위치 정보 저장
            positions.push({
                card,
                x,
                y,
                width: this.cardWidth,
                height: cardHeight
            });

            // 컬럼 높이 업데이트
            this.columnHeights[minHeightIndex] += cardHeight + this.cardGap;
        });

        // 컨테이너 높이 설정
        const maxHeight = Math.max(...this.columnHeights) + containerPadding * 2;
        this.container.style.height = `${maxHeight}px`;

        return positions;
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
            width: `${this.cardWidth}px`
        };
    }
    //#endregion

    //#region 리소스 정리
    // 레이아웃 정리
    destroy() {
        this.container = null;
        this.columnHeights = [];
    }

    updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
    }
    //#endregion
}
