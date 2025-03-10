import { TFile } from 'obsidian';
import { IObsidianApp } from '../domain/obsidian/ObsidianInterfaces';
import { ISearchSuggestManagerImpl } from '../domain/toolbar/SearchSuggestManager';

/**
 * 검색 제안 관리자 클래스
 * 검색어 입력 시 제안 목록을 관리합니다.
 */
export class SearchSuggestManager implements ISearchSuggestManagerImpl {
  /**
   * Obsidian 앱 어댑터
   */
  private obsidianApp: IObsidianApp;
  
  /**
   * 생성자
   * @param obsidianApp Obsidian 앱 어댑터
   */
  constructor(obsidianApp: IObsidianApp) {
    this.obsidianApp = obsidianApp;
  }
  
  /**
   * 검색 타입 제안 목록 가져오기
   * @returns 검색 타입 제안 목록
   */
  getSearchTypeSuggestions(): string[] {
    return [
      'path:',
      'file:',
      'tag:',
      'create:',
      'modify:',
      '[]'
    ];
  }
  
  /**
   * 검색어 제안 목록 가져오기
   * @param searchType 검색 타입
   * @param partialQuery 부분 검색어
   * @returns 검색어 제안 목록
   */
  async getQuerySuggestions(searchType: string, partialQuery: string): Promise<string[]> {
    switch (searchType) {
      case 'path:':
        return this.getPathSuggestions(partialQuery);
      case 'file:':
        return this.getFilenameSuggestions(partialQuery);
      case 'tag:':
        return this.getTagSuggestions(partialQuery);
      case '[]':
        return this.getFrontmatterKeySuggestions();
      default:
        return [];
    }
  }
  
  /**
   * 프론트매터 키 제안 목록 가져오기
   * @returns 프론트매터 키 제안 목록
   */
  async getFrontmatterKeySuggestions(): Promise<string[]> {
    const vault = this.obsidianApp.getVault();
    const metadataCache = this.obsidianApp.getMetadataCache();
    const frontmatterKeys = new Set<string>();
    
    // 모든 파일의 프론트매터 키 수집
    vault.getMarkdownFiles().forEach(file => {
      const cache = metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        Object.keys(cache.frontmatter).forEach(key => {
          if (key !== 'position') {
            frontmatterKeys.add(key);
          }
        });
      }
    });
    
    return Array.from(frontmatterKeys).sort();
  }
  
  /**
   * 프론트매터 값 제안 목록 가져오기
   * @param key 프론트매터 키
   * @returns 프론트매터 값 제안 목록
   */
  async getFrontmatterValueSuggestions(key: string): Promise<string[]> {
    const vault = this.obsidianApp.getVault();
    const metadataCache = this.obsidianApp.getMetadataCache();
    const values = new Set<string>();
    
    // 모든 파일의 해당 프론트매터 키에 대한 값 수집
    vault.getMarkdownFiles().forEach(file => {
      const cache = metadataCache.getFileCache(file);
      if (cache?.frontmatter && cache.frontmatter[key] !== undefined) {
        const value = cache.frontmatter[key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          values.add(String(value));
        }
      }
    });
    
    return Array.from(values).sort();
  }
  
  /**
   * 태그 제안 목록 가져오기
   * @param partialTag 부분 태그
   * @returns 태그 제안 목록
   */
  async getTagSuggestions(partialTag: string): Promise<string[]> {
    const vault = this.obsidianApp.getVault();
    const metadataCache = this.obsidianApp.getMetadataCache();
    
    // 모든 태그 수집
    const tagSet = new Set<string>();
    
    vault.getMarkdownFiles().forEach(file => {
      const cache = metadataCache.getFileCache(file);
      if (cache?.tags) {
        cache.tags.forEach((tag: { tag: string }) => {
          tagSet.add(tag.tag);
        });
      }
    });
    
    // 부분 태그로 필터링
    return Array.from(tagSet)
      .filter(tag => tag.toLowerCase().includes(partialTag.toLowerCase()))
      .sort();
  }
  
  /**
   * 경로 제안 목록 가져오기
   * @param partialPath 부분 경로
   * @returns 경로 제안 목록
   */
  async getPathSuggestions(partialPath: string): Promise<string[]> {
    const vault = this.obsidianApp.getVault();
    const folders = new Set<string>();
    
    // 모든 파일의 경로 수집
    vault.getMarkdownFiles().forEach(file => {
      if (file.parent) {
        const folderPath = file.parent.path;
        if (folderPath) {
          folders.add(folderPath);
        }
      }
    });
    
    // 부분 경로로 필터링
    return Array.from(folders)
      .filter(path => path.toLowerCase().includes(partialPath.toLowerCase()))
      .sort();
  }
  
  /**
   * 파일명 제안 목록 가져오기
   * @param partialName 부분 파일명
   * @returns 파일명 제안 목록
   */
  async getFilenameSuggestions(partialName: string): Promise<string[]> {
    const vault = this.obsidianApp.getVault();
    
    // 모든 마크다운 파일 가져오기
    const files = vault.getMarkdownFiles();
    
    // 부분 파일 이름으로 필터링
    return files
      .filter(file => file.basename.toLowerCase().includes(partialName.toLowerCase()))
      .map(file => file.basename)
      .sort();
  }
} 