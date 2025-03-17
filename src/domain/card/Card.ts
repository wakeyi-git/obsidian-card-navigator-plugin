import { TFile, CachedMetadata } from 'obsidian';
import { CardState } from './CardState';

/**
 * 카드 메타데이터 타입
 */
export type CardMetadata = {
  [key: string]: any;
  tags?: string[];
};

/**
 * 카드 인터페이스
 * 노트의 정보를 카드 형태로 표현하기 위한 인터페이스입니다.
 */
export interface ICard {
  /**
   * 카드 ID (파일 경로)
   */
  id: string;
  
  /**
   * 카드 경로 (파일 경로)
   */
  path: string;
  
  /**
   * 파일 이름
   */
  filename: string;
  
  /**
   * 카드 제목 (파일 이름)
   */
  title: string;
  
  /**
   * 카드 내용 (노트 내용)
   */
  content: string;
  
  /**
   * 카드 태그 목록
   */
  tags: string[];
  
  /**
   * 프론트매터 데이터
   */
  frontmatter?: Record<string, any>;
  
  /**
   * 첫 번째 헤더
   */
  firstHeader?: string;
  
  /**
   * 카드 표시 설정
   */
  displaySettings?: ICardDisplaySettings;
  
  /**
   * 캐시된 메타데이터
   */
  metadata?: CachedMetadata;
  
  /**
   * 생성 시간
   */
  created?: number;
  
  /**
   * 수정 시간
   */
  modified?: number;
  
  /**
   * 카드 ID 가져오기 (파일 경로)
   */
  getId(): string;
  
  /**
   * 카드 경로 가져오기 (파일 경로)
   */
  getPath(): string;

  /**
   * 카드 제목 가져오기
   */
  getTitle(): string;

  /**
   * 카드 내용 가져오기
   */
  getContent(): string;

  /**
   * 카드 태그 가져오기
   */
  getTags(): string[];

  /**
   * 카드 메타데이터 가져오기
   */
  getMetadata(): Record<string, any>;
  
  /**
   * 생성일 가져오기
   */
  getCreated(): number;
  
  /**
   * 수정일 가져오기
   */
  getUpdated(): number;

  /**
   * 카드 상태 가져오기
   */
  getState(): CardState;

  /**
   * 카드 상태 설정
   */
  setState(state: CardState): void;

  /**
   * 카드 제목 설정
   */
  setTitle(title: string): void;

  /**
   * 카드 내용 설정
   */
  setContent(content: string): void;

  /**
   * 카드 생성 시간
   */
  getCreatedAt(): Date;

  /**
   * 카드 수정 시간
   */
  getUpdatedAt(): Date;

  /**
   * 카드 삭제
   */
  destroy(): void;

  /**
   * 헤더 콘텐츠 가져오기
   */
  getHeaderContent(): string;

  /**
   * 본문 콘텐츠 가져오기
   */
  getBodyContent(): string;

  /**
   * 푸터 콘텐츠 가져오기
   */
  getFooterContent(): string;

  /**
   * 카드 생성 시간 가져오기
   */
  getCtime(): number;

  /**
   * 카드 수정 시간 가져오기
   */
  getMtime(): number;
}

/**
 * 날짜 형식 설정 인터페이스
 */
export interface IDateFormatSettings {
  /**
   * 날짜 형식
   * 예: 'YYYY-MM-DD HH:mm:ss'
   */
  format: string;

  /**
   * 로케일
   * 예: 'ko-KR'
   */
  locale: string;

  /**
   * 상대적 시간 표시 여부
   * 예: '2일 전'
   */
  useRelativeTime: boolean;
}

/**
 * 프론트매터 형식 설정 인터페이스
 */
export interface IFrontmatterFormatSettings {
  /**
   * 표시할 필드
   */
  fields: string[];

  /**
   * 필드 레이블
   */
  labels: Record<string, string>;

  /**
   * 구분자
   */
  separator: string;

  /**
   * 형식
   * list: 목록 형식
   * table: 테이블 형식
   * inline: 인라인 형식
   */
  format: 'list' | 'table' | 'inline';
}

/**
 * 카드 표시 설정 인터페이스
 */
export interface ICardDisplaySettings {
  /**
   * 헤더 콘텐츠 설정
   */
  headerContent?: CardContentType | string;
  
  /**
   * 본문 콘텐츠 설정
   */
  bodyContent?: CardContentType | string;
  
  /**
   * 푸터 콘텐츠 설정
   */
  footerContent?: CardContentType | string;
  
  /**
   * 렌더링 방식
   */
  renderingMode?: CardRenderingMode;
  
  /**
   * 카드 스타일
   */
  cardStyle?: ICardStyle;

  /**
   * 날짜 포맷 설정
   */
  dateFormat?: IDateFormatSettings;

  /**
   * 프론트매터 포맷 설정
   */
  frontmatterFormat?: IFrontmatterFormatSettings;
}

/**
 * 카드 콘텐츠 타입
 * 카드에 표시할 콘텐츠 타입을 정의합니다.
 */
export type CardContentType = 'filename' | 'title' | 'firstheader' | 'content' | 'tags' | 'path' | 'created' | 'modified' | 'frontmatter' | string;

/**
 * 카드 렌더링 모드
 * 카드 렌더링 방식을 정의합니다.
 */
export type CardRenderingMode = 'text' | 'html' | 'markdown';

/**
 * 카드 요소 스타일 인터페이스
 */
export interface ICardElementStyle {
  /**
   * 배경색
   */
  background: string;

  /**
   * 글자 크기
   */
  fontSize: number;

  /**
   * 테두리 스타일
   */
  borderStyle: string;

  /**
   * 테두리 색상
   */
  borderColor: string;

  /**
   * 테두리 두께
   */
  borderWidth: number;

  /**
   * 테두리 반경
   */
  borderRadius: number;
}

/**
 * 카드 스타일 인터페이스
 */
export interface ICardStyle {
  /**
   * 일반 상태 스타일
   */
  normal: ICardElementStyle;

  /**
   * 활성 상태 스타일
   */
  active: ICardElementStyle;

  /**
   * 포커스 상태 스타일
   */
  focused: ICardElementStyle;

  /**
   * 헤더 스타일
   */
  header: ICardElementStyle;

  /**
   * 본문 스타일
   */
  body: ICardElementStyle;

  /**
   * 푸터 스타일
   */
  footer: ICardElementStyle;
}

/**
 * 카드 클래스
 * 노트의 정보를 카드 형태로 표현하는 클래스입니다.
 */
export class Card implements ICard {
  id: string;
  path: string;
  filename: string;
  title: string;
  content: string;
  tags: string[] = [];
  frontmatter?: Record<string, any>;
  firstHeader?: string;
  displaySettings?: ICardDisplaySettings;
  metadata?: CachedMetadata;
  created: number;
  modified: number;
  
  /**
   * 생성자
   * @param path 파일 경로
   * @param filename 파일 이름
   * @param content 내용
   * @param tags 태그 목록
   * @param frontmatter 프론트매터 데이터
   * @param firstHeader 첫 번째 헤더
   * @param displaySettings 표시 설정
   * @param metadata 캐시된 메타데이터
   * @param created 생성 시간 (타임스탬프)
   * @param modified 수정 시간 (타임스탬프)
   */
  constructor(
    path: string,
    filename: string,
    content: string,
    tags: string[] = [],
    frontmatter?: Record<string, any>,
    firstHeader?: string,
    displaySettings?: ICardDisplaySettings,
    metadata?: CachedMetadata,
    created: number = Date.now(),
    modified: number = Date.now()
  ) {
    this.id = path;
    this.path = path;
    this.filename = filename;
    this.title = filename;
    this.content = content;
    this.tags = tags;
    this.frontmatter = frontmatter;
    this.firstHeader = firstHeader;
    this.displaySettings = displaySettings;
    this.metadata = metadata;
    this.created = created;
    this.modified = modified;
  }
  
  /**
   * 카드 ID 가져오기 (파일 경로)
   * @returns 카드 ID
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * 카드 경로 가져오기 (파일 경로)
   * @returns 카드 경로
   */
  getPath(): string {
    return this.path;
  }

  /**
   * 카드 제목 가져오기
   * @returns 카드 제목
   */
  getTitle(): string {
    return this.title;
  }

  /**
   * 카드 내용 가져오기
   * @returns 카드 내용
   */
  getContent(): string {
    return this.content;
  }

  /**
   * 카드 태그 가져오기
   * @returns 카드 태그 목록
   */
  getTags(): string[] {
    return this.tags;
  }

  /**
   * 카드 메타데이터 가져오기
   * @returns 카드 메타데이터
   */
  getMetadata(): Record<string, any> {
    return {
      ...this.frontmatter,
      tags: this.tags
    };
  }
  
  /**
   * 생성일 가져오기
   * @returns 생성일 타임스탬프
   */
  getCreated(): number {
    return this.created;
  }
  
  /**
   * 수정일 가져오기
   * @returns 수정일 타임스탬프
   */
  getUpdated(): number {
    return this.modified;
  }

  /**
   * 카드 상태 가져오기
   */
  getState(): CardState {
    // Implementation needed
    throw new Error("Method not implemented.");
  }

  /**
   * 카드 상태 설정
   */
  setState(state: CardState): void {
    // Implementation needed
    throw new Error("Method not implemented.");
  }

  /**
   * 카드 제목 설정
   */
  setTitle(title: string): void {
    // Implementation needed
    throw new Error("Method not implemented.");
  }

  /**
   * 카드 내용 설정
   */
  setContent(content: string): void {
    // Implementation needed
    throw new Error("Method not implemented.");
  }

  /**
   * 카드 생성 시간
   */
  getCreatedAt(): Date {
    // Implementation needed
    throw new Error("Method not implemented.");
  }

  /**
   * 카드 수정 시간
   */
  getUpdatedAt(): Date {
    // Implementation needed
    throw new Error("Method not implemented.");
  }

  /**
   * 카드 삭제
   */
  destroy(): void {
    // Implementation needed
    throw new Error("Method not implemented.");
  }

  /**
   * 헤더 콘텐츠 가져오기
   */
  getHeaderContent(): string {
    return this.title;
  }

  /**
   * 본문 콘텐츠 가져오기
   */
  getBodyContent(): string {
    return this.content;
  }

  /**
   * 푸터 콘텐츠 가져오기
   */
  getFooterContent(): string {
    return this.tags.length > 0 ? this.tags.join(' ') : '';
  }

  /**
   * 카드 생성 시간 가져오기
   */
  getCtime(): number {
    return this.created;
  }

  /**
   * 카드 수정 시간 가져오기
   */
  getMtime(): number {
    return this.modified;
  }
}

export interface CardStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: string;
  margin: string;
  boxShadow: string;
  opacity: number;
  transform: string;
  transition: string;
} 