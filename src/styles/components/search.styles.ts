/**
 * 검색 컴포넌트 스타일 상수
 * 
 * 이 파일은 검색 컴포넌트와 관련된 필수 스타일 상수만 정의합니다.
 * 가능한 옵시디언 기본 스타일을 활용하여 일관성을 유지합니다.
 */

import { SIZES } from '../variables';
import { SizeValue, ColorValue } from '../../core/types/common.types';

/**
 * 스타일 값 타입 - 다양한 스타일 값 타입을 포함합니다.
 */
export type StyleValue = SizeValue | ColorValue | string | number;

/**
 * 스타일 객체 타입 - 중첩된 스타일 객체를 지원합니다.
 */
export interface StyleObject {
  [key: string]: StyleValue | StyleObject;
}

// 검색 컨테이너 스타일
export const SEARCH_CONTAINER: StyleObject = {
  DISPLAY: 'flex',
  ALIGN_ITEMS: 'center',
  JUSTIFY_CONTENT: 'space-between',
  MARGIN_BOTTOM: SIZES.M,
  WIDTH: '100%',
};

// 검색 입력 필드 스타일
export const SEARCH_INPUT: StyleObject = {
  FLEX: '1',
  PADDING: `${SIZES.XS} ${SIZES.S}`,
  BORDER_RADIUS: SIZES.BORDER_RADIUS_S,
  FONT_SIZE: SIZES.FONT_SIZE_M,
  
  FOCUS: {
    OUTLINE: 'none',
  },
  
  PLACEHOLDER: {
    FONT_STYLE: 'italic',
  },
};

// 검색 옵션 스타일
export const SEARCH_OPTIONS: StyleObject = {
  CONTAINER: {
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    MARGIN_LEFT: SIZES.S,
  },
  
  BUTTON: {
    PADDING: `${SIZES.XS} ${SIZES.S}`,
    MARGIN_LEFT: SIZES.XS,
    BORDER_RADIUS: SIZES.BORDER_RADIUS_S,
    FONT_SIZE: SIZES.FONT_SIZE_S,
  },
  
  DROPDOWN: {
    POSITION: 'absolute',
    TOP: '100%',
    RIGHT: 0,
    WIDTH: '250px',
    BORDER_RADIUS: SIZES.BORDER_RADIUS_S,
    PADDING: SIZES.S,
    Z_INDEX: 100,
    
    OPTION: {
      DISPLAY: 'flex',
      ALIGN_ITEMS: 'center',
      PADDING: `${SIZES.XS} 0`,
      
      LABEL: {
        MARGIN_LEFT: SIZES.XS,
        FONT_SIZE: SIZES.FONT_SIZE_S,
      },
    },
  },
};

// 검색 제안 스타일
export const SEARCH_SUGGESTIONS: StyleObject = {
  CONTAINER: {
    POSITION: 'absolute',
    TOP: '100%',
    LEFT: 0,
    WIDTH: '100%',
    MAX_HEIGHT: '300px',
    OVERFLOW_Y: 'auto',
    BORDER_RADIUS: `0 0 ${SIZES.BORDER_RADIUS_S} ${SIZES.BORDER_RADIUS_S}`,
    Z_INDEX: 100,
  },
  
  ITEM: {
    PADDING: `${SIZES.XS} ${SIZES.S}`,
    CURSOR: 'pointer',
    
    HOVER: {
      FONT_WEIGHT: 'bold',
    },
    
    ACTIVE: {
      FONT_WEIGHT: 'bold',
    },
  },
  
  EMPTY: {
    PADDING: `${SIZES.S}`,
    FONT_STYLE: 'italic',
    TEXT_ALIGN: 'center',
  },
};

// 검색 하이라이트 스타일
export const SEARCH_HIGHLIGHT: StyleObject = {
  FONT_WEIGHT: 'bold',
  TEXT_DECORATION: 'underline',
};

// 검색 기록 스타일
export const SEARCH_HISTORY: StyleObject = {
  CONTAINER: {
    MARGIN_TOP: SIZES.S,
  },
  
  TITLE: {
    FONT_SIZE: SIZES.FONT_SIZE_S,
    FONT_WEIGHT: 'bold',
    MARGIN_BOTTOM: SIZES.XS,
  },
  
  ITEM: {
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'space-between',
    PADDING: `${SIZES.XS} ${SIZES.S}`,
    CURSOR: 'pointer',
    
    TEXT: {
      FLEX: 1,
      OVERFLOW: 'hidden',
      TEXT_OVERFLOW: 'ellipsis',
      WHITE_SPACE: 'nowrap',
    },
    
    REMOVE: {
      MARGIN_LEFT: SIZES.XS,
      CURSOR: 'pointer',
    },
  },
};

// 검색 필터 태그 스타일
export const SEARCH_FILTER_TAG: StyleObject = {
  DISPLAY: 'inline-flex',
  ALIGN_ITEMS: 'center',
  PADDING: `${SIZES.XXS} ${SIZES.XS}`,
  MARGIN_RIGHT: SIZES.XS,
  MARGIN_BOTTOM: SIZES.XS,
  BORDER_RADIUS: SIZES.BORDER_RADIUS_S,
  FONT_SIZE: SIZES.FONT_SIZE_XS,
  
  TEXT: {
    MARGIN_RIGHT: SIZES.XXS,
  },
  
  REMOVE: {
    CURSOR: 'pointer',
    FONT_SIZE: SIZES.FONT_SIZE_XS,
  },
}; 