import { ICard } from '../card/Card';
import { Filter, FilterType } from './Filter';

/**
 * 태그 필터 클래스
 * 카드의 태그를 기준으로 필터링하는 클래스입니다.
 */
export class TagFilter extends Filter {
  constructor(tags: string | string[] = []) {
    super('tag', tags);
  }
  
  /**
   * 태그 필터 적용
   * 주어진 카드 목록에서 지정된 태그를 가진 카드만 필터링합니다.
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    if (this.isEmpty()) {
      return cards;
    }
    
    const tagValues = Array.isArray(this.value) ? this.value : [this.value];
    
    return cards.filter(card => {
      // 카드의 태그가 없으면 필터링에서 제외
      if (!card.tags || card.tags.length === 0) {
        return false;
      }
      
      // 지정된 태그 중 하나라도 카드의 태그에 포함되어 있으면 통과
      return tagValues.some(tag => card.tags.includes(tag));
    });
  }
  
  /**
   * 태그 추가
   * @param tag 추가할 태그
   */
  addTag(tag: string): void {
    if (Array.isArray(this.value)) {
      if (!this.value.includes(tag)) {
        this.value = [...this.value, tag];
      }
    } else {
      this.value = [this.value, tag].filter(Boolean);
    }
  }
  
  /**
   * 태그 제거
   * @param tag 제거할 태그
   */
  removeTag(tag: string): void {
    if (Array.isArray(this.value)) {
      this.value = this.value.filter(t => t !== tag);
    } else if (this.value === tag) {
      this.value = [];
    }
  }
  
  /**
   * 모든 태그 제거
   */
  clearTags(): void {
    this.value = [];
  }
} 