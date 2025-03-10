/**
 * 카드셋 소스 타입 정의
 */
export type CardSetSourceType = 'folder' | 'tag' | 'search';

/**
 * 카드셋 타입 정의
 * 활성: 현재 열려 있는 노트에 따라 자동으로 변경됨
 * 지정: 사용자가 지정한 값으로 고정됨
 */
export type CardSetType = 'active' | 'fixed';

/**
 * 카드셋 인터페이스
 * 카드셋의 기본 정보를 정의합니다.
 */
export interface ICardSet {
  /**
   * 카드셋 고유 식별자
   */
  id: string;
  
  /**
   * 카드셋 이름 (UI에 표시될 이름)
   */
  name: string;
  
  /**
   * 카드셋 소스 타입 (폴더, 태그, 검색)
   */
  sourceType: CardSetSourceType;
  
  /**
   * 카드셋 소스 (폴더 경로, 태그 이름, 검색 쿼리 등)
   */
  source: string;
  
  /**
   * 카드셋 타입 (활성, 고정)
   */
  type: CardSetType;
  
  /**
   * 파일 목록
   */
  files: any[];
  
  /**
   * 추가 메타데이터 (선택 사항)
   */
  metadata?: Record<string, any>;
}

/**
 * 카드셋 상태 인터페이스
 * 카드셋의 현재 상태를 정의합니다.
 */
export interface ICardSetState {
  /**
   * 현재 선택된 카드셋
   */
  currentCardSet: string | null;
  
  /**
   * 카드셋 고정 여부
   */
  isFixed: boolean;
  
  /**
   * 추가 상태 정보 (선택 사항)
   */
  metadata?: Record<string, any>;
}

/**
 * 카드셋 소스 인터페이스
 * 카드셋 소스의 기본 기능을 정의합니다.
 */
export interface ICardSetSource {
  /**
   * 소스 타입
   */
  type: CardSetSourceType;
  
  /**
   * 현재 선택된 카드셋
   */
  currentCardSet: string | null;
  
  /**
   * 카드셋 고정 여부 확인
   * @returns 고정 여부
   */
  isCardSetFixed(): boolean;
  
  /**
   * 현재 카드셋 상태 가져오기
   * @returns 카드셋 상태 객체
   */
  getState(): ICardSetState;
}

/**
 * 캐시 아이템 인터페이스
 * 캐시된 데이터 항목을 정의합니다.
 */
export interface ICacheItem<T> {
  /**
   * 캐시된 데이터
   */
  data: T;
  
  /**
   * 캐시 생성 시간 (타임스탬프)
   */
  timestamp: number;
} 