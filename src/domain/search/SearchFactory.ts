import { App } from 'obsidian';
import { ISearch, SearchType } from './Search';
import { FilenameSearch } from './FilenameSearch';
import { ContentSearch } from './ContentSearch';
import { TagSearch } from './TagSearch';
import { PathSearch } from './PathSearch';
import { FrontmatterSearch } from './FrontmatterSearch';
import { DateSearch } from './DateSearch';
import { RegexSearch } from './RegexSearch';

/**
 * 검색 팩토리 클래스
 * 검색 타입에 따라 적절한 검색 객체를 생성합니다.
 */
export class SearchFactory {
  private app: App;
  
  constructor(app: App) {
    this.app = app;
  }
  
  /**
   * 검색 객체 생성
   * @param type 검색 타입
   * @param query 검색 쿼리
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   * @returns 검색 객체
   */
  createSearch(type: SearchType, query: string, caseSensitive = false, frontmatterKey?: string): ISearch {
    switch (type) {
      case 'filename':
        return new FilenameSearch(this.app, query, caseSensitive);
      case 'content':
        return new ContentSearch(this.app, query, caseSensitive);
      case 'tag':
        return new TagSearch(this.app, query, caseSensitive);
      case 'path':
        return new PathSearch(this.app, query, caseSensitive);
      case 'frontmatter':
        return new FrontmatterSearch(this.app, query, caseSensitive, frontmatterKey);
      case 'create':
        return new DateSearch(this.app, query, 'creation', caseSensitive);
      case 'modify':
        return new DateSearch(this.app, query, 'modification', caseSensitive);
      case 'regex':
        return new RegexSearch(this.app, query, caseSensitive);
      default:
        // 기본값은 파일명 검색
        return new FilenameSearch(this.app, query, caseSensitive);
    }
  }
  
  /**
   * 검색 타입 목록 가져오기
   * @returns 검색 타입 목록
   */
  getSearchTypes(): SearchType[] {
    return ['filename', 'content', 'tag', 'path', 'frontmatter', 'create', 'modify', 'regex'];
  }
  
  /**
   * 검색 타입 표시 이름 가져오기
   * @param type 검색 타입
   * @returns 표시 이름
   */
  getSearchTypeDisplayName(type: SearchType): string {
    switch (type) {
      case 'filename': return '파일명';
      case 'content': return '내용';
      case 'tag': return '태그';
      case 'path': return '경로';
      case 'frontmatter': return '프론트매터';
      case 'create': return '생성일';
      case 'modify': return '수정일';
      case 'regex': return '정규식';
      default: return type;
    }
  }
} 