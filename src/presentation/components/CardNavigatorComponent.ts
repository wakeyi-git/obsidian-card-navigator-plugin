import { CardNavigatorViewModel } from '../viewModels/CardNavigatorViewModel';
import { CardSetComponent } from './CardSetComponent';
import { CreateCardSetModal } from './modals/CreateCardSetModal';
import { CreateCardSetDto } from '../../application/dtos/CardSetDto';
import { App, TFile } from 'obsidian';

/**
 * 카드 네비게이터 컴포넌트
 */
export class CardNavigatorComponent {
  private element: HTMLElement;
  private cardSetComponent: CardSetComponent | null = null;
  private selectedCardId: string | null = null;

  constructor(
    private readonly viewModel: CardNavigatorViewModel,
    private readonly app: App
  ) {
    this.element = this.createCardNavigatorElement();
    this.setupEventListeners();
  }

  /**
   * 카드 네비게이터 요소를 생성합니다.
   */
  private createCardNavigatorElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'card-navigator';

    // 툴바
    const toolbar = this.createToolbar();
    container.appendChild(toolbar);

    // 카드셋 컨테이너
    const cardSetContainer = document.createElement('div');
    cardSetContainer.className = 'card-navigator-content';
    container.appendChild(cardSetContainer);

    return container;
  }

  /**
   * 툴바를 생성합니다.
   */
  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'card-navigator-toolbar';

    // 카드셋 선택
    const cardSetSelect = document.createElement('select');
    cardSetSelect.className = 'card-navigator-select';
    // TODO: 카드셋 목록 로드
    toolbar.appendChild(cardSetSelect);

    // 새 카드셋 버튼
    const newCardSetButton = document.createElement('button');
    newCardSetButton.className = 'card-navigator-button';
    newCardSetButton.textContent = '새 카드셋';
    toolbar.appendChild(newCardSetButton);

    return toolbar;
  }

  /**
   * 이벤트 리스너를 설정합니다.
   */
  private setupEventListeners(): void {
    // 카드셋 선택 이벤트
    const cardSetSelect = this.element.querySelector('.card-navigator-select') as HTMLSelectElement;
    if (cardSetSelect) {
      cardSetSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.handleCardSetSelect(target.value);
      });
    }

    // 새 카드셋 버튼 이벤트
    const newCardSetButton = this.element.querySelector('.card-navigator-button');
    if (newCardSetButton) {
      newCardSetButton.addEventListener('click', () => {
        this.handleNewCardSet();
      });
    }
  }

  /**
   * 카드셋 선택을 처리합니다.
   */
  private handleCardSetSelect(cardSetId: string): void {
    this.viewModel.selectCardSet(cardSetId);
    this.updateCardSetComponent();
  }

  /**
   * 새 카드셋 생성을 처리합니다.
   */
  private handleNewCardSet(): void {
    const modal = new CreateCardSetModal(this.viewModel.getApp(), async (dto: CreateCardSetDto) => {
      const cardSet = await this.viewModel.createCardSet(dto);
      this.viewModel.selectCardSet(cardSet.getId());
      this.updateCardSetComponent();
      this.updateCardSetList();
    });
    modal.open();
  }

  /**
   * 카드 선택을 처리합니다.
   */
  private handleCardSelect(cardId: string): void {
    // 이전 선택 해제
    if (this.selectedCardId) {
      const previousCard = this.element.querySelector(`[data-card-id="${this.selectedCardId}"]`);
      if (previousCard) {
        previousCard.classList.remove('selected');
      }
    }

    // 새로운 카드 선택
    const selectedCard = this.element.querySelector(`[data-card-id="${cardId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
      this.selectedCardId = cardId;
    }
  }

  /**
   * 카드 열기를 처리합니다.
   */
  private handleCardOpen(cardId: string): void {
    const currentCardSet = this.viewModel.getCurrentCardSet();
    if (!currentCardSet) return;

    const card = currentCardSet.getCardById(cardId);
    if (!card) return;

    // Obsidian에서 파일 열기
    const file = this.app.vault.getAbstractFileByPath(card.getFilePath());
    if (file && file instanceof TFile) {
      this.app.workspace.getLeaf().openFile(file);
    }
  }

  /**
   * 카드셋 컴포넌트를 업데이트합니다.
   */
  private updateCardSetComponent(): void {
    const cardSetContainer = this.element.querySelector('.card-navigator-content');
    if (!cardSetContainer) return;

    // 이전 카드셋 컴포넌트 제거
    if (this.cardSetComponent) {
      cardSetContainer.removeChild(this.cardSetComponent.getElement());
      this.cardSetComponent = null;
    }

    // 현재 카드셋이 있으면 새 컴포넌트 생성
    const currentCardSet = this.viewModel.getCurrentCardSet();
    if (currentCardSet) {
      this.cardSetComponent = new CardSetComponent(
        currentCardSet,
        this.handleCardSelect.bind(this),
        this.handleCardOpen.bind(this)
      );
      cardSetContainer.appendChild(this.cardSetComponent.getElement());
    }
  }

  /**
   * 카드 네비게이터 요소를 반환합니다.
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 카드 네비게이터를 업데이트합니다.
   */
  update(): void {
    // 카드셋 목록 업데이트
    this.updateCardSetList();

    // 현재 카드셋 컴포넌트 업데이트
    if (this.cardSetComponent) {
      this.cardSetComponent.update();
    }
  }

  /**
   * 카드셋 목록을 업데이트합니다.
   */
  private updateCardSetList(): void {
    const cardSetSelect = this.element.querySelector('.card-navigator-select') as HTMLSelectElement;
    if (!cardSetSelect) return;

    // 현재 선택된 값 저장
    const currentValue = cardSetSelect.value;

    // 옵션 초기화
    cardSetSelect.innerHTML = '';

    // 카드셋 목록 추가
    this.viewModel.getAllCardSets().forEach(cardSet => {
      const option = document.createElement('option');
      option.value = cardSet.getId();
      option.textContent = `${cardSet.getType()} - ${cardSet.getSource()}`;
      cardSetSelect.appendChild(option);
    });

    // 이전 선택값 복원
    if (currentValue) {
      cardSetSelect.value = currentValue;
    }
  }
} 