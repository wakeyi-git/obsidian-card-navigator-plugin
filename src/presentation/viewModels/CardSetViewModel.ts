import { CardSet } from '../../domain/models/CardSet';
import { Card } from '../../domain/models/Card';
import { CardSetType, CardFilter, CardSort, CardPosition } from '../../domain/models/types';
import { CardViewModel } from './CardViewModel';
import { CardSetResponseDto } from '../../application/dtos/CardSetDto';
import { App } from 'obsidian';
import { ObsidianCardRepository } from '../../infrastructure/obsidian/ObsidianCardRepository';
import { CardStyle } from '../../domain/models/types';

/**
 * 카드셋 뷰 모델
 */
export class CardSetViewModel {
  private cardViewModels: Map<string, CardViewModel> = new Map();
  private cardSet!: CardSet;
  private readonly cardRepository: ObsidianCardRepository;
  private cardPositions: Map<string, CardPosition> = new Map();

  constructor(
    cardSetOrDto: CardSet | CardSetResponseDto,
    private readonly app: App
  ) {
    this.cardRepository = new ObsidianCardRepository(app);
    if (this.isCardSet(cardSetOrDto)) {
      this.initializeFromCardSet(cardSetOrDto);
    } else {
      this.initializeFromDto(cardSetOrDto);
    }
  }

  /**
   * CardSet인지 확인합니다.
   */
  private isCardSet(value: CardSet | CardSetResponseDto): value is CardSet {
    return 'getCards' in value;
  }

  /**
   * CardSet으로부터 초기화합니다.
   */
  private initializeFromCardSet(cardSet: CardSet): void {
    this.cardSet = cardSet;
    this.initializeCardViewModels();
  }

  /**
   * DTO로부터 초기화합니다.
   */
  private initializeFromDto(dto: CardSetResponseDto): void {
    // DTO를 CardSet으로 변환
    this.cardSet = new CardSet(
      dto.id,
      dto.type,
      dto.source,
      dto.filter,
      dto.sort,
      [] // 카드는 별도로 로드됨
    );

    // 카드 ID 목록을 기반으로 카드 로드
    this.loadCards(dto.cardIds);
  }

  /**
   * 카드를 로드합니다.
   */
  private async loadCards(cardIds: string[]): Promise<void> {
    for (const id of cardIds) {
      const card = await this.cardRepository.findById(id);
      if (card) {
        this.addCard(card);
      }
    }
  }

  /**
   * 카드 뷰 모델을 초기화합니다.
   */
  private initializeCardViewModels(): void {
    this.cardSet.getCards().forEach(card => {
      this.cardViewModels.set(card.getId(), new CardViewModel(card));
    });
  }

  /**
   * 카드셋 ID를 반환합니다.
   */
  getId(): string {
    return this.cardSet.getId();
  }

  /**
   * 카드셋 타입을 반환합니다.
   */
  getType(): CardSetType {
    return this.cardSet.getType();
  }

  /**
   * 카드셋 소스를 반환합니다.
   */
  getSource(): string {
    return this.cardSet.getSource();
  }

  /**
   * 카드셋의 카드 뷰 모델 목록을 반환합니다.
   */
  getCardViewModels(): CardViewModel[] {
    return Array.from(this.cardViewModels.values());
  }

  /**
   * 특정 ID의 카드 뷰 모델을 반환합니다.
   */
  getCardViewModel(id: string): CardViewModel | undefined {
    return this.cardViewModels.get(id);
  }

  /**
   * 카드셋의 필터를 반환합니다.
   */
  getFilter(): CardFilter {
    return this.cardSet.getFilter();
  }

  /**
   * 카드셋의 정렬 설정을 반환합니다.
   */
  getSort(): CardSort {
    return this.cardSet.getSort();
  }

  /**
   * ID로 카드의 스타일을 반환합니다.
   */
  getCardStyle(cardId: string): CardStyle {
    const card = this.cardSet.getCardById(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    return card.getStyle();
  }

  /**
   * 카드셋의 생성 시간을 반환합니다.
   */
  getCreatedAt(): Date {
    return this.cardSet.getCreatedAt();
  }

  /**
   * 카드셋의 수정 시간을 반환합니다.
   */
  getUpdatedAt(): Date {
    return this.cardSet.getUpdatedAt();
  }

  /**
   * 카드를 카드셋에 추가합니다.
   */
  addCard(card: Card): void {
    this.cardSet.addCard(card);
    this.cardViewModels.set(card.getId(), new CardViewModel(card));
  }

  /**
   * 카드를 카드셋에서 제거합니다.
   */
  removeCard(cardId: string): void {
    this.cardSet.removeCard(cardId);
    this.cardViewModels.delete(cardId);
  }

  /**
   * 카드셋의 필터를 업데이트합니다.
   */
  updateFilter(filter: CardFilter): void {
    this.cardSet.updateFilter(filter);
    this.initializeCardViewModels();
  }

  /**
   * 카드셋의 정렬 설정을 업데이트합니다.
   */
  updateSort(sort: CardSort): void {
    this.cardSet.updateSort(sort);
    this.initializeCardViewModels();
  }

  /**
   * ID로 카드를 찾습니다.
   */
  getCardById(id: string): Card | null {
    return this.cardSet.getCardById(id);
  }

  /**
   * 카드 위치를 저장합니다.
   */
  async saveCardPosition(cardId: string, position: CardPosition): Promise<void> {
    this.cardPositions.set(cardId, position);
    if (this.cardSet) {
      await this.cardSet.updateCardPosition(cardId, position);
    }
  }

  /**
   * 카드 위치를 로드합니다.
   */
  loadCardPosition(cardId: string): CardPosition | null {
    return this.cardPositions.get(cardId) || null;
  }

  /**
   * 모든 카드 위치를 로드합니다.
   */
  loadAllCardPositions(): Map<string, CardPosition> {
    return new Map(this.cardPositions);
  }
} 