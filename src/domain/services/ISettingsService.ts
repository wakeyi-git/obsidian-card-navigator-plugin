import { IPluginSettings } from '../models/DefaultValues';
import { ICardConfig, ICardSectionConfig } from '../models/CardConfig';
import { ICardSetConfig, CardSetType } from '../models/CardSetConfig';
import { ILayoutConfig } from '../models/LayoutConfig';
import { ISortConfig } from '../models/SortConfig';
import { IFilterConfig } from '../models/FilterConfig';
import { ISearchConfig } from '../models/SearchConfig';
import { ICardStyle } from '../models/CardStyle';
import { IStyleProperties } from '../models/CardStyle';

/**
 * 설정 서비스 인터페이스
 */
export interface ISettingsService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 설정 로드
   * @returns 플러그인 설정
   */
  loadSettings(): Promise<IPluginSettings>;

  /**
   * 설정 저장
   * @param settings 저장할 설정
   */
  saveSettings(settings: IPluginSettings): Promise<void>;

  /**
   * 설정 가져오기
   * @returns 플러그인 설정
   */
  getSettings(): IPluginSettings;

  /**
   * 설정 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 해제 함수
   */
  onSettingsChanged(callback: (data: {oldSettings: IPluginSettings, newSettings: IPluginSettings}) => void): () => void;

  /**
   * 카드 설정 가져오기
   * @returns 카드 설정
   */
  getCardConfig(): ICardConfig;

  /**
   * 카드 설정 업데이트
   * @param config 카드 설정
   */
  updateCardConfig(config: ICardConfig): Promise<void>;

  /**
   * 카드셋 설정 가져오기
   * @param type 카드셋 타입
   * @returns 카드셋 설정
   */
  getCardSetConfig(type: CardSetType): ICardSetConfig;

  /**
   * 카드셋 설정 업데이트
   * @param type 카드셋 타입
   * @param config 카드셋 설정
   */
  updateCardSetConfig(type: CardSetType, config: ICardSetConfig): Promise<void>;

  /**
   * 레이아웃 설정 가져오기
   * @returns 레이아웃 설정
   */
  getLayoutConfig(): ILayoutConfig;

  /**
   * 레이아웃 설정 업데이트
   * @param config 레이아웃 설정
   */
  updateLayoutConfig(config: ILayoutConfig): Promise<void>;

  /**
   * 정렬 설정 가져오기
   * @returns 정렬 설정
   */
  getSortConfig(): ISortConfig;

  /**
   * 정렬 설정 업데이트
   * @param config 정렬 설정
   */
  updateSortConfig(config: ISortConfig): Promise<void>;

  /**
   * 필터 설정 가져오기
   * @returns 필터 설정
   */
  getFilterConfig(): IFilterConfig;

  /**
   * 필터 설정 업데이트
   * @param config 필터 설정
   */
  updateFilterConfig(config: IFilterConfig): Promise<void>;

  /**
   * 검색 설정 가져오기
   * @returns 검색 설정
   */
  getSearchConfig(): ISearchConfig;

  /**
   * 검색 설정 업데이트
   * @param config 검색 설정
   */
  updateSearchConfig(config: ISearchConfig): Promise<void>;

  /**
   * 설정 유효성 검사
   * @param settings 검사할 설정
   * @returns 유효성 여부
   */
  validateSettings(settings: IPluginSettings): boolean;

  /**
   * 설정 변경 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToSettingsChange(callback: (settings: IPluginSettings) => void): void;

  /**
   * 설정 변경 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromSettingsChange(callback: (settings: IPluginSettings) => void): void;

  /**
   * 중첩된 설정 업데이트
   * @param path 설정 경로
   * @param value 값
   */
  updateNestedSettings(path: string, value: any): Promise<void>;

  /**
   * 카드 스타일 업데이트
   * @param styleKey 스타일 키
   * @param property 속성
   * @param value 값
   */
  updateCardStyle(styleKey: keyof ICardStyle, property: keyof IStyleProperties, value: string): Promise<void>;

  /**
   * 카드 섹션 표시 설정 업데이트
   * @param section 섹션
   * @param property 속성
   * @param value 값
   */
  updateCardSectionDisplay(
    section: 'header' | 'body' | 'footer',
    property: keyof ICardSectionConfig,
    value: boolean
  ): Promise<void>;
}
  