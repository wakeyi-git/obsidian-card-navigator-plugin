import { CardNavigatorViewModel } from '../viewModels/CardNavigatorViewModel';
import { RefreshType } from '../../domain/models/types';
import { CardComponent } from './CardComponent';
import { Card } from '../../domain/models/Card';
import { CardSetViewModel } from '../viewModels/CardSetViewModel';

/**
 * 카드 세트 컴포넌트
 */
export class CardSetComponent {
    private cardComponents: Map<string, CardComponent> = new Map();
    private container: HTMLElement | null = null;
    private isVertical: boolean = true;
    private scrollAmount: number = 100;

    constructor(
        private readonly viewModel: CardNavigatorViewModel
    ) {}

    /**
     * 컴포넌트를 초기화합니다.
     */
    async initialize(container: HTMLElement): Promise<void> {
        // 컨테이너 초기화
        this.container = container;
        this.container.empty();
        this.container.className = 'card-navigator-container';
        this.container.classList.add(this.isVertical ? 'vertical' : 'horizontal');

        // 스크롤 컨테이너 설정
        this.setupScrollContainer();

        // 초기 카드 표시
        const currentCardSet = this.viewModel.getCurrentCardSet();
        if (currentCardSet) {
            const cards = currentCardSet.getCards();
            if (cards && cards.length > 0) {
                await this.displayCards(cards);
            } else {
                console.warn('[CardNavigator] 표시할 카드가 없습니다.');
            }
        } else {
            console.warn('[CardNavigator] 현재 카드셋이 없습니다.');
        }
    }

    /**
     * 스크롤 컨테이너를 설정합니다.
     */
    private setupScrollContainer(): void {
        if (!this.container) return;

        // 스크롤 방향 설정
        this.isVertical = this.container.classList.contains('vertical');
        
        // 스크롤 이벤트 리스너 설정
        this.container.addEventListener('wheel', (e: WheelEvent) => {
            if (this.isVertical) {
                this.container!.scrollTop += e.deltaY;
            } else {
                this.container!.scrollLeft += e.deltaX;
            }
            e.preventDefault();
        }, { passive: false });
    }

    /**
     * 위로 스크롤합니다.
     */
    public scrollUp(amount: number = this.scrollAmount): void {
        if (!this.container) return;
        this.container.scrollTop -= amount;
    }

    /**
     * 아래로 스크롤합니다.
     */
    public scrollDown(amount: number = this.scrollAmount): void {
        if (!this.container) return;
        this.container.scrollTop += amount;
    }

    /**
     * 왼쪽으로 스크롤합니다.
     */
    public scrollLeft(amount: number = this.scrollAmount): void {
        if (!this.container) return;
        this.container.scrollLeft -= amount;
    }

    /**
     * 오른쪽으로 스크롤합니다.
     */
    public scrollRight(amount: number = this.scrollAmount): void {
        if (!this.container) return;
        this.container.scrollLeft += amount;
    }

    /**
     * 스크롤 방향을 가져옵니다.
     */
    public getIsVertical(): boolean {
        return this.isVertical;
    }

    /**
     * 스크롤 방향을 설정합니다.
     */
    public setIsVertical(isVertical: boolean): void {
        this.isVertical = isVertical;
        if (this.container) {
            this.container.classList.toggle('vertical', isVertical);
            this.container.classList.toggle('horizontal', !isVertical);
        }
    }

    /**
     * 스크롤 양을 가져옵니다.
     */
    public getScrollAmount(): number {
        return this.scrollAmount;
    }

    /**
     * 스크롤 양을 설정합니다.
     */
    public setScrollAmount(amount: number): void {
        this.scrollAmount = amount;
    }

    /**
     * 컴포넌트를 정리합니다.
     */
    dispose(): void {
        this.cardComponents.forEach(component => component.dispose());
        this.cardComponents.clear();
        this.container = null;
    }

    /**
     * 컴포넌트를 새로고침합니다.
     */
    async refresh(type: RefreshType): Promise<void> {
        if (!this.container) {
            console.warn('[CardNavigator] 컨테이너가 초기화되지 않았습니다.');
            return;
        }

        try {
            const currentCardSet = this.viewModel.getCurrentCardSet();
            if (!currentCardSet) {
                console.warn('[CardNavigator] 현재 카드셋이 없습니다.');
                return;
            }

            const cards = currentCardSet.getCards();
            if (!cards || cards.length === 0) {
                console.warn('[CardNavigator] 표시할 카드가 없습니다.');
                return;
            }

            // 카드 표시
            await this.displayCards(cards);

            // 레이아웃 업데이트
            this.updateLayout();
        } catch (error) {
            console.error('[CardNavigator] 컴포넌트 새로고침 실패:', error);
        }
    }

    /**
     * 컴포넌트를 렌더링합니다.
     */
    private render(): void {
        if (!this.container) return;

        // 기존 카드 컴포넌트 제거
        this.cardComponents.forEach(component => component.dispose());
        this.cardComponents.clear();

        // 새로운 카드 컴포넌트 생성
        const cardSet = this.viewModel.getCurrentCardSet();
        if (!cardSet) return;

        const cards = cardSet.getCards();
        cards.forEach((card: Card) => {
            const component = new CardComponent(card, this.viewModel);
            component.initialize(this.container!);
            this.cardComponents.set(card.getId(), component);
        });
    }

    /**
     * 컴포넌트의 컨테이너 요소를 가져옵니다.
     */
    getElement(): HTMLElement | null {
        return this.container;
    }

    /**
     * 이벤트 리스너를 설정합니다.
     */
    private setupEventListeners(): void {
        // TODO: 이벤트 리스너 구현
    }

    /**
     * 카드 컨테이너를 가져옵니다.
     */
    public getCardContainer(): HTMLElement | null {
        return this.container;
    }

    /**
     * 카드 네비게이터에 포커스를 줍니다.
     */
    public focusCardNavigator(): void {
        const firstCard = this.container?.querySelector('.card-navigator-card');
        if (firstCard instanceof HTMLElement) {
            firstCard.focus();
        }
    }

    /**
     * 카드를 표시합니다.
     */
    async displayCards(cards: Card[]): Promise<void> {
        if (!this.container) {
            console.warn('[CardNavigator] 컨테이너가 초기화되지 않았습니다.');
            return;
        }

        // 기존 카드 컴포넌트 정리
        this.cardComponents.forEach(component => {
            component.dispose();
        });
        this.cardComponents.clear();

        // 컨테이너 비우기
        this.container.empty();

        // 새 카드 컴포넌트 생성 및 표시
        for (const card of cards) {
            const cardComponent = new CardComponent(card, this.viewModel);
            await cardComponent.initialize(this.container);
            this.cardComponents.set(card.getId(), cardComponent);
        }

        // 레이아웃 업데이트
        this.updateLayout();
    }

    /**
     * 레이아웃을 업데이트합니다.
     */
    private updateLayout(): void {
        if (!this.container) return;

        // 레이아웃 클래스 설정
        this.container.className = 'card-navigator-container';
        this.container.classList.add(this.isVertical ? 'vertical' : 'horizontal');

        // 카드 스타일 적용
        this.cardComponents.forEach(component => {
            // 카드 컴포넌트는 initialize 메서드에서 이미 스타일이 적용됨
        });
    }
} 