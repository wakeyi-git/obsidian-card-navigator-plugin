/**
 * 레이아웃 컴포넌트 스타일 상수
 * 
 * 이 파일은 레이아웃 컴포넌트와 관련된 CSS 클래스 이름과 스타일 상수를 정의합니다.
 * 레이아웃 관련 모든 CSS 클래스 이름을 중앙 집중화하여 일관성을 유지합니다.
 */

import { SIZES } from '../variables';

/**
 * 레이아웃 CSS 클래스 이름
 * 레이아웃 관련 모든 CSS 클래스 이름을 정의합니다.
 */
export const LAYOUT_CLASS_NAMES = {
  // 컨테이너 관련
  CONTAINER: 'card-navigator-container',
  VERTICAL: 'card-navigator-vertical',
  HORIZONTAL: 'card-navigator-horizontal',
  
  // 레이아웃 타입 관련
  LIST: 'card-navigator-list',
  GRID: 'card-navigator-grid',
  MASONRY: 'card-navigator-masonry',
  
  // 카드 관련
  CARD_WRAPPER: 'card-navigator-card-wrapper',
  CARD: 'card-navigator-card',
  CARD_CONTENT: 'card-navigator-card-content',
  CARD_HEADER: 'card-navigator-card-header',
  CARD_BODY: 'card-navigator-card-body',
  CARD_FOOTER: 'card-navigator-card-footer',
  
  // 카드 상태 관련
  CARD_ACTIVE: 'card-navigator-card-active',
  CARD_FOCUSED: 'card-navigator-card-focused',
  CARD_SELECTED: 'card-navigator-card-selected',
  CARD_DRAGGING: 'card-navigator-card-dragging',
  CARD_DROP_TARGET: 'card-navigator-card-drop-target',
  
  // 상태 관련
  LOADING: 'card-navigator-loading',
  EMPTY: 'card-navigator-empty',
  VIRTUALIZED: 'card-navigator-virtualized',
};

/**
 * 레이아웃 스타일 상수
 * 레이아웃 관련 스타일 값을 정의합니다.
 */
export const LAYOUT_STYLES = {
  // 컨테이너 스타일
  CONTAINER: {
    PADDING: SIZES.M,
    GAP: SIZES.M,
  },
  
  // 그리드 레이아웃 스타일
  GRID: {
    GAP: SIZES.M,
    MIN_CARD_WIDTH: '240px',
  },
  
  // 메이슨리 레이아웃 스타일
  MASONRY: {
    GAP: SIZES.M,
    COLUMN_GAP: SIZES.M,
    ROW_GAP: SIZES.M,
  },
  
  // 리스트 레이아웃 스타일
  LIST: {
    GAP: SIZES.M,
  },
  
  // 애니메이션 스타일
  ANIMATION: {
    DURATION: '0.3s',
    EASING: 'ease',
  },
  
  // 컨테이너 스타일 (기존 layout.constants.ts에서 가져온 값)
  CONTAINER_PADDING: '16px',
  CONTAINER_GAP: '16px',
  
  // 카드 스타일 (기존 layout.constants.ts에서 가져온 값)
  CARD_MIN_WIDTH: '240px',
  CARD_MAX_WIDTH: '800px',
  CARD_MIN_HEIGHT: '120px',
  CARD_MAX_HEIGHT: '800px',
  CARD_PADDING: '16px',
  CARD_BORDER_RADIUS: '8px',
  CARD_GAP: '16px',
  
  // 그리드 스타일 (기존 layout.constants.ts에서 가져온 값)
  GRID_GAP: '16px',
  
  // 메이슨리 스타일 (기존 layout.constants.ts에서 가져온 값)
  MASONRY_GAP: '16px',
  MASONRY_COLUMN_GAP: '16px',
  MASONRY_ROW_GAP: '16px',
  
  // 리스트 스타일 (기존 layout.constants.ts에서 가져온 값)
  LIST_GAP: '16px',
};