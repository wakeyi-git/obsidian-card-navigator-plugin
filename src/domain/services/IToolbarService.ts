import { CardSetType } from '../models/CardSet';
import { ISortConfig } from '../models/SortConfig';
import { ICardRenderConfig } from '../models/CardRenderConfig';
import { ILayoutConfig } from '../models/LayoutConfig';

/**
 * 툴바 액션 타입
 */
export enum ToolbarActionType {
  /** 카드셋 타입 변경 */
  CHANGE_CARD_SET_TYPE = 'CHANGE_CARD_SET_TYPE',
  /** 검색 */
  SEARCH = 'SEARCH',
  /** 정렬 */
  SORT = 'SORT',
  /** 설정 토글 */
  TOGGLE_SETTING = 'TOGGLE_SETTING'
}

/**
 * 툴바 서비스 인터페이스
 */
export interface IToolbarService {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 카드셋 타입 변경
   * @param type 카드셋 타입
   */
  changeCardSetType(type: CardSetType): void;

  /**
   * 검색 실행
   * @param query 검색어
   */
  search(query: string): void;

  /**
   * 정렬 설정 적용
   * @param config 정렬 설정
   */
  applySort(config: ISortConfig): void;

  /**
   * 설정 토글
   * @param type 설정 타입
   * @param value 설정 값
   */
  toggleSetting(type: string, value: any): void;

  /**
   * 현재 카드셋 타입 조회
   */
  getCurrentCardSetType(): CardSetType;

  /**
   * 현재 검색어 조회
   */
  getCurrentSearchQuery(): string;

  /**
   * 현재 정렬 설정 조회
   */
  getCurrentSortConfig(): ISortConfig;

  /**
   * 현재 카드 렌더링 설정 조회
   */
  getCurrentCardRenderConfig(): ICardRenderConfig;

  /**
   * 현재 레이아웃 설정 조회
   */
  getCurrentLayoutConfig(): ILayoutConfig;

  /**
   * UI 업데이트
   */
  updateUI(): void;
} 