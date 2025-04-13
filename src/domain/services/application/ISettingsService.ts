import { IPluginSettings, ICardSetDomainSettings, ILayoutDomainSettings, ISearchDomainSettings, ISortDomainSettings, IPresetDomainSettings } from '../../models/PluginSettings';
import { ICardSection, ICardStyle } from '../../models/Card';
import { CardSetType } from '../../models/CardSet';

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
   * 카드셋 도메인 설정 가져오기
   * @param type 카드셋 타입
   * @returns 카드셋 도메인 설정
   */
  getCardSetDomainSettings(type: CardSetType): ICardSetDomainSettings;

  /**
   * 카드셋 도메인 설정 업데이트
   * @param type 카드셋 타입
   * @param settings 카드셋 도메인 설정
   */
  updateCardSetDomainSettings(type: CardSetType, settings: ICardSetDomainSettings): Promise<void>;

  /**
   * 레이아웃 도메인 설정 가져오기
   * @returns 레이아웃 도메인 설정
   */
  getLayoutDomainSettings(): ILayoutDomainSettings;

  /**
   * 레이아웃 도메인 설정 업데이트
   * @param settings 레이아웃 도메인 설정
   */
  updateLayoutDomainSettings(settings: ILayoutDomainSettings): Promise<void>;

  /**
   * 정렬 도메인 설정 가져오기
   * @returns 정렬 도메인 설정
   */
  getSortDomainSettings(): ISortDomainSettings;

  /**
   * 정렬 도메인 설정 업데이트
   * @param settings 정렬 도메인 설정
   */
  updateSortDomainSettings(settings: ISortDomainSettings): Promise<void>;

  /**
   * 검색 도메인 설정 가져오기
   * @returns 검색 도메인 설정
   */
  getSearchDomainSettings(): ISearchDomainSettings;

  /**
   * 검색 도메인 설정 업데이트
   * @param settings 검색 도메인 설정
   */
  updateSearchDomainSettings(settings: ISearchDomainSettings): Promise<void>;

  /**
   * 프리셋 도메인 설정 가져오기
   * @returns 프리셋 도메인 설정
   */
  getPresetDomainSettings(): IPresetDomainSettings;

  /**
   * 프리셋 도메인 설정 업데이트
   * @param settings 프리셋 도메인 설정
   */
  updatePresetDomainSettings(settings: IPresetDomainSettings): Promise<void>;

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
   * @param state 카드 상태 (normal, active, focused)
   * @param property 스타일 속성
   * @param value 값
   */
  updateCardStyle(state: 'normal' | 'active' | 'focused', property: keyof ICardStyle, value: string): Promise<void>;

  /**
   * 카드 섹션 표시 설정 업데이트
   * @param section 섹션 타입
   * @param property 표시 옵션 속성
   * @param value 값
   */
  updateCardSectionDisplay(
    section: 'header' | 'body' | 'footer',
    property: keyof ICardSection['displayOptions'],
    value: boolean
  ): Promise<void>;
}
  