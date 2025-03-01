import { Card } from 'common/types';
import { TFile } from 'obsidian';

/**
 * 카드 위치 정보 인터페이스
 * 
 * 이 인터페이스는 카드의 위치와 크기 정보를 정의합니다.
 */
export interface CardPosition {
    cardId: string;
    left: number;
    top: number;
    width: number;
    height: number | 'auto';
    activeFile?: TFile;
    focusedCardId?: string;
}

/**
 * 레이아웃 방향을 정의하는 타입
 */
export type LayoutDirection = 'horizontal' | 'vertical';

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
 * 레이아웃 옵션을 정의하는 인터페이스
 */
export interface LayoutOptions {
    container: HTMLElement;
    cards: Card[];
    direction: LayoutDirection;
    cardWidth: number;
    cardHeight: number | 'auto';
    columns: number;
    cardGap: number;
    containerPadding: number;
}

/**
 * 레이아웃 전략 인터페이스
 * 
 * 이 인터페이스는 다양한 레이아웃 알고리즘을 구현하는 전략 패턴의 기본이 됩니다.
 * 각 구현체는 카드를 배치하는 고유한 방법을 제공합니다.
 */
export interface LayoutStrategy {
    /**
     * 카드를 배치하는 메서드
     * 
     * @param options 레이아웃 옵션
     * @returns 카드 위치 배열
     */
    arrange(options: LayoutOptions): CardPosition[];
}

/**
 * 메이슨리 레이아웃 전략 클래스
 * 
 * 카드를 메이슨리(벽돌 쌓기) 형태로 배치합니다.
 * 카드 높이가 다양할 때 공간을 효율적으로 사용합니다.
 */
export class MasonryLayoutStrategy implements LayoutStrategy {
    /**
     * 카드를 메이슨리 형태로 배치합니다.
     * 
     * @param options 레이아웃 옵션
     * @returns 카드 위치 배열
     */
    arrange(options: LayoutOptions): CardPosition[] {
        const { cards, direction, cardWidth, cardHeight, columns, cardGap, containerPadding } = options;
        const positions: CardPosition[] = [];
        
        if (direction === 'horizontal') {
            // 가로 방향 레이아웃 - 단일 행에 카드 배치
            let currentLeft = containerPadding;
            
            cards.forEach((card) => {
                positions.push({
                    cardId: card.id,
                    left: currentLeft,
                    top: containerPadding,
                    width: cardWidth,
                    height: cardHeight
                });
                
                currentLeft += cardWidth + cardGap;
            });
        } else {
            // 세로 방향 레이아웃
            if (cardHeight === 'auto') {
                // 메이슨리 레이아웃 (가변 높이) - 높이가 가장 낮은 열에 카드 추가
                const columnHeights = Array(columns).fill(containerPadding);
                
                cards.forEach((card) => {
                    // 가장 높이가 낮은 열 찾기
                    const minHeightColumn = columnHeights.indexOf(Math.min(...columnHeights));
                    
                    // 컨테이너 패딩을 고려하여 왼쪽 위치 계산
                    const left = containerPadding + minHeightColumn * (cardWidth + cardGap);
                    const top = columnHeights[minHeightColumn];
                    
                    // 카드 높이는 자동으로 설정
                    positions.push({
                        cardId: card.id,
                        left,
                        top,
                        width: cardWidth,
                        height: 'auto'
                    });
                    
                    // 해당 열의 높이 업데이트 (예상 높이 사용)
                    const estimatedHeight = cardWidth * 1.2; // 임시 예상 높이
                    columnHeights[minHeightColumn] += estimatedHeight + cardGap;
                });
            } else {
                // 그리드 레이아웃 (고정 높이) - 균일한 그리드에 카드 배치
                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i];
                    const row = Math.floor(i / columns);
                    const col = i % columns;
                    
                    // 컨테이너 패딩을 고려하여 왼쪽 위치 계산
                    const left = containerPadding + col * (cardWidth + cardGap);
                    const top = containerPadding + row * (cardHeight as number + cardGap);
                    
                    positions.push({
                        cardId: card.id,
                        left,
                        top,
                        width: cardWidth,
                        height: cardHeight
                    });
                }
            }
        }
        
        return positions;
    }
}
