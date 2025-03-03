/**
 * 툴바 스타일 상수
 * 
 * 이 파일은 툴바 관련 모든 스타일 상수를 정의합니다.
 * 클래스 이름, 스타일 값, 애니메이션 등을 포함합니다.
 */

import { SizeValue } from '../variables';

/**
 * 툴바 관련 클래스 이름
 */
export const TOOLBAR_CLASS_NAMES = {
  // 툴바 컨테이너
  CONTAINER: 'card-navigator-toolbar',

  // 섹션
  SECTION: {
    BASE: 'card-navigator-toolbar-section',
    LEFT: 'card-navigator-toolbar-section-left',
    CENTER: 'card-navigator-toolbar-section-center',
    RIGHT: 'card-navigator-toolbar-section-right',
  },

  // 검색
  SEARCH: {
    CONTAINER: 'card-navigator-search-container',
    INPUT: 'card-navigator-search-input',
    ICON: 'card-navigator-search-icon',
    CLEAR: 'card-navigator-search-clear',
  },

  // 버튼
  BUTTON: {
    CONTAINER: 'card-navigator-toolbar-button',
    ICON: 'card-navigator-toolbar-button-icon',
    LABEL: 'card-navigator-toolbar-button-label',
    TOOLTIP: 'card-navigator-toolbar-button-tooltip',
    ACTIVE: 'card-navigator-toolbar-button-active',
    DISABLED: 'card-navigator-toolbar-button-disabled',
  },

  // 구분선과 그룹
  SEPARATOR: 'card-navigator-toolbar-separator',
  GROUP: 'card-navigator-toolbar-group',
};

/**
 * 툴바 스타일
 */
export const TOOLBAR_STYLES = {
  // 툴바 크기
  HEIGHT: '40px' as SizeValue,
  PADDING: '0 8px' as SizeValue,
  
  // 버튼 크기
  BUTTON: {
    SIZE: '32px' as SizeValue,
    PADDING: '6px' as SizeValue,
    MARGIN: '0 2px' as SizeValue,
    BORDER_RADIUS: '4px' as SizeValue,
  },

  // 검색 입력
  SEARCH: {
    HEIGHT: '32px' as SizeValue,
    MAX_WIDTH: '300px' as SizeValue,
    PADDING: '4px 8px' as SizeValue,
    BORDER_RADIUS: '4px' as SizeValue,
  },

  // 구분선
  SEPARATOR: {
    WIDTH: '1px' as SizeValue,
    MARGIN: '0 8px' as SizeValue,
  },
};

/**
 * 툴바 애니메이션
 */
export const TOOLBAR_ANIMATIONS = {
  BUTTON: {
    HOVER: {
      DURATION: '150ms',
      EASING: 'ease-in-out',
    },
    ACTIVE: {
      DURATION: '100ms',
      EASING: 'ease-in',
    },
  },
}; 