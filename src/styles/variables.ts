import { ColorValue, SizeValue, ThemeMode, ShadowValue } from '../core/types/common.types';

export type { ColorValue, SizeValue };

/**
 * 전역 스타일 변수
 * 
 * 이 파일은 Obsidian의 CSS 변수를 참조하여 플러그인 전체에서 사용할 수 있는
 * 스타일 변수를 정의합니다. 이를 통해 플러그인의 스타일이 Obsidian의 테마와
 * 자동으로 통합되도록 합니다.
 */

// 색상 변수
export const COLORS: Record<string, ColorValue> = {
  // 기본 색상
  BACKGROUND: 'var(--background-primary)',
  BACKGROUND_SECONDARY: 'var(--background-secondary)',
  BACKGROUND_MODIFIER_HOVER: 'var(--background-modifier-hover)',
  BACKGROUND_MODIFIER_ACTIVE: 'var(--background-modifier-active)',
  BACKGROUND_MODIFIER_BORDER: 'var(--background-modifier-border)',
  BACKGROUND_MODIFIER_BORDER_HOVER: 'var(--background-modifier-border-hover)',
  BACKGROUND_MODIFIER_BORDER_FOCUS: 'var(--background-modifier-border-focus)',
  
  // 텍스트 색상
  TEXT_NORMAL: 'var(--text-normal)',
  TEXT_MUTED: 'var(--text-muted)',
  TEXT_FAINT: 'var(--text-faint)',
  TEXT_ERROR: 'var(--text-error)',
  TEXT_ERROR_HOVER: 'var(--text-error)',  // 오류 텍스트 호버 (Obsidian에 없으면 기본 오류 색상 사용)
  TEXT_SUCCESS: 'var(--text-success)',
  TEXT_ACCENT: 'var(--text-accent)',
  TEXT_ACCENT_HOVER: 'var(--text-accent-hover)',
  TEXT_ON_ACCENT: 'white',  // 강조 배경 위의 텍스트 (일반적으로 흰색)
  
  // 테두리 색상
  BORDER: 'var(--background-modifier-border)',
  BORDER_HOVER: 'var(--background-modifier-border-hover)',
  BORDER_FOCUS: 'var(--background-modifier-border-focus)',
  
  // 강조 색상
  INTERACTIVE_ACCENT: 'var(--interactive-accent)',
  INTERACTIVE_ACCENT_HOVER: 'var(--interactive-accent-hover)',
  
  // 스크롤바 색상
  SCROLLBAR_BG: 'var(--scrollbar-bg)',
  SCROLLBAR_THUMB_BG: 'var(--scrollbar-thumb-bg)',
  SCROLLBAR_ACTIVE_THUMB_BG: 'var(--scrollbar-active-thumb-bg)',
};

// 크기 및 간격 변수
export const SIZES: Record<string, SizeValue> = {
  // 기본 간격
  XS: '4px',
  S: '8px',
  M: '12px',
  L: '16px',
  XL: '24px',
  XXL: '32px',
  
  // 테두리 반경
  BORDER_RADIUS_S: '4px',
  BORDER_RADIUS_M: '6px',
  BORDER_RADIUS_L: '8px',
  
  // 테두리 두께
  BORDER_WIDTH_THIN: '1px',
  BORDER_WIDTH_NORMAL: '2px',
  BORDER_WIDTH_THICK: '3px',
  
  // 글꼴 크기
  FONT_SIZE_XS: 'var(--font-smallest)',
  FONT_SIZE_S: 'var(--font-smaller)',
  FONT_SIZE_M: 'var(--font-small)',
  FONT_SIZE_L: 'var(--font-ui-medium)',
  FONT_SIZE_XL: 'var(--font-ui-large)',
  
  // 줄 높이
  LINE_HEIGHT_TIGHT: '1.2',
  LINE_HEIGHT_NORMAL: '1.5',
  LINE_HEIGHT_LOOSE: '1.8',
  
  // 아이콘 크기
  ICON_SIZE_S: '14px',
  ICON_SIZE_M: '16px',
  ICON_SIZE_L: '20px',
};

// 그림자 효과
export const SHADOWS: Record<string, ShadowValue> = {
  SHADOW_S: '0 1px 3px rgba(0, 0, 0, 0.1)',
  SHADOW_M: '0 2px 6px rgba(0, 0, 0, 0.15)',
  SHADOW_L: '0 4px 12px rgba(0, 0, 0, 0.2)',
};

// 애니메이션 변수
export const ANIMATIONS = {
  TRANSITION_FAST: '0.1s ease',
  TRANSITION_NORMAL: '0.2s ease',
  TRANSITION_SLOW: '0.3s ease',
  
  EASING_STANDARD: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  EASING_DECELERATE: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  EASING_ACCELERATE: 'cubic-bezier(0.4, 0.0, 1, 1)',
};

// Z-인덱스 변수
export const Z_INDEX = {
  BASE: 1,
  CARD: 10,
  TOOLBAR: 20,
  DROPDOWN: 30,
  MODAL: 40,
  TOOLTIP: 50,
};

// 미디어 쿼리 브레이크포인트
export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '992px',
  DESKTOP: '1200px',
};

// 카드 레이아웃 관련 변수
export const CARD_LAYOUT = {
  MIN_CARD_WIDTH: '240px',
  MAX_CARD_WIDTH: '400px',
  MIN_CARD_HEIGHT: '120px',
  DEFAULT_CARD_GAP: '12px',
  CONTAINER_PADDING: '16px',
};

// 스크롤 관련 변수
export const SCROLL = {
  SCROLLBAR_WIDTH: '8px',
  SCROLLBAR_THUMB_RADIUS: '4px',
  SCROLL_SPEED_NORMAL: '300ms',
  SCROLL_SPEED_FAST: '150ms',
};

// 기타 유틸리티 함수
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getCssVariable = (variableName: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
};

/**
 * 현재 테마 모드를 감지합니다.
 * @returns 현재 테마 모드 ('light' 또는 'dark')
 */
export function detectThemeMode(): ThemeMode {
  return document.body.classList.contains('theme-dark') ? 'dark' : 'light';
} 