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
   * 카드 경로 (파일 경로)
   */
  path: string;
  
  /**
   * 생성일
   */
  created: number;
  
  /**
   * 수정일
   */
  modified: number;
  
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
}

/**
 * 카드 표시 설정 인터페이스
 * 카드의 표시 항목, 렌더링 방식, 스타일을 정의합니다.
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
 * 카드 내용 타입
 */
export type CardContentType = 'filename' | 'title' | 'firstheader' | 'content' | 'tags' | 'path' | 'created' | 'modified' | 'frontmatter' | string;

/**
 * 카드 렌더링 방식
 */
export type CardRenderingMode = 'text' | 'html';

/**
 * 카드 스타일 인터페이스
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
  id: string;
  title: string;
  content: string;
  tags: string[];
  path: string;
  created: number;
  modified: number;
  frontmatter?: Record<string, any>;
  firstHeader?: string;
  displaySettings?: ICardDisplaySettings;
  
  constructor(
    id: string,
    title: string,
    content: string,
    tags: string[] = [],
    path: string,
    created: number,
    modified: number,
    frontmatter?: Record<string, any>,
    firstHeader?: string,
    displaySettings?: ICardDisplaySettings
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.tags = tags;
    this.path = path;
    this.created = created;
    this.modified = modified;
    this.frontmatter = frontmatter;
    this.firstHeader = firstHeader;
    this.displaySettings = displaySettings;
  }
  
  /**
   * 카드 내용 업데이트
   * @param content 새 내용
   */
  updateContent(content: string): void {
    this.content = content;
    this.modified = Date.now();
  }
  
  /**
   * 카드 태그 추가
   * @param tag 추가할 태그
   */
  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }
  
  /**
   * 카드 태그 제거
   * @param tag 제거할 태그
   */
  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }
  
  /**
   * 카드 표시 설정 업데이트
   * @param displaySettings 새 표시 설정
   */
  updateDisplaySettings(displaySettings: ICardDisplaySettings): void {
    this.displaySettings = {
      ...this.displaySettings,
      ...displaySettings
    };
  }
} 