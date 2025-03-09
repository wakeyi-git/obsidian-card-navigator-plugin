import { App, TFile } from 'obsidian';
import { ICard } from '../card/Card';
import { CardSetSourceType } from '../cardset/CardSet';
import { LayoutType } from '../layout/Layout';
import { IPreset } from '../preset/Preset';
import { SearchType } from '../search/Search';
import { ICardService } from '../../application/CardService';
import { ICardSetSourceService } from '../../application/CardSetSourceService';
import { ISearchService } from '../../application/SearchService';
import { ISortService } from '../../application/SortService';
import { ILayoutService } from '../../application/LayoutService';
import { IPresetService } from '../../application/PresetService';
import CardNavigatorPlugin from '../../main';

/**
 * 카드 네비게이터 초기화 인터페이스
 * 카드 네비게이터 초기화 관련 기능을 제공합니다.
 */
export interface ICardNavigatorInitializer {
  /**
   * 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 모든 설정 초기화
   */
  reset(): Promise<void>;
}

/**
 * 카드 관리 인터페이스
 * 카드 관련 기능을 제공합니다.
 */
export interface ICardManager {
  /**
   * 카드 목록 가져오기
   * 현재 모드, 필터, 정렬, 검색 설정에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 현재 카드 목록 가져오기
   * 마지막으로 로드된 카드 목록을 반환합니다.
   * @returns 현재 카드 목록
   */
  getCurrentCards(): ICard[];
  
  /**
   * 카드 저장소 새로고침
   * 카드 목록을 다시 로드합니다.
   */
  refreshCards(): Promise<void>;
}

/**
 * 카드셋 소스 관리 인터페이스
 * 카드셋 소스 관련 기능을 제공합니다.
 */
export interface ICardSetSourceController {
  /**
   * 모드 변경
   * @param type 변경할 모드 타입
   */
  changeCardSetSource(type: CardSetSourceType): Promise<void>;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   */
  selectCardSet(cardSet: string, isFixed?: boolean): Promise<void>;
  
  /**
   * 모드 변경 알림 처리
   * CardSetSourceService에서 모드가 변경될 때 호출됩니다.
   * @param cardSetSourceType 변경된 모드 타입
   */
  notifyCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void;
}

/**
 * 레이아웃 관리 인터페이스
 * 레이아웃 관련 기능을 제공합니다.
 */
export interface ILayoutController {
  /**
   * 레이아웃 변경
   * @param type 변경할 레이아웃 타입
   */
  changeLayout(type: LayoutType): Promise<void>;
}

/**
 * 프리셋 관리 인터페이스
 * 프리셋 관련 기능을 제공합니다.
 */
export interface IPresetController {
  /**
   * 프리셋 적용
   * @param presetId 적용할 프리셋 ID
   */
  applyPreset(presetId: string): Promise<boolean>;
  
  /**
   * 현재 설정을 프리셋으로 저장
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @returns 저장된 프리셋
   */
  saveAsPreset(name: string, description?: string): IPreset;
}

/**
 * 검색 관리 인터페이스
 * 검색 관련 기능을 제공합니다.
 */
export interface ISearchController {
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입 (기본값: 'filename')
   * @param caseSensitive 대소문자 구분 여부 (기본값: false)
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  search(
    query: string, 
    searchType: SearchType, 
    caseSensitive: boolean, 
    frontmatterKey?: string
  ): Promise<void>;
  
  /**
   * 검색 타입 변경
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  changeSearchType(searchType: SearchType, frontmatterKey?: string): Promise<void>;
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): Promise<void>;
}

/**
 * 설정 관리 인터페이스
 * 설정 관련 기능을 제공합니다.
 */
export interface ISettingsController {
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): any;
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  updateSettings(settings: Partial<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    priorityFolders: string[];
    defaultCardSetSource: CardSetSourceType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultFolderCardSet: string;
    defaultTagCardSet: string;
    isCardSetFixed: boolean;
    defaultSearchScope?: 'all' | 'current';
    tagCaseSensitive?: boolean;
  }>): Promise<void>;
}

/**
 * 서비스 제공 인터페이스
 * 다양한 서비스를 제공합니다.
 */
export interface IServiceProvider {
  /**
   * 모드 서비스 가져오기
   * @returns 모드 서비스
   */
  getCardSetSourceService(): ICardSetSourceService;
  
  /**
   * 카드 서비스 가져오기
   * @returns 카드 서비스
   */
  getCardService(): ICardService;
  
  /**
   * 검색 서비스 가져오기
   * @returns 검색 서비스
   */
  getSearchService(): ISearchService;
  
  /**
   * 정렬 서비스 가져오기
   * @returns 정렬 서비스
   */
  getSortService(): ISortService;
  
  /**
   * 레이아웃 서비스 가져오기
   * @returns 레이아웃 서비스
   */
  getLayoutService(): ILayoutService;
  
  /**
   * 프리셋 서비스 가져오기
   * @returns 프리셋 서비스
   */
  getPresetService(): IPresetService;
  
  /**
   * Obsidian App 객체 가져오기
   * @returns Obsidian App 객체
   */
  getApp(): App;
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): CardNavigatorPlugin;
}

/**
 * 마크다운 렌더링 인터페이스
 * 마크다운 렌더링 관련 기능을 제공합니다.
 */
export interface IMarkdownRenderer {
  /**
   * 마크다운 렌더링
   * 마크다운 텍스트를 HTML로 변환합니다.
   * @param markdown 마크다운 텍스트
   * @returns 변환된 HTML
   */
  renderMarkdown(markdown: string): string;
}

/**
 * 통합 카드 네비게이터 서비스 인터페이스
 * 모든 카드 네비게이터 관련 인터페이스를 통합합니다.
 */
export interface ICardNavigatorService extends 
  ICardNavigatorInitializer,
  ICardManager,
  ICardSetSourceController,
  ILayoutController,
  IPresetController,
  ISearchController,
  ISettingsController,
  IServiceProvider,
  IMarkdownRenderer {
  
  /**
   * 카드셋 소스 서비스 설정
   * @param service 카드셋 소스 서비스
   */
  setCardSetSourceService(service: ICardSetSourceService): void;
  
  /**
   * 검색 서비스 설정
   * @param service 검색 서비스
   */
  setSearchService(service: ISearchService): void;
} 