import { ICard } from '../card/Card';
import { Filter, FilterType } from './Filter';

/**
 * 프론트매터 필터 클래스
 * 카드의 프론트매터 값을 기준으로 필터링하는 클래스입니다.
 */
export class FrontmatterFilter extends Filter {
  /**
   * 프론트매터 키
   */
  private key: string;
  
  constructor(key: string = '', value: string | string[] = []) {
    super('frontmatter', value);
    this.key = key;
  }
  
  /**
   * 프론트매터 필터 적용
   * 주어진 카드 목록에서 지정된 프론트매터 값을 가진 카드만 필터링합니다.
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    if (this.isEmpty() || !this.key) {
      return cards;
    }
    
    const filterValues = Array.isArray(this.value) ? this.value : [this.value];
    
    return cards.filter(card => {
      // 카드의 프론트매터가 없으면 필터링에서 제외
      if (!card.frontmatter) {
        return false;
      }
      
      // 프론트매터에 해당 키가 없으면 필터링에서 제외
      const frontmatterValue = card.frontmatter[this.key];
      if (frontmatterValue === undefined) {
        return false;
      }
      
      // 프론트매터 값이 배열인 경우
      if (Array.isArray(frontmatterValue)) {
        // 배열 값 중 하나라도 필터 값에 포함되어 있으면 통과
        return frontmatterValue.some(value => 
          filterValues.includes(String(value))
        );
      }
      
      // 프론트매터 값이 문자열이나 다른 타입인 경우
      return filterValues.includes(String(frontmatterValue));
    });
  }
  
  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setKey(key: string): void {
    this.key = key;
  }
  
  /**
   * 프론트매터 키 가져오기
   * @returns 프론트매터 키
   */
  getKey(): string {
    return this.key;
  }
  
  /**
   * 프론트매터 값 추가
   * @param value 추가할 값
   */
  addValue(value: string): void {
    if (Array.isArray(this.value)) {
      if (!this.value.includes(value)) {
        this.value = [...this.value, value];
      }
    } else {
      this.value = [this.value, value].filter(Boolean);
    }
  }
  
  /**
   * 프론트매터 값 제거
   * @param value 제거할 값
   */
  removeValue(value: string): void {
    if (Array.isArray(this.value)) {
      this.value = this.value.filter(v => v !== value);
    } else if (this.value === value) {
      this.value = [];
    }
  }
  
  /**
   * 모든 프론트매터 값 제거
   */
  clearValues(): void {
    this.value = [];
  }
} 