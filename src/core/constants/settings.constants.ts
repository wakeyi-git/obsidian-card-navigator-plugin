/**
 * 플러그인 ID
 */
export const PLUGIN_ID = 'obsidian-card-navigator-plugin';

/**
 * 플러그인 이름
 */
export const PLUGIN_NAME = 'Card Navigator';

/**
 * 플러그인 설명
 */
export const PLUGIN_DESCRIPTION = 'Navigate your notes as cards in a flexible, visual way.';

/**
 * 카드 네비게이터 뷰 ID
 */
export const CARD_NAVIGATOR_VIEW_ID = 'card-navigator-view';

/**
 * 카드 네비게이터 뷰 이름
 */
export const CARD_NAVIGATOR_VIEW_NAME = 'Card Navigator';

/**
 * 카드 네비게이터 뷰 아이콘
 */
export const CARD_NAVIGATOR_VIEW_ICON = 'layout-grid';

/**
 * 설정 저장 지연 시간 (밀리초)
 */
export const SETTINGS_SAVE_DELAY = 500;

/**
 * 설정 마이그레이션 버전
 */
export const SETTINGS_MIGRATION_VERSION = 1;

/**
 * 설정 탭 섹션
 */
export enum SettingsTabSection {
  GENERAL = 'general',
  CARD_CONTENT = 'cardContent',
  CARD_STYLE = 'cardStyle',
  LAYOUT = 'layout',
  PRESETS = 'presets',
  KEYBOARD = 'keyboard',
  ADVANCED = 'advanced'
}

/**
 * 설정 탭 섹션 이름
 */
export const SETTINGS_TAB_SECTION_NAMES: Record<SettingsTabSection, string> = {
  [SettingsTabSection.GENERAL]: 'General',
  [SettingsTabSection.CARD_CONTENT]: 'Card Content',
  [SettingsTabSection.CARD_STYLE]: 'Card Style',
  [SettingsTabSection.LAYOUT]: 'Layout',
  [SettingsTabSection.PRESETS]: 'Presets',
  [SettingsTabSection.KEYBOARD]: 'Keyboard',
  [SettingsTabSection.ADVANCED]: 'Advanced'
};

/**
 * 설정 탭 섹션 아이콘
 */
export const SETTINGS_TAB_SECTION_ICONS: Record<SettingsTabSection, string> = {
  [SettingsTabSection.GENERAL]: 'settings',
  [SettingsTabSection.CARD_CONTENT]: 'file-text',
  [SettingsTabSection.CARD_STYLE]: 'palette',
  [SettingsTabSection.LAYOUT]: 'layout',
  [SettingsTabSection.PRESETS]: 'bookmark',
  [SettingsTabSection.KEYBOARD]: 'keyboard',
  [SettingsTabSection.ADVANCED]: 'tool'
};

/**
 * 설정 탭 섹션 설명
 */
export const SETTINGS_TAB_SECTION_DESCRIPTIONS: Record<SettingsTabSection, string> = {
  [SettingsTabSection.GENERAL]: 'General settings for Card Navigator',
  [SettingsTabSection.CARD_CONTENT]: 'Configure what content appears on cards',
  [SettingsTabSection.CARD_STYLE]: 'Customize the appearance of cards',
  [SettingsTabSection.LAYOUT]: 'Configure how cards are arranged and displayed',
  [SettingsTabSection.PRESETS]: 'Manage saved configurations',
  [SettingsTabSection.KEYBOARD]: 'Configure keyboard shortcuts',
  [SettingsTabSection.ADVANCED]: 'Advanced settings and debugging options'
};

/**
 * 지원되는 언어 코드
 */
export const SUPPORTED_LOCALES = ['en', 'ko'];

/**
 * 기본 언어 코드
 */
export const DEFAULT_LOCALE = 'en';

/**
 * 언어 이름 맵
 */
export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  ko: '한국어'
}; 