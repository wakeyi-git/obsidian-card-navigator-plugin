import { CardNavigatorViewModel } from '../viewModels/CardNavigatorViewModel';
import { RefreshType } from '../../domain/models/types';
import { CardSetComponent } from './CardSetComponent';
import { CreateCardSetModal } from './modals/CreateCardSetModal';
import { CreateCardSetDto } from '../../application/dtos/CardSetDto';
import { App, TFile } from 'obsidian';

/**
 * 카드 네비게이터 컴포넌트
 */
export class CardNavigatorComponent {
  private cardSetComponent: CardSetComponent | null = null;
  private container: HTMLElement | null = null;
  private selectedCardId: string | null = null;

  constructor(
    private readonly viewModel: CardNavigatorViewModel,
    private readonly app: App
  ) {}

  /**
   * 컴포넌트를 초기화합니다.
   */
  async initialize(container: HTMLElement): Promise<void> {
    // 컨테이너 초기화
    this.container = container;
    this.container.empty();
    this.container.className = 'card-navigator';

    // 카드셋 컴포넌트 초기화
    this.cardSetComponent = new CardSetComponent(this.viewModel);
    await this.cardSetComponent.initialize(this.container);

    // 초기 데이터 로드
    await this.loadInitialData();
  }

  /**
   * 컴포넌트를 정리합니다.
   */
  async dispose(): Promise<void> {
    if (this.cardSetComponent) {
      await this.cardSetComponent.dispose();
    }
    this.container = null;
  }

  /**
   * 컴포넌트를 새로고침합니다.
   */
  async refresh(types: RefreshType[]): Promise<void> {
    if (!this.container || !this.cardSetComponent) return;

    // 가장 높은 우선순위의 리프레시 타입 결정
    const type = this.determineRefreshType(types);
    
    // 카드 세트 컴포넌트 새로고침
    await this.cardSetComponent.refresh(type);
  }

  /**
   * 리프레시 타입을 결정합니다.
   */
  private determineRefreshType(types: RefreshType[]): RefreshType {
    if (types.includes(RefreshType.FULL)) return RefreshType.FULL;
    if (types.includes(RefreshType.SELECTION)) return RefreshType.SELECTION;
    return RefreshType.CONTENT;
  }

  /**
   * 컴포넌트를 렌더링합니다.
   */
  private render(): void {
    if (!this.container) return;

    // 기존 컴포넌트 정리
    this.dispose();

    // 카드 세트 컴포넌트 생성 및 초기화
    this.cardSetComponent = new CardSetComponent(this.viewModel);
    this.cardSetComponent.initialize(this.container);
  }

  /**
   * 툴바를 초기화합니다.
   */
  private async initializeToolbar(container: HTMLElement): Promise<void> {
    // TODO: 툴바 컴포넌트 구현
  }

  /**
   * 카드셋 컨테이너를 초기화합니다.
   */
  private async initializeCardSetContainer(container: HTMLElement): Promise<void> {
    this.cardSetComponent = new CardSetComponent(this.viewModel);
    await this.cardSetComponent.initialize(container);
  }

  /**
   * 초기 데이터를 로드합니다.
   */
  private async loadInitialData(): Promise<void> {
    try {
      // 모든 카드셋 로드
      await this.viewModel.loadAllCardSets();

      // 현재 카드셋 가져오기
      const currentCardSet = this.viewModel.getCurrentCardSet();
      if (!currentCardSet) {
        console.warn('[CardNavigator] 현재 카드셋이 없습니다.');
        return;
      }

      // 카드셋 컴포넌트가 존재하는지 확인
      if (!this.cardSetComponent) {
        console.warn('[CardNavigator] 카드셋 컴포넌트가 초기화되지 않았습니다.');
        return;
      }

      // 카드셋 컴포넌트 새로고침
      await this.cardSetComponent.refresh(RefreshType.FULL);
    } catch (error) {
      console.error('[CardNavigator] 초기 데이터 로드 실패:', error);
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
      const previousCard = this.container?.querySelector(`[data-card-id="${this.selectedCardId}"]`);
      if (previousCard) {
        previousCard.classList.remove('selected');
      }
    }

    // 새로운 카드 선택
    const selectedCard = this.container?.querySelector(`[data-card-id="${cardId}"]`);
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
    const cardSetContainer = this.container?.querySelector('.card-navigator-container');
    if (!cardSetContainer) return;

    // 이전 카드셋 컴포넌트 제거
    if (this.cardSetComponent) {
      const element = this.cardSetComponent.getElement();
      if (element) {
        cardSetContainer.removeChild(element);
      }
      this.cardSetComponent.dispose();
      this.cardSetComponent = null;
    }

    // 현재 카드셋이 있으면 새 컴포넌트 생성
    const currentCardSet = this.viewModel.getCurrentCardSet();
    if (currentCardSet) {
      this.cardSetComponent = new CardSetComponent(this.viewModel);
      const element = this.cardSetComponent.getElement();
      if (element) {
        cardSetContainer.appendChild(element);
      }
    }
  }

  /**
   * 카드셋 목록을 업데이트합니다.
   */
  private updateCardSetList(): void {
    const cardSetSelect = this.container?.querySelector('.card-navigator-select') as HTMLSelectElement;
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

  /**
   * 카드 컨테이너를 가져옵니다.
   */
  public getCardContainer(): HTMLElement | null {
    return this.cardSetComponent?.getCardContainer() || null;
  }

  /**
   * 카드 네비게이터에 포커스를 줍니다.
   */
  public focusCardNavigator(): void {
    this.cardSetComponent?.focusCardNavigator();
  }

  /**
   * 스크롤 방향을 가져옵니다.
   */
  public getIsVertical(): boolean {
    return this.cardSetComponent?.getIsVertical() ?? true;
  }

  /**
   * 스크롤 방향을 설정합니다.
   */
  public setIsVertical(isVertical: boolean): void {
    this.cardSetComponent?.setIsVertical(isVertical);
  }

  /**
   * 스크롤 양을 가져옵니다.
   */
  public getScrollAmount(): number {
    return this.cardSetComponent?.getScrollAmount() ?? 100;
  }

  /**
   * 스크롤 양을 설정합니다.
   */
  public setScrollAmount(amount: number): void {
    this.cardSetComponent?.setScrollAmount(amount);
  }

  /**
   * 위로 스크롤합니다.
   */
  public scrollUp(amount?: number): void {
    this.cardSetComponent?.scrollUp(amount);
  }

  /**
   * 아래로 스크롤합니다.
   */
  public scrollDown(amount?: number): void {
    this.cardSetComponent?.scrollDown(amount);
  }

  /**
   * 왼쪽으로 스크롤합니다.
   */
  public scrollLeft(amount?: number): void {
    this.cardSetComponent?.scrollLeft(amount);
  }

  /**
   * 오른쪽으로 스크롤합니다.
   */
  public scrollRight(amount?: number): void {
    this.cardSetComponent?.scrollRight(amount);
  }
} 