import { TFile } from 'obsidian';
import { ICard } from '../card/Card';
import { CardSetSourceType, ICardSetSource } from './CardSet';
import { SearchType } from '../search/index';
import { EventType } from '../events/EventTypes';

/**
 * 카드셋 소스 관리 인터페이스
 * 카드셋 소스 관련 기능을 제공합니다.
 */
export interface ICardSetSourceManager {
  /**
   * 현재 카드셋 소스 가져오기
   * @returns 현재 카드셋 소스
   */
  getCurrentSource(): ICardSetSource;
  
  /**
   * 현재 카드셋 소스 타입 가져오기
   * @returns 현재 카드셋 소스 타입
   */
  getCurrentSourceType(): CardSetSourceType;
  
  /**
   * 카드셋 소스 변경
   * @param sourceType 변경할 카드셋 소스 타입
   */
  changeSource(sourceType: CardSetSourceType): Promise<void>;
  
  /**
   * 폴더 카드셋 소스 가져오기
   * @returns 폴더 카드셋 소스 객체
   */
  getFolderSource(): ICardSetSource;
  
  /**
   * 태그 카드셋 소스 가져오기
   * @returns 태그 카드셋 소스 객체
   */
  getTagSource(): ICardSetSource;
  
  /**
   * 이전 카드셋 소스 가져오기
   * @returns 이전 카드셋 소스
   */
  getPreviousSourceType(): CardSetSourceType;
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   * @returns 이전 카드셋 소스 타입
   */
  getPreviousCardSetSource(): CardSetSourceType;
}

/**
 * 카드셋 선택 관리 인터페이스
 * 카드셋 선택 관련 기능을 제공합니다.
 */
export interface ICardSetSelectionManager {
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부 (true: 지정 폴더/태그, false: 활성 폴더/태그)
   */
  selectCardSet(cardSet: string, isFixed?: boolean): Promise<void>;
  
  /**
   * 현재 선택된 카드셋 가져오기
   * @returns 현재 선택된 카드셋
   */
  getCurrentCardSet(): string | null;
  
  /**
   * 카드셋 고정 여부 가져오기
   * @returns 카드셋 고정 여부
   */
  isCardSetFixed(): boolean;
  
  /**
   * 카드셋 목록 가져오기
   * @returns 카드셋 목록
   */
  getCardSets(): Promise<string[]>;
}

/**
 * 카드셋 필터 관리 인터페이스
 * 카드셋 필터링 관련 기능을 제공합니다.
 */
export interface ICardSetFilterManager {
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void;
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean;
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void;
  
  /**
   * 태그 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isTagCaseSensitive(): boolean;
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  getFilterOptions(): Promise<string[]>;
}

/**
 * 카드셋 파일 관리 인터페이스
 * 카드셋 파일 관련 기능을 제공합니다.
 */
export interface ICardSetFileManager {
  /**
   * 현재 카드셋 소스에 따라 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 현재 카드셋 소스에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 현재 카드셋 소스를 카드 목록에 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  applySource(cards: ICard[]): Promise<ICard[]>;
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   * @returns 카드셋이 변경되었는지 여부
   */
  handleActiveFileChange(file: TFile | null): Promise<boolean>;
}

/**
 * 카드셋 상태 관리 인터페이스
 * 카드셋 상태 관련 기능을 제공합니다.
 */
export interface ICardSetStateManager {
  /**
   * 현재 카드셋 소스 상태 저장
   * 검색 소스로 전환하기 전에 현재 카드셋 소스 상태를 저장합니다.
   */
  saveCurrentSourceState(): void;
  
  /**
   * 이전 카드셋 소스 상태 복원
   * 검색 소스에서 이전 카드셋 소스로 돌아갑니다.
   */
  restorePreviousSourceState(): void;
  
  /**
   * 서비스 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 설정 초기화
   */
  reset(): void;
}

/**
 * 카드셋 검색 관리 인터페이스
 * 카드셋 검색 관련 기능을 제공합니다.
 */
export interface ICardSetSearchManager {
  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
  
  /**
   * 검색 서비스 설정
   * @param searchService 검색 서비스
   */
  setSearchService(searchService: any): void;
}

/**
 * 카드셋 이벤트 관리 인터페이스
 * 카드셋 이벤트 관련 기능을 제공합니다.
 */
export interface ICardSetEventManager {
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: EventType, listener: (...args: any[]) => void): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: EventType, listener: (...args: any[]) => void): void;
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param args 이벤트 인자
   */
  emit(event: EventType, ...args: any[]): void;
}

/**
 * 통합 카드셋 서비스 인터페이스
 * 모든 카드셋 관련 인터페이스를 통합합니다.
 */
export interface ICardSetService extends 
  ICardSetSourceManager,
  ICardSetSelectionManager,
  ICardSetFilterManager,
  ICardSetFileManager,
  ICardSetStateManager,
  ICardSetSearchManager,
  ICardSetEventManager {
} 