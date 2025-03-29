import { Card } from '@domain/models/Card';

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
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[];

    /**
     * 카드의 너비를 설정합니다.
     * @param width - 설정할 카드의 너비
     */
    setCardWidth(width?: number): void;
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

    /**
     * 컨테이너 스타일을 가져옵니다.
     */
    getContainerStyle(): Partial<CSSStyleDeclaration>;

    /**
     * 카드 스타일을 가져옵니다.
     */
    getCardStyle(): Partial<CSSStyleDeclaration>;

    //#region 컨테이너 관련 메서드
    /**
     * 컨테이너를 설정합니다.
     * @param container - 컨테이너 요소
     */
    setContainer?(container: HTMLElement): void;

    /**
     * 컨테이너의 설정을 업데이트합니다.
     * @param settings - 업데이트할 설정 객체
     */
    updateSettings?(settings: any): void;

    /**
     * 컨테이너의 너비가 변경될 때 대응하는 메서드
     * @param newWidth - 새로운 컨테이너의 너비
     */
    updateContainerWidth?(newWidth: number): void;
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
}
