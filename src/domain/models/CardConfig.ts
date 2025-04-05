import { ICardStyle, DEFAULT_CARD_STYLE } from './CardStyle';

/**
 * 카드 일반 설정 인터페이스
 */
export interface ICardGeneralConfig {
  readonly showHeader: boolean;
  readonly showBody: boolean;
  readonly showFooter: boolean;
  readonly renderMarkdown: boolean;
  readonly showImages: boolean;
  readonly highlightCode: boolean;
  readonly supportCallouts: boolean;
  readonly supportMath: boolean;
  readonly contentLengthLimitEnabled: boolean;
  readonly contentLengthLimit: number;
  readonly titleDisplayType: 'filename' | 'first_header';
}

/**
 * 카드 컨텐츠 섹션 설정 인터페이스
 */
export interface ICardSectionConfig {
  readonly showTitle: boolean;
  readonly showFileName: boolean;
  readonly showFirstHeader: boolean;
  readonly showContent: boolean;
  readonly showTags: boolean;
  readonly showCreatedDate: boolean;
  readonly showUpdatedDate: boolean;
  readonly showProperties: string[];
}

/**
 * 카드 컨텐츠 설정 인터페이스
 */
export interface ICardContentConfig {
  readonly header: ICardSectionConfig;
  readonly body: ICardSectionConfig;
  readonly footer: ICardSectionConfig;
}

/**
 * 카드 설정 인터페이스
 */
export interface ICardConfig {
  readonly cardGeneral: ICardGeneralConfig;
  readonly cardContent: ICardContentConfig;
  readonly cardStyle: ICardStyle;
}

/**
 * 카드 일반 설정 기본값
 */
export const DEFAULT_CARD_GENERAL_CONFIG: ICardGeneralConfig = {
  showHeader: true,
  showBody: true,
  showFooter: true,
  renderMarkdown: true,
  showImages: true,
  highlightCode: true,
  supportCallouts: true,
  supportMath: true,
  contentLengthLimitEnabled: false,
  contentLengthLimit: 200,
  titleDisplayType: 'filename'
};

/**
 * 카드 헤더 설정 기본값
 */
export const DEFAULT_CARD_HEADER_CONFIG: ICardSectionConfig = {
  showTitle: true,
  showFileName: true,
  showFirstHeader: true,
  showContent: false,
  showTags: true,
  showCreatedDate: false,
  showUpdatedDate: false,
  showProperties: []
};

/**
 * 카드 본문 설정 기본값
 */
export const DEFAULT_CARD_BODY_CONFIG: ICardSectionConfig = {
  showTitle: false,
  showFileName: false,
  showFirstHeader: false,
  showContent: true,
  showTags: false,
  showCreatedDate: false,
  showUpdatedDate: false,
  showProperties: []
};

/**
 * 카드 푸터 설정 기본값
 */
export const DEFAULT_CARD_FOOTER_CONFIG: ICardSectionConfig = {
  showTitle: false,
  showFileName: false,
  showFirstHeader: false,
  showContent: false,
  showTags: false,
  showCreatedDate: true,
  showUpdatedDate: true,
  showProperties: []
};

/**
 * 카드 컨텐츠 설정 기본값
 */
export const DEFAULT_CARD_CONTENT_CONFIG: ICardContentConfig = {
  header: DEFAULT_CARD_HEADER_CONFIG,
  body: DEFAULT_CARD_BODY_CONFIG,
  footer: DEFAULT_CARD_FOOTER_CONFIG
};

/**
 * 카드 설정 기본값
 */
export const DEFAULT_CARD_CONFIG: ICardConfig = {
  cardGeneral: DEFAULT_CARD_GENERAL_CONFIG,
  cardContent: DEFAULT_CARD_CONTENT_CONFIG,
  cardStyle: DEFAULT_CARD_STYLE
}; 