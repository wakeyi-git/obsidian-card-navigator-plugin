import { CardSet } from '@/domain/models/CardSet';

/**
 * 카드셋 리포지토리 인터페이스
 */
export interface ICardSetRepository {
  /**
   * 카드셋 저장
   * @param cardSet 저장할 카드셋
   */
  save(cardSet: CardSet): Promise<void>;

  /**
   * ID로 카드셋 찾기
   * @param id 카드셋 ID
   */
  findById(id: string): Promise<CardSet | undefined>;

  /**
   * 모든 카드셋 찾기
   */
  findAll(): Promise<CardSet[]>;

  /**
   * 카드셋 삭제
   * @param id 카드셋 ID
   */
  delete(id: string): Promise<void>;
} 