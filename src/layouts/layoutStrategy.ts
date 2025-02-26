import { Card, CardNavigatorSettings } from 'common/types';

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
     * @returns 각 카드의 위치와 크기를 나타내는 CardPosition 객체 배열
     */
    calculatePositions(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[];

    /**
     * 카드의 너비를 설정합니다.
     * @param width - 설정할 카드의 너비
     */
    setCardWidth(width?: number): void;
    //#endregion

    //#region 레이아웃 속성
    /**
     * 레이아웃의 타입을 반환합니다.
     * @returns 레이아웃 타입 ('list', 'grid', 'masonry', 'auto')
     */
    getLayoutType(): CardNavigatorSettings['defaultLayout'];

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

    //#region 컨테이너 관련 메서드
    /**
     * 컨테이너를 설정합니다. (메이슨리 레이아웃에서만 필요)
     * @param container - 컨테이너 요소
     */
    setContainer?(container: HTMLElement): void;

    /**
     * 컨테이너의 설정을 업데이트합니다.
     * @param settings - 업데이트할 설정 객체
     */
    updateSettings(settings: CardNavigatorSettings): void;

    /**
     * 컨테이너의 너비가 변경될 때 대응하는 메서드
     * @param newWidth - 새로운 컨테이너의 너비
     */
    handleContainerResize(newWidth: number): void;
    //#endregion
}

/**
 * 레이아웃에서 카드의 위치와 크기를 정의하는 인터페이스
 */
export interface CardPosition {
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
    column?: number; // CSS Grid에서 사용할 열 번호 (선택적)
}
