/**
 * 레이아웃 관련 상수
 * 
 * 이 파일은 카드 레이아웃과 관련된 모든 상수를 정의합니다.
 * 레이아웃 모드, 기본 설정값, 임계값 등을 포함합니다.
 */

import { LayoutType } from '../types/layout.types';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';

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
 * 레이아웃 스타일 상수
 */
export const LAYOUT_STYLES = {
  // 컨테이너 스타일
  CONTAINER_PADDING: '16px',
  CONTAINER_GAP: '16px',
  
  // 카드 스타일
  CARD_MIN_WIDTH: '240px',
  CARD_MAX_WIDTH: '800px',
  CARD_MIN_HEIGHT: '120px',
  CARD_MAX_HEIGHT: '800px',
  CARD_PADDING: '16px',
  CARD_BORDER_RADIUS: '8px',
  CARD_GAP: '16px',
  
  // 그리드 스타일
  GRID_GAP: '16px',
  
  // 메이슨리 스타일
  MASONRY_GAP: '16px',
  MASONRY_COLUMN_GAP: '16px',
  MASONRY_ROW_GAP: '16px',
  
  // 리스트 스타일
  LIST_GAP: '16px',
};

/**
 * 레이아웃 설정 상수
 */
export const LAYOUT_SETTINGS = {
  // 기본 설정
  DEFAULT_LAYOUT_TYPE: LayoutType.MASONRY,
  DEFAULT_LAYOUT_DIRECTION: LayoutDirection.VERTICAL,
  DEFAULT_CARD_ALIGNMENT: CardAlignment.LEFT,
  DEFAULT_CARD_SIZE_MODE: CardSizeMode.ADAPTIVE,
  
  // 카드 크기 설정
  DEFAULT_CARD_WIDTH: 300,
  DEFAULT_CARD_HEIGHT: 200,
  DEFAULT_CARD_MIN_WIDTH: 240,
  DEFAULT_CARD_MAX_WIDTH: 800,
  DEFAULT_CARD_MIN_HEIGHT: 120,
  DEFAULT_CARD_MAX_HEIGHT: 800,
  
  // 그리드 설정
  DEFAULT_GRID_COLUMNS: 3,
  DEFAULT_GRID_ROWS: 2,
  
  // 메이슨리 설정
  DEFAULT_MASONRY_COLUMNS: 3,
  
  // 리스트 설정
  DEFAULT_LIST_ITEM_HEIGHT: 80,
};

/**
 * 레이아웃 제한 상수
 */
export const LAYOUT_LIMITS = {
  // 카드 크기 제한
  MIN_CARD_WIDTH: 120,
  MAX_CARD_WIDTH: 1200,
  MIN_CARD_HEIGHT: 80,
  MAX_CARD_HEIGHT: 1200,
  
  // 그리드 제한
  MIN_GRID_COLUMNS: 1,
  MAX_GRID_COLUMNS: 12,
  MIN_GRID_ROWS: 1,
  MAX_GRID_ROWS: 12,
  
  // 메이슨리 제한
  MIN_MASONRY_COLUMNS: 1,
  MAX_MASONRY_COLUMNS: 12,
  
  // 리스트 제한
  MIN_LIST_ITEM_HEIGHT: 40,
  MAX_LIST_ITEM_HEIGHT: 200,
};

/**
 * 레이아웃 지연 상수
 */
export const LAYOUT_DELAYS = {
  // 리사이즈 지연
  RESIZE_DEBOUNCE: 100,
  
  // 스크롤 지연
  SCROLL_DEBOUNCE: 50,
  
  // 레이아웃 계산 지연
  LAYOUT_CALCULATION_DEBOUNCE: 100,
  
  // 레이아웃 렌더링 지연
  LAYOUT_RENDERING_DEBOUNCE: 16,
};

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

/**
 * 레이아웃 애니메이션 상수
 */
export const LAYOUT_ANIMATIONS = {
  // 기본 애니메이션
  DEFAULT_DURATION: 300,
  DEFAULT_EASING: 'ease',
  
  // 카드 애니메이션
  CARD_APPEAR_DURATION: 200,
  CARD_APPEAR_EASING: 'ease-out',
  CARD_MOVE_DURATION: 300,
  CARD_MOVE_EASING: 'ease-in-out',
  CARD_DISAPPEAR_DURATION: 200,
  CARD_DISAPPEAR_EASING: 'ease-in',
  
  // 레이아웃 전환 애니메이션
  LAYOUT_TRANSITION_DURATION: 400,
  LAYOUT_TRANSITION_EASING: 'ease-in-out',
};

/**
 * 레이아웃 성능 상수
 */
export const LAYOUT_PERFORMANCE = {
  // 가상화 설정
  VIRTUALIZATION_ENABLED: true,
  VIRTUALIZATION_BUFFER: 5,
  VIRTUALIZATION_OVERSCAN: 3,
  
  // 지연 로딩 설정
  LAZY_LOADING_ENABLED: true,
  LAZY_LOADING_THRESHOLD: 200,
  LAZY_LOADING_BATCH_SIZE: 10,
  
  // 성능 최적화 설정
  THROTTLE_SCROLL_EVENTS: true,
  DEBOUNCE_RESIZE_EVENTS: true,
  USE_REQUEST_ANIMATION_FRAME: true,
  USE_PASSIVE_EVENTS: true,
};

/**
 * 레이아웃 브레이크포인트 상수
 */
export const LAYOUT_BREAKPOINTS = {
  // 반응형 브레이크포인트
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1440,
  
  // 레이아웃 브레이크포인트
  SINGLE_COLUMN: 480,
  TWO_COLUMNS: 768,
  THREE_COLUMNS: 1024,
  FOUR_COLUMNS: 1440,
  
  // 방향 브레이크포인트
  HORIZONTAL_THRESHOLD: 0.8, // 너비/높이 비율
};

// LAYOUT_CLASS_NAMES 상수를 내보냅니다.
export { LAYOUT_CLASS_NAMES }; 