import { CardSet, CardSetType, CardFilter, ICardSetConfig } from '@/domain/models/CardSet';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ICardRenderConfig } from '@/domain/models/Card';
import { Preset } from '@/domain/models/Preset';

/**
 * 카드셋 서비스 인터페이스
 */
export interface ICardSetService {
  /**
   * 카드셋 생성
   */
  createCardSet(
    name: string,
    description: string,
    config: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<CardSet>;

  /**
   * 카드셋 업데이트
   */
  updateCardSet(cardSet: CardSet): Promise<void>;

  /**
   * 카드셋 삭제
   */
  deleteCardSet(id: string): Promise<void>;

  /**
   * 카드셋 조회
   */
  getCardSet(id: string): Promise<CardSet | null>;

  /**
   * 모든 카드셋 조회
   */
  getAllCardSets(): Promise<CardSet[]>;

  /**
   * 카드셋 타입 업데이트
   */
  updateCardSetType(id: string, type: CardSetType): Promise<void>;

  /**
   * 프리셋 적용
   */
  applyPreset(id: string, preset: Preset): Promise<void>;

  /**
   * 카드셋에 카드 추가
   */
  addCardToSet(cardSetId: string, cardId: string): Promise<void>;

  /**
   * 카드셋에서 카드 제거
   */
  removeCardFromSet(cardSetId: string, cardId: string): Promise<void>;

  /**
   * 카드셋 활성 카드 설정
   */
  setActiveCard(cardSetId: string, cardId: string): Promise<void>;

  /**
   * 카드셋 포커스 카드 설정
   */
  setFocusedCard(cardSetId: string, cardId: string): Promise<void>;

  /**
   * 카드셋 카드 정렬
   */
  sortCards(cardSetId: string): Promise<void>;

  /**
   * 카드셋 카드 필터링
   */
  filterCards(cardSetId: string, filter: CardFilter): Promise<void>;

  /**
   * 서비스 정리
   */
  dispose(): void;
} 