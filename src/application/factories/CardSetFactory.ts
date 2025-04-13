import { injectable } from 'inversify';
import { ICardSet, CardSetType, ICardSetConfig, CardSet } from '@/domain/models/CardSet';
import { ICardSetFactory } from '@/domain/factories/ICardSetFactory';

/**
 * 카드셋 생성을 위한 팩토리 클래스
 */
@injectable()
export class CardSetFactory implements ICardSetFactory {
  /**
   * 카드셋을 생성합니다.
   * @param type 카드셋 타입
   * @param config 카드셋 설정
   * @returns 생성된 카드셋
   */
  create(type: CardSetType, config: ICardSetConfig): ICardSet {
    return new CardSet(type, config);
  }
}