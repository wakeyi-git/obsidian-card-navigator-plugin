import { IObsidianApp } from '../obsidian/ObsidianInterfaces';
import { ISearchSuggestManager } from './ToolbarInterfaces';

/**
 * 검색 제안 관리자 인터페이스
 * 검색어 입력 시 제안 목록을 관리합니다.
 */
export interface ISearchSuggestManagerImpl extends ISearchSuggestManager {
  /**
   * 검색 타입 제안 목록 가져오기
   * @returns 검색 타입 제안 목록
   */
  getSearchTypeSuggestions(): string[];
  
  /**
   * 검색어 제안 목록 가져오기
   * @param searchType 검색 타입
   * @param partialQuery 부분 검색어
   * @returns 검색어 제안 목록
   */
  getQuerySuggestions(searchType: string, partialQuery: string): Promise<string[]>;
  
  /**
   * 프론트매터 키 제안 목록 가져오기
   * @returns 프론트매터 키 제안 목록
   */
  getFrontmatterKeySuggestions(): Promise<string[]>;
  
  /**
   * 프론트매터 값 제안 목록 가져오기
   * @param key 프론트매터 키
   * @returns 프론트매터 값 제안 목록
   */
  getFrontmatterValueSuggestions(key: string): Promise<string[]>;
  
  /**
   * 태그 제안 목록 가져오기
   * @param partialTag 부분 태그
   * @returns 태그 제안 목록
   */
  getTagSuggestions(partialTag: string): Promise<string[]>;
  
  /**
   * 경로 제안 목록 가져오기
   * @param partialPath 부분 경로
   * @returns 경로 제안 목록
   */
  getPathSuggestions(partialPath: string): Promise<string[]>;
  
  /**
   * 파일명 제안 목록 가져오기
   * @param partialName 부분 파일명
   * @returns 파일명 제안 목록
   */
  getFilenameSuggestions(partialName: string): Promise<string[]>;
} 