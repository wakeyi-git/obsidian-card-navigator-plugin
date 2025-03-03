/**
 * 카드 컴포넌트 스타일 상수
 * 
 * 이 파일은 카드 컴포넌트와 관련된 필수 스타일 상수만 정의합니다.
 * 가능한 옵시디언 기본 스타일을 활용하여 일관성을 유지합니다.
 */

import { SIZES } from '../variables';
import { SizeValue, ColorValue } from '../../core/types/common.types';

/**
 * 카드 컴포넌트 CSS 변수
 */
export const CARD_CSS_VARS = {
  COLORS: {
    BACKGROUND: 'var(--card-navigator-background, var(--background-primary))',
    TEXT: 'var(--card-navigator-text, var(--text-normal))',
    BORDER: 'var(--card-navigator-border, var(--background-modifier-border))',
    HOVER: 'var(--card-navigator-hover, var(--background-modifier-hover))',
    SELECTED: 'var(--card-navigator-selected, var(--background-modifier-active))'
  },
  SIZES: {
    PADDING: 'var(--card-navigator-padding, 16px)',
    BORDER_RADIUS: 'var(--card-navigator-border-radius, 8px)',
    FONT_SIZE: {
      SMALL: 'var(--card-navigator-font-size-small, 12px)',
      NORMAL: 'var(--card-navigator-font-size-normal, 14px)',
      LARGE: 'var(--card-navigator-font-size-large, 16px)'
    }
  }
};

/**
 * 카드 컴포넌트 클래스명
 */
export const CARD_CLASS_NAMES = {
  CONTAINER: {
    ROOT: 'card-navigator',
    CARDS: 'card-navigator__cards'
  },
  CARD: {
    CONTAINER: 'card-navigator__card',
    HEADER: 'card-navigator__card-header',
    TITLE: 'card-navigator__card-title',
    BODY: 'card-navigator__card-body',
    CONTENT: 'card-navigator__card-content',
    FOOTER: 'card-navigator__card-footer',
    TAGS: {
      CONTAINER: 'card-navigator__tags',
      TAG: 'card-navigator__tag',
      MORE: 'card-navigator__tag--more'
    },
    STATE: {
      SELECTED: 'card-navigator__card--selected',
      FOCUSED: 'card-navigator__card--focused',
      DRAGGING: 'card-navigator__card--dragging'
    }
  },
  EMPTY_STATE: {
    CONTAINER: 'card-navigator-empty-state',
    ICON: 'card-navigator-empty-state-icon',
    TITLE: 'card-navigator-empty-state-title',
    DESCRIPTION: 'card-navigator-empty-state-description'
  },
  STATUS: {
    LOADING: 'card-navigator__status--loading',
    ERROR: 'card-navigator__status--error',
    EMPTY: 'card-navigator__status--empty',
    SUCCESS: 'card-navigator-status-success',
    LOADED: 'card-navigator-status-loaded',
    IMAGE_ERROR: 'card-navigator-status-image-error'
  },
  DISABLED: {
    CONTAINER: 'card-navigator-disabled',
    BUTTON: 'card-navigator-button-disabled',
    LINK: 'card-navigator-link-disabled',
    MATH: 'card-navigator-math-disabled',
    CODE: 'card-navigator-code-disabled',
    IMAGE: 'card-navigator-image-disabled'
  },
  INTERACTION: {
    CLICKABLE: 'card-navigator__interactive--clickable',
    DRAGGABLE: 'card-navigator__interactive--draggable',
    DROPPABLE: 'card-navigator-droppable',
    HOVERABLE: 'card-navigator__interactive--hoverable',
    ZOOMABLE: 'card-navigator-zoomable',
    COPY_BUTTON: 'card-navigator-copy-button'
  },
  COMPONENTS: {
    HEADER: 'card-navigator-header',
    BODY: 'card-navigator-body',
    FOOTER: 'card-navigator-footer',
    TOOLBAR: 'card-navigator-toolbar',
    SEARCH: 'card-navigator-search',
    FILTER: 'card-navigator-filter',
    CODE_WRAPPER: 'card-navigator-code-wrapper'
  },
  CONTENT: {
    TAG: 'card-navigator-content-tag',
    TAGS: 'card-navigator-content-tags',
    DATES: 'card-navigator-content-dates',
    CREATION_TIME: 'card-navigator-content-creation-time',
    MODIFICATION_TIME: 'card-navigator-content-modification-time',
    MORE_TAGS: 'card-navigator-content-more-tags'
  },
  THEME: {
    LIGHT: 'card-navigator-theme-light',
    DARK: 'card-navigator-theme-dark',
    SYSTEM: 'card-navigator-theme-system'
  }
} as const;

/**
 * 카드 스타일 옵션 인터페이스
 * 카드 스타일 생성에 필요한 옵션을 정의합니다.
 */
export interface CardStyleOptions {
  /**
   * 카드 너비
   */
  cardWidth?: SizeValue;
  
  /**
   * 카드 높이
   */
  cardHeight?: SizeValue;
  
  /**
   * 카드 패딩
   */
  cardPadding?: SizeValue;
  
  /**
   * 카드 테두리 반경
   */
  cardBorderRadius?: SizeValue;
  
  /**
   * 카드 간격
   */
  cardGap?: SizeValue;
}

/**
 * 크기 값을 CSS 크기 문자열로 변환합니다.
 * @param value 크기 값 (숫자 또는 문자열)
 * @returns CSS 크기 문자열
 */
export function toCssSize(value: SizeValue | undefined): string {
  if (value === undefined) {
    return '0';
  }
  
  if (typeof value === 'number') {
    return `${value}px`;
  }
  
  return value;
}

/**
 * 카드 컴포넌트 스타일
 */
export const CARD_STYLES = {
  CONTAINER: {
    display: 'grid',
    gap: CARD_CSS_VARS.SIZES.PADDING,
    padding: CARD_CSS_VARS.SIZES.PADDING,
    width: '100%',
    height: '100%',
    overflow: 'auto'
  },
  CARD: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: CARD_CSS_VARS.COLORS.BACKGROUND,
    color: CARD_CSS_VARS.COLORS.TEXT,
    borderRadius: CARD_CSS_VARS.SIZES.BORDER_RADIUS,
    border: `1px solid ${CARD_CSS_VARS.COLORS.BORDER}`,
    transition: 'all 0.2s ease',
    
    '&:hover': {
      backgroundColor: CARD_CSS_VARS.COLORS.HOVER,
      transform: 'translateY(-2px)'
    },
    
    '&--selected': {
      backgroundColor: CARD_CSS_VARS.COLORS.SELECTED,
      borderColor: CARD_CSS_VARS.COLORS.SELECTED
    }
  },
  HEADER: {
    padding: CARD_CSS_VARS.SIZES.PADDING,
    borderBottom: `1px solid ${CARD_CSS_VARS.COLORS.BORDER}`,
    
    TITLE: {
      margin: 0,
      fontSize: CARD_CSS_VARS.SIZES.FONT_SIZE.LARGE,
      fontWeight: 'bold',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  },
  BODY: {
    padding: CARD_CSS_VARS.SIZES.PADDING,
    flex: 1,
    overflow: 'hidden',
    
    CONTENT: {
      fontSize: CARD_CSS_VARS.SIZES.FONT_SIZE.NORMAL,
      lineHeight: 1.5,
      overflow: 'hidden',
      display: '-webkit-box',
      '-webkit-line-clamp': 3,
      '-webkit-box-orient': 'vertical'
    }
  },
  FOOTER: {
    padding: CARD_CSS_VARS.SIZES.PADDING,
    borderTop: `1px solid ${CARD_CSS_VARS.COLORS.BORDER}`,
    
    TAGS: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      
      TAG: {
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: CARD_CSS_VARS.SIZES.FONT_SIZE.SMALL,
        backgroundColor: 'var(--background-modifier-success)',
        color: 'var(--text-on-accent)'
      }
    }
  }
} as const;

/**
 * 반응형 브레이크포인트
 */
export const CARD_BREAKPOINTS = {
  MOBILE: '320px',
  TABLET: '768px',
  DESKTOP: '1024px'
} as const;

/**
 * 테마 관련 상수
 */
export const CARD_THEME = {
  LIGHT: 'card-navigator--light',
  DARK: 'card-navigator--dark'
} as const;

/**
 * 카드 컴포넌트 스타일 상수
 */
export const CARD_COMPONENTS = {
  // 카드 컨테이너
  CONTAINER: {
    DISPLAY: 'grid',
    GRID_GAP: SIZES.M,
    PADDING: SIZES.M,
    WIDTH: '100%',
    HEIGHT: '100%',
    OVERFLOW: 'auto',
  },

  // 카드 기본
  CARD: {
    POSITION: 'relative',
    DISPLAY: 'flex',
    FLEX_DIRECTION: 'column',
    BORDER_RADIUS: SIZES.BORDER_RADIUS_M,
    OVERFLOW: 'hidden',
    TRANSITION: 'transform 0.2s ease, box-shadow 0.2s ease',
    
    ERROR: {
      BACKGROUND_COLOR: 'var(--background-modifier-error)',
      COLOR: 'var(--text-error)',
      PADDING: SIZES.M,
    },
  },

  // 카드 헤더
  HEADER: {
    PADDING: `${SIZES.S} ${SIZES.M}`,
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'space-between',
    
    TITLE: {
      MARGIN: '0',
      FONT_SIZE: SIZES.FONT_SIZE_M,
      FONT_WEIGHT: 'bold',
      OVERFLOW: 'hidden',
      TEXT_OVERFLOW: 'ellipsis',
      WHITE_SPACE: 'nowrap',
    },
  },

  // 카드 본문
  BODY: {
    PADDING: `0 ${SIZES.M} ${SIZES.M}`,
    FLEX: '1',
    OVERFLOW: 'hidden',
    
    CONTENT: {
      FONT_SIZE: SIZES.FONT_SIZE_S,
      LINE_HEIGHT: '1.5',
      OVERFLOW: 'hidden',
      DISPLAY: '-webkit-box',
      WEBKIT_LINE_CLAMP: '5',
      WEBKIT_BOX_ORIENT: 'vertical',
    },
  },

  // 카드 푸터
  FOOTER: {
    PADDING: `${SIZES.S} ${SIZES.M}`,
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'space-between',
    
    TAGS: {
      DISPLAY: 'flex',
      FLEX_WRAP: 'wrap',
      GAP: SIZES.XS,
      
      TAG: {
        PADDING: `${SIZES.XXS} ${SIZES.XS}`,
        BORDER_RADIUS: SIZES.BORDER_RADIUS_S,
        FONT_SIZE: SIZES.FONT_SIZE_XS,
      },
    },
    
    DATES: {
      FONT_SIZE: SIZES.FONT_SIZE_XS,
      WHITE_SPACE: 'nowrap',
    },
  },

  // 상호작용
  INTERACTION: {
    HOVER: {
      TRANSFORM: 'translateY(-2px)',
    },
    
    ACTIVE: {
      TRANSFORM: 'translateY(0)',
    },
    
    SELECTED: {
      BORDER_WIDTH: '2px',
    },
  },

  // 비활성화 요소
  DISABLED: {
    MATH: {
      FONT_STYLE: 'italic',
      COLOR: 'var(--text-muted)',
    },
    
    CODE: {
      FONT_STYLE: 'italic',
      COLOR: 'var(--text-muted)',
    },
    
    IMAGE: {
      FONT_STYLE: 'italic',
      COLOR: 'var(--text-muted)',
      PADDING: SIZES.XS,
      BACKGROUND_COLOR: 'var(--background-modifier-box-shadow)',
      BORDER_RADIUS: SIZES.BORDER_RADIUS_S,
    },
  },
}; 