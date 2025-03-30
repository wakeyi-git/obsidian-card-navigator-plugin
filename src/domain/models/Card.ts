/**
 * 카드 컨텐츠 타입
 */
export type CardContent = {
  /** 제목 */
  title: string;
  /** 헤더 */
  header?: string;
  /** 본문 */
  body?: string;
  /** 태그 목록 */
  tags: string[];
  /** 프론트매터 */
  frontmatter: Record<string, any>;
};

/**
 * 카드 스타일 타입
 */
export type CardStyle = {
  /** 배경색 */
  backgroundColor: string;
  /** 폰트 크기 */
  fontSize: number;
  /** 테두리 색상 */
  borderColor: string;
  /** 테두리 두께 */
  borderWidth: number;
  /** 테두리 스타일 */
  borderStyle: string;
  /** 테두리 반경 */
  borderRadius: number;
  /** 패딩 */
  padding: number;
  /** 마진 */
  margin: number;
};

/**
 * 카드 위치 인터페이스
 */
export interface CardPosition {
    /**
     * 카드 ID
     */
    cardId: string;

    /**
     * 왼쪽 위치
     */
    left: number;

    /**
     * 상단 위치
     */
    top: number;

    /**
     * 너비
     */
    width: number;

    /**
     * 높이
     */
    height: number;

    /**
     * X 좌표 (그리드 레이아웃용)
     */
    x?: number;

    /**
     * Y 좌표 (그리드 레이아웃용)
     */
    y?: number;

    /**
     * Z-index
     */
    zIndex?: number;
}

/**
 * 카드 렌더링 옵션
 */
export interface ICardRenderConfig {
  /** 헤더 설정 */
  header: {
    /** 파일 이름 표시 여부 */
    showFileName: boolean;
    /** 첫 번째 헤더 표시 여부 */
    showFirstHeader: boolean;
    /** 태그 표시 여부 */
    showTags: boolean;
    /** 생성일 표시 여부 */
    showCreatedDate: boolean;
    /** 수정일 표시 여부 */
    showUpdatedDate: boolean;
    /** 선택된 속성 목록 */
    showProperties: string[];
    /** 마크다운 렌더링 여부 */
    renderMarkdown?: boolean;
  };
  /** 본문 설정 */
  body: {
    /** 파일 이름 표시 여부 */
    showFileName: boolean;
    /** 첫 번째 헤더 표시 여부 */
    showFirstHeader: boolean;
    /** 내용 표시 여부 */
    showContent: boolean;
    /** 태그 표시 여부 */
    showTags: boolean;
    /** 생성일 표시 여부 */
    showCreatedDate: boolean;
    /** 수정일 표시 여부 */
    showUpdatedDate: boolean;
    /** 선택된 속성 목록 */
    showProperties: string[];
    /** 내용 길이 */
    contentLength?: number;
    /** 마크다운 렌더링 여부 */
    renderMarkdown?: boolean;
  };
  /** 푸터 설정 */
  footer: {
    /** 파일 이름 표시 여부 */
    showFileName: boolean;
    /** 첫 번째 헤더 표시 여부 */
    showFirstHeader: boolean;
    /** 태그 표시 여부 */
    showTags: boolean;
    /** 생성일 표시 여부 */
    showCreatedDate: boolean;
    /** 수정일 표시 여부 */
    showUpdatedDate: boolean;
    /** 선택된 속성 목록 */
    showProperties: string[];
    /** 마크다운 렌더링 여부 */
    renderMarkdown?: boolean;
  };
  /** HTML로 렌더링 여부 */
  renderAsHtml: boolean;
}

/**
 * 카드 스타일 인터페이스
 */
export interface ICardStyle {
  /** 일반 카드 스타일 */
  card: {
    /** 배경색 */
    background: string;
    /** 글꼴 크기 */
    fontSize: string;
    /** 테두리 색상 */
    borderColor: string;
    /** 테두리 두께 */
    borderWidth: string;
  };
  /** 활성 카드 스타일 */
  activeCard: {
    /** 배경색 */
    background: string;
    /** 글꼴 크기 */
    fontSize: string;
    /** 테두리 색상 */
    borderColor: string;
    /** 테두리 두께 */
    borderWidth: string;
  };
  /** 포커스 카드 스타일 */
  focusedCard: {
    /** 배경색 */
    background: string;
    /** 글꼴 크기 */
    fontSize: string;
    /** 테두리 색상 */
    borderColor: string;
    /** 테두리 두께 */
    borderWidth: string;
  };
  /** 헤더 스타일 */
  header: {
    /** 배경색 */
    background: string;
    /** 글꼴 크기 */
    fontSize: string;
    /** 테두리 색상 */
    borderColor: string;
    /** 테두리 두께 */
    borderWidth: string;
  };
  /** 본문 스타일 */
  body: {
    /** 배경색 */
    background: string;
    /** 글꼴 크기 */
    fontSize: string;
    /** 테두리 색상 */
    borderColor: string;
    /** 테두리 두께 */
    borderWidth: string;
  };
  /** 푸터 스타일 */
  footer: {
    /** 배경색 */
    background: string;
    /** 글꼴 크기 */
    fontSize: string;
    /** 테두리 색상 */
    borderColor: string;
    /** 테두리 두께 */
    borderWidth: string;
  };
}

/**
 * 카드 인터페이스
 */
export interface ICard {
  /**
   * 카드 ID
   */
  id: string;

  /**
   * 파일 경로
   */
  filePath: string;

  /**
   * 파일 이름
   */
  fileName: string;

  /**
   * 첫 번째 헤더
   */
  firstHeader: string;

  /**
   * 프론트매터
   */
  frontmatter: Record<string, any>;

  /**
   * 내용
   */
  content: string;

  /**
   * 태그
   */
  tags: string[];

  /**
   * 생성일
   */
  createdAt: number;

  /**
   * 수정일
   */
  updatedAt: number;

  /**
   * 활성화 여부
   */
  isActive: boolean;

  /**
   * 포커스 여부
   */
  isFocused: boolean;

  /**
   * 렌더링 설정
   */
  renderConfig: ICardRenderConfig;

  /**
   * 스타일
   */
  style: ICardStyle;

  /**
   * 카드 위치
   */
  position?: CardPosition;
}

/**
 * 카드 클래스
 */
export class Card implements ICard {
  private _id: string;
  private _filePath: string;
  private _fileName: string;
  private _firstHeader: string;
  private _content: string;
  private _tags: string[];
  private _createdAt: number;
  private _updatedAt: number;
  private _frontmatter: Record<string, any>;
  private _isActive: boolean;
  private _isFocused: boolean;
  private _position?: CardPosition;
  private _renderConfig: ICardRenderConfig;
  private _style: ICardStyle;

  constructor(
    id: string,
    filePath: string,
    fileName: string,
    firstHeader: string,
    content: string,
    tags: string[],
    createdAt: number,
    updatedAt: number,
    frontmatter: Record<string, any>,
    renderConfig: ICardRenderConfig,
    style: ICardStyle
  ) {
    this._id = id;
    this._filePath = filePath;
    this._fileName = fileName;
    this._firstHeader = firstHeader;
    this._content = content;
    this._tags = tags;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._frontmatter = frontmatter;
    this._isActive = false;
    this._isFocused = false;
    this._renderConfig = renderConfig;
    this._style = style;
  }

  /**
   * 카드 ID 반환
   */
  get id(): string {
    return this._id;
  }

  /**
   * 파일 경로 반환
   */
  get filePath(): string {
    return this._filePath;
  }

  /**
   * 파일 이름 반환
   */
  get fileName(): string {
    return this._fileName;
  }

  /**
   * 첫 번째 헤더 반환
   */
  get firstHeader(): string {
    return this._firstHeader;
  }

  /**
   * 본문 반환
   */
  get content(): string {
    return this._content;
  }

  /**
   * 태그 목록 반환
   */
  get tags(): string[] {
    return this._tags;
  }

  /**
   * 생성일 반환
   */
  get createdAt(): number {
    return this._createdAt;
  }

  /**
   * 수정일 반환
   */
  get updatedAt(): number {
    return this._updatedAt;
  }

  /**
   * 프론트매터 반환
   */
  get frontmatter(): Record<string, any> {
    return this._frontmatter;
  }

  /**
   * 활성 여부 반환
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * 포커스 여부 반환
   */
  get isFocused(): boolean {
    return this._isFocused;
  }

  /**
   * 위치 반환
   */
  get position(): CardPosition | undefined {
    return this._position;
  }

  /**
   * 렌더링 설정 반환
   */
  get renderConfig(): ICardRenderConfig {
    return this._renderConfig;
  }

  /**
   * 스타일 반환
   */
  get style(): ICardStyle {
    return this._style;
  }

  /**
   * 위치 설정
   */
  set position(position: CardPosition | undefined) {
    this._position = position;
  }

  /**
   * 활성 상태 설정
   */
  setActive(isActive: boolean): void {
    this._isActive = isActive;
  }

  /**
   * 포커스 상태 설정
   */
  setFocused(isFocused: boolean): void {
    this._isFocused = isFocused;
  }

  /**
   * 렌더링 설정 업데이트
   */
  updateRenderConfig(config: Partial<ICardRenderConfig>): void {
    this._renderConfig = {
      ...this._renderConfig,
      ...config
    };
  }

  /**
   * 스타일 업데이트
   */
  updateStyle(style: Partial<ICardStyle>): void {
    this._style = {
      ...this._style,
      ...style
    };
  }

  /**
   * 카드 복제
   */
  clone(): Card {
    const clonedCard = new Card(
      this._id,
      this._filePath,
      this._fileName,
      this._firstHeader,
      this._content,
      [...this._tags],
      this._createdAt,
      this._updatedAt,
      { ...this._frontmatter },
      {
        header: { ...this._renderConfig.header },
        body: { ...this._renderConfig.body },
        footer: { ...this._renderConfig.footer },
        renderAsHtml: this._renderConfig.renderAsHtml
      },
      {
        card: { ...this._style.card },
        activeCard: { ...this._style.activeCard },
        focusedCard: { ...this._style.focusedCard },
        header: { ...this._style.header },
        body: { ...this._style.body },
        footer: { ...this._style.footer }
      }
    );

    if (this._position) {
      clonedCard.position = { ...this._position };
    }

    clonedCard.setActive(this._isActive);
    clonedCard.setFocused(this._isFocused);

    return clonedCard;
  }

  /**
   * 카드 내용 업데이트
   */
  updateContent(content: string): void {
    this._content = content;
    this._updatedAt = Date.now();
  }
} 