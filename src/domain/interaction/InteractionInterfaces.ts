import { App, TFile } from 'obsidian';
import { ICard } from '../card/index';
import { CardSetSourceType } from '../cardset/index';
import { LayoutType } from '../layout/index';
import { IPreset } from '../preset/index';
import { SearchType } from '../search/index';
import { ICardService } from '../../application/CardService';
import { ICardSetService } from '../../application/CardSetService';
import { ISearchService } from '../../application/SearchService';
import { ILayoutService } from '../../application/LayoutService';
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
   * 현재 카드 세트, 필터, 정렬, 검색 설정에 따라 카드 목록을 가져옵니다.
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
   * 카드 세트 변경
   * @param type 변경할 카드 세트 타입
   */
  changeCardSetSource(type: CardSetSourceType): Promise<void>;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   */
  selectCardSet(cardSet: string, isFixed?: boolean): Promise<void>;
  
  /**
   * 카드 세트 변경 알림 처리
   * CardSetSourceService에서 카드 세트가 변경될 때 호출됩니다.
   * @param cardSetSourceType 변경된 카드 세트 타입
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
   * 카드 세트 서비스 가져오기
   * @returns 카드 세트 서비스
   */
  getCardSetSourceService(): ICardSetService;
  
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
  getSortService(): ICardSetService;
  
  /**
   * 레이아웃 서비스 가져오기
   * @returns 레이아웃 서비스
   */
  getLayoutService(): ILayoutService;
  
  /**
   * 프리셋 서비스 가져오기
   * @returns 프리셋 서비스
   */
  getPresetService(): ICardSetService;
  
  /**
   * Obsidian App 객체 가져오기
   * @returns Obsidian App 객체
   */
  getApp(): App;
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): any;
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
 * 키보드 내비게이션 방향
 */
export type KeyboardNavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 카드 상호작용 인터페이스
 * 카드와의 상호작용을 정의합니다.
 */
export interface ICardInteraction {
  /**
   * 클릭 이벤트 처리
   * @param card 카드
   */
  onClick(card: ICard): void;
  
  /**
   * 더블 클릭 이벤트 처리
   * @param card 카드
   */
  onDoubleClick(card: ICard): void;
  
  /**
   * 우클릭 이벤트 처리
   * @param card 카드
   * @param event 마우스 이벤트
   */
  onRightClick(card: ICard, event: MouseEvent): void;
  
  /**
   * 드래그 시작 이벤트 처리
   * @param card 카드
   * @param event 드래그 이벤트
   */
  onDragStart(card: ICard, event: DragEvent): void;
  
  /**
   * 드래그 종료 이벤트 처리
   * @param card 카드
   * @param event 드래그 이벤트
   */
  onDragEnd(card: ICard, event: DragEvent): void;
  
  /**
   * 드롭 이벤트 처리
   * @param card 카드
   * @param event 드래그 이벤트
   */
  onDrop(card: ICard, event: DragEvent): void;
}

/**
 * 키보드 내비게이션 인터페이스
 * 키보드를 이용한 카드 내비게이션을 정의합니다.
 */
export interface IKeyboardNavigation {
  /**
   * 키보드 이벤트 처리
   * @param event 키보드 이벤트
   * @returns 이벤트 처리 여부
   */
  handleKeyEvent(event: KeyboardEvent): Promise<boolean>;
  
  /**
   * 방향키 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigate(direction: KeyboardNavigationDirection): boolean;
  
  /**
   * 현재 포커스된 카드 열기
   * @returns 성공 여부
   */
  openFocusedCard(): Promise<boolean>;
  
  /**
   * 현재 포커스된 카드 편집
   * @returns 성공 여부
   */
  editFocusedCard(): Promise<boolean>;
  
  /**
   * 현재 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedIndex(): number;
}

/**
 * 다중 선택 인터페이스
 * 카드의 다중 선택 기능을 정의합니다.
 */
export interface IMultiSelection {
  /**
   * 선택된 카드 목록
   */
  selectedCards: ICard[];
  
  /**
   * 카드 선택
   * @param card 선택할 카드
   * @param addToSelection 기존 선택에 추가할지 여부 (true: 추가, false: 대체)
   */
  selectCard(card: ICard, addToSelection?: boolean): void;
  
  /**
   * 카드 선택 해제
   * @param card 선택 해제할 카드
   */
  deselectCard(card: ICard): void;
  
  /**
   * 모든 카드 선택
   * @param cards 선택할 카드 목록
   */
  selectAll(cards: ICard[]): void;
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAll(): void;
  
  /**
   * 범위 선택
   * @param startCard 시작 카드
   * @param endCard 끝 카드
   * @param cards 전체 카드 목록
   */
  selectRange(startCard: ICard, endCard: ICard, cards: ICard[]): void;
  
  /**
   * 카드 선택 여부 확인
   * @param card 확인할 카드
   * @returns 선택 여부
   */
  isSelected(card: ICard): boolean;
  
  /**
   * 선택된 카드 수 가져오기
   * @returns 선택된 카드 수
   */
  getSelectionCount(): number;
  
  /**
   * 선택된 카드 목록 가져오기
   * @returns 선택된 카드 목록
   */
  getSelectedCards(): ICard[];
  
  /**
   * 선택된 카드에 대한 일괄 작업 수행
   * @param action 수행할 작업 함수
   */
  performBatchAction(action: (cards: ICard[]) => Promise<void>): Promise<void>;
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
  IMarkdownRenderer,
  ICardInteraction,
  IKeyboardNavigation,
  IMultiSelection {
  
  /**
   * 카드셋 소스 서비스 설정
   * @param service 카드셋 소스 서비스
   */
  setCardSetSourceService(service: ICardSetService): void;
  
  /**
   * 검색 서비스 설정
   * @param service 검색 서비스
   */
  setSearchService(service: ISearchService): void;
} 