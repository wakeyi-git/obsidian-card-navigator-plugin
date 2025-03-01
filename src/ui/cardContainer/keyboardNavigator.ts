import { Menu, MenuItem, debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { t } from 'i18next';
import { LayoutManager } from 'layouts/layoutManager';
import { TFile } from 'obsidian';

// 키보드 내비게이션에 필요한 인터페이스 정의
export interface KeyboardNavigationHost {
    getLayoutManager(): LayoutManager;
    getContainerElement(): HTMLElement;
    getFileFromCard(cardElement: HTMLElement): TFile | null;
    centerCard(cardElement: HTMLElement, smooth: boolean): void;
    openFile(file: TFile): void;
}

// KeyboardNavigator class to handle keyboard navigation for the card container
export class KeyboardNavigator {
    //#region 클래스 속성
    private focusedCardIndex: number | null = null;
    private previousFocusedCardIndex: number | null = null;
    private isFocused = false;
    private mutationObserver: MutationObserver | null = null;
    private containerEl: HTMLElement;
    private plugin: CardNavigatorPlugin;
    private navigationHost: KeyboardNavigationHost;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 키보드 네비게이터 초기화
    constructor(
        plugin: CardNavigatorPlugin,
        navigationHost: KeyboardNavigationHost,
        containerEl: HTMLElement
    ) {
        this.plugin = plugin;
        this.navigationHost = navigationHost;
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
        const layoutManager = this.getLayoutManager();
        const isVertical = layoutManager.getLayoutDirection() === 'vertical';
        const columnsCount = layoutManager.getColumns();

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

        const layoutManager = this.getLayoutManager();
        const columnsCount = layoutManager.getColumns();
        const rowsCount = Math.ceil(totalCards / columnsCount);

        // 현재 행과 열 계산
        const currentRow = Math.floor(this.focusedCardIndex / columnsCount);
        const currentCol = this.focusedCardIndex % columnsCount;

        let rowDelta = 0;
        let colDelta = 0;

        switch (direction) {
            case 'up':
                rowDelta = -1;
                break;
            case 'down':
                rowDelta = 1;
                break;
            case 'left':
                colDelta = -1;
                break;
            case 'right':
                colDelta = 1;
                break;
        }

        this.focusedCardIndex = this.calculateGridIndex(rowDelta, colDelta, totalCards);
    }

    // 리스트 레이아웃에서 포커스 이동
    private moveInList(direction: 'up' | 'down' | 'left' | 'right', totalCards: number, isVertical: boolean): void {
        if (this.focusedCardIndex === null) return;

        let delta = 0;

        if (isVertical) {
            // 세로 레이아웃
            switch (direction) {
                case 'up':
                    delta = -1;
                    break;
                case 'down':
                    delta = 1;
                    break;
                // 가로 방향 키는 무시
                case 'left':
                case 'right':
                    return;
            }
        } else {
            // 가로 레이아웃
            switch (direction) {
                case 'left':
                    delta = -1;
                    break;
                case 'right':
                    delta = 1;
                    break;
                // 세로 방향 키는 무시
                case 'up':
                case 'down':
                    return;
            }
        }

        this.focusedCardIndex = this.calculateListIndex(0, delta, totalCards);
    }

    // 그리드 인덱스 계산
    private calculateGridIndex(rowDelta: number, colDelta: number, totalCards: number): number {
        if (this.focusedCardIndex === null) return 0;

        const layoutManager = this.getLayoutManager();
        const columnsCount = layoutManager.getColumns();
        const rowsCount = Math.ceil(totalCards / columnsCount);

        // 현재 행과 열 계산
        const currentRow = Math.floor(this.focusedCardIndex / columnsCount);
        const currentCol = this.focusedCardIndex % columnsCount;

        // 새 행과 열 계산
        let newRow = currentRow + rowDelta;
        let newCol = currentCol + colDelta;

        // 범위 검사
        newRow = Math.max(0, Math.min(rowsCount - 1, newRow));
        newCol = Math.max(0, Math.min(columnsCount - 1, newCol));

        // 새 인덱스 계산
        let newIndex = newRow * columnsCount + newCol;

        // 마지막 행의 경우 열 범위 추가 검사
        if (newRow === rowsCount - 1) {
            const lastRowCols = totalCards % columnsCount || columnsCount;
            if (newCol >= lastRowCols) {
                newCol = lastRowCols - 1;
                newIndex = newRow * columnsCount + newCol;
            }
        }

        // 유효 범위 확인
        return this.ensureValidIndex(newIndex);
    }

    // 리스트 인덱스 계산
    private calculateListIndex(rowDelta: number, colDelta: number, totalCards: number): number {
        if (this.focusedCardIndex === null) return 0;
        const newIndex = this.focusedCardIndex + colDelta + rowDelta;
        return this.ensureValidIndex(newIndex);
    }

    // 유효한 인덱스 확인
    private ensureValidIndex(index: number): number {
        const totalCards = this.containerEl.children.length;
        return Math.max(0, Math.min(totalCards - 1, index));
    }

    // 포커스된 카드로 스크롤
    private scrollToFocusedCard(immediate = false) {
        if (this.focusedCardIndex === null) return;
        
        const cardElement = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        if (cardElement) {
            // immediate 파라미터를 활용하여 부드러운 스크롤 여부 결정
            this.navigationHost.centerCard(cardElement, !immediate);
        }
    }

    // 포커스된 카드 열기
    private openFocusedCard() {
        if (this.focusedCardIndex === null) return;
        const cardElement = this.containerEl.children[this.focusedCardIndex] as HTMLElement;
        if (cardElement) {
            const file = this.getFileFromCard(cardElement);
            if (file) {
                this.openFile(file);
            }
        }
    }
    //#endregion

    //#region 유틸리티 메서드
    // 활성 카드 인덱스 찾기
    private findActiveCardIndex(): number {
        const activeCard = this.containerEl.querySelector('.card-active');
        if (activeCard) {
            return Array.from(this.containerEl.children).indexOf(activeCard);
        }
        return -1;
    }

    // 첫 번째 보이는 카드 인덱스 찾기
    private findFirstVisibleCardIndex(): number | null {
        const containerRect = this.containerEl.getBoundingClientRect();
        
        for (let i = 0; i < this.containerEl.children.length; i++) {
            const cardElement = this.containerEl.children[i] as HTMLElement;
            const cardRect = cardElement.getBoundingClientRect();
            
            if (this.isCardVisible(cardRect, containerRect)) {
                return i;
            }
        }
        
        return null;
    }

    // 카드가 보이는지 확인
    private isCardVisible(cardRect: DOMRect, containerRect: DOMRect): boolean {
        const isVisible = (
            cardRect.top < containerRect.bottom &&
            cardRect.bottom > containerRect.top &&
            cardRect.left < containerRect.right &&
            cardRect.right > containerRect.left
        );
        
        return isVisible;
    }

    // 뮤테이션 옵저버 설정
    private setupMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        this.mutationObserver = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && mutation.attributeName === 'class')) {
                    needsUpdate = true;
                    break;
                }
            }
            
            if (needsUpdate) {
                this.updateFocusedCard();
            }
        });
        
        this.mutationObserver.observe(this.containerEl, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // 레이아웃 매니저 가져오기
    private getLayoutManager(): LayoutManager {
        return this.navigationHost.getLayoutManager();
    }

    // 카드에서 파일 가져오기
    private getFileFromCard(cardElement: HTMLElement): TFile | null {
        return this.navigationHost.getFileFromCard(cardElement);
    }

    // 파일 열기
    private openFile(file: TFile): void {
        this.navigationHost.openFile(file);
    }
    //#endregion
}
