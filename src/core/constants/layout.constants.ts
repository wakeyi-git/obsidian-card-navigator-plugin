/**
 * 레이아웃 관련 상수
 * 
 * 이 파일은 레이아웃 관련 비즈니스 로직 상수를 정의합니다.
 * 스타일 관련 상수는 styles/components/layout.styles.ts 파일을 참조하세요.
 */

import { LayoutType } from '../types/layout.types';

/**
 * 레이아웃 방향 열거형
 */
export enum LayoutDirection {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

/**
 * 레이아웃 모드 열거형
 */
export enum LayoutMode {
  MASONRY = 'masonry',
  GRID = 'grid',
  LIST = 'list',
}

/**
 * 카드 정렬 열거형
 */
export enum CardAlignment {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

/**
 * 카드 크기 모드 열거형
 */
export enum CardSizeMode {
  FIXED = 'fixed',
  ADAPTIVE = 'adaptive',
  DYNAMIC = 'dynamic',
}

/**
 * 기본 레이아웃 타입
 */
export const DEFAULT_LAYOUT_TYPE: LayoutType = LayoutType.MASONRY;

/**
 * 레이아웃 계산 상수
 */
export const LAYOUT_CALCULATIONS = {
  // 컨테이너 계산
  CONTAINER_PADDING_FACTOR: 2,
  
  // 카드 계산
  CARD_ASPECT_RATIO: 1.5,
  CARD_PADDING_FACTOR: 2,
  
  // 그리드 계산
  GRID_GAP_FACTOR: 1,
  
  // 메이슨리 계산
  MASONRY_GAP_FACTOR: 1,
  
  // 리스트 계산
  LIST_GAP_FACTOR: 1,
};

// layout.styles.ts에서 LAYOUT_CLASS_NAMES를 가져와서 다시 내보냅니다.
export { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles'; 