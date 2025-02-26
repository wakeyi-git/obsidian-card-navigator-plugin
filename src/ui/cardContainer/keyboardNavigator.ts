import { Menu, MenuItem, debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardContainer } from './cardContainer';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { GridLayout } from 'layouts/gridLayout';
import { MasonryLayout } from 'layouts/masonryLayout';
import { t } from 'i18next';

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
    
        // 활성 카드 인덱스 찾기
        const activeCardIndex = this.findActiveCardIndex();
        
        if (activeCardIndex !== -1) {
            // 활성 카드가 있으면 해당 카드에 포커스 설정
            this.focusedCardIndex = activeCardIndex;
        } else {
            // 활성 카드가 없으면 첫 번째 보이는 카드에 포커스 설정
            const firstVisibleCardIndex = this.findFirstVisibleCardIndex();
            if (firstVisibleCardIndex !== null) {
                this.focusedCardIndex = firstVisibleCardIndex;
            } else {
                this.focusedCardIndex = 0;
            }
        }

        this.updateFocusedCardImmediate();
        
        // 포커스된 카드로 스크롤
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

    // 블러 이벤트 처리
    private handleBlur = () => {
        if (!this.containerEl) return;
        this.isFocused = false;
        this.updateFocusedCardImmediate();
    };
    //#endregion

    //#region 포커스 이동
    // 포커스 이동
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
        this.updateFocusedCardImmediate();
        this.scrollToFocusedCard();
    }

    // 페이지 단위 포커스 이동
    private moveFocusPage(direction: number) {
        if (this.focusedCardIndex === null || !this.containerEl) return;

        const totalCards = this.containerEl.children.length;
        const layoutStrategy = this.cardContainer.getLayoutStrategy();
        const isVertical = layoutStrategy.getScrollDirection() === 'vertical';
        
        // 그리드 또는 메이슨리 레이아웃인 경우
        if (layoutStrategy instanceof GridLayout || layoutStrategy instanceof MasonryLayout) {
            const columns = layoutStrategy.getColumnsCount();
            
            // 현재 행과 열 계산
            const currentRow = Math.floor(this.focusedCardIndex / columns);
            const currentCol = this.focusedCardIndex % columns;
            
            // 컨테이너와 카드의 크기 정보 가져오기
            const containerRect = this.containerEl.getBoundingClientRect();
            const cardEl = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
            if (!cardEl) return;
            
            const cardRect = cardEl.getBoundingClientRect();
            
            let newIndex: number;
            
            // 수직 스크롤 방향인 경우 (일반적인 그리드)
            if (isVertical) {
                // 뷰포트에 표시되는 대략적인 행 수 계산
                const cardHeight = cardRect.height;
                const containerHeight = containerRect.height;
                const rowsPerView = Math.max(1, Math.floor(containerHeight / cardHeight));
                
                // 이동할 행 수 계산 (최소 1행)
                const rowsToMove = Math.max(1, rowsPerView - 1);
                
                // 새 행 계산
                const newRow = direction > 0 
                    ? Math.min(Math.ceil(totalCards / columns) - 1, currentRow + rowsToMove)
                    : Math.max(0, currentRow - rowsToMove);
                
                // 새 인덱스 계산
                newIndex = newRow * columns + currentCol;
            } 
            // 수평 스크롤 방향인 경우
            else {
                // 뷰포트에 표시되는 대략적인 열 수 계산
                const cardWidth = cardRect.width;
                const containerWidth = containerRect.width;
                const colsPerView = Math.max(1, Math.floor(containerWidth / cardWidth));
                
                // 이동할 열 수 계산 (최소 1열)
                const colsToMove = Math.max(1, colsPerView - 1);
                
                // 새 열 계산
                const newCol = direction > 0 
                    ? Math.min(columns - 1, currentCol + colsToMove)
                    : Math.max(0, currentCol - colsToMove);
                
                // 새 인덱스 계산
                newIndex = currentRow * columns + newCol;
                
                // 열 이동으로 인덱스 범위를 벗어나면 행도 조정
                if (newIndex >= totalCards) {
                    // 다음 행의 첫 번째 열로 이동
                    if (direction > 0 && currentRow < Math.ceil(totalCards / columns) - 1) {
                        newIndex = (currentRow + 1) * columns;
                    } 
                    // 마지막 카드로 이동
                    else {
                        newIndex = totalCards - 1;
                    }
                }
            }
            
            // 마지막 행에서는 열 수가 적을 수 있으므로 조정
            newIndex = Math.min(totalCards - 1, newIndex);
            
            this.focusedCardIndex = this.ensureValidIndex(newIndex);
        } 
        // 리스트 레이아웃 또는 기타 레이아웃인 경우
        else {
            // 컨테이너와 카드의 크기 정보 가져오기
            const containerRect = this.containerEl.getBoundingClientRect();
            const cardEl = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
            if (!cardEl) return;
            
            const cardRect = cardEl.getBoundingClientRect();
            
            let cardsToMove: number;
            
            // 뷰포트에 표시되는 카드 수 계산
            if (isVertical) {
                const cardHeight = cardRect.height;
                const containerHeight = containerRect.height;
                cardsToMove = Math.max(1, Math.floor(containerHeight / cardHeight) - 1);
            } else {
                const cardWidth = cardRect.width;
                const containerWidth = containerRect.width;
                cardsToMove = Math.max(1, Math.floor(containerWidth / cardWidth) - 1);
            }
            
            // 설정된 cardsPerView와 계산된 값 중 더 작은 값 사용
            const cardsPerView = this.plugin.settings.cardsPerView;
            cardsToMove = Math.min(cardsToMove, cardsPerView);
            
            // 새 인덱스 계산
            const newIndex = direction > 0
                ? Math.min(totalCards - 1, this.focusedCardIndex + cardsToMove)
                : Math.max(0, this.focusedCardIndex - cardsToMove);
            
            this.focusedCardIndex = this.ensureValidIndex(newIndex);
        }
        
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
    //#endregion

    //#region 유틸리티 메서드
    // 그리드 레이아웃의 인덱스 계산
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
        
        // 모든 카드 요소를 배열로 변환하여 활성 카드 찾기
        const cards = Array.from(this.containerEl.children);
        
        // 'card-navigator-active' 클래스를 가진 카드 찾기
        const activeIndex = cards.findIndex(
            child => child instanceof HTMLElement && 
            child.classList.contains('card-navigator-active')
        );
        
        // 활성 카드가 없으면 'active' 클래스를 가진 카드 찾기 (대체 방법)
        if (activeIndex === -1) {
            return cards.findIndex(
                child => child instanceof HTMLElement && 
                child.classList.contains('active')
            );
        }
        
        return activeIndex;
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

    // 레이아웃 업데이트
    public updateLayout(_layoutStrategy: LayoutStrategy) {
        // TODO: Implement layout update logic
    }
    //#endregion
}
