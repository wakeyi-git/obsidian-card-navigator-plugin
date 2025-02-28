import { Menu, MenuItem, debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardContainer } from './cardContainer';
import { t } from 'i18next';
import { LayoutManager } from 'layouts/layoutManager';
import { TFile } from 'obsidian';

// KeyboardNavigator class to handle keyboard navigation for the card container
export class KeyboardNavigator {
    //#region 클래스 속성
    private focusedCardIndex: number | null = null;
    private previousFocusedCardIndex: number | null = null;
    private isFocused = false;
    private mutationObserver: MutationObserver | null = null;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 키보드 네비게이터 초기화
    constructor(
        private plugin: CardNavigatorPlugin,
        private cardContainer: CardContainer,
        private containerEl: HTMLElement
    ) {
        this.containerEl = containerEl;
        this.setupKeyboardEvents();
    }

    // 키보드 이벤트 리스너 설정
    private setupKeyboardEvents() {
        this.containerEl.addEventListener('keydown', this.handleKeyDown);
        this.containerEl.addEventListener('blur', this.handleBlur);
    }

    // 리소스 정리
    public cleanup() {
        this.containerEl.removeEventListener('keydown', this.handleKeyDown);
        this.containerEl.removeEventListener('blur', this.handleBlur);
        this.updateFocusedCard.cancel();
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }
    //#endregion

    //#region 포커스 관리
    // 네비게이터 포커스 설정
    public focusNavigator() {
        if (!this.containerEl) return;
    
        this.containerEl.tabIndex = -1;
        this.containerEl.focus();
        this.isFocused = true;
    
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

        this.updateFocusedCardImmediate();
        
        requestAnimationFrame(() => {
            this.scrollToFocusedCard(true);
            this.updateFocusedCardImmediate();
        });

        this.setupMutationObserver();
    }

    // 네비게이터 포커스 해제
    public blurNavigator() {
        if (!this.containerEl) return;
        this.containerEl.blur();
        this.isFocused = false;
        this.focusedCardIndex = null;
        this.updateFocusedCardImmediate();
    }

    // 포커스된 카드 상태 즉시 업데이트
    private updateFocusedCardImmediate() {
        if (!this.containerEl) return;

        const focusedCards = this.containerEl.querySelectorAll('.card-navigator-focused');
        focusedCards.forEach(card => {
            card.classList.remove('card-navigator-focused');
            if (card instanceof HTMLElement) {
                card.removeAttribute('data-focused');
            }
        });

        if (this.isFocused && this.focusedCardIndex !== null) {
            const currentCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
            if (currentCard) {
                currentCard.classList.add('card-navigator-focused');
                currentCard.setAttribute('data-focused', 'true');
                this.containerEl.setAttribute('data-focused-index', this.focusedCardIndex.toString());
            }
        }

        this.previousFocusedCardIndex = this.focusedCardIndex;
    }

    // 포커스된 카드 상태 디바운스 업데이트
    private updateFocusedCard = debounce(() => {
        this.updateFocusedCardImmediate();
    }, 50, true);
    //#endregion

    //#region 이벤트 핸들링
    // 키보드 이벤트 처리
    private handleKeyDown = (e: KeyboardEvent) => {
        if (!this.isFocused) return;

        const keyHandlers: Record<string, () => void> = {
            ArrowLeft: () => {
                e.preventDefault();
                this.moveFocus('left');
            },
            ArrowRight: () => {
                e.preventDefault();
                this.moveFocus('right');
            },
            ArrowUp: () => {
                e.preventDefault();
                this.moveFocus('up');
            },
            ArrowDown: () => {
                e.preventDefault();
                this.moveFocus('down');
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

    // 블러 이벤트 처리
    private handleBlur = () => {
        if (!this.containerEl) return;
        this.isFocused = false;
        this.updateFocusedCardImmediate();
    };
    //#endregion

    //#region 포커스 이동
    // 포커스 이동
    private moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
        if (this.focusedCardIndex === null) {
            this.focusedCardIndex = 0;
            this.updateFocusedCardImmediate();
            this.scrollToFocusedCard(true);
            return;
        }

        const totalCards = this.containerEl.children.length;
        if (totalCards === 0) return;

        // 레이아웃 방향 확인
        const isVertical = this.cardContainer.layoutManager.getLayoutDirection() === 'vertical';
        const columnsCount = this.cardContainer.layoutManager.getColumnsCount();

        // 그리드 레이아웃인 경우 (열 수가 1보다 큰 경우)
        if (columnsCount > 1) {
            this.moveInGrid(direction, totalCards);
        } else {
            // 리스트 레이아웃인 경우 (열 수가 1인 경우)
            this.moveInList(direction, totalCards, isVertical);
        }

        this.updateFocusedCardImmediate();
        this.scrollToFocusedCard(true);
    }

    // 페이지 단위 포커스 이동
    private moveFocusPage(direction: number) {
        if (this.focusedCardIndex === null) return;
    
        const totalCards = this.containerEl.children.length;
        const cardsPerColumn = this.plugin.settings.cardsPerColumn;
    
        let newIndex: number;
    
        if (direction > 0) {
            newIndex = Math.min(totalCards - 1, this.focusedCardIndex + cardsPerColumn);
        } else {
            newIndex = Math.max(0, this.focusedCardIndex - cardsPerColumn);
        }
    
        this.focusedCardIndex = this.ensureValidIndex(newIndex);
        this.updateFocusedCardImmediate();
        this.scrollToFocusedCard();
    }

    // 첫 번째 카드로 포커스 이동
    private moveFocusToStart() {
        this.focusedCardIndex = this.ensureValidIndex(0);
        this.updateFocusedCardImmediate();
        this.scrollToFocusedCard();
    }

    // 마지막 카드로 포커스 이동
    private moveFocusToEnd() {
        this.focusedCardIndex = this.ensureValidIndex(this.containerEl.children.length - 1);
        this.updateFocusedCardImmediate();
        this.scrollToFocusedCard();
    }

    // 그리드 레이아웃에서 포커스 이동
    private moveInGrid(direction: 'up' | 'down' | 'left' | 'right', totalCards: number): void {
        if (this.focusedCardIndex === null) return;
        
        const columns = this.cardContainer.layoutManager.getLayoutConfig().getColumns();
        const currentRow = Math.floor(this.focusedCardIndex / columns);
        const currentCol = this.focusedCardIndex % columns;
        
        let newRow = currentRow;
        let newCol = currentCol;
        
        switch (direction) {
            case 'up':
                newRow = Math.max(0, currentRow - 1);
                break;
            case 'down':
                newRow = Math.min(Math.floor((totalCards - 1) / columns), currentRow + 1);
                break;
            case 'left':
                newCol = Math.max(0, currentCol - 1);
                break;
            case 'right':
                newCol = Math.min(columns - 1, currentCol + 1);
                break;
        }
        
        const newIndex = newRow * columns + newCol;
        this.focusedCardIndex = this.ensureValidIndex(newIndex);
    }
    
    // 리스트 레이아웃에서 포커스 이동
    private moveInList(direction: 'up' | 'down' | 'left' | 'right', totalCards: number, isVertical: boolean): void {
        if (this.focusedCardIndex === null) return;
        
        if (isVertical) {
            // 수직 레이아웃에서는 위/아래가 주 이동 방향
            switch (direction) {
                case 'up':
                case 'left':
                    this.focusedCardIndex = this.ensureValidIndex(this.focusedCardIndex - 1);
                    break;
                case 'down':
                case 'right':
                    this.focusedCardIndex = this.ensureValidIndex(this.focusedCardIndex + 1);
                    break;
            }
        } else {
            // 수평 레이아웃에서는 좌/우가 주 이동 방향
            switch (direction) {
                case 'up':
                case 'left':
                    this.focusedCardIndex = this.ensureValidIndex(this.focusedCardIndex - 1);
                    break;
                case 'down':
                case 'right':
                    this.focusedCardIndex = this.ensureValidIndex(this.focusedCardIndex + 1);
                    break;
            }
        }
    }
    //#endregion

    //#region 유틸리티 메서드
    // 그리드 레이아웃의 인덱스 계산
    private calculateGridIndex(rowDelta: number, colDelta: number, totalCards: number): number {
        const columns = this.cardContainer.layoutManager.getLayoutConfig().getColumns();
        
        // 열 수가 1이면 리스트 방식으로 계산
        if (columns <= 1) {
            return this.calculateListIndex(rowDelta, colDelta, totalCards);
        }
        
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

    // 리스트 레이아웃의 인덱스 계산
    private calculateListIndex(rowDelta: number, colDelta: number, totalCards: number): number {
        const newIndex = (this.focusedCardIndex ?? 0) + rowDelta + colDelta;
        return newIndex >= 0 && newIndex < totalCards ? newIndex : this.focusedCardIndex ?? 0;
    }

    // 유효한 인덱스 범위 확인
    private ensureValidIndex(index: number): number {
        const totalCards = this.containerEl.children.length;
        return Math.max(0, Math.min(index, totalCards - 1));
    }

    // 포커스된 카드로 스크롤
    private scrollToFocusedCard(immediate = false) {
        if (this.focusedCardIndex === null || !this.containerEl) return;

        const focusedCard = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        this.cardContainer.centerCard(focusedCard, !immediate);
    }

    // 포커스된 카드 열기
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

    // 활성 카드의 인덱스 찾기
    private findActiveCardIndex(): number {
        if (!this.containerEl) return -1;
        return Array.from(this.containerEl.children).findIndex(
            child => child instanceof HTMLElement && child.classList?.contains('card-navigator-active')
        );
    }

    // 첫 번째 보이는 카드의 인덱스 찾기
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

    // 카드가 컨테이너 내에서 보이는지 확인
    private isCardVisible(cardRect: DOMRect, containerRect: DOMRect): boolean {
        return (
            cardRect.top >= containerRect.top &&
            cardRect.bottom <= containerRect.bottom &&
            cardRect.left >= containerRect.left &&
            cardRect.right <= containerRect.right
        );
    }

    // DOM 변경 감지를 위한 MutationObserver 설정
    private setupMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        this.mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && this.isFocused) {
                    requestAnimationFrame(() => {
                        this.updateFocusedCardImmediate();
                    });
                    break;
                }
            }
        });

        if (this.containerEl) {
            this.mutationObserver.observe(this.containerEl, {
                childList: true,
                subtree: false
            });
        }
    }
    //#endregion
}
