import { IStyleProperties, DEFAULT_CARD_STYLE, ICardStyle } from './CardStyle';
import { NoteTitleDisplayType } from './Card';

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
  readonly renderMarkdown: boolean;
  readonly contentLengthLimitEnabled: boolean;
  readonly contentLengthLimit: number;
  readonly titleDisplayType: NoteTitleDisplayType;
  
  // 섹션별 표시 항목 설정
  readonly headerDisplay: ISectionDisplayConfig;
  readonly bodyDisplay: ISectionDisplayConfig;
  readonly footerDisplay: ISectionDisplayConfig;

  // 렌더링 기능 설정
  readonly showImages: boolean;
  readonly highlightCode: boolean;
  readonly supportCallouts: boolean;
  readonly supportMath: boolean;

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
    renderMarkdown: boolean;
    contentLengthLimitEnabled: boolean;
    contentLengthLimit: number;
    titleDisplayType: NoteTitleDisplayType;
    headerDisplay: ISectionDisplayConfig;
    bodyDisplay: ISectionDisplayConfig;
    footerDisplay: ISectionDisplayConfig;
    showImages: boolean;
    highlightCode: boolean;
    supportCallouts: boolean;
    supportMath: boolean;
  };
}

/**
 * 카드 렌더링 설정 기본값
 */
export const DEFAULT_CARD_RENDER_CONFIG: ICardRenderConfig = {
  type: CardRenderType.HTML,
  showHeader: true,
  showBody: true,
  showFooter: true,
  renderMarkdown: true,
  contentLengthLimitEnabled: false,
  contentLengthLimit: 200,
  titleDisplayType: NoteTitleDisplayType.FILENAME,
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
  showImages: true,
  highlightCode: true,
  supportCallouts: true,
  supportMath: true,
  validate: () => true,
  preview: function() {
    return {
      type: this.type,
      showHeader: this.showHeader,
      showBody: this.showBody,
      showFooter: this.showFooter,
      renderMarkdown: this.renderMarkdown,
      contentLengthLimitEnabled: this.contentLengthLimitEnabled,
      contentLengthLimit: this.contentLengthLimit,
      titleDisplayType: this.titleDisplayType,
      headerDisplay: this.headerDisplay,
      bodyDisplay: this.bodyDisplay,
      footerDisplay: this.footerDisplay,
      showImages: this.showImages,
      highlightCode: this.highlightCode,
      supportCallouts: this.supportCallouts,
      supportMath: this.supportMath
    };
  }
};