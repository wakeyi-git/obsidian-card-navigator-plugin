import { Menu, MenuItem, debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardContainer } from './cardContainer';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { GridLayout } from 'layouts/gridLayout';
import { MasonryLayout } from 'layouts/masonryLayout';
import { t } from 'i18next';

// KeyboardNavigator class to handle keyboard navigation for the card container
export class KeyboardNavigator {
    private focusedCardIndex: number | null = null;
    private previousFocusedCardIndex: number | null = null;
    private isFocused = false;

	constructor(
		private plugin: CardNavigatorPlugin,
		private cardContainer: CardContainer,
		private containerEl: HTMLElement
	) {
		this.containerEl = containerEl;
		this.setupKeyboardEvents();
	}

    // Set up keyboard event listeners
    private setupKeyboardEvents() {
        this.containerEl.addEventListener('keydown', this.handleKeyDown);
        this.containerEl.addEventListener('blur', this.handleBlur);
    }

    // Remove keyboard event listeners
	public cleanup() {
		this.containerEl.removeEventListener('keydown', this.handleKeyDown);
		this.containerEl.removeEventListener('blur', this.handleBlur);
		this.updateFocusedCard.cancel();
	}

    // Handle keydown events for navigation
    private handleKeyDown = (e: KeyboardEvent) => {
        if (!this.isFocused) return;

        const keyHandlers: Record<string, () => void> = {
            ArrowLeft: () => {
                e.preventDefault();
                this.moveFocus(0, -1);
            },
            ArrowRight: () => {
                e.preventDefault();
                this.moveFocus(0, 1);
            },
            ArrowUp: () => {
                e.preventDefault();
                this.moveFocus(-1, 0);
            },
            ArrowDown: () => {
                e.preventDefault();
                this.moveFocus(1, 0);
            },
            PageUp: () => {
                e.preventDefault();
                this.moveFocusPage(-1);
            },
            PageDown: () => {
                e.preventDefault();
                this.moveFocusPage(1);
            },
            Home: () => {
                e.preventDefault();
                this.moveFocusToStart();
            },
            End: () => {
                e.preventDefault();
                this.moveFocusToEnd();
            },
            Enter: () => {
                e.preventDefault();
                this.openFocusedCard();
            },
        };

        const handler = keyHandlers[e.key];
        if (handler) {
            handler();
        }
    };

    // Handle blur event
    private handleBlur = () => {
        if (!this.containerEl) return;
        this.isFocused = false;
        this.updateFocusedCard();
    };

    // Focus the navigator
	public focusNavigator() {
		if (!this.containerEl) return;
	
		this.containerEl.tabIndex = -1;
		this.containerEl.focus();
		this.isFocused = true;
	
		// 항상 활성 카드를 찾도록 수정
		const activeCardIndex = this.findActiveCardIndex();
		if (activeCardIndex !== -1) {
			this.focusedCardIndex = this.ensureValidIndex(activeCardIndex);
		} else {
			const firstVisibleCardIndex = this.findFirstVisibleCardIndex();
			if (firstVisibleCardIndex !== null) {
				this.focusedCardIndex = this.ensureValidIndex(firstVisibleCardIndex);
			} else {
				this.focusedCardIndex = this.ensureValidIndex(0);
			}
		}
	
		this.updateFocusedCard();
		this.scrollToFocusedCard(true); // 포커스된 카드로 스크롤
	}

    // Blur the navigator
    public blurNavigator() {
        if (!this.containerEl) return;
        this.containerEl.blur();
        this.isFocused = false;
        this.focusedCardIndex = null;
        this.updateFocusedCard();
    }

    // Calculate new index for grid layout
	private calculateGridIndex(rowDelta: number, colDelta: number, totalCards: number): number {
		const layoutStrategy = this.cardContainer.getLayoutStrategy();
		if (!(layoutStrategy instanceof GridLayout || layoutStrategy instanceof MasonryLayout)) {
			console.warn('The layout strategy is unexpected.');
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
        return newIndex >= 0 && newIndex < totalCards ? newIndex : this.focusedCardIndex ?? 0;
    }

    // Calculate new index for list layout
    private calculateListIndex(rowDelta: number, colDelta: number, totalCards: number): number {
        const newIndex = (this.focusedCardIndex ?? 0) + rowDelta + colDelta;
        return newIndex >= 0 && newIndex < totalCards ? newIndex : this.focusedCardIndex ?? 0;
    }

	private ensureValidIndex(index: number): number {
		const totalCards = this.containerEl.children.length;
		return Math.max(0, Math.min(index, totalCards - 1));
	}

	// Move focus based on row and column deltas
	private moveFocus(rowDelta: number, colDelta: number) {
		if (this.focusedCardIndex === null) {
			this.focusedCardIndex = 0;
		} else {
			const totalCards = this.containerEl.children.length;
			const layoutStrategy = this.cardContainer.getLayoutStrategy();
	
			if (layoutStrategy instanceof GridLayout || layoutStrategy instanceof MasonryLayout) {
				this.focusedCardIndex = this.ensureValidIndex(this.calculateGridIndex(rowDelta, colDelta, totalCards));
			} else {
				this.focusedCardIndex = this.ensureValidIndex(this.calculateListIndex(rowDelta, colDelta, totalCards));
			}
		}
		this.updateFocusedCard();
		this.scrollToFocusedCard();
	}

    // Move focus by a page (multiple cards at once)
	private moveFocusPage(direction: number) {
		if (this.focusedCardIndex === null) return;
	
		const totalCards = this.containerEl.children.length;
		const cardsPerView = this.plugin.settings.cardsPerView;
	
		let newIndex: number;
	
		if (direction > 0) {
			// PageDown
			newIndex = Math.min(totalCards - 1, this.focusedCardIndex + cardsPerView);
		} else {
			// PageUp
			newIndex = Math.max(0, this.focusedCardIndex - cardsPerView);
		}
	
		this.focusedCardIndex = this.ensureValidIndex(newIndex);
		this.updateFocusedCard();
		this.scrollToFocusedCard();
	}

    // Move focus to the first card
	private moveFocusToStart() {
		this.focusedCardIndex = this.ensureValidIndex(0);
		this.updateFocusedCard();
		this.scrollToFocusedCard();
	}

    // Move focus to the last card
	private moveFocusToEnd() {
		this.focusedCardIndex = this.ensureValidIndex(this.containerEl.children.length - 1);
		this.updateFocusedCard();
		this.scrollToFocusedCard();
	}

    // Update the focused card's visual state
    private updateFocusedCard = debounce(() => {
        if (!this.containerEl) return;

        // Remove focus from previous card
        if (this.previousFocusedCardIndex !== null) {
            const prevCard = this.containerEl.children[this.previousFocusedCardIndex] as HTMLElement;
            if (prevCard) {
                prevCard.classList?.remove('card-navigator-focused');
            }
        }

        // Add focus to current card
        if (this.isFocused && this.focusedCardIndex !== null) {
            const currentCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
            if (currentCard) {
                currentCard.classList?.add('card-navigator-focused');
            }
        }

        this.previousFocusedCardIndex = this.focusedCardIndex;
    }, 50);

    // Scroll to ensure the focused card is visible
    private scrollToFocusedCard(immediate = false) {
        if (this.focusedCardIndex === null || !this.containerEl) return;

        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        this.cardContainer.centerCard(focusedCard, !immediate);
    }

    // Open the focused card
	private openFocusedCard() {
		try {
			if (!this.containerEl || this.focusedCardIndex === null) return;
			const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
			if (!focusedCard) return;
			
			const file = this.cardContainer.getFileFromCard(focusedCard);
			if (file) {
				this.plugin.app.workspace.getLeaf().openFile(file);
			}
		} catch (error) {
			console.error('An error occurred while opening the card:', error);
		}
	}

    // Find the index of the active card
    private findActiveCardIndex(): number {
        if (!this.containerEl) return -1;
        return Array.from(this.containerEl.children).findIndex(
            child => child instanceof HTMLElement && child.classList?.contains('card-navigator-active')
        );
    }

    // Find the index of the first visible card
    private findFirstVisibleCardIndex(): number | null {
        if (!this.containerEl) return null;
        const containerRect = this.containerEl.getBoundingClientRect();
        for (let i = 0; i < this.containerEl.children.length; i++) {
            const card = this.containerEl.children[i] as HTMLElement;
            if (card) {
                const cardRect = card.getBoundingClientRect();
                if (this.isCardVisible(cardRect, containerRect)) {
                    return i;
                }
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
	public updateLayout(_layoutStrategy: LayoutStrategy) {
    // TODO: Implement layout update logic
}
}
