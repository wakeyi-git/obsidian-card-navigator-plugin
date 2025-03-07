import { ICard } from '../card/Card';
import { Search, SearchType } from './Search';

/**
 * 정규식 검색 클래스
 * 정규식 기반 검색을 위한 클래스입니다.
 */
export class RegexSearch extends Search {
  private regex: RegExp | null = null;

  /**
   * 생성자
   * @param query 검색어 (정규식 패턴)
   * @param caseSensitive 대소문자 구분 여부
   */
  constructor(query: string = '', caseSensitive: boolean = false) {
    super('filename', query, caseSensitive); // 타입은 임의로 filename 사용 (실제로는 사용되지 않음)
    this.compileRegex();
  }

  /**
   * 검색어 설정 (정규식 패턴)
   * @param query 검색어
   */
  setQuery(query: string): void {
    super.setQuery(query);
    this.compileRegex();
  }

  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    super.setCaseSensitive(caseSensitive);
    this.compileRegex();
  }

  /**
   * 정규식 컴파일
   */
  private compileRegex(): void {
    if (!this.query) {
      this.regex = null;
      return;
    }

    try {
      this.regex = new RegExp(this.query, this.caseSensitive ? 'g' : 'gi');
    } catch (error) {
      console.error('정규식 컴파일 오류:', error);
      this.regex = null;
    }
  }

  /**
   * 정규식 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.regex) {
      return cards;
    }

    return cards.filter(card => {
      // 파일명 검색
      if (this.regex!.test(card.title)) {
        this.regex!.lastIndex = 0; // 정규식 인덱스 초기화
        return true;
      }

      // 내용 검색
      if (card.content && this.regex!.test(card.content)) {
        this.regex!.lastIndex = 0;
        return true;
      }

      // 태그 검색
      if (card.tags && card.tags.length > 0) {
        for (const tag of card.tags) {
          if (this.regex!.test(tag)) {
            this.regex!.lastIndex = 0;
            return true;
          }
        }
      }

      // 경로 검색
      if (this.regex!.test(card.path)) {
        this.regex!.lastIndex = 0;
        return true;
      }

      // 프론트매터 검색
      if (card.frontmatter) {
        for (const key in card.frontmatter) {
          const value = card.frontmatter[key];
          if (value !== null && value !== undefined && this.regex!.test(String(value))) {
            this.regex!.lastIndex = 0;
            return true;
          }
        }
      }

      return false;
    });
  }

  /**
   * 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'regex'
    };
  }

  /**
   * 정규식 객체 가져오기
   * @returns 정규식 객체
   */
  getRegex(): RegExp | null {
    return this.regex;
  }
} 