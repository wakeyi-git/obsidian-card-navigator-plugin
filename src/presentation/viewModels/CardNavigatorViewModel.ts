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

/**
 * 카드 네비게이터 뷰 모델
 */
export class CardNavigatorViewModel {
  private currentCardSet: CardSetViewModel | null = null;
  private cardSetViewModels: Map<string, CardSetViewModel> = new Map();
  private readonly cardRepository: ObsidianCardRepository;

  constructor(
    private readonly app: App,
    private readonly cardUseCase: CardUseCase,
    private readonly cardSetUseCase: CardSetUseCase
  ) {
    this.cardRepository = new ObsidianCardRepository(app);
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
    }
  }

  /**
   * 카드를 생성합니다.
   */
  async createCard(dto: CreateCardDto): Promise<void> {
    const cardDto = await this.cardUseCase.createCard(dto);
    const card = await this.convertToCard(cardDto);
    if (this.currentCardSet) {
      this.currentCardSet.addCard(card);
    }
  }

  /**
   * 카드를 업데이트합니다.
   */
  async updateCard(id: string, dto: UpdateCardDto): Promise<void> {
    const cardDto = await this.cardUseCase.updateCard(id, dto);
    const card = await this.convertToCard(cardDto);
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
    const cardSets = await this.cardSetUseCase.getAllCardSets();
    this.cardSetViewModels.clear();
    
    cardSets.forEach((cardSet: CardSet) => {
      const viewModel = new CardSetViewModel(cardSet, this.app);
      this.cardSetViewModels.set(viewModel.getId(), viewModel);
    });
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
   * DTO를 Card로 변환합니다.
   */
  private async convertToCard(dto: CardResponseDto): Promise<Card> {
    const file = this.app.vault.getAbstractFileByPath(dto.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${dto.filePath}`);
    }

    const card = await this.cardRepository.createFromFile(file, this.app);
    card.updateContent(dto.content);
    card.updateStyle(dto.style);
    card.updatePosition(dto.position);

    return card;
  }

  /**
   * 모든 카드셋을 반환합니다.
   */
  getAllCardSets(): CardSetViewModel[] {
    return Array.from(this.cardSetViewModels.values());
  }
} 