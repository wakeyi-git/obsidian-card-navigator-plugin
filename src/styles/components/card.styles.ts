/**
 * 카드 컴포넌트 스타일 상수
 * 
 * 이 파일은 카드 컴포넌트와 관련된 필수 스타일 상수만 정의합니다.
 * 가능한 옵시디언 기본 스타일을 활용하여 일관성을 유지합니다.
 */

import { SIZES } from '../variables';
import { SizeValue, ColorValue } from '../../core/types/common.types';

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

// 카드 컨테이너 스타일
export const CARD_CONTAINER = {
  DISPLAY: 'grid',
  GRID_GAP: SIZES.M,
  PADDING: SIZES.M,
  WIDTH: '100%',
  HEIGHT: '100%',
  OVERFLOW: 'auto',
};

// 카드 스타일
export const CARD = {
  CONTAINER: {
    POSITION: 'relative',
    DISPLAY: 'flex',
    FLEX_DIRECTION: 'column',
    BORDER_RADIUS: SIZES.BORDER_RADIUS_M,
    OVERFLOW: 'hidden',
    TRANSITION: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  
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
    
    ACTIONS: {
      DISPLAY: 'flex',
      ALIGN_ITEMS: 'center',
    },
  },
  
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
  
  FOOTER: {
    PADDING: `${SIZES.S} ${SIZES.M}`,
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'space-between',
    
    TAGS: {
      DISPLAY: 'flex',
      FLEX_WRAP: 'wrap',
      GAP: SIZES.XS,
    },
    
    TAG: {
      PADDING: `${SIZES.XXS} ${SIZES.XS}`,
      BORDER_RADIUS: SIZES.BORDER_RADIUS_S,
      FONT_SIZE: SIZES.FONT_SIZE_XS,
    },
    
    META: {
      FONT_SIZE: SIZES.FONT_SIZE_XS,
      WHITE_SPACE: 'nowrap',
    },
  },
};

// 카드 상호작용 스타일
export const CARD_INTERACTION = {
  HOVER: {
    TRANSFORM: 'translateY(-2px)',
  },
  
  ACTIVE: {
    TRANSFORM: 'translateY(0)',
  },
  
  SELECTED: {
    BORDER_WIDTH: '2px',
  },
}; 