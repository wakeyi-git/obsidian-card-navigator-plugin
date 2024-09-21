import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from '../../common/types';
import { CardMaker } from '../cardContainer/cardMaker';

export class MasonryLayout implements LayoutStrategy {
    private container: HTMLElement | null = null;
    private columnElements: HTMLElement[] = [];

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

        this.columnElements = [];
        for (let i = 0; i < this.columns; i++) {
            const column = document.createElement('div');
            column.className = 'masonry-column';
            this.container.appendChild(column);
            this.columnElements.push(column);
        }
    }

    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        if (!this.container) {
            console.warn('Container is not set. Please call setContainer before arrange.');
            return [];
        }

        this.setupContainer(); // Ensure container is set up correctly

        const cardPositions: CardPosition[] = [];
        const containerRect = this.container.getBoundingClientRect();

        cards.forEach((card, index) => {
            const columnIndex = index % this.columns;
            const cardElement = this.cardMaker.createCardElement(card);
            cardElement.classList.add('masonry-card');
            this.columnElements[columnIndex].appendChild(cardElement);

            const rect = cardElement.getBoundingClientRect();
            cardPositions.push({
                card,
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
                width: rect.width,
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
        // Clean up if necessary
        this.container = null;
        this.columnElements = [];
    }
}
