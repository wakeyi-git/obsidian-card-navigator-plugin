import { SizeValue } from '../variables';

/**
 * 모달 관련 클래스명 상수
 */
export const MODAL_CLASS_NAMES = {
  CONTAINER: 'card-navigator-modal',
  HEADER: {
    CONTAINER: 'card-navigator-modal-header',
    TITLE: 'card-navigator-modal-title',
    CLOSE: 'card-navigator-modal-close'
  },
  CONTENT: {
    CONTAINER: 'card-navigator-modal-content',
    MESSAGE: 'card-navigator-modal-message'
  },
  BUTTONS: {
    CONTAINER: 'card-navigator-modal-buttons',
    BUTTON: 'card-navigator-button',
    CANCEL: 'card-navigator-button-cancel',
    CONFIRM: 'card-navigator-button-confirm',
    SAVE: 'card-navigator-button-save',
    SMALL: 'card-navigator-button-small'
  },
  DESCRIPTION: 'card-navigator-modal-description',
  TEXTAREA: {
    JSON: 'card-navigator-json-textarea'
  },
  KEYBOARD: {
    SECTION: 'card-navigator-keyboard-section',
    TABLE: 'card-navigator-keyboard-table',
    KEY: 'card-navigator-keyboard-key',
    DESCRIPTION: 'card-navigator-keyboard-description'
  },
  ADVANCED: {
    SECTION: 'card-navigator-advanced-section',
    HEADER: 'card-navigator-advanced-header',
    CONTENT: 'card-navigator-advanced-content',
    TOGGLE: 'card-navigator-toggle-button'
  },
  INFO: {
    TEXT: 'card-navigator-info-text'
  }
} as const;

/**
 * 모달 스타일 상수
 */
export const MODAL_STYLES = {
  CONTAINER: {
    MIN_WIDTH: '300px' as SizeValue,
    MAX_WIDTH: '500px' as SizeValue,
    PADDING: '20px' as SizeValue,
    BORDER_RADIUS: '8px' as SizeValue
  },
  HEADER: {
    MARGIN_BOTTOM: '16px' as SizeValue
  },
  CONTENT: {
    MARGIN_BOTTOM: '20px' as SizeValue
  },
  BUTTONS: {
    GAP: '8px' as SizeValue
  }
} as const;

/**
 * 모달 애니메이션 상수
 */
export const MODAL_ANIMATIONS = {
  DURATION: '200ms',
  TIMING: 'ease-in-out'
} as const; 