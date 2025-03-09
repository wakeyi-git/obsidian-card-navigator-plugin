import { App } from 'obsidian';
import { ISearch, SearchType } from './Search';
import { FileSearch } from './FileSearch';
import { ContentSearch } from './ContentSearch';
import { TagSearch } from './TagSearch';
import { PathSearch } from './PathSearch';
import { FrontmatterSearch } from './FrontmatterSearch';
import { DateSearch } from './DateSearch';
import { RegexSearch } from './RegexSearch';
import { TitleSearch } from './TitleSearch';
import { FolderSearch } from './FolderSearch';
import { ComplexSearch } from './ComplexSearch';

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
        return new FileSearch(this.app, query, caseSensitive);
      case 'content':
        return new ContentSearch(this.app, query, caseSensitive);
      case 'tag':
        return new TagSearch(this.app, query, caseSensitive);
      case 'path':
        return new PathSearch(this.app, query, caseSensitive);
      case 'frontmatter':
        return new FrontmatterSearch(this.app, query, frontmatterKey || '', caseSensitive);
      case 'create':
        return new DateSearch(this.app, query, 'creation', caseSensitive);
      case 'modify':
        return new DateSearch(this.app, query, 'modification', caseSensitive);
      case 'regex':
        return new RegexSearch(this.app, query, caseSensitive);
      case 'folder':
        return new FolderSearch(this.app, query, caseSensitive);
      case 'title':
        return new TitleSearch(this.app, query, caseSensitive);
      case 'file':
        return new FileSearch(this.app, query, caseSensitive);
      case 'complex':
        return new ComplexSearch(this.app, query, caseSensitive);
      case 'date':
        return new DateSearch(this.app, query, 'creation', caseSensitive);
      default:
        // 기본값은 파일명 검색
        return new FileSearch(this.app, query, caseSensitive);
    }
  }
  
  /**
   * 사용 가능한 검색 타입 목록 가져오기
   * @returns 검색 타입 목록
   */
  getSearchTypes(): SearchType[] {
    return [
      'filename', 'content', 'tag', 'path', 'frontmatter', 
      'create', 'modify', 'regex', 'folder', 'title', 'file', 'complex', 'date'
    ];
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
      case 'folder': return '폴더';
      case 'title': return '제목';
      case 'file': return '파일';
      case 'complex': return '복합 검색';
      case 'date': return '날짜';
      default: return '파일명';
    }
  }
} 