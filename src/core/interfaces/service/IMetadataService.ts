import { CachedMetadata, FrontMatterCache, HeadingCache, LinkCache, TFile } from 'obsidian';

/**
 * 메타데이터 서비스 인터페이스
 * 파일의 메타데이터를 관리하는 서비스의 계약을 정의합니다.
 */
export interface IMetadataService {
  /**
   * 파일의 메타데이터를 가져옵니다.
   * @param file 파일 객체
   * @returns 메타데이터 또는 null
   */
  getFileMetadata(file: TFile): CachedMetadata | null;

  /**
   * 파일의 프론트매터를 가져옵니다.
   * @param file 파일 객체
   * @returns 프론트매터 또는 null
   */
  getFrontMatter(file: TFile): FrontMatterCache | null;

  /**
   * 파일의 프론트매터에서 특정 속성 값을 가져옵니다.
   * @param file 파일 객체
   * @param key 속성 키
   * @returns 속성 값 또는 undefined
   */
  getFrontMatterValue(file: TFile, key: string): any;

  /**
   * 파일의 모든 헤딩을 가져옵니다.
   * @param file 파일 객체
   * @returns 헤딩 배열 또는 빈 배열
   */
  getHeadings(file: TFile): HeadingCache[];

  /**
   * 파일의 첫 번째 헤딩을 가져옵니다.
   * @param file 파일 객체
   * @returns 첫 번째 헤딩 또는 null
   */
  getFirstHeading(file: TFile): HeadingCache | null;

  /**
   * 파일의 특정 레벨 헤딩을 가져옵니다.
   * @param file 파일 객체
   * @param level 헤딩 레벨
   * @returns 헤딩 배열 또는 빈 배열
   */
  getHeadingsByLevel(file: TFile, level: number): HeadingCache[];

  /**
   * 파일의 모든 링크를 가져옵니다.
   * @param file 파일 객체
   * @returns 링크 배열 또는 빈 배열
   */
  getLinks(file: TFile): LinkCache[];

  /**
   * 파일의 모든 내부 링크를 가져옵니다.
   * @param file 파일 객체
   * @returns 링크 배열 또는 빈 배열
   */
  getInternalLinks(file: TFile): LinkCache[];

  /**
   * 파일의 모든 외부 링크를 가져옵니다.
   * @param file 파일 객체
   * @returns 링크 배열 또는 빈 배열
   */
  getExternalLinks(file: TFile): LinkCache[];

  /**
   * 파일의 모든 태그를 가져옵니다.
   * @param file 파일 객체
   * @returns 태그 배열
   */
  getTags(file: TFile): string[];

  /**
   * 파일이 특정 태그를 포함하는지 확인합니다.
   * @param file 파일 객체
   * @param tag 확인할 태그
   * @returns 태그 포함 여부
   */
  hasTag(file: TFile, tag: string): boolean;

  /**
   * 파일이 특정 프론트매터 속성을 가지고 있는지 확인합니다.
   * @param file 파일 객체
   * @param key 속성 키
   * @returns 속성 포함 여부
   */
  hasFrontMatterKey(file: TFile, key: string): boolean;

  /**
   * 파일의 생성 시간을 가져옵니다.
   * @param file 파일 객체
   * @returns 생성 시간 (밀리초)
   */
  getCreationTime(file: TFile): number | null;

  /**
   * 파일의 수정 시간을 가져옵니다.
   * @param file 파일 객체
   * @returns 수정 시간 (밀리초)
   */
  getModificationTime(file: TFile): number | null;

  /**
   * 파일의 제목을 가져옵니다.
   * @param file 파일 객체
   * @returns 파일 제목
   */
  getFileTitle(file: TFile): string;

  /**
   * 파일의 요약을 가져옵니다.
   * @param file 파일 객체
   * @param maxLength 최대 길이
   * @returns 파일 내용 요약
   */
  getFileSummary(file: TFile, maxLength?: number): Promise<string>;

  /**
   * 파일의 프론트매터 속성 값이 특정 값과 일치하는지 확인합니다.
   * @param file 파일 객체
   * @param key 속성 키
   * @param value 속성 값
   * @returns 속성 값 일치 여부
   */
  hasFrontMatterValue(file: TFile, key: string, value: any): boolean;

  /**
   * 파일의 메타데이터 캐시가 로드되었는지 확인합니다.
   * @param file 파일 객체
   * @returns 메타데이터 로드 여부
   */
  isMetadataLoaded(file: TFile): boolean;

  /**
   * 파일의 메타데이터 캐시가 로드될 때까지 기다립니다.
   * @param file 파일 객체
   * @param timeout 타임아웃(밀리초)
   * @returns 메타데이터 로드 성공 여부
   */
  waitForMetadata(file: TFile, timeout?: number): Promise<boolean>;
} 