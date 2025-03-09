import { TFile, CachedMetadata } from 'obsidian';

/**
 * 카드 인터페이스
 * 노트의 정보를 카드 형태로 표현하기 위한 인터페이스입니다.
 */
export interface ICard {
  /**
   * 원본 파일 객체
   * Obsidian TFile 객체를 직접 참조합니다.
   */
  file: TFile;
  
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
   * 카드 ID 가져오기 (파일 경로)
   */
  getId(): string;
  
  /**
   * 카드 경로 가져오기 (파일 경로)
   */
  getPath(): string;
  
  /**
   * 생성일 가져오기
   */
  getCreatedTime(): number;
  
  /**
   * 수정일 가져오기
   */
  getModifiedTime(): number;
}

/**
 * 카드 표시 설정 인터페이스
 * 카드의 표시 방식을 정의합니다.
 */
export interface ICardDisplaySettings {
  /**
   * 헤더 표시 항목
   */
  headerContent?: CardContentType;
  
  /**
   * 본문 표시 항목
   */
  bodyContent?: CardContentType;
  
  /**
   * 푸터 표시 항목
   */
  footerContent?: CardContentType;
  
  /**
   * 렌더링 방식
   */
  renderingMode?: CardRenderingMode;
  
  /**
   * 카드 스타일
   */
  cardStyle?: ICardStyle;
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
export type CardRenderingMode = 'text' | 'html';

/**
 * 카드 스타일 인터페이스
 * 카드의 스타일을 정의합니다.
 */
export interface ICardStyle {
  /**
   * 일반 카드 스타일
   */
  normal?: ICardElementStyle;
  
  /**
   * 활성 카드 스타일
   */
  active?: ICardElementStyle;
  
  /**
   * 포커스 카드 스타일
   */
  focused?: ICardElementStyle;
  
  /**
   * 헤더 스타일
   */
  header?: ICardElementStyle;
  
  /**
   * 본문 스타일
   */
  body?: ICardElementStyle;
  
  /**
   * 푸터 스타일
   */
  footer?: ICardElementStyle;
}

/**
 * 카드 요소 스타일 인터페이스
 * 카드 요소의 스타일을 정의합니다.
 */
export interface ICardElementStyle {
  /**
   * 배경색
   */
  backgroundColor?: string;
  
  /**
   * 폰트 크기
   */
  fontSize?: number;
  
  /**
   * 테두리 스타일
   */
  borderStyle?: string;
  
  /**
   * 테두리 색상
   */
  borderColor?: string;
  
  /**
   * 테두리 두께
   */
  borderWidth?: number;
  
  /**
   * 테두리 반경
   */
  borderRadius?: number;
}

/**
 * 카드 클래스
 * 노트의 정보를 카드 형태로 표현하는 클래스입니다.
 */
export class Card implements ICard {
  file: TFile;
  title: string;
  content: string;
  tags: string[] = [];
  frontmatter?: Record<string, any>;
  firstHeader?: string;
  displaySettings?: ICardDisplaySettings;
  metadata?: CachedMetadata;
  
  /**
   * 생성자
   * @param file 파일 객체
   * @param content 내용
   * @param tags 태그 목록
   * @param frontmatter 프론트매터 데이터
   * @param firstHeader 첫 번째 헤더
   * @param displaySettings 표시 설정
   * @param metadata 캐시된 메타데이터
   */
  constructor(
    file: TFile,
    content: string,
    tags: string[] = [],
    frontmatter?: Record<string, any>,
    firstHeader?: string,
    displaySettings?: ICardDisplaySettings,
    metadata?: CachedMetadata
  ) {
    this.file = file;
    this.title = file.basename;
    this.content = content;
    this.tags = tags;
    this.frontmatter = frontmatter;
    this.firstHeader = firstHeader;
    this.displaySettings = displaySettings;
    this.metadata = metadata;
  }
  
  /**
   * 카드 ID 가져오기 (파일 경로)
   * @returns 카드 ID
   */
  getId(): string {
    return this.file.path;
  }
  
  /**
   * 카드 경로 가져오기 (파일 경로)
   * @returns 카드 경로
   */
  getPath(): string {
    return this.file.path;
  }
  
  /**
   * 생성일 가져오기
   * @returns 생성일 타임스탬프
   */
  getCreatedTime(): number {
    return this.file.stat.ctime;
  }
  
  /**
   * 수정일 가져오기
   * @returns 수정일 타임스탬프
   */
  getModifiedTime(): number {
    return this.file.stat.mtime;
  }
} 