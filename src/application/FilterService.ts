import { ICard } from '../domain/card/Card';

/**
 * 필터 서비스 인터페이스
 * 카드 필터링을 위한 인터페이스입니다.
 */
export interface IFilterService {
  /**
   * 필터 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  applyFilters(cards: ICard[]): ICard[];
  
  /**
   * 서비스 초기화
   */
  initialize(): void;
  
  /**
   * 설정 초기화
   */
  reset(): void;
}

/**
 * 필터 서비스 클래스
 * 카드 필터링을 위한 클래스입니다.
 */
export class FilterService implements IFilterService {
  constructor() {
    // 필터 초기화
  }
  
  /**
   * 필터 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  applyFilters(cards: ICard[]): ICard[] {
    console.log(`[FilterService] 필터 적용 시작, 카드 수: ${cards.length}`);
    
    // 현재는 필터가 없으므로 모든 카드 반환
    // 향후 필터 기능 추가 시 여기에 구현
    
    console.log(`[FilterService] 필터 적용 완료, 필터링 후 카드 수: ${cards.length}`);
    return cards;
  }
  
  /**
   * 서비스 초기화
   */
  initialize(): void {
    // 초기화 로직
  }
  
  /**
   * 설정 초기화
   */
  reset(): void {
    // 설정 초기화 로직
  }
} 