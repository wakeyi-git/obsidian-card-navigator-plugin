import { CardSetType } from '../../models/CardSet';
import { ICardSection, ICardStyle } from '../../models/Card';
import { ILayoutConfig } from '../../models/Layout';
import { ISearchConfig } from '../../models/Search';
import { ISortConfig } from '../../models/Sort';

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
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean;

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
   * 현재 카드셋 타입 가져오기
   * @returns 현재 카드셋 타입
   */
  getCurrentCardSetType(): CardSetType;

  /**
   * 검색 설정 업데이트
   * @param config 검색 설정
   */
  updateSearchConfig(config: ISearchConfig): void;

  /**
   * 현재 검색 설정 가져오기
   * @returns 현재 검색 설정
   */
  getCurrentSearchConfig(): ISearchConfig;

  /**
   * 정렬 설정 업데이트
   * @param config 정렬 설정
   */
  updateSortConfig(config: ISortConfig): void;

  /**
   * 현재 정렬 설정 가져오기
   * @returns 현재 정렬 설정
   */
  getCurrentSortConfig(): ISortConfig;

  /**
   * 카드 섹션 업데이트
   * @param section 카드 섹션
   */
  updateCardSection(section: ICardSection): void;

  /**
   * 현재 카드 섹션 가져오기
   * @returns 현재 카드 섹션
   */
  getCurrentCardSection(): ICardSection;

  /**
   * 카드 스타일 업데이트
   * @param style 카드 스타일
   */
  updateCardStyle(style: ICardStyle): void;

  /**
   * 현재 카드 스타일 가져오기
   * @returns 현재 카드 스타일
   */
  getCurrentCardStyle(): ICardStyle;

  /**
   * 레이아웃 설정 업데이트
   * @param config 레이아웃 설정
   */
  updateLayoutConfig(config: ILayoutConfig): void;

  /**
   * 현재 레이아웃 설정 가져오기
   * @returns 현재 레이아웃 설정
   */
  getCurrentLayoutConfig(): ILayoutConfig;

  /**
   * UI 업데이트
   */
  updateUI(): void;
} 