// src/ui/cardContainer/common/keyboardNavigator.ts

import { Menu, MenuItem, debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardContainer } from '../ui/cardContainer/cardContainer';
import { t } from 'i18next';

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

    private setupKeyboardEvents() {
        this.containerEl.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.containerEl.addEventListener('blur', this.handleBlur.bind(this));
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (!this.isFocused) return;

        switch(e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.moveFocus(-1);
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                this.moveFocus(1);
                break;
            case 'PageUp':
                e.preventDefault();
                this.moveFocus(-this.plugin.settings.cardsPerView);
                break;
            case 'PageDown':
                e.preventDefault();
                this.moveFocus(this.plugin.settings.cardsPerView);
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
				if (e.metaKey && e.ctrlKey) {  // Command + Control + E
					e.preventDefault();
					this.openContextMenu();
				}
				break;
        }
    }

    private handleBlur() {
        this.isFocused = false;
        this.updateFocusedCard();
    }

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

	public blurNavigator() {
		this.containerEl.blur();
		this.isFocused = false;
		this.focusedCardIndex = null;
		this.updateFocusedCard();
	}

    private moveFocus(delta: number) {
        if (this.focusedCardIndex === null) {
            this.focusedCardIndex = 0;
        } else {
            const newIndex = this.focusedCardIndex + delta;
            if (newIndex >= 0 && newIndex < this.containerEl.children.length) {
                this.focusedCardIndex = newIndex;
            }
        }
        this.updateFocusedCard();
        this.scrollToFocusedCard();
    }

    private moveFocusToStart() {
        this.focusedCardIndex = 0;
        this.updateFocusedCard();
        this.scrollToFocusedCard();
    }

    private moveFocusToEnd() {
        this.focusedCardIndex = this.containerEl.children.length - 1;
        this.updateFocusedCard();
        this.scrollToFocusedCard();
    }

	private updateFocusedCard = debounce(() => {
		if (!this.containerEl || this.focusedCardIndex === null) return;
	
		const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
		if (!focusedCard) return;
	
		// 현재 포커스된 카드의 스타일만 업데이트
		Array.from(this.containerEl.children).forEach((card, index) => {
			if (index === this.focusedCardIndex) {
				card.classList.add('card-navigator-focused');
			} else {
				card.classList.remove('card-navigator-focused');
			}
		});
	
		this.scrollToFocusedCard();
	}, 50);

    private scrollToFocusedCard(immediate = false) {
        if (this.focusedCardIndex === null) return;

        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        this.cardContainer.centerCard(focusedCard);

        if (immediate) {
            // Force immediate scroll without animation
            const containerRect = this.containerEl.getBoundingClientRect();
            const cardRect = focusedCard.getBoundingClientRect();
            
            if (this.cardContainer.isVertical) {
                this.containerEl.scrollTop += cardRect.top - containerRect.top - (containerRect.height - cardRect.height) / 2;
            } else {
                this.containerEl.scrollLeft += cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;
            }
        }
    }

    private openFocusedCard() {
        if (this.focusedCardIndex === null) return;
        
        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (file) {
            this.plugin.app.workspace.getLeaf().openFile(file);
        }
    }

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

    private findActiveCardIndex(): number {
        return Array.from(this.containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );
    }

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

    private isCardVisible(cardRect: DOMRect, containerRect: DOMRect): boolean {
        return (
            cardRect.top >= containerRect.top &&
            cardRect.bottom <= containerRect.bottom &&
            cardRect.left >= containerRect.left &&
            cardRect.right <= containerRect.right
        );
    }
}
