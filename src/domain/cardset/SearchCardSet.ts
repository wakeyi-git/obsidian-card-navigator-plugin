import { ICard } from '../card/Card';
import { CardSet, CardSetType } from './CardSet';
import { ICardRepository } from '../card/CardRepository';

/**
 * 검색 타입
 * 검색 대상을 정의합니다.
 */
export type SearchType = 'title' | 'content' | 'path' | 'frontmatter' | 'all';

/**
 * 검색 카드 세트 클래스
 * 검색 기반 카드 세트를 구현합니다.
 */
export class SearchCardSet extends CardSet {
  private cardRepository: ICardRepository;
  private query: string;
  private searchType: SearchType;
  private caseSensitive: boolean;
  private frontmatterKey?: string;
  
  constructor(
    id: string,
    name: string,
    query: string,
    cardRepository: ICardRepository,
    searchType: SearchType = 'content',
    caseSensitive: boolean = false,
    frontmatterKey?: string,
    isFixed: boolean = false
  ) {
    super(id, name, 'search', 'folder', '', true, isFixed);
    this.cardRepository = cardRepository;
    this.query = query;
    this.searchType = searchType;
    this.caseSensitive = caseSensitive;
    this.frontmatterKey = frontmatterKey;
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 검색 쿼리에 해당하는 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    console.log(`[SearchCardSet] 검색 쿼리 '${this.query}'의 카드 가져오기 시작`);
    
    try {
      // 모든 카드 가져오기
      const allCards = await this.cardRepository.getAllCards();
      
      // 검색 쿼리가 없으면 모든 카드 반환
      if (!this.query) {
        return allCards;
      }
      
      // 검색 쿼리에 맞는 카드 필터링
      const filteredCards = this.filterCardsByQuery(allCards);
      console.log(`[SearchCardSet] 검색 쿼리 '${this.query}'의 카드 ${filteredCards.length}개 가져오기 완료`);
      
      return filteredCards;
    } catch (error) {
      console.error(`[SearchCardSet] 검색 쿼리 '${this.query}'의 카드 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 쿼리로 카드 필터링
   * @param cards 필터링할 카드 목록
   * @returns 필터링된 카드 목록
   */
  private filterCardsByQuery(cards: ICard[]): ICard[] {
    // 검색 쿼리 준비
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    
    return cards.filter(card => {
      let searchTarget = '';
      
      switch (this.searchType) {
        case 'title':
          searchTarget = this.caseSensitive ? card.title : card.title.toLowerCase();
          break;
        case 'content':
          searchTarget = this.caseSensitive ? card.content : card.content.toLowerCase();
          break;
        case 'path':
          searchTarget = this.caseSensitive ? card.path : card.path.toLowerCase();
          break;
        case 'frontmatter':
          if (this.frontmatterKey && card.frontmatter && card.frontmatter[this.frontmatterKey]) {
            const value = card.frontmatter[this.frontmatterKey];
            searchTarget = this.caseSensitive ? String(value) : String(value).toLowerCase();
          }
          break;
        case 'all':
          const title = this.caseSensitive ? card.title : card.title.toLowerCase();
          const content = this.caseSensitive ? card.content : card.content.toLowerCase();
          const path = this.caseSensitive ? card.path : card.path.toLowerCase();
          
          return title.includes(query) || content.includes(query) || path.includes(query);
      }
      
      return searchTarget.includes(query);
    });
  }
  
  /**
   * 검색 쿼리 업데이트
   * @param query 새 검색 쿼리
   */
  updateQuery(query: string): void {
    this.query = query;
  }
  
  /**
   * 검색 타입 업데이트
   * @param searchType 새 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  updateSearchType(searchType: SearchType, frontmatterKey?: string): void {
    this.searchType = searchType;
    this.frontmatterKey = frontmatterKey;
  }
  
  /**
   * 대소문자 구분 여부 업데이트
   * @param caseSensitive 대소문자 구분 여부
   */
  updateCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
} 