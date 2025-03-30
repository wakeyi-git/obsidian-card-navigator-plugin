import { CardSet, CardSetType, CardFilter, ICardSetConfig } from '@/domain/models/CardSet';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ICardRenderConfig } from '@/domain/models/Card';
import { ICardSetRepository } from '@/domain/repositories/ICardSetRepository';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardSetCreatedEvent, CardSetUpdatedEvent, CardSetDeletedEvent } from '@/domain/events/CardSetEvents';
import { IDomainEventHandler } from '@/domain/events/IDomainEventHandler';
import { Preset } from '@/domain/models/Preset';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ICardService } from '@/domain/services/ICardService';
import { ICardSetService } from '@/domain/services/ICardSetService';
import { App } from 'obsidian';

/**
 * 카드셋 서비스
 */
export class CardSetService implements ICardSetService {
  private _cardSets: Map<string, CardSet> = new Map();
  private _startTime: number;

  constructor(
    private readonly repository: ICardSetRepository,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly loggingService: LoggingService,
    private readonly layoutService: ILayoutService,
    private readonly cardService: ICardService,
    private readonly app: App
  ) {
    this._startTime = performance.now();
    this.loggingService.debug('CardSetService 초기화 시작');

    // 이벤트 핸들러 등록
    const handlers: Record<string, IDomainEventHandler<any>> = {
      cardSetCreated: {
        handle: async (event: CardSetCreatedEvent) => {
          this._handleCardSetCreated(event);
        }
      },
      cardSetUpdated: {
        handle: async (event: CardSetUpdatedEvent) => {
          this._handleCardSetUpdated(event);
        }
      },
      cardSetDeleted: {
        handle: async (event: CardSetDeletedEvent) => {
          this._handleCardSetDeleted(event);
        }
      }
    };

    // 이벤트 핸들러 등록
    Object.entries(handlers).forEach(([key, handler]) => {
      switch (key) {
        case 'cardSetCreated':
          this.eventDispatcher.register(CardSetCreatedEvent, handler);
          break;
        case 'cardSetUpdated':
          this.eventDispatcher.register(CardSetUpdatedEvent, handler);
          break;
        case 'cardSetDeleted':
          this.eventDispatcher.register(CardSetDeletedEvent, handler);
          break;
        default:
          this.loggingService.warn(`알 수 없는 이벤트 핸들러: ${key}`);
      }
    });

    const endTime = performance.now();
    this.loggingService.debug(`CardSetService 초기화 완료, 소요 시간: ${endTime - this._startTime}ms`);
  }

  /**
   * 카드셋 생성
   */
  async createCardSet(
    name: string,
    description: string,
    config: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<CardSet> {
    try {
      this.loggingService.debug('카드셋 생성 시작:', { name, description });

      const cardSet = await this.repository.createCardSet(
        name,
        description,
        config,
        this.app,
        this.cardService,
        this.layoutService,
        layoutConfig,
        cardRenderConfig
      );

      this._cardSets.set(cardSet.id, cardSet);
      this.eventDispatcher.dispatch(new CardSetCreatedEvent(cardSet));
      this.loggingService.debug('카드셋 생성 완료:', cardSet.id);
      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 업데이트
   */
  async updateCardSet(cardSet: CardSet): Promise<void> {
    try {
      this.loggingService.debug('카드셋 업데이트 시작:', cardSet.id);
      await this.repository.updateCardSet(cardSet);
      this._cardSets.set(cardSet.id, cardSet);
      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
      this.loggingService.debug('카드셋 업데이트 완료:', cardSet.id);
    } catch (error) {
      this.loggingService.error('카드셋 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 삭제
   */
  async deleteCardSet(id: string): Promise<void> {
    try {
      this.loggingService.debug('카드셋 삭제 시작:', id);
      await this.repository.deleteCardSet(id);
      this._cardSets.delete(id);
      this.eventDispatcher.dispatch(new CardSetDeletedEvent(id));
      this.loggingService.debug('카드셋 삭제 완료:', id);
    } catch (error) {
      this.loggingService.error('카드셋 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 조회
   */
  async getCardSet(id: string): Promise<CardSet | null> {
    try {
      this.loggingService.debug('카드셋 조회 시작:', id);
      const cardSet = await this.repository.getCardSet(id);
      if (cardSet) {
        this._cardSets.set(id, cardSet);
      }
      this.loggingService.debug('카드셋 조회 완료:', id);
      return cardSet || null;
    } catch (error) {
      this.loggingService.error('카드셋 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 카드셋 조회
   */
  async getAllCardSets(): Promise<CardSet[]> {
    try {
      this.loggingService.debug('모든 카드셋 조회 시작');
      const cardSets = await this.repository.getAllCardSets();
      cardSets.forEach(cardSet => {
        this._cardSets.set(cardSet.id, cardSet);
      });
      this.loggingService.debug('모든 카드셋 조회 완료:', cardSets.length);
      return cardSets;
    } catch (error) {
      this.loggingService.error('모든 카드셋 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 타입 업데이트
   */
  async updateCardSetType(id: string, type: CardSetType): Promise<void> {
    try {
      this.loggingService.debug('카드셋 타입 업데이트 시작:', { id, type });
      const cardSet = await this.getCardSet(id);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${id}`);
      }
      cardSet.config.type = type;
      await this.updateCardSet(cardSet);
      this.loggingService.debug('카드셋 타입 업데이트 완료:', id);
    } catch (error) {
      this.loggingService.error('카드셋 타입 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 프리셋 적용
   */
  async applyPreset(id: string, preset: Preset): Promise<void> {
    try {
      this.loggingService.debug('프리셋 적용 시작:', { id, presetId: preset.id });
      const cardSet = await this.getCardSet(id);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${id}`);
      }
      cardSet.applyPreset(preset);
      await this.updateCardSet(cardSet);
      this.loggingService.debug('프리셋 적용 완료:', id);
    } catch (error) {
      this.loggingService.error('프리셋 적용 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋에 카드 추가
   */
  async addCardToSet(cardSetId: string, cardId: string): Promise<void> {
    try {
      this.loggingService.debug('카드 추가 시작:', { cardSetId, cardId });
      const cardSet = await this.getCardSet(cardSetId);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${cardSetId}`);
      }
      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        throw new Error(`카드를 찾을 수 없습니다: ${cardId}`);
      }
      cardSet.addCard(card);
      await this.updateCardSet(cardSet);
      this.loggingService.debug('카드 추가 완료:', { cardSetId, cardId });
    } catch (error) {
      this.loggingService.error('카드 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋에서 카드 제거
   */
  async removeCardFromSet(cardSetId: string, cardId: string): Promise<void> {
    try {
      this.loggingService.debug('카드 제거 시작:', { cardSetId, cardId });
      const cardSet = await this.getCardSet(cardSetId);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${cardSetId}`);
      }
      cardSet.removeCard(cardId);
      await this.updateCardSet(cardSet);
      this.loggingService.debug('카드 제거 완료:', { cardSetId, cardId });
    } catch (error) {
      this.loggingService.error('카드 제거 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 활성 카드 설정
   */
  async setActiveCard(cardSetId: string, cardId: string): Promise<void> {
    try {
      this.loggingService.debug('활성 카드 설정 시작:', { cardSetId, cardId });
      const cardSet = await this.getCardSet(cardSetId);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${cardSetId}`);
      }
      cardSet.activeCardId = cardId;
      await this.updateCardSet(cardSet);
      this.loggingService.debug('활성 카드 설정 완료:', { cardSetId, cardId });
    } catch (error) {
      this.loggingService.error('활성 카드 설정 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 포커스 카드 설정
   */
  async setFocusedCard(cardSetId: string, cardId: string): Promise<void> {
    try {
      this.loggingService.debug('포커스 카드 설정 시작:', { cardSetId, cardId });
      const cardSet = await this.getCardSet(cardSetId);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${cardSetId}`);
      }
      cardSet.focusedCardId = cardId;
      await this.updateCardSet(cardSet);
      this.loggingService.debug('포커스 카드 설정 완료:', { cardSetId, cardId });
    } catch (error) {
      this.loggingService.error('포커스 카드 설정 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 카드 정렬
   */
  async sortCards(cardSetId: string): Promise<void> {
    try {
      this.loggingService.debug('카드 정렬 시작:', cardSetId);
      const cardSet = await this.getCardSet(cardSetId);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${cardSetId}`);
      }
      cardSet.sortCards();
      await this.updateCardSet(cardSet);
      this.loggingService.debug('카드 정렬 완료:', cardSetId);
    } catch (error) {
      this.loggingService.error('카드 정렬 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 카드 필터링
   */
  async filterCards(cardSetId: string, filter: CardFilter): Promise<void> {
    try {
      this.loggingService.debug('카드 필터링 시작:', { cardSetId, filter });
      const cardSet = await this.getCardSet(cardSetId);
      if (!cardSet) {
        throw new Error(`카드셋을 찾을 수 없습니다: ${cardSetId}`);
      }
      cardSet.filterCards(filter);
      await this.updateCardSet(cardSet);
      this.loggingService.debug('카드 필터링 완료:', cardSetId);
    } catch (error) {
      this.loggingService.error('카드 필터링 실패:', error);
      throw error;
    }
  }

  /**
   * 서비스 정리
   */
  dispose(): void {
    this.loggingService.debug('CardSetService 정리');
    this._cardSets.clear();
    this.repository.dispose();
  }

  /**
   * 카드셋 생성 이벤트 처리
   */
  private async _handleCardSetCreated(event: CardSetCreatedEvent): Promise<void> {
    const cardSet = await this.getCardSet(event.cardSet.id);
    if (cardSet) {
      this._cardSets.set(event.cardSet.id, cardSet);
    }
  }

  /**
   * 카드셋 업데이트 이벤트 처리
   */
  private async _handleCardSetUpdated(event: CardSetUpdatedEvent): Promise<void> {
    const cardSet = await this.getCardSet(event.cardSet.id);
    if (cardSet) {
      this._cardSets.set(event.cardSet.id, cardSet);
    }
  }

  /**
   * 카드셋 삭제 이벤트 처리
   */
  private async _handleCardSetDeleted(event: CardSetDeletedEvent): Promise<void> {
    this._cardSets.delete(event.cardSetId);
  }
} 