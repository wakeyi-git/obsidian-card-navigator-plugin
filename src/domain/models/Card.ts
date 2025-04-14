import { TFile } from 'obsidian';

/**
 * 카드 기본 정보 인터페이스
 * 
 * @example
 * ```typescript
 * const card: ICard = {
 *   id: 'card-1',
 *   file: null,
 *   filePath: '/notes/note1.md',
 *   title: '노트 제목',
 *   fileName: 'note1.md',
 *   firstHeader: '# 노트 제목',
 *   content: '노트 내용...',
 *   tags: ['태그1', '태그2'],
 *   properties: { key: 'value' },
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface ICard {
  /** 카드 ID */
  readonly id: string;
  /** 파일 객체 */
  readonly file: TFile | null;
  /** 파일 경로 */
  readonly filePath: string;
  /** 노트 제목 */
  readonly title: string;
  /** 파일명 */
  readonly fileName: string;
  /** 첫 번째 헤더 */
  readonly firstHeader: string | null;
  /** 내용 */
  readonly content: string;
  /** 태그 목록 */
  readonly tags: readonly string[];
  /** 속성 (프론트매터 속성과 메타데이터) */
  readonly properties: Readonly<Record<string, unknown>>;
  /** 생성일 */
  readonly createdAt: Date;
  /** 수정일 */
  readonly updatedAt: Date;
  /** 유효성 검사 */
  validate(): boolean;
  /** 미리보기 */
  preview(): Omit<ICard, 'validate' | 'preview' | 'toString'>;
  /** 문자열 표현 */
  toString(): string;
}

/**
 * 렌더링 타입 열거형
 * 
 * @example
 * ```typescript
 * const renderType = RenderType.MARKDOWN; // 마크다운 렌더링
 * ```
 */
export enum RenderType {
  /** 일반 텍스트 */
  TEXT = 'text',
  /** 마크다운 렌더링 */
  MARKDOWN = 'markdown'
}

/**
 * 렌더링 상태 열거형
 * 
 * @example
 * ```typescript
 * const status = RenderStatus.PROCESSING; // 렌더링 중
 * ```
 */
export enum RenderStatus {
  /** 대기 중 */
  PENDING = 'pending',
  /** 처리 중 */
  PROCESSING = 'processing',
  /** 완료 */
  COMPLETED = 'completed',
  /** 실패 */
  FAILED = 'failed'
}

/**
 * 렌더링 상태 인터페이스
 * 
 * @example
 * ```typescript
 * const state: IRenderState = {
 *   status: RenderStatus.PENDING,
 *   startTime: Date.now(),
 *   endTime: 0,
 *   error: null,
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface IRenderState {
  /** 렌더링 상태 */
  readonly status: RenderStatus;
  /** 렌더링 시작 시간 */
  readonly startTime: number;
  /** 렌더링 종료 시간 */
  readonly endTime: number;
  /** 렌더링 오류 */
  readonly error: string | null;
  /** 타임스탬프 */
  readonly timestamp: number;
}

/**
 * 카드 스타일 인터페이스
 */
export interface ICardStyle {
  /** CSS 클래스 목록 */
  readonly classes: readonly string[];
  /** 배경색 */
  readonly backgroundColor: string;
  /** 폰트 크기 */
  readonly fontSize: string;
  /** 폰트 색상 */
  readonly color: string;
  /** 테두리 */
  readonly border: {
    /** 너비 */
    readonly width: string;
    /** 색상 */
    readonly color: string;
    /** 스타일 */
    readonly style: string;
    /** 반경 */
    readonly radius: string;
  };
  /** 여백 */
  readonly padding: string;
  /** 그림자 */
  readonly boxShadow: string;
  /** 줄 간격 */
  readonly lineHeight: string;
  /** 폰트 패밀리 */
  readonly fontFamily: string;
}

/**
 * 카드 표시 옵션 인터페이스
 */
export interface ICardDisplayOptions {
  /** 제목 표시 여부 */
  showTitle: boolean;
  /** 파일명 표시 여부 */
  showFileName: boolean;
  /** 첫 번째 헤더 표시 여부 */
  showFirstHeader: boolean;
  /** 내용 표시 여부 */
  showContent: boolean;
  /** 태그 표시 여부 */
  showTags: boolean;
  /** 생성일 표시 여부 */
  showCreatedAt: boolean;
  /** 수정일 표시 여부 */
  showUpdatedAt: boolean;
  /** 속성 표시 여부 */
  showProperties: boolean;
  /** 렌더링 설정 */
  renderConfig: IRenderConfig;
}

/**
 * 카드 섹션 인터페이스
 */
export interface ICardSection {
  /** 섹션 타입 */
  readonly type: 'header' | 'body' | 'footer';
  /** 섹션 표시 옵션 */
  readonly displayOptions: ICardDisplayOptions;
  /** 섹션 스타일 */
  readonly style?: ICardStyle;
}

/**
 * 카드 상태별 스타일 인터페이스
 */
export interface ICardStateStyle {
  /** 일반 카드 스타일 */
  readonly normal: ICardStyle;
  /** 활성 카드 스타일 */
  readonly active: ICardStyle;
  /** 포커스된 카드 스타일 */
  readonly focused: ICardStyle;
}

/**
 * 제목 소스 열거형
 * 
 * @example
 * ```typescript
 * const source = TitleSource.FILE_NAME; // 파일명을 제목으로 사용
 * ```
 */
export enum TitleSource {
  /** 파일명을 제목으로 사용 */
  FILE_NAME = 'fileName',
  /** 첫 번째 헤더를 제목으로 사용 */
  FIRST_HEADER = 'firstHeader'
}

/**
 * 렌더링 설정 인터페이스
 */
export interface IRenderConfig {
  /** 렌더링 타입 */
  readonly type: RenderType;
  /** 내용 길이 제한 활성화 */
  readonly contentLengthLimitEnabled: boolean;
  /** 내용 길이 제한 */
  readonly contentLengthLimit: number;
  /** 렌더링 스타일 */
  readonly style?: ICardStyle;
  /** 렌더링 상태 */
  readonly state: IRenderState;
  /** 섹션 설정 */
  readonly sections?: {
    header?: {
      displayOptions?: {
        showTitle?: boolean;
        showFileName?: boolean;
        showFirstHeader?: boolean;
        showContent?: boolean;
        showTags?: boolean;
        showCreatedAt?: boolean;
        showUpdatedAt?: boolean;
        showProperties?: boolean;
      };
    };
    body?: {
      displayOptions?: {
        showTitle?: boolean;
        showFileName?: boolean;
        showFirstHeader?: boolean;
        showContent?: boolean;
        showTags?: boolean;
        showCreatedAt?: boolean;
        showUpdatedAt?: boolean;
        showProperties?: boolean;
      };
    };
    footer?: {
      displayOptions?: {
        showTitle?: boolean;
        showFileName?: boolean;
        showFirstHeader?: boolean;
        showContent?: boolean;
        showTags?: boolean;
        showCreatedAt?: boolean;
        showUpdatedAt?: boolean;
        showProperties?: boolean;
      };
    };
  };
}

/**
 * 카드 생성 설정 인터페이스
 */
export interface ICardCreateConfig {
  /** 카드 상태별 스타일 */
  stateStyle: ICardStateStyle;
  /** 카드 표시 옵션 */
  displayOptions: ICardDisplayOptions;
  /** 헤더 섹션 */
  header: ICardSection;
  /** 본문 섹션 */
  body: ICardSection;
  /** 푸터 섹션 */
  footer: ICardSection;
  /** 렌더링 설정 */
  renderConfig: IRenderConfig;
  /** 제목 소스 */
  titleSource: TitleSource;
}

/**
 * 카드 도메인 설정 인터페이스
 */
export interface ICardDomainSettings {
  /** 카드 섹션 설정 */
  readonly sections: {
    header: ICardSection;
    body: ICardSection;
    footer: ICardSection;
  };
  /** 카드 렌더링 설정 */
  readonly renderConfig: IRenderConfig;
  /** 카드 상태별 스타일 */
  readonly stateStyle: ICardStateStyle;
  /** 제목 소스 */
  readonly titleSource: TitleSource;
}

/**
 * 기본 카드 스타일
 */
export const DEFAULT_CARD_STYLE: ICardStyle = {
  classes: ['card'],
  backgroundColor: '#ffffff',
  fontSize: '14px',
  color: '#333333',
  border: {
    width: '1px',
    color: '#e0e0e0',
    style: 'solid',
    radius: '8px'
  },
  padding: '10px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  lineHeight: '1.5',
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

/**
 * 기본 렌더링 상태
 */
export const DEFAULT_RENDER_STATE: IRenderState = {
  status: RenderStatus.PENDING,
  startTime: 0,
  endTime: 0,
  error: null,
  timestamp: Date.now()
};

/**
 * 기본 렌더링 설정
 */
export const DEFAULT_RENDER_CONFIG: IRenderConfig = {
  type: RenderType.MARKDOWN,
  contentLengthLimitEnabled: false,
  contentLengthLimit: 200,
  state: DEFAULT_RENDER_STATE
};

/**
 * 기본 카드 표시 옵션
 */
export const DEFAULT_CARD_DISPLAY_OPTIONS: ICardDisplayOptions = {
  showTitle: true,
  showFileName: false,
  showFirstHeader: false,
  showContent: true,
  showTags: true,
  showCreatedAt: true,
  showUpdatedAt: true,
  showProperties: true,
  renderConfig: DEFAULT_RENDER_CONFIG
};

/**
 * 기본 카드 상태별 스타일
 */
export const DEFAULT_CARD_STATE_STYLE: ICardStateStyle = {
  normal: DEFAULT_CARD_STYLE,
  active: {
    ...DEFAULT_CARD_STYLE,
    classes: [...DEFAULT_CARD_STYLE.classes, 'card-active'],
    border: {
      ...DEFAULT_CARD_STYLE.border,
      color: '#2196f3',
      width: '2px'
    }
  },
  focused: {
    ...DEFAULT_CARD_STYLE,
    classes: [...DEFAULT_CARD_STYLE.classes, 'card-focused'],
    border: {
      ...DEFAULT_CARD_STYLE.border,
      color: '#ff9800',
      width: '2px'
    }
  }
};

/**
 * 기본 카드 도메인 설정
 */
export const DEFAULT_CARD_DOMAIN_SETTINGS: ICardDomainSettings = {
  sections: {
    header: {
      type: 'header',
      displayOptions: {
        ...DEFAULT_CARD_DISPLAY_OPTIONS,
        showTitle: true,
        showFileName: false,
        showFirstHeader: false,
        showContent: false,
        showTags: false,
        showCreatedAt: false,
        showUpdatedAt: false,
        showProperties: false
      }
    },
    body: {
      type: 'body',
      displayOptions: {
        ...DEFAULT_CARD_DISPLAY_OPTIONS,
        showTitle: false,
        showFileName: false,
        showFirstHeader: false,
        showContent: true,
        showTags: true,
        showCreatedAt: false,
        showUpdatedAt: false,
        showProperties: false
      }
    },
    footer: {
      type: 'footer',
      displayOptions: {
        ...DEFAULT_CARD_DISPLAY_OPTIONS,
        showTitle: false,
        showFileName: false,
        showFirstHeader: false,
        showContent: false,
        showTags: true,
        showCreatedAt: true,
        showUpdatedAt: true,
        showProperties: true
      }
    }
  },
  renderConfig: DEFAULT_RENDER_CONFIG,
  stateStyle: DEFAULT_CARD_STATE_STYLE,
  titleSource: TitleSource.FILE_NAME
};

/**
 * 기본 카드 섹션 설정
 */
export const DEFAULT_CARD_SECTION: ICardSection = {
  type: 'body',
  displayOptions: {
    showTitle: true,
    showFileName: true,
    showFirstHeader: true,
    showContent: true,
    showTags: true,
    showCreatedAt: true,
    showUpdatedAt: true,
    showProperties: true,
    renderConfig: DEFAULT_RENDER_CONFIG
  }
};

/**
 * 기본 카드 생성 설정
 */
export const DEFAULT_CARD_CREATE_CONFIG: ICardCreateConfig = {
  stateStyle: DEFAULT_CARD_STATE_STYLE,
  displayOptions: DEFAULT_CARD_DISPLAY_OPTIONS,
  header: {
    ...DEFAULT_CARD_SECTION,
    type: 'header'
  },
  body: {
    ...DEFAULT_CARD_SECTION,
    type: 'body'
  },
  footer: {
    ...DEFAULT_CARD_SECTION,
    type: 'footer'
  },
  renderConfig: DEFAULT_RENDER_CONFIG,
  titleSource: TitleSource.FILE_NAME
};

