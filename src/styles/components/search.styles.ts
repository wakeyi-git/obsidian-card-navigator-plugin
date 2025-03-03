/**
 * 검색 스타일 상수
 * 
 * 이 파일은 검색 관련 모든 스타일 상수를 정의합니다.
 * 클래스 이름, 스타일 값, 애니메이션 등을 포함합니다.
 */

import { SizeValue } from '../variables';

/**
 * 검색 관련 클래스 이름
 */
export const SEARCH_CLASS_NAMES = {
  // 검색 컨테이너
  CONTAINER: 'card-navigator-search',
  WRAPPER: 'card-navigator-search-wrapper',
  CONTENT: 'card-navigator-search-content',

  // 검색 바
  BAR: {
    CONTAINER: 'card-navigator-search-bar',
    INPUT: 'card-navigator-search-input',
    ICON: 'card-navigator-search-icon',
    CLEAR: 'card-navigator-search-clear',
  },

  // 검색 결과
  RESULTS: {
    CONTAINER: 'card-navigator-search-results',
    LIST: 'card-navigator-search-results-list',
    ITEM: {
      BASE: 'card-navigator-search-result',
      TITLE: 'card-navigator-search-result-title',
      HEADER: 'card-navigator-search-result-header',
      TAG: 'card-navigator-search-result-tag',
      CONTENT: 'card-navigator-search-result-content',
      FRONTMATTER: 'card-navigator-search-result-frontmatter',
    },
    NO_RESULTS: 'card-navigator-search-no-results',
  },

  // 검색 제안
  SUGGESTIONS: {
    CONTAINER: 'card-navigator-search-suggestions',
    LIST: 'card-navigator-search-suggestions-list',
    ITEM: 'card-navigator-search-suggestion',
  },

  // 검색 옵션
  OPTIONS: {
    CONTAINER: 'card-navigator-search-options',
    SETTING: {
      CONTAINER: 'card-navigator-search-setting',
      TITLE: 'card-navigator-search-setting-title',
      DESCRIPTION: 'card-navigator-search-setting-description',
      CONTROL: 'card-navigator-search-setting-control'
    }
  },

  // 검색 상태
  STATUS: {
    LOADING: 'card-navigator-search-loading',
    ERROR: 'card-navigator-search-error',
    EMPTY: 'card-navigator-search-empty',
  },

  // 검색 매치
  MATCH: {
    BASE: 'card-navigator-search-match',
    TITLE: 'card-navigator-search-match-title',
    HEADER: 'card-navigator-search-match-header',
    TAG: 'card-navigator-search-match-tag',
    CONTENT: 'card-navigator-search-match-content',
    FRONTMATTER: 'card-navigator-search-match-frontmatter',
    HIGHLIGHT: 'card-navigator-search-highlight',
    SELECTED: 'card-navigator-search-selected',
  },

  // 최상위 상태 클래스 (하위 호환성)
  LOADING: 'card-navigator-search-loading',
  ERROR: 'card-navigator-search-error',
  NO_RESULTS: 'card-navigator-search-no-results',
  HIGHLIGHT: 'card-navigator-search-highlight',
};

/**
 * 검색 스타일
 */
export const SEARCH_STYLES = {
  // 검색 바 스타일
  BAR: {
    HEIGHT: '40px',
    MAX_WIDTH: '600px',
    PADDING: '8px 12px',
    BORDER_RADIUS: '4px',
  },

  // 검색 결과 스타일
  RESULTS: {
    MAX_HEIGHT: '400px',
    ITEM_PADDING: '8px 12px',
    ITEM_MARGIN: '4px 0',
  },

  // 검색 제안 스타일
  SUGGESTIONS: {
    MAX_HEIGHT: '200px',
    ITEM_PADDING: '4px 8px',
  },

  // 검색 옵션 스타일
  OPTIONS: {
    PADDING: '8px',
    GAP: '8px',
  },

  // 하이라이트 스타일
  HIGHLIGHT: {
    BACKGROUND_COLOR: 'var(--text-highlight-bg)',
    COLOR: 'var(--text-highlight-fg)',
    PADDING: '0 2px',
    BORDER_RADIUS: '2px',
    TAG: 'mark',
    CONTEXT_LENGTH: 50,
    MAX_HIGHLIGHTS: 10,
    SEPARATOR: '...',
  },
};

/**
 * 검색 애니메이션
 */
export const SEARCH_ANIMATIONS = {
  // 결과 표시
  RESULTS_APPEAR: {
    DURATION: 200,
    EASING: 'ease-out',
  },

  // 하이라이트
  HIGHLIGHT: {
    DURATION: 150,
    EASING: 'ease',
  },
};

/**
 * 검색 성능 설정
 */
export const SEARCH_PERFORMANCE = {
  // 검색 디바운스
  DEBOUNCE: {
    INPUT: 200,
    RESULTS: 100,
  },

  // 결과 제한
  LIMITS: {
    MAX_RESULTS: 50,
    MAX_SUGGESTIONS: 10,
  },
}; 