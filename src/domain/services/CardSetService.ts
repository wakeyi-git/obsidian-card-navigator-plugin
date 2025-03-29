import { CardSet, CardSetType, ICardSetConfig } from '../models/CardSet';
import { Card } from '../models/Card';
import { TFile, TFolder, TAbstractFile } from 'obsidian';
import { App } from 'obsidian';
import { ICardService } from './CardService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardSetCreatedEvent, CardSetUpdatedEvent, CardSetDeletedEvent } from '@/domain/events/CardSetEvents';
import { IPresetService } from './PresetService';
import { v4 as uuidv4 } from 'uuid';

/**
 * 카드셋 서비스 인터페이스
 */
export interface ICardSetService {
  /** 카드셋 생성 */
  createCardSet(name: string, description: string, config: ICardSetConfig): CardSet;
  /** 카드셋 업데이트 */
  updateCardSet(cardSet: CardSet): void;
  /** 카드셋 삭제 */
  deleteCardSet(id: string): void;
  /** 카드셋에 카드 추가 */
  addCardToSet(cardSetId: string, cardId: string): Promise<void>;
  /** 카드셋에서 카드 제거 */
  removeCardFromSet(cardSetId: string, cardId: string): Promise<void>;
  /** 카드셋 활성 카드 설정 */
  setActiveCard(cardSetId: string, cardId: string): Promise<void>;
  /** 카드셋 포커스 카드 설정 */
  setFocusedCard(cardSetId: string, cardId: string): Promise<void>;
  /** 카드셋 카드 정렬 */
  sortCards(cardSetId: string): Promise<void>;
  /** 카드셋 카드 필터링 */
  filterCards(cardSetId: string, filter: (card: Card) => boolean): Promise<void>;
  /** 카드셋 조회 */
  getCardSet(id: string): CardSet | undefined;
  /** 모든 카드셋 조회 */
  getAllCardSets(): CardSet[];
  /** 카드셋 타입 업데이트 */
  updateCardSetType(cardSetId: string, type: CardSetType): Promise<void>;
  /** 프리셋 적용 */
  applyPreset(cardSetId: string, presetId: string): Promise<void>;
}

/**
 * 카드셋 서비스 클래스
 */
export class CardSetService implements ICardSetService {
  private readonly _cardSets: Map<string, CardSet>;

  constructor(
    private readonly app: App,
    private readonly cardService: ICardService,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly presetService: IPresetService
  ) {
    this._cardSets = new Map();
  }

  /**
   * 카드셋 생성
   */
  createCardSet(name: string, description: string, config: ICardSetConfig): CardSet {
    const id = uuidv4();
    const cardSet = new CardSet(
      id,
      name,
      description,
      config,
      this.app,
      this.cardService
    );
    this._cardSets.set(id, cardSet);
    return cardSet;
  }

  /**
   * 카드셋 업데이트
   */
  updateCardSet(cardSet: CardSet): void {
    this._cardSets.set(cardSet.id, cardSet);
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋 삭제
   */
  deleteCardSet(id: string): void {
    this._cardSets.delete(id);
    this.eventDispatcher.dispatch(new CardSetDeletedEvent(id));
  }

  /**
   * 카드셋에 카드 추가
   */
  async addCardToSet(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    const card = await this.cardService.getCard(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    cardSet.addCard(card);
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋에서 카드 제거
   */
  async removeCardFromSet(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.removeCard(cardId);
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋 활성 카드 설정
   */
  async setActiveCard(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.activeCardId = cardId;
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋 포커스 카드 설정
   */
  async setFocusedCard(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.focusedCardId = cardId;
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋 카드 정렬
   */
  async sortCards(cardSetId: string): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.sortCards();
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋 카드 필터링
   */
  async filterCards(cardSetId: string, filter: (card: Card) => boolean): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.filterCards(filter);
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋 조회
   */
  getCardSet(id: string): CardSet | undefined {
    return this._cardSets.get(id);
  }

  /**
   * 모든 카드셋 조회
   */
  getAllCardSets(): CardSet[] {
    return Array.from(this._cardSets.values());
  }

  /**
   * 카드셋 타입 업데이트
   */
  async updateCardSetType(cardSetId: string, type: CardSetType): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.updateType(type);
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 프리셋 적용
   */
  async applyPreset(cardSetId: string, presetId: string): Promise<void> {
    const cardSet = this._cardSets.get(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    const preset = await this.presetService.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    cardSet.applyPreset(preset);
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }
} 