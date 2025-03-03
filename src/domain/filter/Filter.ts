import { ICard } from '../card/Card';

/**
 * 필터 타입 정의
 */
export type FilterType = 'tag' | 'folder' | 'frontmatter';

/**
 * 필터 인터페이스
 * 카드를 필터링하기 위한 인터페이스입니다.
 */
export interface IFilter {
  /**
   * 필터 타입
   */
  type: FilterType;
  
  /**
   * 필터 값
   */
  value: string | string[];
  
  /**
   * 필터 적용
   * 주어진 카드 목록에 필터를 적용합니다.
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  apply(cards: ICard[]): ICard[];
  
  /**
   * 필터 값 설정
   * @param value 필터 값
   */
  setValue(value: string | string[]): void;
  
  /**
   * 필터 값 가져오기
   * @returns 필터 값
   */
  getValue(): string | string[];
}

/**
 * 필터 추상 클래스
 * 필터 인터페이스를 구현하는 추상 클래스입니다.
 */
export abstract class Filter implements IFilter {
  type: FilterType;
  value: string | string[];
  
  constructor(type: FilterType, value: string | string[] = []) {
    this.type = type;
    this.value = value;
  }
  
  abstract apply(cards: ICard[]): ICard[];
  
  setValue(value: string | string[]): void {
    this.value = value;
  }
  
  getValue(): string | string[] {
    return this.value;
  }
  
  /**
   * 필터 값이 비어있는지 확인
   * @returns 필터 값이 비어있는지 여부
   */
  isEmpty(): boolean {
    if (Array.isArray(this.value)) {
      return this.value.length === 0;
    }
    return !this.value;
  }
} 