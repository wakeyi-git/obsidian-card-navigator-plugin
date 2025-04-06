import { TFile } from 'obsidian';
import { ICardConfig } from './CardConfig';

/**
 * 카드 인터페이스
 */
export interface ICard {
  /** 카드 ID (파일 경로) */
  readonly id: string;

  /** 카드 파일 */
  readonly file: TFile;

  /** 파일 경로 */
  readonly filePath: string;

  /** 파일명 */
  readonly fileName: string;

  /** 첫 번째 헤더 */
  readonly firstHeader: string | null;

  /** 카드 내용 */
  readonly content: string;

  /** 태그 목록 */
  readonly tags: readonly string[];

  /** 프론트매터 속성 */
  readonly properties: Readonly<Record<string, any>>;

  /** 생성일 */
  readonly createdAt: Date;

  /** 수정일 */
  readonly updatedAt: Date;

  /** 메타데이터 */
  readonly metadata: Readonly<Record<string, any>>;

  /** 카드 설정 */
  readonly config: ICardConfig;

  /**
   * 카드 유효성 검사
   */
  validate(): boolean;

  /**
   * 카드 미리보기
   */
  preview(): ICardPreview;

  /**
   * 카드 문자열 표현
   */
  toString(): string;

  /**
   * 제목
   */
  title: string;
}

/**
 * 카드 미리보기 인터페이스
 */
export interface ICardPreview {
  /** 카드 ID */
  readonly id: string;
  /** 파일 경로 */
  readonly filePath: string;
  /** 파일명 */
  readonly fileName: string;
  /** 첫 번째 헤더 */
  readonly firstHeader: string | null;
  /** 내용 */
  readonly content: string;
  /** 태그 목록 */
  readonly tags: readonly string[];
  /** 프론트매터 속성 */
  readonly properties: Readonly<Record<string, any>>;
  /** 생성일 */
  readonly createdAt: Date;
  /** 수정일 */
  readonly updatedAt: Date;
  /** 메타데이터 */
  readonly metadata: Readonly<Record<string, any>>;
}

/**
 * 기본 카드
 */
export const DEFAULT_CARD: ICard = {
  id: '',
  file: null as unknown as TFile,
  filePath: '',
  fileName: '',
  firstHeader: null,
  content: '',
  tags: [],
  properties: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {},
  config: null as unknown as ICardConfig,

  validate(): boolean {
    return this.id !== '' && this.file !== null;
  },

  preview(): ICardPreview {
    return {
      id: this.id,
      filePath: this.filePath,
      fileName: this.fileName,
      firstHeader: this.firstHeader,
      content: this.content,
      tags: this.tags,
      properties: this.properties,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  },

  toString(): string {
    return `Card(${this.fileName})`;
  },

  title: '',
};

/**
 * 카드 생성 설정 인터페이스
 */
export interface ICardCreateConfig {
  /** 파일명 */
  readonly fileName: string;
  /** 첫 번째 헤더 */
  readonly firstHeader: string | null;
  /** 내용 */
  readonly content: string;
  /** 태그 목록 */
  readonly tags: readonly string[];
  /** 생성일 */
  readonly createdDate: Date;
  /** 수정일 */
  readonly updatedDate: Date;
  /** 프론트매터 속성 */
  readonly properties: Readonly<Record<string, any>>;
  /** 카드 설정 */
  readonly config: ICardConfig;
}