import { ICard } from './Card';
import { ICardSet } from './CardSet';
import { IPluginSettings, DEFAULT_PLUGIN_SETTINGS } from './PluginSettings';

/**
 * 카드 내비게이터 상태 인터페이스
 */
export interface ICardNavigatorState {
  /** 활성 카드셋 */
  readonly activeCardSet: ICardSet | null;
  /** 활성 카드 */
  readonly activeCard: ICard | null;
  /** 포커스된 카드 */
  readonly focusedCard: ICard | null;
  /** 선택된 카드 ID 목록 */
  readonly selectedCards: Set<string>;
  /** 플러그인 설정 */
  readonly settings: IPluginSettings;
}

/**
 * 기본 카드 내비게이터 상태
 */
export const DEFAULT_CARD_NAVIGATOR_STATE: ICardNavigatorState = {
  activeCardSet: null,
  activeCard: null,
  focusedCard: null,
  selectedCards: new Set<string>(),
  settings: DEFAULT_PLUGIN_SETTINGS
}; 