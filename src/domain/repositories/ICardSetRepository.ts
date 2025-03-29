import { CardSet } from '../models/CardSet';
import { CardSetType, CardFilter, CardSort } from '../models/types';

/**
 * 카드셋 저장소 인터페이스
 */
export interface ICardSetRepository {
  /**
   * ID로 카드셋을 조회합니다.
   */
  findById(id: string): Promise<CardSet | null>;

  /**
   * 타입과 소스로 카드셋을 조회합니다.
   */
  findByTypeAndSource(type: CardSetType, source: string): Promise<CardSet | null>;

  /**
   * 새로운 카드셋을 생성합니다.
   */
  create(type: CardSetType, source: string, filter: CardFilter, sort: CardSort): Promise<CardSet>;

  /**
   * 카드셋의 필터를 업데이트합니다.
   */
  updateFilter(cardSet: CardSet, filter: CardFilter): Promise<CardSet>;

  /**
   * 카드셋의 정렬 설정을 업데이트합니다.
   */
  updateSort(cardSet: CardSet, sort: CardSort): Promise<CardSet>;

  /**
   * 카드셋을 삭제합니다.
   */
  delete(cardSet: CardSet): Promise<void>;

  /**
   * 모든 카드셋을 조회합니다.
   */
  findAll(): Promise<CardSet[]>;
} 