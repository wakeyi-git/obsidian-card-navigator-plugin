/**
 * 설정 컴포넌트 스타일 상수
 * 
 * 이 파일은 설정 컴포넌트와 관련된 필수 스타일 상수만 정의합니다.
 * 가능한 옵시디언 기본 스타일을 활용하여 일관성을 유지합니다.
 */

import { SIZES, detectThemeMode } from '../variables';
import { SizeValue, ColorValue, TextStyleOptions, ThemeMode } from '../../core/types/common.types';

/**
 * 설정 스타일 옵션 인터페이스
 * 설정 스타일 생성에 필요한 옵션을 정의합니다.
 */
export interface SettingsStyleOptions extends TextStyleOptions {
  /**
   * 설정 섹션 간격
   */
  settingsSectionGap?: SizeValue;
  
  /**
   * 설정 항목 간격
   */
  settingsItemGap?: SizeValue;
}

// 현재 테마 모드 감지
let currentThemeMode = detectThemeMode();

/**
 * 테마 모드에 따라 다른 값을 반환하는 유틸리티 함수
 * @param lightValue 라이트 모드에서 사용할 값
 * @param darkValue 다크 모드에서 사용할 값
 * @param themeMode 테마 모드 (기본값: 현재 감지된 테마 모드)
 * @returns 테마 모드에 따른 값
 */
export function getThemeValue<T>(lightValue: T, darkValue: T, themeMode: ThemeMode = currentThemeMode): T {
  return themeMode === 'dark' ? darkValue : lightValue;
}

/**
 * 테마 모드에 따라 다른 색상을 반환하는 유틸리티 함수
 * @param lightColor 라이트 모드에서 사용할 색상
 * @param darkColor 다크 모드에서 사용할 색상
 * @param themeMode 테마 모드 (기본값: 현재 감지된 테마 모드)
 * @returns 테마 모드에 따른 색상
 */
export function getThemeColor(lightColor: ColorValue, darkColor: ColorValue, themeMode: ThemeMode = currentThemeMode): ColorValue {
  return getThemeValue(lightColor, darkColor, themeMode);
}

/**
 * 테마 변경을 감지하고 현재 테마 모드를 업데이트합니다.
 * @returns 현재 테마 모드
 */
export function updateThemeMode(): ThemeMode {
  currentThemeMode = detectThemeMode();
  return currentThemeMode;
}

/**
 * 테마 변경 이벤트 리스너를 설정합니다.
 * @param callback 테마 변경 시 호출할 콜백 함수
 * @returns 이벤트 리스너 제거 함수
 */
export function setupThemeChangeListener(callback: (themeMode: ThemeMode) => void): () => void {
  // MutationObserver를 사용하여 body 클래스 변경 감지
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'class') {
        const newThemeMode = updateThemeMode();
        callback(newThemeMode);
        break;
      }
    }
  });
  
  // body 요소의 클래스 변경 감지 시작
  observer.observe(document.body, { attributes: true });
  
  // 이벤트 리스너 제거 함수 반환
  return () => observer.disconnect();
}

// 설정 섹션 스타일 (최소한의 필수 스타일만 정의)
export const SETTINGS_SECTION = {
  CONTAINER: {
    MARGIN_BOTTOM: SIZES.XL,
    PADDING_BOTTOM: SIZES.L,
  },
  
  CONTENT: {
    PADDING_LEFT: SIZES.M,
  },
};

// 설정 항목 스타일 (최소한의 필수 스타일만 정의)
export const SETTINGS_ITEM = {
  CONTAINER: {
    MARGIN_BOTTOM: SIZES.M,
  },
  
  ROW: {
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'space-between',
    MARGIN_BOTTOM: SIZES.XS,
  },
  
  DESCRIPTION: {
    MARGIN_BOTTOM: SIZES.S,
  },
  
  CONTROL: {
    MIN_WIDTH: '180px',
  },
};

// 프리셋 관리 스타일 (최소한의 필수 스타일만 정의)
export const PRESET_MANAGER = {
  CONTAINER: {
    MARGIN_TOP: SIZES.M,
  },
  
  LIST: {
    MARGIN_TOP: SIZES.M,
    OVERFLOW: 'hidden',
  },
  
  ITEM: {
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'space-between',
    PADDING: `${SIZES.S} ${SIZES.M}`,
  },
  
  INFO: {
    FLEX: '1',
    
    NAME: {
      MARGIN_BOTTOM: SIZES.XS,
    },
  },
  
  ACTIONS: {
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
  },
  
  ACTION_BUTTON: {
    PADDING: SIZES.XS,
    MARGIN_LEFT: SIZES.XS,
  },
  
  ADD_BUTTON: {
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'center',
    PADDING: `${SIZES.XS} ${SIZES.M}`,
    
    ICON: {
      MARGIN_RIGHT: SIZES.XS,
    },
  },
};

// 폴더 프리셋 스타일 (최소한의 필수 스타일만 정의)
export const FOLDER_PRESET = {
  CONTAINER: {
    MARGIN_TOP: SIZES.M,
  },
  
  LIST: {
    MARGIN_TOP: SIZES.M,
    MAX_HEIGHT: '300px',
    OVERFLOW_Y: 'auto',
  },
  
  ITEM: {
    DISPLAY: 'flex',
    ALIGN_ITEMS: 'center',
    JUSTIFY_CONTENT: 'space-between',
    PADDING: `${SIZES.S} ${SIZES.M}`,
  },
  
  FOLDER: {
    FLEX: '1',
    WHITE_SPACE: 'nowrap',
    OVERFLOW: 'hidden',
    TEXT_OVERFLOW: 'ellipsis',
  },
  
  PRESET_SELECT: {
    MIN_WIDTH: '150px',
    MARGIN_LEFT: SIZES.M,
  },
}; 