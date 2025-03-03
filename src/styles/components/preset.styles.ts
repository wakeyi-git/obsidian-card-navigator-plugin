import { SizeValue } from '../variables';

/**
 * 프리셋 관련 CSS 클래스 이름
 */
export const PRESET_CLASS_NAMES = {
  CONTAINER: {
    SETTING_ITEM: 'card-navigator-setting-item',
    SETTING_CONTROL_ROW: 'card-navigator-setting-control-row',
    SETTING_CONTROL: 'card-navigator-setting-control',
    SETTING_DESCRIPTION: 'card-navigator-setting-description',
    INFO_TEXT: 'card-navigator-info-text'
  },
  FOLDER_PRESET: {
    LIST: 'card-navigator-folder-preset-list',
    ITEM: 'card-navigator-folder-preset-item',
    PATH: 'card-navigator-folder-preset-path',
    PRESET: 'card-navigator-folder-preset-preset',
    PRIORITY: 'card-navigator-folder-preset-priority',
    ACTION: 'card-navigator-folder-preset-action'
  },
  TAG_PRESET: {
    LIST: 'card-navigator-tag-preset-list',
    HEADER: 'card-navigator-tag-preset-header',
    CONTENT: 'card-navigator-tag-preset-content',
    ITEM: 'card-navigator-tag-preset-item',
    EMPTY: 'card-navigator-tag-preset-empty',
    TAG: {
      CONTAINER: 'card-navigator-tag-preset-tag',
      HEADER: 'card-navigator-tag-preset-tag-header',
      LABEL: 'card-navigator-tag'
    },
    PRESET: {
      CONTAINER: 'card-navigator-tag-preset-preset',
      HEADER: 'card-navigator-tag-preset-preset-header',
      NAME: 'card-navigator-preset-name'
    },
    PRIORITY: {
      CONTAINER: 'card-navigator-tag-preset-priority',
      HEADER: 'card-navigator-tag-preset-priority-header',
      LABEL: 'card-navigator-priority',
      TAG: 'priority-tag',
      GLOBAL: 'priority-global',
      FOLDER: 'priority-folder'
    },
    ACTION: {
      CONTAINER: 'card-navigator-tag-preset-action',
      HEADER: 'card-navigator-tag-preset-action-header'
    }
  },
  BUTTON: {
    BASE: 'card-navigator-button',
    SMALL: 'card-navigator-button-small',
    DANGER: 'card-navigator-button-danger'
  },
  DROPDOWN: 'dropdown',
  HIDDEN: 'is-hidden'
} as const;

/**
 * 프리셋 스타일 상수
 */
export const PRESET_STYLES = {
  CONTAINER: {
    PADDING: '16px' as SizeValue,
    MARGIN: '8px' as SizeValue
  },
  LIST: {
    GAP: '8px' as SizeValue,
    PADDING: '12px' as SizeValue
  },
  ITEM: {
    PADDING: '8px' as SizeValue,
    BORDER_RADIUS: '4px' as SizeValue
  },
  BUTTON: {
    PADDING: '4px 8px' as SizeValue,
    MARGIN: '0 4px' as SizeValue
  }
} as const; 