// src/ui/cardContainer/keyboardNavigator.ts

import { Menu, MenuItem } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardContainer } from './cardContainer';

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
		}
    }

	private handleBlur() {
        this.isFocused = false;
    }

    public focusNavigator() {
        if (!this.containerEl) return;

        this.containerEl.tabIndex = -1;  // 키보드 포커스를 받을 수 있도록 설정
        this.containerEl.focus();
        this.isFocused = true;

        // 초기 포커스 설정 (이전 코드와 동일)
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
    }

    private moveFocusToStart() {
        this.focusedCardIndex = 0;
        this.updateFocusedCard();
    }

    private moveFocusToEnd() {
        this.focusedCardIndex = this.containerEl.children.length - 1;
        this.updateFocusedCard();
    }

    private updateFocusedCard() {
        if (this.focusedCardIndex === null) return;

        Array.from(this.containerEl.children).forEach((card, index) => {
            card.classList.toggle('card-navigator-focused', index === this.focusedCardIndex);
        });

        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        this.scrollToCard(focusedCard);
    }

    private scrollToCard(card: HTMLElement) {
        this.cardContainer.centerCard(card);
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
					.setTitle('Copy as Link')
					.setIcon('link')
					.onClick(() => {
						this.cardContainer.copyLink(file);
					});
			});
		
			menu.addItem((item: MenuItem) => {
				item
					.setTitle('Copy Card Content')
					.setIcon('file-text')
					.onClick(() => {
						this.cardContainer.copyCardContent(file);
					});
			});

            const rect = focusedCard.getBoundingClientRect();
            menu.showAtPosition({ x: rect.left, y: rect.bottom });
        }
    }

    private truncateContent(content: string): string {
        const maxLength = this.plugin.settings.contentLength;
        return content.length <= maxLength ? content : `${content.slice(0, maxLength)}...`;
    }

	public getContextMenuInstructions(): string {
        return "컨텍스트 메뉴를 열려면 Obsidian 설정의 단축키 섹션에서 'Open Card Context Menu' 명령에 대한 단축키를 설정하세요.";
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
