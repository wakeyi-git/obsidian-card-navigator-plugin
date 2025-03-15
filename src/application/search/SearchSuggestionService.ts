import { TFile } from 'obsidian';
import { ObsidianService } from '../../infrastructure/obsidian/adapters/ObsidianService';
import { ISearchSuggestion, SearchType } from '../../domain/search/Search';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 검색 제안 서비스 인터페이스
 */
export interface ISearchSuggestionService {
  /**
   * 검색 제안 가져오기
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 제안 목록
   */
  getSuggestions(query: string, searchType?: SearchType, caseSensitive?: boolean): Promise<ISearchSuggestion[]>;
  
  /**
   * 파일 경로 제안 가져오기
   * @param query 검색어
   * @returns 파일 경로 제안 목록
   */
  getPathSuggestions(query: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 파일 이름 제안 가져오기
   * @param query 검색어
   * @returns 파일 이름 제안 목록
   */
  getFileSuggestions(query: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 태그 제안 가져오기
   * @param query 검색어
   * @returns 태그 제안 목록
   */
  getTagSuggestions(query: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 속성 제안 가져오기
   * @param query 검색어
   * @returns 속성 제안 목록
   */
  getPropertySuggestions(query: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 속성값 제안 가져오기
   * @param property 속성
   * @param query 검색어
   * @returns 속성값 제안 목록
   */
  getPropertyValueSuggestions(property: string, query: string): Promise<ISearchSuggestion[]>;
}

/**
 * 검색 제안 서비스
 * 검색 제안을 관리합니다.
 */
export class SearchSuggestionService implements ISearchSuggestionService {
  private obsidianService: ObsidianService;
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   */
  constructor(obsidianService: ObsidianService) {
    this.obsidianService = obsidianService;
  }
  
  /**
   * 검색 제안 가져오기
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 제안 목록
   */
  async getSuggestions(query: string, searchType: SearchType = 'filename', caseSensitive = false): Promise<ISearchSuggestion[]> {
    if (!query) {
      return [];
    }
    
    // 검색 타입에 따라 다른 제안 가져오기
    switch (searchType) {
      case 'filename':
        return this.getFileSuggestions(query);
      case 'tag':
        return this.getTagSuggestions(query);
      case 'frontmatter':
        return this.getPropertySuggestions(query);
      default:
        // 기본적으로 파일 이름 제안 반환
        return this.getFileSuggestions(query);
    }
  }
  
  /**
   * 파일 경로 제안 가져오기
   * @param query 검색어
   * @returns 파일 경로 제안 목록
   */
  async getPathSuggestions(query: string): Promise<ISearchSuggestion[]> {
    const folders = this.obsidianService.getFolderPaths();
    const suggestions: ISearchSuggestion[] = [];
    
    for (const path of folders) {
      if (path.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: `path:${path}`,
          type: 'path',
          description: `폴더: ${path}`,
          highlightIndices: this.getHighlightIndices(path, query)
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * 파일 이름 제안 가져오기
   * @param query 검색어
   * @returns 파일 이름 제안 목록
   */
  async getFileSuggestions(query: string): Promise<ISearchSuggestion[]> {
    const files = this.obsidianService.getMarkdownFiles();
    const suggestions: ISearchSuggestion[] = [];
    
    for (const file of files) {
      const filename = file.basename;
      if (filename.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: `file:${filename}`,
          type: 'file',
          description: `파일: ${filename}`,
          highlightIndices: this.getHighlightIndices(filename, query)
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * 태그 제안 가져오기
   * @param query 검색어
   * @returns 태그 제안 목록
   */
  async getTagSuggestions(query: string): Promise<ISearchSuggestion[]> {
    const metadataCache = this.obsidianService.getMetadataCache();
    const tags = new Set<string>();
    const suggestions: ISearchSuggestion[] = [];
    
    // 모든 파일의 태그 수집
    this.obsidianService.getMarkdownFiles().forEach(file => {
      const fileCache = metadataCache.getFileCache(file);
      if (fileCache && fileCache.tags) {
        fileCache.tags.forEach(tag => {
          tags.add(tag.tag);
        });
      }
    });
    
    // 검색어에 맞는 태그 필터링
    for (const tag of tags) {
      if (tag.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: `tag:${tag}`,
          type: 'tag',
          description: `태그: ${tag}`,
          highlightIndices: this.getHighlightIndices(tag, query)
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * 속성 제안 가져오기
   * @param query 검색어
   * @returns 속성 제안 목록
   */
  async getPropertySuggestions(query: string): Promise<ISearchSuggestion[]> {
    const metadataCache = this.obsidianService.getMetadataCache();
    const properties = new Set<string>();
    const suggestions: ISearchSuggestion[] = [];
    
    // 모든 파일의 프론트매터 속성 수집
    this.obsidianService.getMarkdownFiles().forEach(file => {
      const fileCache = metadataCache.getFileCache(file);
      if (fileCache && fileCache.frontmatter) {
        Object.keys(fileCache.frontmatter).forEach(key => {
          properties.add(key);
        });
      }
    });
    
    // 검색어에 맞는 속성 필터링
    for (const property of properties) {
      if (property.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: `[${property}]`,
          type: 'frontmatter',
          description: `속성: ${property}`,
          highlightIndices: this.getHighlightIndices(property, query)
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * 속성값 제안 가져오기
   * @param property 속성
   * @param query 검색어
   * @returns 속성값 제안 목록
   */
  async getPropertyValueSuggestions(property: string, query: string): Promise<ISearchSuggestion[]> {
    const metadataCache = this.obsidianService.getMetadataCache();
    const values = new Set<string>();
    const suggestions: ISearchSuggestion[] = [];
    
    // 모든 파일의 해당 속성 값 수집
    this.obsidianService.getMarkdownFiles().forEach(file => {
      const fileCache = metadataCache.getFileCache(file);
      if (fileCache && fileCache.frontmatter && fileCache.frontmatter[property] !== undefined) {
        const value = String(fileCache.frontmatter[property]);
        values.add(value);
      }
    });
    
    // 검색어에 맞는 속성값 필터링
    for (const value of values) {
      if (value.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: `[${property}]${value}`,
          type: 'frontmatter',
          description: `${property}: ${value}`,
          highlightIndices: this.getHighlightIndices(value, query)
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * 강조 위치 가져오기
   * @param text 텍스트
   * @param query 검색어
   * @returns 강조 위치 목록
   */
  private getHighlightIndices(text: string, query: string): [number, number][] {
    const indices: [number, number][] = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    let startIndex = 0;
    while (startIndex < lowerText.length) {
      const index = lowerText.indexOf(lowerQuery, startIndex);
      if (index === -1) break;
      
      indices.push([index, index + lowerQuery.length]);
      startIndex = index + 1;
    }
    
    return indices;
  }
} 