/**
 * 모드 타입 정의
 */
export type ModeType = 'folder' | 'tag';

/**
 * 모드 인터페이스
 * 폴더 모드와 태그 모드의 공통 인터페이스를 정의합니다.
 */
export interface IMode {
  /**
   * 모드 타입
   */
  type: ModeType;
  
  /**
   * 카드 세트 가져오기
   * 현재 모드에 따라 카드 세트를 가져옵니다.
   */
  getCardSets(): Promise<string[]>;
  
  /**
   * 현재 선택된 카드 세트
   */
  currentCardSet: string | null;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   */
  selectCardSet(cardSet: string): void;
  
  /**
   * 필터 옵션 가져오기
   * 현재 모드에 따라 필터링 옵션을 가져옵니다.
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 설정 초기화
   * 현재 모드의 설정을 초기화합니다.
   */
  reset(): void;
}

/**
 * 모드 추상 클래스
 * 모드 인터페이스를 구현하는 추상 클래스입니다.
 */
export abstract class Mode implements IMode {
  type: ModeType;
  currentCardSet: string | null = null;
  
  constructor(type: ModeType) {
    this.type = type;
  }
  
  abstract getCardSets(): Promise<string[]>;
  
  selectCardSet(cardSet: string): void {
    this.currentCardSet = cardSet;
  }
  
  abstract getFilterOptions(): Promise<string[]>;
  
  /**
   * 설정 초기화
   * 현재 모드의 설정을 초기화합니다.
   */
  reset(): void {
    this.currentCardSet = null;
  }
} 