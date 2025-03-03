/**
 * 레이아웃 스타일 상수
 * 
 * 이 파일은 레이아웃 관련 모든 스타일 상수를 정의합니다.
 * 클래스 이름, 스타일 값, 애니메이션, 브레이크포인트 등을 포함합니다.
 */

import { SizeValue, ColorValue } from '../variables';
import { LayoutType, LayoutDirection, CardAlignment, CardSizeMode } from '../../core/types/layout.types';

/**
 * 레이아웃 클래스 이름
 */
export const LAYOUT_CLASS_NAMES = {
  // 컨테이너
  CONTAINER: {
    ROOT: 'card-navigator-container',
    BASE: 'card-navigator-base-container',
    CARDS: 'card-navigator-card-container',
  },

  // 레이아웃 타입
  TYPE: {
    MASONRY: 'card-navigator-layout-masonry',
    GRID: 'card-navigator-layout-grid',
    LIST: 'card-navigator-layout-list',
  },

  // 레이아웃 방향
  DIRECTION: {
    VERTICAL: 'card-navigator-layout-vertical',
    HORIZONTAL: 'card-navigator-layout-horizontal',
  },

  // 카드 정렬
  ALIGNMENT: {
    LEFT: 'card-navigator-layout-align-left',
    CENTER: 'card-navigator-layout-align-center',
    RIGHT: 'card-navigator-layout-align-right',
  },

  // 크기 관련
  SIZE: {
    SMALL: 'card-navigator-layout-size-small',
    MEDIUM: 'card-navigator-layout-size-medium',
    LARGE: 'card-navigator-layout-size-large',
  },

  // 카드
  CARD: {
    CONTAINER: 'card-navigator-card',
    HEADER: 'card-navigator-card-header',
    TITLE: 'card-navigator-card-title',
    BODY: 'card-navigator-card-body',
    FOOTER: 'card-navigator-card-footer',
    TAGS: {
      CONTAINER: 'card-navigator-card-tags',
      TAG: 'card-navigator-card-tag',
    },
    STATE: {
      SELECTED: 'card-navigator-card-selected',
      FOCUSED: 'card-navigator-card-focused',
      DRAGGING: 'card-navigator-card-dragging',
      DROP_TARGET: 'card-navigator-card-drop-target',
      HOVER: 'card-navigator-card-hover',
    },
  },

  // 빈 상태
  EMPTY_STATE: {
    CONTAINER: 'card-navigator-empty-state',
    ICON: 'card-navigator-empty-state-icon',
    MESSAGE: 'card-navigator-empty-state-message',
  },

  // 컴포넌트
  COMPONENTS: {
    HEADER: 'card-navigator-header',
    BODY: 'card-navigator-body',
    FOOTER: 'card-navigator-footer',
    TOOLBAR: 'card-navigator-toolbar',
    SEARCH: 'card-navigator-search',
    FILTER: 'card-navigator-filter',
  },

  // 컨텐츠
  CONTENT: {
    TITLE: 'card-navigator-content-title',
    TEXT: 'card-navigator-content-text',
    TAG: 'card-navigator-content-tag',
    DATE: 'card-navigator-content-date',
    ICON: 'card-navigator-content-icon',
    DATES: 'card-navigator-content-dates',
    TAGS: 'card-navigator-content-tags',
    MORE_TAGS: 'card-navigator-content-more-tags',
    CREATION_TIME: 'card-navigator-content-creation-time',
    MODIFICATION_TIME: 'card-navigator-content-modification-time',
  },

  // 상태
  STATUS: {
    LOADING: 'card-navigator-status-loading',
    ERROR: 'card-navigator-status-error',
    EMPTY: 'card-navigator-status-empty',
    SUCCESS: 'card-navigator-status-success',
  },

  // 비활성화
  DISABLED: {
    CONTAINER: 'card-navigator-disabled',
    BUTTON: 'card-navigator-button-disabled',
    LINK: 'card-navigator-link-disabled',
    MATH: 'card-navigator-math-disabled',
    CODE: 'card-navigator-code-disabled',
    IMAGE: 'card-navigator-image-disabled',
  },

  // 상호작용
  INTERACTION: {
    CLICKABLE: 'card-navigator-clickable',
    DRAGGABLE: 'card-navigator-draggable',
    DROPPABLE: 'card-navigator-droppable',
    HOVERABLE: 'card-navigator-hoverable',
    ZOOMABLE: 'card-navigator-zoomable',
  },

  // 버튼
  BUTTON: {
    BASE: 'card-navigator-button',
    CONFIRM: 'card-navigator-button-confirm',
    CANCEL: 'card-navigator-button-cancel',
    PRIMARY: 'card-navigator-button-primary',
    SECONDARY: 'card-navigator-button-secondary',
    DISABLED: 'card-navigator-button-disabled',
  },

  // 테마
  THEME: {
    LIGHT: 'card-navigator-theme-light',
    DARK: 'card-navigator-theme-dark',
    SYSTEM: 'card-navigator-theme-system',
  },

  // 애니메이션
  ANIMATION: {
    APPEAR: 'card-navigator-layout-appear',
    DISAPPEAR: 'card-navigator-layout-disappear',
    MOVE: 'card-navigator-layout-move',
    TRANSITION: 'card-navigator-layout-transition',
  },

  // 카드 상태
  CARD_NORMAL: 'card-navigator-layout-card-normal',
  CARD_SELECTED: 'card-navigator-layout-card-selected',
  CARD_FOCUSED: 'card-navigator-layout-card-focused',
  CARD_DRAGGING: 'card-navigator-layout-card-dragging',
  CARD_DROP_TARGET: 'card-navigator-layout-card-drop-target',
  CARD_HOVER: 'card-navigator-layout-card-hover',
};

/**
 * 레이아웃 스타일
 */
export const LAYOUT_STYLES = {
  // 컨테이너 스타일
  CONTAINER: {
    PADDING: '16px',
    GAP: '16px',
    MIN_WIDTH: '240px',
    MAX_WIDTH: '100%',
    MIN_HEIGHT: '120px',
    MAX_HEIGHT: '100%',
  },

  // 카드 스타일
  CARD: {
    MIN_WIDTH: '240px',
    MAX_WIDTH: '800px',
    MIN_HEIGHT: '120px',
    MAX_HEIGHT: '800px',
    PADDING: '16px',
    BORDER_RADIUS: '8px',
    GAP: '16px',
  },

  // 그리드 스타일
  GRID: {
    GAP: '16px',
    MIN_COLUMNS: 1,
    MAX_COLUMNS: 12,
    MIN_ROWS: 1,
    MAX_ROWS: 12,
    MIN_COLUMN_WIDTH: '240px',
    MAX_COLUMN_WIDTH: '800px',
  },

  // 메이슨리 스타일
  MASONRY: {
    GAP: '16px',
    COLUMN_GAP: '16px',
    ROW_GAP: '16px',
    MIN_COLUMNS: 1,
    MAX_COLUMNS: 12,
    MIN_COLUMN_WIDTH: '240px',
    MAX_COLUMN_WIDTH: '800px',
  },

  // 리스트 스타일
  LIST: {
    GAP: '16px',
    ITEM_MIN_HEIGHT: '40px',
    ITEM_MAX_HEIGHT: '200px',
  },
};

/**
 * 레이아웃 기본값
 */
export const LAYOUT_DEFAULTS = {
  // 레이아웃 타입
  TYPE: LayoutType.MASONRY,
  DIRECTION: LayoutDirection.VERTICAL,
  CARD_ALIGNMENT: CardAlignment.LEFT,
  CARD_SIZE_MODE: CardSizeMode.ADAPTIVE,

  // 카드 크기
  CARD_WIDTH: 300,
  CARD_HEIGHT: 200,
  GRID_COLUMNS: 3,
  GRID_ROWS: 2,
  MASONRY_COLUMNS: 3,
  LIST_ITEM_HEIGHT: 80,
};

/**
 * 레이아웃 성능 설정
 */
export const LAYOUT_PERFORMANCE = {
  // 가상화
  VIRTUALIZATION: {
    ENABLED: true,
    BUFFER: 5,
    OVERSCAN: 3,
  },

  // 지연 로딩
  LAZY_LOADING: {
    ENABLED: true,
    THRESHOLD: 200,
    BATCH_SIZE: 10,
  },

  // 이벤트 처리
  EVENTS: {
    RESIZE_DEBOUNCE: 100,
    SCROLL_DEBOUNCE: 50,
    LAYOUT_CALCULATION_DEBOUNCE: 100,
    LAYOUT_RENDERING_DEBOUNCE: 16,
    USE_PASSIVE: true,
  },
};

/**
 * 레이아웃 애니메이션
 */
export const LAYOUT_ANIMATIONS = {
  // 기본
  DEFAULT: {
    DURATION: 300,
    EASING: 'ease',
  },

  // 카드
  CARD: {
    APPEAR: {
      DURATION: 200,
      EASING: 'ease-out',
    },
    MOVE: {
      DURATION: 300,
      EASING: 'ease-in-out',
    },
    DISAPPEAR: {
      DURATION: 200,
      EASING: 'ease-in',
    },
  },

  // 레이아웃 전환
  TRANSITION: {
    DURATION: 400,
    EASING: 'ease-in-out',
  },
};

/**
 * 레이아웃 브레이크포인트
 */
export const LAYOUT_BREAKPOINTS = {
  // 디바이스
  DEVICE: {
    MOBILE: 480,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE_DESKTOP: 1440,
  },

  // 레이아웃
  LAYOUT: {
    SINGLE_COLUMN: 480,
    TWO_COLUMNS: 768,
    THREE_COLUMNS: 1024,
    FOUR_COLUMNS: 1440,
  },

  // 방향
  DIRECTION: {
    HORIZONTAL_THRESHOLD: 0.8, // 너비/높이 비율
  },
};