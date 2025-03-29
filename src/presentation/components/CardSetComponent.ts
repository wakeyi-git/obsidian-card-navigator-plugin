import { CardSetViewModel } from '../viewModels/CardSetViewModel';
import { CardComponent } from './CardComponent';
import { CardSort, CardFilter, CardPosition } from '../../domain/models/types';

/**
 * 카드셋 컴포넌트
 */
export class CardSetComponent {
  private element: HTMLElement;
  private cardComponents: Map<string, CardComponent> = new Map();
  private selectedCardId: string | null = null;
  private currentFilter: CardFilter | null = null;
  private currentSort: CardSort = { criterion: 'fileName', order: 'asc' };

  constructor(
    private readonly viewModel: CardSetViewModel,
    private readonly onCardSelect: (cardId: string) => void,
    private readonly onCardOpen: (cardId: string) => void
  ) {
    this.element = this.createCardSetElement();
    this.initializeCards();
    this.setupDragAndDrop();
  }

  /**
   * 카드셋 요소를 생성합니다.
   */
  private createCardSetElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'card-navigator-container';
    container.dataset.cardSetId = this.viewModel.getId();

    // 카드셋 헤더
    const header = this.createHeader();
    container.appendChild(header);

    // 카드 컨테이너
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-navigator-cards';
    container.appendChild(cardContainer);

    return container;
  }

  /**
   * 헤더를 생성합니다.
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'card-navigator-header';

    // 카드셋 정보
    const info = document.createElement('div');
    info.className = 'card-navigator-info';
    info.innerHTML = `
      <h2>${this.viewModel.getType()}</h2>
      <p>${this.viewModel.getSource()}</p>
    `;
    header.appendChild(info);

    // 필터 및 정렬 컨트롤
    const controls = document.createElement('div');
    controls.className = 'card-navigator-controls';
    // TODO: 필터 및 정렬 컨트롤 구현
    header.appendChild(controls);

    return header;
  }

  /**
   * 드래그 앤 드롭을 설정합니다.
   */
  private setupDragAndDrop(): void {
    const cardContainer = this.element.querySelector('.card-navigator-cards');
    if (!cardContainer) return;

    let draggedCard: HTMLElement | null = null;
    let draggedCardId: string | null = null;

    cardContainer.addEventListener('dragstart', (e: Event) => {
      const card = (e.target as HTMLElement).closest('.card-navigator-card');
      if (card) {
        draggedCard = card as HTMLElement;
        draggedCardId = card.getAttribute('data-card-id');
        card.classList.add('dragging');
      }
    });

    cardContainer.addEventListener('dragend', (e: Event) => {
      if (draggedCard) {
        draggedCard.classList.remove('dragging');
        draggedCard = null;
        draggedCardId = null;
      }
    });

    cardContainer.addEventListener('dragover', (e: Event) => {
      e.preventDefault();
      if (!draggedCard) return;

      const card = (e.target as HTMLElement).closest('.card-navigator-card');
      if (!card || card === draggedCard) return;

      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const midX = rect.left + rect.width / 2;

      if ((e as DragEvent).clientY < midY) {
        cardContainer.insertBefore(draggedCard, card);
      } else if ((e as DragEvent).clientX < midX) {
        cardContainer.insertBefore(draggedCard, card);
      } else {
        cardContainer.insertBefore(draggedCard, card.nextSibling);
      }
    });

    cardContainer.addEventListener('drop', async (e: Event) => {
      e.preventDefault();
      if (!draggedCardId) return;

      const cards = Array.from(cardContainer.children);
      const newIndex = cards.indexOf(draggedCard!);
      const oldIndex = Array.from(cards).findIndex(card => 
        card.getAttribute('data-card-id') === draggedCardId
      );

      if (newIndex !== oldIndex) {
        const position: CardPosition = {
          left: newIndex * 100,
          top: 0,
          width: 300, // 기본 카드 너비
          height: 200  // 기본 카드 높이
        };
        await this.viewModel.saveCardPosition(draggedCardId, position);
      }
    });
  }

  /**
   * 카드를 초기화합니다.
   */
  private initializeCards(): void {
    const cardContainer = this.element.querySelector('.card-navigator-cards');
    if (!cardContainer) return;

    this.viewModel.getCardViewModels().forEach(cardViewModel => {
      const cardComponent = new CardComponent(
        cardViewModel,
        this.handleCardSelect.bind(this),
        this.handleCardOpen.bind(this)
      );
      this.cardComponents.set(cardViewModel.getId(), cardComponent);
      
      // 저장된 위치 적용
      const position = this.viewModel.loadCardPosition(cardViewModel.getId());
      if (position) {
        const cardElement = cardComponent.getElement();
        cardElement.style.position = 'absolute';
        cardElement.style.left = `${position.left}px`;
        cardElement.style.top = `${position.top}px`;
        cardElement.style.width = `${position.width}px`;
        cardElement.style.height = `${position.height}px`;
      }
      
      cardContainer.appendChild(cardComponent.getElement());
    });
  }

  /**
   * 카드 선택을 처리합니다.
   */
  private handleCardSelect(cardId: string): void {
    // 이전 선택 해제
    if (this.selectedCardId) {
      const previousCard = this.cardComponents.get(this.selectedCardId);
      if (previousCard) {
        previousCard.setSelected(false);
      }
    }

    // 새로운 카드 선택
    const selectedCard = this.cardComponents.get(cardId);
    if (selectedCard) {
      selectedCard.setSelected(true);
      this.selectedCardId = cardId;
      this.onCardSelect(cardId);
    }
  }

  /**
   * 카드 열기를 처리합니다.
   */
  private handleCardOpen(cardId: string): void {
    this.onCardOpen(cardId);
  }

  /**
   * 카드셋 요소를 반환합니다.
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 카드셋을 업데이트합니다.
   */
  async update(): Promise<void> {
    // 카드 컴포넌트 업데이트
    for (const [cardId, component] of this.cardComponents) {
      await component.updateContent();
      const style = this.viewModel.getCardStyle(cardId);
      component.updateStyle(style);
    }

    // 필터 및 정렬 적용
    this.applyFilterAndSort();
  }

  /**
   * 필터 및 정렬을 적용합니다.
   */
  private applyFilterAndSort(): void {
    const cardContainer = this.element.querySelector('.card-navigator-cards');
    if (!cardContainer) return;

    // 카드 요소들을 배열로 변환
    const cards = Array.from(cardContainer.children);

    // 필터 적용
    if (this.currentFilter) {
      cards.forEach(card => {
        const cardId = card.getAttribute('data-card-id');
        if (!cardId) return;

        const cardComponent = this.cardComponents.get(cardId);
        if (!cardComponent) return;

        const isVisible = this.applyFilter(cardComponent);
        card.classList.toggle('hidden', !isVisible);
      });
    }

    // 정렬 적용
    cards.sort((a, b) => {
      const cardA = this.cardComponents.get(a.getAttribute('data-card-id') || '');
      const cardB = this.cardComponents.get(b.getAttribute('data-card-id') || '');
      if (!cardA || !cardB) return 0;

      return this.compareCards(cardA, cardB);
    });

    // 정렬된 카드 다시 추가
    cards.forEach(card => cardContainer.appendChild(card));
  }

  /**
   * 필터를 적용합니다.
   */
  private applyFilter(cardComponent: CardComponent): boolean {
    if (!this.currentFilter) return true;

    const content = cardComponent.getContent();
    const searchText = this.currentFilter.criteria.value.toLowerCase();

    // 제목 검색
    if (this.currentFilter.type === 'search' && 
        cardComponent.getTitle().toLowerCase().includes(searchText)) {
      return true;
    }

    // 내용 검색
    if (this.currentFilter.type === 'search') {
      for (const section of content.body) {
        if (section.type === 'text' && 
            section.content.toLowerCase().includes(searchText)) {
          return true;
        }
      }
    }

    // 태그 검색
    if (this.currentFilter.type === 'tag') {
      for (const section of content.footer) {
        if (section.type === 'text' && 
            section.content.startsWith('#') && 
            section.content.toLowerCase().includes(searchText)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 카드를 비교합니다.
   */
  private compareCards(a: CardComponent, b: CardComponent): number {
    switch (this.currentSort.criterion) {
      case 'fileName':
        return a.getTitle().localeCompare(b.getTitle());
      case 'createDate':
        return a.getCreatedTime() - b.getCreatedTime();
      case 'updateDate':
        return a.getModifiedTime() - b.getModifiedTime();
      case 'property':
        return this.comparePriority(a, b);
      default:
        return 0;
    }
  }

  /**
   * 우선순위를 비교합니다.
   */
  private comparePriority(a: CardComponent, b: CardComponent): number {
    const priorityTags = ['#urgent', '#important', '#high', '#medium', '#low'];
    
    const getPriority = (card: CardComponent): number => {
      const content = card.getContent();
      for (const section of content.footer) {
        if (section.type === 'text' && section.content.startsWith('#')) {
          const tag = section.content.toLowerCase();
          const index = priorityTags.indexOf(tag);
          if (index !== -1) return index;
        }
      }
      return priorityTags.length; // 우선순위 태그가 없는 경우
    };

    return getPriority(a) - getPriority(b);
  }

  /**
   * 필터를 설정합니다.
   */
  setFilter(filter: CardFilter | null): void {
    this.currentFilter = filter;
    this.applyFilterAndSort();
  }

  /**
   * 정렬 방식을 설정합니다.
   */
  setSort(sort: CardSort): void {
    this.currentSort = sort;
    this.applyFilterAndSort();
  }

  /**
   * 카드 내용을 업데이트합니다.
   */
  updateCardContent(cardId: string): void {
    const cardComponent = this.cardComponents.get(cardId);
    if (cardComponent) {
      cardComponent.updateContent();
    }
  }

  /**
   * 카드 스타일을 업데이트합니다.
   */
  updateCardStyle(cardId: string): void {
    const cardComponent = this.cardComponents.get(cardId);
    if (cardComponent) {
      const style = this.viewModel.getCardStyle(cardId);
      cardComponent.updateStyle(style);
    }
  }
} 