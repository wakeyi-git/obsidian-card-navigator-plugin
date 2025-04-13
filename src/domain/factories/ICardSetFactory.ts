import { ICardSet, CardSetType, ICardSetConfig } from '@/domain/models/CardSet';

/**
 * 카드셋 생성을 위한 팩토리 인터페이스
 */
export interface ICardSetFactory {
  /**
   * 카드셋을 생성합니다.
   * @param type 카드셋 타입
   * @param config 카드셋 설정
   * @returns 생성된 카드셋
   */
  create(type: CardSetType, config: ICardSetConfig): ICardSet;
}