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
  
  constructor(
    id: string,
    title: string,
    content: string,
    tags: string[] = [],
    path: string,
    created: number,
    modified: number,
    frontmatter?: Record<string, any>
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.tags = tags;
    this.path = path;
    this.created = created;
    this.modified = modified;
    this.frontmatter = frontmatter;
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
} 