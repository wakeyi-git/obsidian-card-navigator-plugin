import { CardRenderType } from './CardRenderConfig';
import { ICardRenderConfig } from './CardRenderConfig';
import { ICardStyle } from './CardStyle';
import { DEFAULT_CARD_RENDER_CONFIG } from './CardRenderConfig';
import { DEFAULT_CARD_STYLE } from './CardStyle';
import { CardSetType, LinkType } from './CardSet';

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

  /**
   * 기본 카드셋 타입
   */
  defaultCardSetType: CardSetType;

  /**
   * 기본 카드셋 기준
   */
  defaultCardSetCriteria: string;

  /**
   * 하위 폴더 포함 여부
   */
  includeSubfolders: boolean;

  /**
   * 링크 타입
   */
  linkType: LinkType;

  /**
   * 링크 레벨
   */
  linkLevel: number;

  /**
   * 백링크 포함 여부
   */
  includeBacklinks: boolean;

  /**
   * 아웃고잉 링크 포함 여부
   */
  includeOutgoingLinks: boolean;

  /**
   * 포함 패턴
   */
  includePatterns?: string[];

  /**
   * 제외 패턴
   */
  excludePatterns?: string[];

  /**
   * 폴더 카드셋 모드 (활성 폴더 / 고정 폴더)
   */
  folderSetMode: 'active' | 'fixed';

  /**
   * 고정 폴더 경로
   */
  fixedFolderPath: string;

  /**
   * 태그 카드셋 모드 (활성 태그 / 고정 태그)
   */
  tagSetMode: 'active' | 'fixed';

  /**
   * 고정 태그
   */
  fixedTag: string;
}

/**
 * 플러그인 설정 기본값
 */
export const DEFAULT_PLUGIN_SETTINGS: IPluginSettings = {
  cardTitleDisplayType: 'filename',
  cardRenderType: CardRenderType.TEXT,
  renderMarkdown: true,
  cardRenderConfig: DEFAULT_CARD_RENDER_CONFIG,
  cardStyle: DEFAULT_CARD_STYLE,
  defaultCardSetType: CardSetType.FOLDER,
  defaultCardSetCriteria: '',
  includeSubfolders: false,
  linkType: LinkType.BACKLINK,
  linkLevel: 1,
  includeBacklinks: true,
  includeOutgoingLinks: false,
  includePatterns: [],
  excludePatterns: [],
  folderSetMode: 'active',
  fixedFolderPath: '',
  tagSetMode: 'active',
  fixedTag: ''
}; 