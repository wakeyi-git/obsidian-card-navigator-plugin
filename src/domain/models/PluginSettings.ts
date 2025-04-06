import { ICardConfig } from './CardConfig';
import { ICardSetConfig } from './CardSetConfig';
import { ILayoutConfig } from './LayoutConfig';
import { ISortConfig } from './SortConfig';
import { IFilterConfig } from './FilterConfig';
import { ISearchConfig } from './SearchConfig';
import { ICardStyle } from './CardStyle';
import { IPresetConfig } from './Preset';

/**
 * 플러그인 설정 인터페이스
 */
export interface IPluginSettings {
  /** 카드 설정 */
  readonly cardConfig: ICardConfig;
  /** 카드셋 설정 */
  readonly cardSetConfig: ICardSetConfig;
  /** 레이아웃 설정 */
  readonly layoutConfig: ILayoutConfig;
  /** 정렬 설정 */
  readonly sortConfig: ISortConfig;
  /** 필터 설정 */
  readonly filterConfig: IFilterConfig;
  /** 검색 설정 */
  readonly searchConfig: ISearchConfig;
  /** 카드 스타일 설정 */
  readonly cardStyle: ICardStyle;
  /** 프리셋 설정 */
  readonly presetConfig: IPresetConfig;
  /** 서비스 초기화 여부 */
  readonly servicesInitialized?: boolean;
}

/**
 * 플러그인 설정 클래스
 */
export class PluginSettings implements IPluginSettings {
  constructor(
    public readonly cardConfig: ICardConfig,
    public readonly cardSetConfig: ICardSetConfig,
    public readonly layoutConfig: ILayoutConfig,
    public readonly sortConfig: ISortConfig,
    public readonly filterConfig: IFilterConfig,
    public readonly searchConfig: ISearchConfig,
    public readonly cardStyle: ICardStyle,
    public readonly presetConfig: IPresetConfig,
    public readonly servicesInitialized: boolean = false
  ) {}

  /**
   * 설정 유효성 검사
   */
  validate(): boolean {
    return true;
  }
} 