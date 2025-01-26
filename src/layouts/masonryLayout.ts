import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from 'ui/cardContainer/cardMaker';

export class MasonryLayout implements LayoutStrategy {
    private container: HTMLElement | null = null;
    private columnElements: HTMLElement[] = [];
    private cardWidth: number = 0;

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

    setCardWidth(width: number): void {
        this.cardWidth = width;
    }

    setContainer(container: HTMLElement) {
        this.container = container;
        this.setupContainer();
    }

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

        // Store focused cards before clearing the container
        const focusedCards = new Set(Array.from(this.container.querySelectorAll('.card-navigator-focused'))
            .map(el => (el as HTMLElement).dataset.cardId));

        // Clear existing cards
        this.columnElements.forEach(column => column.innerHTML = '');

        cards.forEach((card, index) => {
            const columnIndex = index % this.columns;
            const cardElement = this.cardMaker.createCardElement(card);
            cardElement.classList.add('masonry-card');
            cardElement.style.width = `${calculatedCardWidth}px`;
            
            // Restore the focused state if it existed
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

    getColumnsCount(): number {
        return this.columns;
    }

    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    destroy() {
        this.container = null;
        this.columnElements = [];
    }
}
