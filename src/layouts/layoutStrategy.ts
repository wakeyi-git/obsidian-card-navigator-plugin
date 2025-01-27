import { Card } from 'common/types';

/**
 * 레이아웃 전략을 정의하는 인터페이스
 * 다양한 카드 배치 방식을 구현하기 위한 기본 계약을 정의합니다.
 */
export interface LayoutStrategy {
    //#region 카드 배치 및 관리
    /**
     * 특정 레이아웃 전략에 따라 카드를 배치합니다.
     * @param cards - 배치할 카드 배열
     * @param containerWidth - 컨테이너의 너비
     * @param containerHeight - 컨테이너의 높이
     * @param cardsPerView - 뷰당 표시할 카드 수
     * @returns 각 카드의 위치와 크기를 나타내는 CardPosition 객체 배열
     */
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[];

    /**
     * 카드의 너비를 설정합니다.
     * @param width - 설정할 카드의 너비
     */
    setCardWidth(width: number): void;
    //#endregion

    //#region 레이아웃 속성
    /**
     * 레이아웃의 스크롤 방향을 반환합니다.
     * @returns 수직 스크롤의 경우 'vertical', 수평 스크롤의 경우 'horizontal'
     */
    getScrollDirection(): 'vertical' | 'horizontal';

    /**
     * 레이아웃의 열 수를 반환합니다.
     * @returns 레이아웃의 열 수
     */
    getColumnsCount(): number;
    //#endregion
}

/**
 * 레이아웃에서 카드의 위치와 크기를 정의하는 인터페이스
 */
export interface CardPosition {
    // 카드 객체
    card: Card;
    // 카드의 X 좌표 위치
    x: number;
    // 카드의 Y 좌표 위치
    y: number;
    // 카드의 너비 (숫자 또는 'auto')
    width: number | 'auto';
    // 카드의 높이 (숫자 또는 'auto')
    height: number | 'auto';
}
