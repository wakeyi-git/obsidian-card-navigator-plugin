import { Menu, MenuItem, debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardContainer } from '../ui/cardContainer/cardContainer';
import { t } from 'i18next';
import { LayoutStrategy } from 'ui/layouts/layoutStrategy';
import { GridLayout } from 'ui/layouts/gridLayout';
import { MasonryLayout } from 'ui/layouts/masonryLayout';

// KeyboardNavigator class to handle keyboard navigation for the card container
export class KeyboardNavigator {
    private focusedCardIndex: number | null = null;
    private isFocused = false;

    constructor(
        private plugin: CardNavigatorPlugin,
        private cardContainer: CardContainer,
        private containerEl: HTMLElement
    ) {
        this.setupKeyboardEvents();
    }

    // Set up keyboard event listeners
    private setupKeyboardEvents() {
        this.containerEl.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.containerEl.addEventListener('blur', this.handleBlur.bind(this));
    }

    // Handle keydown events for navigation
    private handleKeyDown(e: KeyboardEvent) {
        if (!this.isFocused) return;

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.moveFocus(0, -1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveFocus(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveFocus(-1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveFocus(1, 0);
                break;
            case 'PageUp':
                e.preventDefault();
                this.moveFocusPage(-1);
                break;
            case 'PageDown':
                e.preventDefault();
                this.moveFocusPage(1);
                break;
            case 'Home':
                e.preventDefault();
                this.moveFocusToStart();
                break;
            case 'End':
                e.preventDefault();
                this.moveFocusToEnd();
                break;
            case 'Enter':
                e.preventDefault();
                this.openFocusedCard();
                break;
            case 'ContextMenu':
                e.preventDefault();
                this.openContextMenu();
                break;
            case 'e':
                if (e.metaKey && e.ctrlKey) {  
                    e.preventDefault();
                    this.openContextMenu();
                }
                break;
        }
    }

    // Handle blur event
    private handleBlur() {
        this.isFocused = false;
        this.updateFocusedCard();
    }

    // Focus the navigator
    public focusNavigator() {
        if (!this.containerEl) return;

        this.containerEl.tabIndex = -1;
        this.containerEl.focus();
        this.isFocused = true;

        const activeCardIndex = this.findActiveCardIndex();
        if (activeCardIndex !== -1) {
            this.focusedCardIndex = activeCardIndex;
        } else {
            this.focusedCardIndex = this.findFirstVisibleCardIndex();
        }

        if (this.focusedCardIndex === null) {
            this.focusedCardIndex = 0;
        }

        this.updateFocusedCard();
    }

    // Blur the navigator
    public blurNavigator() {
        this.containerEl.blur();
        this.isFocused = false;
        this.focusedCardIndex = null;
        this.updateFocusedCard();
    }

    // Move focus based on row and column deltas
    private moveFocus(rowDelta: number, colDelta: number) {
        if (this.focusedCardIndex === null) {
            this.focusedCardIndex = 0;
        } else {
            const totalCards = this.containerEl.children.length;
            const layoutStrategy = this.cardContainer.getLayoutStrategy();
            
            if (layoutStrategy instanceof GridLayout || layoutStrategy instanceof MasonryLayout) {
                this.focusedCardIndex = this.calculateGridIndex(rowDelta, colDelta, totalCards);
            } else {
                this.focusedCardIndex = this.calculateListIndex(rowDelta, colDelta, totalCards);
            }
        }
        this.updateFocusedCard();
        this.scrollToFocusedCard();
    }

    // Calculate new index for grid layout
    private calculateGridIndex(rowDelta: number, colDelta: number, totalCards: number): number {
        const layoutStrategy = this.cardContainer.getLayoutStrategy();
        if (!(layoutStrategy instanceof GridLayout || layoutStrategy instanceof MasonryLayout)) {
            return this.focusedCardIndex ?? 0;
        }
        const columns = layoutStrategy.getColumnsCount();
        const currentRow = Math.floor((this.focusedCardIndex ?? 0) / columns);
        const currentCol = (this.focusedCardIndex ?? 0) % columns;
        
        let newRow = currentRow + rowDelta;
        let newCol = currentCol + colDelta;

        if (newCol < 0) {
            newRow--;
            newCol = columns - 1;
        } else if (newCol >= columns) {
            newRow++;
            newCol = 0;
        }

        const newIndex = newRow * columns + newCol;
        return newIndex >= 0 && newIndex < totalCards ? newIndex : (this.focusedCardIndex ?? 0);
    }

    // Calculate new index for list layout
    private calculateListIndex(rowDelta: number, colDelta: number, totalCards: number): number {
        const newIndex = (this.focusedCardIndex ?? 0) + rowDelta + colDelta;
        return newIndex >= 0 && newIndex < totalCards ? newIndex : (this.focusedCardIndex ?? 0);
    }

    // Move focus by a page (multiple cards at once)
    private moveFocusPage(direction: number) {
        if (this.focusedCardIndex === null) return;

        const totalCards = this.containerEl.children.length;
        const cardsPerView = this.plugin.settings.cardsPerView;

        let newIndex: number;

        if (direction > 0) { // PageDown
            if (totalCards - this.focusedCardIndex <= cardsPerView) {
                newIndex = totalCards - 1; // Move to the last card
            } else {
                newIndex = Math.min(totalCards - 1, this.focusedCardIndex + cardsPerView);
            }
        } else { // PageUp
            if (this.focusedCardIndex < cardsPerView) {
                newIndex = 0; // Move to the first card
            } else {
                newIndex = Math.max(0, this.focusedCardIndex - cardsPerView);
            }
        }

        this.focusedCardIndex = newIndex;
        this.updateFocusedCard();
        this.scrollToFocusedCard();
    }

    // Move focus to the first card
    private moveFocusToStart() {
        this.focusedCardIndex = 0;
        this.updateFocusedCard();
        this.scrollToFocusedCard();
    }

    // Move focus to the last card
    private moveFocusToEnd() {
        this.focusedCardIndex = this.containerEl.children.length - 1;
        this.updateFocusedCard();
        this.scrollToFocusedCard();
    }

    // Update the focused card's visual state
    private updateFocusedCard = debounce(() => {
        if (!this.containerEl) return;
    
        Array.from(this.containerEl.children).forEach((card, index) => {
            if (this.isFocused && index === this.focusedCardIndex) {
                card.classList.add('card-navigator-focused');
            } else {
                card.classList.remove('card-navigator-focused');
            }
        });
    }, 50);

    // Scroll to ensure the focused card is visible
    private scrollToFocusedCard(immediate = false) {
        if (this.focusedCardIndex === null || !this.containerEl) return;

        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        this.cardContainer.centerCard(focusedCard, !immediate);
    }

    // Open the focused card
    private openFocusedCard() {
        if (this.focusedCardIndex === null) return;
        
        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (file) {
            this.plugin.app.workspace.getLeaf().openFile(file);
        }
    }

    // Open the context menu for the focused card
    public openContextMenu() {
        if (this.focusedCardIndex === null) return;
        
        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (file) {
            const menu = new Menu();
            this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

            menu.addItem((item: MenuItem) => {
                item
                    .setTitle(t('Copy as Link'))
                    .setIcon('link')
                    .onClick(() => {
                        this.cardContainer.copyLink(file);
                    });
            });
        
            menu.addItem((item: MenuItem) => {
                item
                    .setTitle(t('Copy Card Content'))
                    .setIcon('file-text')
                    .onClick(() => {
                        this.cardContainer.copyCardContent(file);
                    });
            });

            const rect = focusedCard.getBoundingClientRect();
            menu.showAtPosition({ x: rect.left, y: rect.bottom });
        }
    }

    // Find the index of the active card
    private findActiveCardIndex(): number {
        return Array.from(this.containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );
    }

    // Find the index of the first visible card
    private findFirstVisibleCardIndex(): number | null {
        const containerRect = this.containerEl.getBoundingClientRect();
        for (let i = 0; i < this.containerEl.children.length; i++) {
            const cardRect = (this.containerEl.children[i] as HTMLElement).getBoundingClientRect();
            if (this.isCardVisible(cardRect, containerRect)) {
                return i;
            }
        }
        return null;
    }

    // Check if a card is visible within the container
    private isCardVisible(cardRect: DOMRect, containerRect: DOMRect): boolean {
        return (
            cardRect.top >= containerRect.top &&
            cardRect.bottom <= containerRect.bottom &&
            cardRect.left >= containerRect.left &&
            cardRect.right <= containerRect.right
        );
    }

    // Update the layout strategy (currently empty, can be implemented if needed)
    public updateLayout(layoutStrategy: LayoutStrategy) {
        // Implementation can be added here if needed
    }
}
