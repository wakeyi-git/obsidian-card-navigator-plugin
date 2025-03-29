import { App, TFile } from 'obsidian';
import { CardSetViewModel } from './CardSetViewModel';
import { CardUseCase } from '../../application/useCases/CardUseCase';
import { CardSetUseCase } from '../../application/useCases/CardSetUseCase';
import { CreateCardSetDto, UpdateCardSetDto } from '../../application/dtos/CardSetDto';
import { CreateCardDto, UpdateCardDto, CardResponseDto } from '../../application/dtos/CardDto';
import { CardFilter, CardSort } from '../../domain/models/types';
import { Card } from '../../domain/models/Card';
import { ObsidianCardRepository } from '../../infrastructure/obsidian/ObsidianCardRepository';
import { CardSet } from '../../domain/models/CardSet';
import { CardNavigatorPlugin } from '../../main';
import { RefreshType } from '../../domain/models/types';
import { DomainEventDispatcher } from '../../domain/events/DomainEventDispatcher';
import { ObsidianCardSetRepository } from '../../infrastructure/obsidian/ObsidianCardSetRepository';

/**
 * 카드 네비게이터 뷰 모델
 */
export class CardNavigatorViewModel {
  private currentCardSet: CardSetViewModel | null = null;
  private cardSetViewModels: Map<string, CardSetViewModel> = new Map();
  private readonly cardRepository: ObsidianCardRepository;
  private readonly cardSetRepository: ObsidianCardSetRepository;
  private selectedCardIds: Set<string> = new Set();
  private readonly plugin: CardNavigatorPlugin;
  private readonly app: App;
  private readonly cardUseCase: CardUseCase;
  private readonly cardSetUseCase: CardSetUseCase;
  private readonly eventDispatcher: DomainEventDispatcher;

  constructor(
    app: App,
    plugin: CardNavigatorPlugin
  ) {
    this.app = app;
    this.plugin = plugin;
    this.cardRepository = new ObsidianCardRepository(app);
    this.cardSetRepository = new ObsidianCardSetRepository(app, this.cardRepository);
    this.eventDispatcher = new DomainEventDispatcher();
    this.cardUseCase = new CardUseCase(this.cardRepository, this.app, this.eventDispatcher);
    this.cardSetUseCase = new CardSetUseCase(this.cardSetRepository, this.app);
  }

  /**
   * App 인스턴스를 반환합니다.
   */
  getApp(): App {
    return this.app;
  }

  /**
   * 현재 카드셋을 반환합니다.
   */
  getCurrentCardSet(): CardSetViewModel | null {
    if (!this.currentCardSet) {
      console.warn('[CardNavigator] 현재 카드셋이 없습니다.');
    }
    return this.currentCardSet;
  }

  /**
   * 카드셋을 생성합니다.
   */
  async createCardSet(dto: CreateCardSetDto): Promise<CardSetViewModel> {
    const defaultFilter: CardFilter = { type: 'search', criteria: { value: '' } };
    const defaultSort: CardSort = { criterion: 'fileName', order: 'asc' };
    const cardSet = await this.cardSetUseCase.createCardSet(
      dto.type,
      dto.source,
      dto.filter || defaultFilter,
      dto.sort || defaultSort
    );
    const viewModel = new CardSetViewModel(cardSet, this.app);
    this.cardSetViewModels.set(viewModel.getId(), viewModel);
    return viewModel;
  }

  /**
   * 카드셋을 업데이트합니다.
   */
  async updateCardSet(id: string, dto: UpdateCardSetDto): Promise<CardSetViewModel> {
    const cardSet = await this.cardSetUseCase.findById(id);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${id}`);
    }
    
    const updatedCardSet = await this.cardSetUseCase.updateCardSet(cardSet, dto);
    const viewModel = new CardSetViewModel(updatedCardSet, this.app);
    this.cardSetViewModels.set(viewModel.getId(), viewModel);
    
    if (this.currentCardSet?.getId() === id) {
      this.currentCardSet = viewModel;
    }
    
    return viewModel;
  }

  /**
   * 카드셋을 삭제합니다.
   */
  async deleteCardSet(id: string): Promise<void> {
    const cardSet = await this.cardSetUseCase.findById(id);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${id}`);
    }
    
    await this.cardSetUseCase.deleteCardSet(cardSet);
    this.cardSetViewModels.delete(id);
    
    if (this.currentCardSet?.getId() === id) {
      this.currentCardSet = null;
    }
  }

  /**
   * 카드셋을 선택합니다.
   */
  selectCardSet(id: string): void {
    const viewModel = this.cardSetViewModels.get(id);
    if (viewModel) {
      this.currentCardSet = viewModel;
      console.log('[CardNavigator] 카드셋 선택됨:', id);
      console.log('[CardNavigator] 현재 카드 수:', viewModel.getCards().length);
    } else {
      console.warn('[CardNavigator] 카드셋을 찾을 수 없음:', id);
    }
  }

  /**
   * 카드를 생성합니다.
   */
  async createCard(dto: CreateCardDto): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(dto.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${dto.filePath}`);
    }
    
    const card = await this.cardUseCase.createCard(file);
    if (this.currentCardSet) {
      this.currentCardSet.addCard(card);
    }
  }

  /**
   * 카드를 업데이트합니다.
   */
  async updateCard(id: string, dto: UpdateCardDto): Promise<void> {
    const cardDto = await this.cardUseCase.getCard(id);
    if (dto.content) cardDto.content = dto.content;
    if (dto.style) cardDto.style = dto.style;
    if (dto.position) cardDto.position = dto.position;
    
    const card = await this.convertToCard(cardDto);
    await this.cardUseCase.updateCard(card);
    if (this.currentCardSet) {
      this.currentCardSet.addCard(card);
    }
  }

  /**
   * 카드를 삭제합니다.
   */
  async deleteCard(id: string): Promise<void> {
    await this.cardUseCase.deleteCard(id);
    if (this.currentCardSet) {
      this.currentCardSet.removeCard(id);
    }
  }

  /**
   * 모든 카드셋을 로드합니다.
   */
  async loadAllCardSets(): Promise<void> {
    try {
      console.log('[CardNavigator] 카드셋 로드 시작');

      // 기본 카드셋 생성
      const defaultCardSet = await this.cardSetUseCase.createCardSet(
        'folder',
        this.plugin.settings.selectedFolder || '',
        {
          type: 'folder',
          criteria: { value: this.plugin.settings.selectedFolder || '' }
        },
        {
          criterion: this.plugin.settings.sortCriterion,
          order: this.plugin.settings.sortOrder,
          priorityTags: this.plugin.settings.priorityTags,
          priorityFolders: this.plugin.settings.priorityFolders
        }
      );

      console.log('[CardNavigator] 기본 카드셋 생성됨:', defaultCardSet.getId());

      // 카드 로드
      await this.loadCardsForCardSet(defaultCardSet);

      // 카드셋 뷰 모델 생성 및 저장
      const viewModel = new CardSetViewModel(defaultCardSet, this.app);
      this.cardSetViewModels.set(viewModel.getId(), viewModel);
      this.currentCardSet = viewModel;

      // 카드셋 선택
      this.selectCardSet(defaultCardSet.getId());

      console.log('[CardNavigator] 카드셋 로드 완료');
    } catch (error) {
      console.error('[CardNavigator] 카드셋 로드 실패:', error);
    }
  }

  /**
   * 카드셋의 카드를 로드합니다.
   */
  private async loadCardsForCardSet(cardSet: CardSet): Promise<void> {
    try {
      const folderPath = cardSet.getSource();
      console.log('[CardNavigator] 카드 로드 시작:', folderPath);

      const files = this.app.vault.getMarkdownFiles().filter(file => 
        file.path.startsWith(folderPath)
      );

      console.log('[CardNavigator] 카드 로드 시작:', files.length, '개 파일');

      // 카드셋의 필터와 정렬 설정을 임시로 비활성화
      const originalFilter = cardSet.getFilter();
      const originalSort = cardSet.getSort();
      cardSet.updateFilter({ type: 'folder', criteria: { value: '' } });
      cardSet.updateSort({ criterion: 'fileName', order: 'asc' });

      // 카드 생성 및 추가
      for (const file of files) {
        try {
          const card = await this.cardUseCase.createCard(file);
          cardSet.addCard(card);
          console.log('[CardNavigator] 카드 추가됨:', file.path);
        } catch (error) {
          console.error('[CardNavigator] 카드 생성 실패:', file.path, error);
        }
      }

      // 원래 필터와 정렬 설정 복원
      cardSet.updateFilter(originalFilter);
      cardSet.updateSort(originalSort);

      console.log('[CardNavigator] 카드 로드 완료:', cardSet.getCards().length, '개 카드');
    } catch (error) {
      console.error('[CardNavigator] 카드 로드 실패:', error);
    }
  }

  /**
   * 현재 카드셋의 필터를 업데이트합니다.
   */
  updateFilter(filter: CardFilter): void {
    if (this.currentCardSet) {
      this.currentCardSet.updateFilter(filter);
    }
  }

  /**
   * 현재 카드셋의 정렬 설정을 업데이트합니다.
   */
  updateSort(sort: CardSort): void {
    if (this.currentCardSet) {
      this.currentCardSet.updateSort(sort);
    }
  }

  /**
   * DTO를 Card 객체로 변환합니다.
   */
  private async convertToCard(dto: CardResponseDto): Promise<Card> {
    const file = this.app.vault.getAbstractFileByPath(dto.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${dto.filePath}`);
    }
    
    return new Card(
      dto.filePath,
      file,
      dto.content,
      dto.style,
      dto.position,
      this.app
    );
  }

  /**
   * 모든 카드셋을 반환합니다.
   */
  getAllCardSets(): CardSetViewModel[] {
    return Array.from(this.cardSetViewModels.values());
  }

  /**
   * 카드 유스케이스를 반환합니다.
   */
  getCardUseCase(): CardUseCase {
    return this.cardUseCase;
  }

  /**
   * 카드셋 유스케이스를 반환합니다.
   */
  getCardSetUseCase(): CardSetUseCase {
    return this.cardSetUseCase;
  }

  /**
   * 선택된 카드 ID 목록을 가져옵니다.
   */
  getSelectedCardIds(): string[] {
    return Array.from(this.selectedCardIds);
  }

  /**
   * 카드를 선택합니다.
   */
  selectCard(cardId: string): void {
    this.selectedCardIds.add(cardId);
  }

  /**
   * 카드 선택을 해제합니다.
   */
  deselectCard(cardId: string): void {
    this.selectedCardIds.delete(cardId);
  }

  /**
   * 모든 카드 선택을 해제합니다.
   */
  deselectAllCards(): void {
    this.selectedCardIds.clear();
  }

  /**
   * ID로 카드를 찾습니다.
   */
  getCardById(id: string): Card | null {
    if (!this.currentCardSet) return null;
    return this.currentCardSet.getCardById(id);
  }

  /**
   * 선택된 카드 목록을 가져옵니다.
   */
  getSelectedCards(): Card[] {
    return Array.from(this.selectedCardIds)
      .map((id: string) => this.getCardById(id))
      .filter((card: Card | null): card is Card => card !== null);
  }

  /**
   * 플러그인 인스턴스를 가져옵니다.
   */
  getPlugin(): CardNavigatorPlugin {
    return this.plugin;
  }

  /**
   * 현재 폴더 경로를 가져옵니다.
   */
  public async getCurrentFolderPath(): Promise<string | null> {
    const currentCardSet = this.getCurrentCardSet();
    if (!currentCardSet) {
      console.warn('[CardNavigator] 현재 카드셋이 없습니다.');
      return null;
    }
    return currentCardSet.getSource();
  }

  /**
   * 현재 카드셋의 카드 목록을 반환합니다.
   */
  getCards(): Card[] {
    const currentCardSet = this.getCurrentCardSet();
    if (!currentCardSet) {
      console.warn('[CardNavigator] 현재 카드셋이 없어 카드를 가져올 수 없습니다.');
      return [];
    }
    return currentCardSet.getCards();
  }
} 