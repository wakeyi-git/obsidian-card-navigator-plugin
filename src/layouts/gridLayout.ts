import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { LayoutConfig } from './layoutConfig';

/**
 * 그리드 레이아웃 전략을 구현하는 클래스
 * 카드를 격자 형태로 배열합니다.
 */
export class GridLayout implements LayoutStrategy {
    //#region 클래스 속성
    private cardWidth: number = 0;
    private layoutConfig: LayoutConfig;
    private settings: CardNavigatorSettings;
    private columns: number;
    private cardGap: number;
    //#endregion

    //#region 초기화
    // 생성자: 그리드 레이아웃 초기화
    constructor(
        columns: number,
        settings: CardNavigatorSettings,
        layoutConfig: LayoutConfig
    ) {
        this.layoutConfig = layoutConfig;
        this.settings = settings;
        this.columns = columns;
        this.cardGap = layoutConfig.getCardGap(); // LayoutConfig에서 가져오기
        
        if (columns <= 0) {
            throw new Error('The number of columns must be greater than 0');
        }
    }
    //#endregion

    //#region 카드 크기 및 레이아웃 관리
    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width || this.layoutConfig.calculateCardWidth(this.columns);
    }

    // 카드를 그리드 형태로 배치
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const cardGap = this.cardGap; // 클래스 속성 사용
        const cardWidth = this.cardWidth;
        
        // 카드 높이 계산
        const cardHeightValue = this.layoutConfig.calculateCardHeight('grid', true);
        // 'auto'인 경우 기본값 사용
        const cardHeight = cardHeightValue === 'auto' ? 200 : cardHeightValue;

        cards.forEach((card, index) => {
            const row = Math.floor(index / this.columns);
            const col = index % this.columns;
            
            // 카드 ID (파일 경로 사용)
            const cardId = card.file.path;

            const position: CardPosition = {
                id: cardId,
                left: col * (cardWidth + cardGap),
                top: row * (cardHeight + cardGap),
                width: cardWidth,
                height: cardHeight
            };
            positions.push(position);
        });

        return positions;
    }

    getContainerStyle(): Partial<CSSStyleDeclaration> {
        // 빈 객체 반환 - 실제 스타일은 LayoutStyleManager에서 적용
        return {};
    }

    getCardStyle(): Partial<CSSStyleDeclaration> {
        // 빈 객체 반환 - 실제 스타일은 LayoutStyleManager에서 적용
        return {};
    }

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        this.cardGap = this.layoutConfig.getCardGap(); // 설정 업데이트 시 cardGap도 업데이트
        // 카드 너비 재계산
        this.setCardWidth(this.layoutConfig.calculateCardWidth(this.columns));
    }
    //#endregion

    //#region 레이아웃 속성 조회
    // 그리드의 열 수 반환
    public getColumnsCount(): number {
        return this.columns;
    }

    // 스크롤 방향 반환 (항상 수직)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    // 레이아웃 타입 반환
    getLayoutType(): string {
        return 'grid';
    }

    // 컨테이너 너비 변화에 대응하는 메서드
    public updateContainerWidth(newWidth: number): void {
        if (newWidth <= 0) return;
        
        // 카드 너비 재계산
        const cardWidth = this.layoutConfig.calculateCardWidth(this.columns);
        this.setCardWidth(cardWidth);
    }
    //#endregion
}
