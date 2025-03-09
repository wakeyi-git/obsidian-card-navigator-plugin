/**
 * 모드 타입 정의
 */
export type ModeType = 'folder' | 'tag' | 'search';

/**
 * 모드 인터페이스
 * 폴더 모드, 태그 모드, 검색 모드의 공통 인터페이스를 정의합니다.
 * 모드는 카드셋을 구성하는 방식을 나타냅니다.
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
   * @param cardSet 선택할 카드 세트 (null인 경우 카드 세트 선택 해제)
   */
  selectCardSet(cardSet: string | null): void;
  
  /**
   * 필터 옵션 가져오기
   * 현재 모드에 따라 필터링 옵션을 가져옵니다.
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 파일 목록 가져오기
   * 현재 모드에 따라 파일 목록을 가져옵니다.
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 설정 초기화
   * 현재 모드의 설정을 초기화합니다.
   */
  reset(): void;
  
  /**
   * 고정 여부 설정
   * 현재 모드의 카드셋 고정 여부를 설정합니다.
   * @param isFixed 고정 여부
   */
  setFixed(isFixed: boolean): void;
  
  /**
   * 고정 여부 확인
   * 현재 모드의 카드셋 고정 여부를 확인합니다.
   * @returns 고정 여부
   */
  isFixed(): boolean;
}

/**
 * 모드 추상 클래스
 * 모드 인터페이스를 구현하는 추상 클래스입니다.
 */
export abstract class Mode implements IMode {
  type: ModeType;
  currentCardSet: string | null = null;
  protected isFixedValue = false;
  
  constructor(type: ModeType) {
    this.type = type;
  }
  
  abstract getCardSets(): Promise<string[]>;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트 (null인 경우 카드 세트 선택 해제)
   */
  selectCardSet(cardSet: string | null): void {
    console.log(`[Mode] 카드 세트 선택: ${cardSet}, 이전 값: ${this.currentCardSet}, 모드: ${this.type}`);
    this.currentCardSet = cardSet;
    console.log(`[Mode] 카드 세트 선택 완료: ${this.currentCardSet}`);
  }
  
  abstract getFilterOptions(): Promise<string[]>;
  
  /**
   * 파일 목록 가져오기
   * 현재 모드에 따라 파일 목록을 가져옵니다.
   */
  abstract getFiles(): Promise<string[]>;
  
  /**
   * 설정 초기화
   * 현재 모드의 설정을 초기화합니다.
   */
  reset(): void {
    this.currentCardSet = null;
    this.isFixedValue = false;
  }
  
  /**
   * 고정 여부 설정
   * 현재 모드의 카드셋 고정 여부를 설정합니다.
   * @param isFixed 고정 여부
   */
  setFixed(isFixed: boolean): void {
    this.isFixedValue = isFixed;
    console.log(`[Mode] ${this.type} 모드 고정 상태 변경: ${isFixed}`);
  }
  
  /**
   * 고정 여부 확인
   * 현재 모드의 카드셋 고정 여부를 확인합니다.
   * @returns 고정 여부
   */
  isFixed(): boolean {
    return this.isFixedValue;
  }
} 