import { App, TFile } from 'obsidian';
import { ICard } from '../card/index';
import { CardSetSourceType } from '../cardset/index';
import { LayoutType } from '../layout/index';
import { IPreset } from '../preset/index';
import { SearchType } from '../search/index';
import { BatchActionType, IBatchActionParams, IBatchActionResult } from './BatchActions';
import { SelectionMode } from './SelectionState';
import { KeyboardNavigationDirection } from '../navigation';

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
 * 카드 상호작용 핸들러 인터페이스
 * 카드와의 상호작용을 처리하는 핸들러를 정의합니다.
 */
export interface ICardInteractionHandler {
  /**
   * 카드 클릭 처리
   * @param card 카드 데이터
   */
  onCardClick(card: ICard): void;
  
  /**
   * 카드 더블 클릭 처리
   * @param card 카드 데이터
   */
  onCardDoubleClick(card: ICard): void;
  
  /**
   * 카드 컨텍스트 메뉴 처리
   * @param card 카드 데이터
   * @param event 이벤트
   */
  onCardContextMenu(card: ICard, event: MouseEvent): void;
  
  /**
   * 카드 드래그 시작 처리
   * @param card 카드 데이터
   * @param event 드래그 이벤트
   */
  onCardDragStart(card: ICard, event: DragEvent): void;
  
  /**
   * 카드 드래그 종료 처리
   * @param card 카드 데이터
   * @param event 드래그 이벤트
   */
  onCardDragEnd(card: ICard, event: DragEvent): void;
  
  /**
   * 태그 클릭 처리
   * @param tag 태그
   * @param card 카드 데이터
   */
  onTagClick(tag: string, card: ICard): void;
  
  /**
   * 편집 버튼 클릭 처리
   * @param card 카드 데이터
   */
  onEditClick(card: ICard): void;
  
  /**
   * 열기 버튼 클릭 처리
   * @param card 카드 데이터
   */
  onOpenClick(card: ICard): void;
}

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
 * 다중 선택 인터페이스
 * 다중 선택 관련 기능을 제공합니다.
 */
export interface IMultiSelection {
  /**
   * 선택된 카드 목록
   */
  selectedCards: ICard[];
  
  /**
   * 마지막으로 선택된 카드
   */
  lastSelectedCard: ICard | null;
  
  /**
   * 현재 선택 모드
   */
  selectionMode: SelectionMode;
  
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
   * 선택 모드 변경
   * @param mode 변경할 선택 모드
   */
  setSelectionMode(mode: SelectionMode): void;
  
  /**
   * 현재 선택 모드 가져오기
   * @returns 현재 선택 모드
   */
  getSelectionMode(): SelectionMode;
  
  /**
   * 선택된 카드에 대한 일괄 작업 수행
   * @param action 수행할 작업 함수
   * @deprecated 대신 performBatchActionWithParams 사용
   */
  performBatchAction(action: (cards: ICard[]) => Promise<void>): Promise<void>;
  
  /**
   * 선택된 카드에 대한 일괄 작업 수행
   * @param params 일괄 작업 매개변수
   * @returns 일괄 작업 결과
   */
  performBatchActionWithParams(params: IBatchActionParams): Promise<IBatchActionResult>;
  
  /**
   * 특정 일괄 작업 타입이 현재 선택에 적용 가능한지 확인
   * @param actionType 확인할 일괄 작업 타입
   * @returns 적용 가능 여부
   */
  isBatchActionAvailable(actionType: BatchActionType): boolean;
} 