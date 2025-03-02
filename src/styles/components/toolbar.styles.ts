/**
 * 툴바 컴포넌트 스타일 상수
 * 
 * 이 파일은 툴바 컴포넌트와 관련된 필수 스타일 상수만 정의합니다.
 * 가능한 옵시디언 기본 스타일을 활용하여 일관성을 유지합니다.
 */

import { COLORS, SIZES, Z_INDEX } from '../variables';
import { SizeValue, ColorValue, StyleState } from '../../core/types/common.types';

/**
 * 툴바 스타일 옵션 인터페이스
 * 툴바 스타일 생성에 필요한 옵션을 정의합니다.
 */
export interface ToolbarStyleOptions {
  /**
   * 툴바 높이
   */
  toolbarHeight?: SizeValue;
  
  /**
   * 툴바 패딩
   */
  toolbarPadding?: SizeValue;
  
  /**
   * 툴바 고정 여부
   */
  toolbarSticky?: boolean;
}

// 툴바 컨테이너 스타일
export const TOOLBAR_CONTAINER = {
  HEIGHT: '40px',
  PADDING: `0 ${SIZES.M}`,
  DISPLAY: 'flex',
  ALIGN_ITEMS: 'center',
  JUSTIFY_CONTENT: 'space-between',
  Z_INDEX: Z_INDEX.TOOLBAR,
  
  // 고정 툴바
  STICKY: {
    POSITION: 'sticky',
    TOP: '0',
  },
};

// 툴바 그룹 스타일
export const TOOLBAR_GROUP = {
  DISPLAY: 'flex',
  ALIGN_ITEMS: 'center',
  MARGIN: `0 ${SIZES.S}`,
  
  // 구분선
  SEPARATOR: {
    HEIGHT: '20px',
    WIDTH: '1px',
    MARGIN: `0 ${SIZES.S}`,
  },
};

// 정렬 메뉴 스타일
export const SORT_MENU = {
  ICON: {
    ASCENDING: '↑',
    DESCENDING: '↓',
    MARGIN_LEFT: SIZES.XS,
  },
  
  ACTIVE_SORT: {
    FONT_WEIGHT: 'bold',
  },
};

// 카드셋 메뉴 스타일
export const CARDSET_MENU = {
  FOLDER_ICON: {
    MARGIN_RIGHT: SIZES.XS,
  },
  
  FOLDER_PATH: {
    MARGIN_LEFT: SIZES.S,
    MAX_WIDTH: '150px',
    OVERFLOW: 'hidden',
    TEXT_OVERFLOW: 'ellipsis',
    WHITE_SPACE: 'nowrap',
  },
  
  ACTIVE_MODE: {
    FONT_WEIGHT: 'bold',
  },
};

// 프리셋 메뉴 스타일
export const PRESET_MENU = {
  PRESET_ICON: {
    MARGIN_RIGHT: SIZES.XS,
  },
  
  PRESET_DESCRIPTION: {
    MARGIN_TOP: SIZES.XS,
  },
  
  ACTIVE_PRESET: {
    FONT_WEIGHT: 'bold',
  },
  
  MANAGE_BUTTON: {
    PADDING: `${SIZES.XS} ${SIZES.S}`,
    MARGIN_TOP: SIZES.XS,
    TEXT_ALIGN: 'center',
  },
}; 