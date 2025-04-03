import { CardRenderType } from './CardRenderConfig';
import { ICardRenderConfig } from './CardRenderConfig';
import { ICardStyle } from './CardStyle';
import { DEFAULT_CARD_RENDER_CONFIG } from './CardRenderConfig';
import { DEFAULT_CARD_STYLE } from './CardStyle';

/**
 * 플러그인 설정 인터페이스
 */
export interface IPluginSettings {
  /**
   * 카드 타이틀 표시 방식
   */
  cardTitleDisplayType: 'filename' | 'firstHeader';

  /**
   * 카드 렌더링 타입
   */
  cardRenderType: CardRenderType;

  /**
   * 마크다운 렌더링 여부
   */
  renderMarkdown: boolean;

  /**
   * 카드 렌더링 설정
   */
  cardRenderConfig: ICardRenderConfig;

  /**
   * 카드 스타일
   */
  cardStyle: ICardStyle;
}

/**
 * 플러그인 설정 기본값
 */
export const DEFAULT_PLUGIN_SETTINGS: IPluginSettings = {
  cardTitleDisplayType: 'filename',
  cardRenderType: CardRenderType.TEXT,
  renderMarkdown: true,
  cardRenderConfig: DEFAULT_CARD_RENDER_CONFIG,
  cardStyle: DEFAULT_CARD_STYLE
}; 