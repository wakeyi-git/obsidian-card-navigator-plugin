import { Card, CardNavigatorSettings } from 'common/types';
import { TFile } from 'obsidian';

/**
 * 카드 위치 정보 인터페이스
 */
export interface CardPosition {
    id: string;
    left: number;
    top: number;
    width: number;
    height: number | 'auto';
    activeFile?: TFile;
    focusedCardId?: string;
}

/**
 * 레이아웃 방향 타입
 */
export type LayoutDirection = 'vertical' | 'horizontal';

/**
 * 레이아웃 관련 CSS 클래스 상수
 */
export const LAYOUT_CLASSES = {
    VERTICAL: 'vertical-layout',
    HORIZONTAL: 'horizontal-layout',
    ALIGN_HEIGHT: 'align-height',
    FLEXIBLE_HEIGHT: 'flexible-height'
};

/**
 * 레이아웃 전략 인터페이스
 * 
 * 이 인터페이스는 다양한 레이아웃 전략을 구현하는 클래스에서 사용됩니다.
 * 각 레이아웃 전략은 이 인터페이스를 구현하여 일관된 API를 제공합니다.
 * 
 * 참고: 이 인터페이스는 LayoutManager에서 구현됩니다.
 */
export interface LayoutStrategy {
    /**
     * 컨테이너를 설정합니다.
     */
    setContainer(container: HTMLElement): Promise<void>;
    
    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void;
    
    /**
     * 컨테이너 너비를 업데이트합니다.
     */
    updateContainerWidth(newWidth: number): void;
    
    /**
     * 카드를 배치합니다.
     */
    arrange(cards: Card[], containerWidth?: number, containerHeight?: number): CardPosition[];
    
    /**
     * 레이아웃 방향을 가져옵니다.
     */
    getLayoutDirection(): LayoutDirection;
    
    /**
     * 열 수를 가져옵니다.
     */
    getColumnsCount(): number;
    
    /**
     * 컨테이너 스타일을 가져옵니다.
     */
    getContainerStyle(): Partial<CSSStyleDeclaration>;
    
    /**
     * 카드 스타일을 가져옵니다.
     */
    getCardStyle(): Partial<CSSStyleDeclaration>;
    
    /**
     * 레이아웃을 새로고침합니다.
     */
    refreshLayout(): void;
    
    /**
     * 카드 위치를 가져옵니다.
     */
    getCardPosition(cardId: string): CardPosition | null;
    
    /**
     * 카드 요소를 등록합니다.
     */
    registerCardElement(cardId: string, cardElement: HTMLElement): void;
}
