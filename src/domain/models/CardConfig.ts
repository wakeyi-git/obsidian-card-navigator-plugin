import { ICardStyle, DEFAULT_CARD_STYLE } from './CardStyle';

/**
 * 노트 제목 표시 타입
 */
export enum NoteTitleDisplayType {
  /** 파일명으로 표시 */
  FILENAME = 'filename',
  /** 첫 번째 헤더로 표시 */
  FIRST_HEADER = 'firstHeader',
  /** 둘 다 표시 */
  BOTH = 'both'
}

/**
 * 렌더링 타입
 */
export enum RenderType {
  /** 일반 텍스트로 렌더링 */
  TEXT = 'text',
  /** HTML로 렌더링 */
  HTML = 'html'
}

/**
 * 섹션 타입
 */
export enum SectionType {
  /** 헤더 섹션 */
  HEADER = 'header',
  /** 본문 섹션 */
  BODY = 'body',
  /** 푸터 섹션 */
  FOOTER = 'footer'
}

/**
 * 제목 표시 설정 인터페이스
 */
export interface ITitleDisplayConfig {
  /** 표시 여부 */
  readonly enabled: boolean;
  /** 표시 타입 */
  readonly type: NoteTitleDisplayType;
}

/**
 * 표시 항목 인터페이스
 */
export interface IDisplayItems {
  /** 노트 제목 표시 여부 (파일명 또는 첫 헤더) */
  readonly title: boolean;
  /** 파일명 표시 여부 (title과 중복 가능) */
  readonly fileName: boolean;
  /** 첫 번째 헤더 표시 여부 (title과 중복 가능) */
  readonly firstHeader: boolean;
  /** 내용 표시 여부 */
  readonly content: boolean;
  /** 태그 표시 여부 */
  readonly tags: boolean;
  /** 생성일 표시 여부 */
  readonly createdDate: boolean;
  /** 수정일 표시 여부 */
  readonly updatedDate: boolean;
  /** 속성 표시 여부 */
  readonly properties: boolean;
}

/**
 * 섹션 표시 설정 인터페이스
 */
export interface ISectionDisplayConfig {
  /** 활성화 여부 */
  readonly enabled: boolean;
  /** 표시 항목 */
  readonly items: IDisplayItems;
}

/**
 * 렌더링 설정 인터페이스
 */
export interface IRenderConfig {
  /** 렌더링 타입 */
  readonly type: RenderType;
  /** 이미지 표시 */
  readonly showImages: boolean;
  /** 코드 하이라이팅 */
  readonly highlightCode: boolean;
  /** 콜아웃 지원 */
  readonly supportCallouts: boolean;
  /** 수식 지원 */
  readonly supportMath: boolean;
  /** 내용 길이 제한 활성화 */
  readonly contentLengthLimitEnabled: boolean;
  /** 내용 길이 제한 */
  readonly contentLengthLimit: number;
}

/**
 * 카드 섹션 설정 인터페이스
 */
export interface ICardSectionConfig {
  /** 표시 여부 */
  readonly display: boolean;
  /** 파일명 표시 여부 */
  readonly fileName: boolean;
  /** 첫 번째 헤더 표시 여부 */
  readonly firstHeader: boolean;
  /** 내용 표시 여부 */
  readonly content?: boolean;
  /** 태그 표시 여부 */
  readonly tags: boolean;
  /** 날짜 표시 여부 */
  readonly date: boolean;
  /** 속성 표시 여부 */
  readonly properties: boolean;
}

/**
 * 카드 설정 인터페이스
 */
export interface ICardConfig {
  /** 헤더 설정 */
  readonly header: ICardSectionConfig;
  /** 본문 설정 */
  readonly body: ICardSectionConfig;
  /** 푸터 설정 */
  readonly footer: ICardSectionConfig;
  /** 렌더링 타입 */
  readonly renderType: 'text' | 'html';
  /** 이미지 표시 */
  readonly showImages: boolean;
  /** 코드 하이라이팅 */
  readonly highlightCode: boolean;
  /** 콜아웃 지원 */
  readonly supportCallouts: boolean;
  /** 수식 지원 */
  readonly supportMath: boolean;
  /** 스타일 설정 */
  readonly style: ICardStyle;
}

/**
 * 기본 표시 항목 설정
 */
const DEFAULT_DISPLAY_ITEMS: IDisplayItems = {
  title: false,
  fileName: false,
  firstHeader: false,
  content: false,
  tags: false,
  createdDate: false,
  updatedDate: false,
  properties: false
};

/**
 * 기본 헤더 섹션 표시 설정
 */
const DEFAULT_HEADER_SECTION_CONFIG: ISectionDisplayConfig = {
  enabled: true,
  items: {
    ...DEFAULT_DISPLAY_ITEMS,
    title: true,      // 노트 제목 표시
    tags: true
  }
};

/**
 * 기본 본문 섹션 표시 설정
 */
const DEFAULT_BODY_SECTION_CONFIG: ISectionDisplayConfig = {
  enabled: true,
  items: {
    ...DEFAULT_DISPLAY_ITEMS,
    content: true
  }
};

/**
 * 기본 푸터 섹션 표시 설정
 */
const DEFAULT_FOOTER_SECTION_CONFIG: ISectionDisplayConfig = {
  enabled: true,
  items: {
    ...DEFAULT_DISPLAY_ITEMS,
    createdDate: true,
    updatedDate: true
  }
};

/**
 * 기본 렌더링 설정
 */
const DEFAULT_RENDER_CONFIG: IRenderConfig = {
  type: RenderType.HTML,
  showImages: true,
  highlightCode: true,
  supportCallouts: true,
  supportMath: true,
  contentLengthLimitEnabled: false,
  contentLengthLimit: 200
};

/**
 * 기본 카드 설정
 */
export const DEFAULT_CARD_CONFIG: ICardConfig = {
  header: {
    display: DEFAULT_HEADER_SECTION_CONFIG.enabled,
    fileName: DEFAULT_HEADER_SECTION_CONFIG.items.fileName,
    firstHeader: DEFAULT_HEADER_SECTION_CONFIG.items.firstHeader,
    content: DEFAULT_HEADER_SECTION_CONFIG.items.content,
    tags: DEFAULT_HEADER_SECTION_CONFIG.items.tags,
    date: DEFAULT_HEADER_SECTION_CONFIG.items.createdDate || DEFAULT_HEADER_SECTION_CONFIG.items.updatedDate,
    properties: DEFAULT_HEADER_SECTION_CONFIG.items.properties
  },
  body: {
    display: DEFAULT_BODY_SECTION_CONFIG.enabled,
    fileName: DEFAULT_BODY_SECTION_CONFIG.items.fileName,
    firstHeader: DEFAULT_BODY_SECTION_CONFIG.items.firstHeader,
    content: DEFAULT_BODY_SECTION_CONFIG.items.content,
    tags: DEFAULT_BODY_SECTION_CONFIG.items.tags,
    date: DEFAULT_BODY_SECTION_CONFIG.items.createdDate || DEFAULT_BODY_SECTION_CONFIG.items.updatedDate,
    properties: DEFAULT_BODY_SECTION_CONFIG.items.properties
  },
  footer: {
    display: DEFAULT_FOOTER_SECTION_CONFIG.enabled,
    fileName: DEFAULT_FOOTER_SECTION_CONFIG.items.fileName,
    firstHeader: DEFAULT_FOOTER_SECTION_CONFIG.items.firstHeader,
    content: DEFAULT_FOOTER_SECTION_CONFIG.items.content,
    tags: DEFAULT_FOOTER_SECTION_CONFIG.items.tags,
    date: DEFAULT_FOOTER_SECTION_CONFIG.items.createdDate || DEFAULT_FOOTER_SECTION_CONFIG.items.updatedDate,
    properties: DEFAULT_FOOTER_SECTION_CONFIG.items.properties
  },
  renderType: DEFAULT_RENDER_CONFIG.type,
  showImages: DEFAULT_RENDER_CONFIG.showImages,
  highlightCode: DEFAULT_RENDER_CONFIG.highlightCode,
  supportCallouts: DEFAULT_RENDER_CONFIG.supportCallouts,
  supportMath: DEFAULT_RENDER_CONFIG.supportMath,
  style: DEFAULT_CARD_STYLE
}; 