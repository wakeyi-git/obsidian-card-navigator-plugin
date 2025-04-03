import { IStyleProperties, DEFAULT_CARD_STYLE } from './CardStyle';

/**
 * 카드 렌더링 타입
 */
export enum CardRenderType {
  TEXT = 'text',
  HTML = 'html'
}

/**
 * 섹션별 표시 항목 설정
 */
export interface ISectionDisplayConfig {
  readonly showFileName: boolean;
  readonly showFirstHeader: boolean;
  readonly showContent: boolean;
  readonly showTags: boolean;
  readonly showCreatedDate: boolean;
  readonly showUpdatedDate: boolean;
  readonly showProperties: string[];
}

/**
 * 카드 렌더링 설정 인터페이스
 * - 카드 렌더링 관련 설정을 관리하는 불변 객체
 */
export interface ICardRenderConfig {
  readonly type: CardRenderType;
  readonly showHeader: boolean;
  readonly showBody: boolean;
  readonly showFooter: boolean;
  readonly contentLength?: number;
  readonly renderMarkdown: boolean;
  
  // 섹션별 표시 항목 설정
  readonly headerDisplay: ISectionDisplayConfig;
  readonly bodyDisplay: ISectionDisplayConfig;
  readonly footerDisplay: ISectionDisplayConfig;

  // 스타일 설정
  readonly headerStyle: IStyleProperties;
  readonly bodyStyle: IStyleProperties;
  readonly footerStyle: IStyleProperties;
  readonly normalCardStyle: IStyleProperties;
  readonly activeCardStyle: IStyleProperties;
  readonly focusedCardStyle: IStyleProperties;

  /**
   * 렌더링 설정 유효성 검사
   */
  validate(): boolean;

  /**
   * 렌더링 설정 미리보기
   */
  preview(): {
    type: CardRenderType;
    showHeader: boolean;
    showBody: boolean;
    showFooter: boolean;
    contentLength?: number;
    renderMarkdown: boolean;
    headerDisplay: ISectionDisplayConfig;
    bodyDisplay: ISectionDisplayConfig;
    footerDisplay: ISectionDisplayConfig;
    headerStyle: IStyleProperties;
    bodyStyle: IStyleProperties;
    footerStyle: IStyleProperties;
    normalCardStyle: IStyleProperties;
    activeCardStyle: IStyleProperties;
    focusedCardStyle: IStyleProperties;
  };

  /**
   * 이미지 표시 여부
   */
  showImages?: boolean;

  /**
   * 코드 하이라이팅 여부
   */
  highlightCode?: boolean;

  /**
   * 콜아웃 지원 여부
   */
  supportCallouts?: boolean;

  /**
   * 수식 지원 여부
   */
  supportMath?: boolean;
}

/**
 * 카드 렌더링 설정 기본값
 */
export const DEFAULT_CARD_RENDER_CONFIG: ICardRenderConfig = {
  type: CardRenderType.TEXT,
  showHeader: true,
  showBody: true,
  showFooter: true,
  renderMarkdown: true,
  headerDisplay: {
    showFileName: true,
    showFirstHeader: true,
    showContent: false,
    showTags: true,
    showCreatedDate: false,
    showUpdatedDate: false,
    showProperties: []
  },
  bodyDisplay: {
    showFileName: false,
    showFirstHeader: false,
    showContent: true,
    showTags: false,
    showCreatedDate: false,
    showUpdatedDate: false,
    showProperties: []
  },
  footerDisplay: {
    showFileName: false,
    showFirstHeader: false,
    showContent: false,
    showTags: false,
    showCreatedDate: true,
    showUpdatedDate: true,
    showProperties: []
  },
  headerStyle: DEFAULT_CARD_STYLE.header,
  bodyStyle: DEFAULT_CARD_STYLE.body,
  footerStyle: DEFAULT_CARD_STYLE.footer,
  normalCardStyle: DEFAULT_CARD_STYLE.card,
  activeCardStyle: DEFAULT_CARD_STYLE.activeCard,
  focusedCardStyle: DEFAULT_CARD_STYLE.focusedCard,
  validate: () => true,
  preview: function() {
    return {
      type: this.type,
      showHeader: this.showHeader,
      showBody: this.showBody,
      showFooter: this.showFooter,
      renderMarkdown: this.renderMarkdown,
      headerDisplay: this.headerDisplay,
      bodyDisplay: this.bodyDisplay,
      footerDisplay: this.footerDisplay,
      headerStyle: this.headerStyle,
      bodyStyle: this.bodyStyle,
      footerStyle: this.footerStyle,
      normalCardStyle: this.normalCardStyle,
      activeCardStyle: this.activeCardStyle,
      focusedCardStyle: this.focusedCardStyle
    };
  }
}; 