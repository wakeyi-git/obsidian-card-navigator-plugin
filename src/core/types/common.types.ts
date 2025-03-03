/**
 * 공통 타입 정의
 * 
 * 이 파일은 코어와 스타일 도메인 간에 공유되는 타입을 정의합니다.
 * 중복을 방지하고 일관성을 유지하기 위해 사용됩니다.
 */

/**
 * 테마 모드 타입
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 크기 값 타입
 * CSS 크기 값을 나타냅니다.
 */
export type SizeValue = string | number;

/**
 * 색상 값 타입
 * CSS 색상 값을 나타냅니다.
 */
export type ColorValue = string;

/**
 * 그림자 값 타입
 * CSS 그림자 값을 나타냅니다.
 */
export type ShadowValue = string;

/**
 * 스타일 상태 타입
 * UI 요소의 다양한 상태를 나타냅니다.
 */
export type StyleState = 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'selected';

/**
 * 텍스트 스타일 옵션 인터페이스
 * 텍스트 스타일 관련 옵션을 정의합니다.
 */
export interface TextStyleOptions {
  /**
   * 글꼴 크기
   */
  fontSize?: SizeValue;
  
  /**
   * 글꼴 두께
   */
  fontWeight?: string | number;
  
  /**
   * 글꼴 색상
   */
  color?: ColorValue;
  
  /**
   * 줄 높이
   */
  lineHeight?: SizeValue;
  
  /**
   * 텍스트 정렬
   */
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * 방향 타입
 * 레이아웃 방향을 정의합니다.
 */
export type Direction = 'vertical' | 'horizontal';

/**
 * 스크롤 방향 타입
 * 스크롤 방향을 정의합니다.
 */
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 정렬 방향 열거형
 */
export enum SortDirection {
  ASC = 'asc',  // 오름차순
  DESC = 'desc' // 내림차순
}

/**
 * 이벤트 데이터 기본 인터페이스
 * 모든 이벤트 데이터 인터페이스의 기본이 되는 인터페이스입니다.
 */
export interface IEventData {
  /**
   * 이벤트 타입
   */
  type: string;
  
  /**
   * 이벤트 발생 시간
   */
  timestamp: number;
}

/**
 * 이벤트 핸들러 타입
 * 이벤트 처리 함수의 타입을 정의합니다.
 */
export type EventHandler<T extends IEventData> = (data: T) => void; 