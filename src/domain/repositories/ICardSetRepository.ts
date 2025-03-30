import { App } from 'obsidian';
import { CardSet, ICardSetConfig } from '@/domain/models/CardSet';
import { ICardService } from '@/domain/services/ICardService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ICardRenderConfig } from '@/domain/models/Card';

/**
 * 카드셋 저장소 인터페이스
 */
export interface ICardSetRepository {
  /**
   * 카드셋 생성
   */
  createCardSet(
    name: string,
    description: string,
    config: ICardSetConfig,
    app: App,
    cardService: ICardService,
    layoutService: ILayoutService,
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
  getCardSet(id: string): Promise<CardSet | undefined>;

  /**
   * 모든 카드셋 조회
   */
  getAllCardSets(): Promise<CardSet[]>;

  /**
   * 저장소 정리
   */
  dispose(): void;
} 