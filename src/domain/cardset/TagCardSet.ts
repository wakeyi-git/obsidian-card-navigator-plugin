import { ICard } from '../card/Card';
import { CardSet, CardSetType } from './CardSet';
import { ICardRepository } from '../card/CardRepository';

/**
 * 태그 카드 세트 클래스
 * 태그 기반 카드 세트를 구현합니다.
 */
export class TagCardSet extends CardSet {
  private cardRepository: ICardRepository;
  
  constructor(
    id: string,
    name: string,
    tag: string,
    cardRepository: ICardRepository,
    isFixed = false
  ) {
    super(id, name, 'tag', 'tag', tag, true, isFixed);
    this.cardRepository = cardRepository;
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 태그에 해당하는 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    console.log(`[TagCardSet] 태그 '${this.path}'의 카드 가져오기 시작`);
    
    try {
      // 태그에 해당하는 카드 가져오기
      const cards = await this.cardRepository.getCardsByTag(this.path);
      console.log(`[TagCardSet] 태그 '${this.path}'의 카드 ${cards.length}개 가져오기 완료`);
      
      return cards;
    } catch (error) {
      console.error(`[TagCardSet] 태그 '${this.path}'의 카드 가져오기 오류:`, error);
      return [];
    }
  }
} 