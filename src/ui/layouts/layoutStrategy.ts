import { Card } from '../../common/types';

// Interface defining the contract for different layout strategies
export interface LayoutStrategy {
    /**
     * Arrange cards according to the specific layout strategy
     * @param cards - Array of cards to be arranged
     * @param containerWidth - Width of the container
     * @param containerHeight - Height of the container
     * @param cardsPerView - Number of cards to be displayed per view
     * @returns An array of CardPosition objects representing the position and size of each card
     */
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[];

    /**
     * Get the scroll direction for the layout
     * @returns 'vertical' for vertical scrolling layouts, 'horizontal' for horizontal scrolling layouts
     */
    getScrollDirection(): 'vertical' | 'horizontal';

    /**
     * Get the number of columns in the layout
     * @returns The number of columns in the layout
     */
	getColumnsCount(): number;
}

// Interface defining the position and size of a card in the layout
export interface CardPosition {
    // The card object
    card: Card;
    // X-coordinate of the card's position
    x: number;
    // Y-coordinate of the card's position
    y: number;
    // Width of the card (can be a number or 'auto')
    width: number | 'auto';
    // Height of the card (can be a number or 'auto')
    height: number | 'auto';
}
