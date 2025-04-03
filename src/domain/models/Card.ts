import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from './CardRenderConfig';
import { TFile } from 'obsidian';

/**
 * 노트 타이틀 표시 방식
 */
export enum NoteTitleDisplayType {
  /**
   * 파일명을 타이틀로 사용
   */
  FILENAME = 'filename',
  
  /**
   * 첫 번째 헤더를 타이틀로 사용
   */
  FIRST_HEADER = 'first_header'
}

/**
 * 카드 인터페이스
 * - 옵시디언 노트의 내용을 표현하는 불변 객체
 */
export interface ICard {
  /**
   * 카드 ID (파일 경로)
   */
  id: string;

  /**
   * 카드 파일
   */
  file: TFile;

  /**
   * 파일명
   */
  fileName: string;

  /**
   * 첫 번째 헤더
   */
  firstHeader: string | null;

  /**
   * 카드 내용
   */
  content: string;

  /**
   * 태그 목록
   */
  tags: string[];

  /**
   * 프론트매터 속성
   */
  properties: Record<string, any>;

  /**
   * 생성일
   */
  createdAt: Date;

  /**
   * 수정일
   */
  updatedAt: Date;

  /**
   * 메타데이터
   */
  readonly metadata: Readonly<Record<string, any>>;

  /**
   * 렌더링 설정
   */
  readonly renderConfig: ICardRenderConfig;

  /**
   * 노트 타이틀 표시 방식
   */
  readonly titleDisplayType: NoteTitleDisplayType;

  /**
   * 카드 유효성 검사
   */
  validate(): boolean;

  /**
   * 카드 문자열 표현
   */
  toString(): string;
}

/**
 * 카드 기본값
 */
export const DEFAULT_CARD: ICard = {
  id: '',
  file: null as unknown as TFile,
  fileName: '',
  firstHeader: null,
  content: '',
  tags: [],
  properties: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {},
  renderConfig: DEFAULT_CARD_RENDER_CONFIG,
  titleDisplayType: NoteTitleDisplayType.FILENAME,
  validate: () => true,
  toString: function() {
    return `Card(${this.titleDisplayType === NoteTitleDisplayType.FILENAME ? this.fileName : this.firstHeader || this.fileName})`;
  }
}; 