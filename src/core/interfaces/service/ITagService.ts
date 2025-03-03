import { TFile } from 'obsidian';

/**
 * 태그 서비스 인터페이스
 * Obsidian의 태그 관련 기능을 제공합니다.
 */
export interface ITagService {
  /**
   * 볼트의 모든 태그를 가져옵니다.
   * @returns 태그 배열
   */
  getAllTags(): string[];

  /**
   * 특정 태그를 가진 모든 파일을 가져옵니다.
   * @param tag 검색할 태그
   * @returns 파일 배열
   */
  getFilesWithTag(tag: string): TFile[];

  /**
   * 여러 태그 중 하나라도 가진 파일을 가져옵니다.
   * @param tags 검색할 태그 배열
   * @returns 파일 배열
   */
  getFilesWithAnyTag(tags: string[]): TFile[];

  /**
   * 모든 태그를 가진 파일을 가져옵니다.
   * @param tags 검색할 태그 배열
   * @returns 파일 배열
   */
  getFilesWithAllTags(tags: string[]): TFile[];

  /**
   * 태그 관련 파일을 가져옵니다.
   * @param tag 태그
   * @returns 관련 파일 배열
   */
  getRelatedFiles(tag: string): TFile[];

  /**
   * 태그 계층 구조를 가져옵니다.
   * @returns 태그 계층 구조 객체
   */
  getTagHierarchy(): Record<string, string[]>;

  /**
   * 태그의 하위 태그를 가져옵니다.
   * @param tag 상위 태그
   * @returns 하위 태그 배열
   */
  getChildTags(tag: string): string[];

  /**
   * 태그의 상위 태그를 가져옵니다.
   * @param tag 하위 태그
   * @returns 상위 태그 또는 null
   */
  getParentTag(tag: string): string | null;
} 