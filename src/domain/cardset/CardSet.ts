/**
 * 카드셋 소스 타입 정의
 */
export type CardSetSourceType = 'folder' | 'tag' | 'search';

/**
 * 카드셋 타입 정의
 * 활성: 현재 열려 있는 노트에 따라 자동으로 변경됨
 * 지정: 사용자가 지정한 값으로 고정됨
 */
export type CardSetType = 'active' | 'fixed';

/**
 * 카드셋 인터페이스
 * 카드셋의 기본 정보를 정의합니다.
 */
export interface ICardSet {
  /**
   * 카드셋 고유 식별자
   */
  id: string;
  
  /**
   * 카드셋 이름 (UI에 표시될 이름)
   */
  name: string;
  
  /**
   * 카드셋 소스 타입 (폴더, 태그, 검색)
   */
  sourceType: CardSetSourceType;
  
  /**
   * 카드셋 소스 (폴더 경로, 태그 이름, 검색 쿼리 등)
   */
  source: string;
  
  /**
   * 카드셋 타입 (활성, 고정)
   */
  type: CardSetType;
  
  /**
   * 추가 메타데이터 (선택 사항)
   */
  metadata?: Record<string, any>;
}

/**
 * 카드셋 상태 인터페이스
 * 카드셋의 현재 상태를 나타내는 인터페이스입니다.
 */
export interface ICardSetState {
  /**
   * 현재 선택된 카드셋
   */
  currentCardSet: string | null;
  
  /**
   * 카드셋 고정 여부
   */
  isFixed: boolean;
  
  /**
   * 추가 상태 정보 (선택 사항)
   */
  metadata?: Record<string, any>;
}

/**
 * 카드셋 관리 인터페이스
 * 카드셋 관리에 필요한 메서드를 정의합니다.
 */
export interface ICardSetManager {
  /**
   * 현재 카드셋 가져오기
   */
  getCurrentCardSet(): ICardSet | null;
  
  /**
   * 이전 폴더 카드셋 가져오기
   */
  getPreviousFolderCardSet(): ICardSet | null;
  
  /**
   * 이전 태그 카드셋 가져오기
   */
  getPreviousTagCardSet(): ICardSet | null;
  
  /**
   * 카드셋 설정하기
   * @param cardSet 설정할 카드셋
   * @param isFixed 고정 여부
   */
  setCardSet(cardSet: ICardSet, isFixed?: boolean): Promise<void>;
  
  /**
   * 카드셋 소스 변경하기
   * @param sourceType 변경할 소스 타입
   */
  changeCardSetSource(sourceType: CardSetSourceType): Promise<void>;
}

/**
 * 카드셋 소스 인터페이스
 * 폴더 소스, 태그 소스, 검색 소스의 공통 인터페이스를 정의합니다.
 * 카드셋 소스는 카드셋을 구성하는 방식을 나타냅니다.
 */
export interface ICardSetSource {
  /**
   * 소스 타입
   */
  type: CardSetSourceType;
  
  /**
   * 카드셋 목록 가져오기
   * 현재 소스에 따라 카드셋 목록을 가져옵니다.
   */
  getCardSets(): Promise<string[]>;
  
  /**
   * 현재 선택된 카드셋
   */
  currentCardSet: string | null;
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋 (null인 경우 카드셋 선택 해제)
   * @param isFixed 카드셋 고정 여부 (true: 지정, false: 활성)
   */
  selectCardSet(cardSet: string | null, isFixed?: boolean): void;
  
  /**
   * 카드셋 고정 여부 확인
   * @returns 고정 여부
   */
  isCardSetFixed(): boolean;
  
  /**
   * 필터 옵션 가져오기
   * 현재 소스에 따라 필터링 옵션을 가져옵니다.
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 파일 목록 가져오기
   * 현재 소스에 따라 파일 목록을 가져옵니다.
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 카드 목록 가져오기
   * 현재 소스에 따라 카드 목록을 가져옵니다.
   * @param cardService 카드 서비스
   */
  getCards(cardService: any): Promise<any[]>;
  
  /**
   * 설정 초기화
   */
  reset(): void;
  
  /**
   * 현재 카드셋 상태 가져오기
   * @returns 카드셋 상태 객체
   */
  getState(): ICardSetState;
  
  /**
   * 카드셋 상태 설정하기
   * @param state 카드셋 상태 객체
   */
  setState(state: ICardSetState): void;
  
  /**
   * 캐시 초기화
   */
  clearCache(): void;
}

/**
 * 카드셋 소스 추상 클래스
 * 카드셋 소스의 기본 구현을 제공합니다.
 */
export abstract class CardSetSource implements ICardSetSource {
  type: CardSetSourceType;
  currentCardSet: string | null = null;
  private isFixed = false;
  protected cache: Map<string, any> = new Map();
  protected lastCacheTime: Map<string, number> = new Map();
  protected readonly CACHE_TTL = 30000; // 30초 캐시 유효 시간
  
  constructor(type: CardSetSourceType) {
    this.type = type;
  }
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부
   */
  selectCardSet(cardSet: string | null, isFixed = false): void {
    this.currentCardSet = cardSet;
    this.isFixed = isFixed;
  }
  
  /**
   * 카드셋 고정 여부 확인
   * @returns 고정 여부
   */
  isCardSetFixed(): boolean {
    return this.isFixed;
  }
  
  /**
   * 카드셋 상태 가져오기
   * @returns 카드셋 상태 객체
   */
  getState(): ICardSetState {
    return {
      currentCardSet: this.currentCardSet,
      isFixed: this.isFixed
    };
  }
  
  /**
   * 카드셋 상태 설정하기
   * @param state 카드셋 상태 객체
   */
  setState(state: ICardSetState): void {
    this.currentCardSet = state.currentCardSet;
    this.isFixed = state.isFixed;
  }
  
  /**
   * 캐시 확인
   * @param key 캐시 키
   * @returns 캐시된 값 또는 null
   */
  protected getFromCache<T>(key: string): T | null {
    const now = Date.now();
    const cacheEntry = this.cache.get(key);
    const cacheTime = this.lastCacheTime.get(key) || 0;
    
    if (cacheEntry && now - cacheTime < this.CACHE_TTL) {
      return cacheEntry as T;
    }
    
    return null;
  }
  
  /**
   * 캐시에 저장
   * @param key 캐시 키
   * @param value 저장할 값
   */
  protected setCache<T>(key: string, value: T): void {
    this.cache.set(key, value);
    this.lastCacheTime.set(key, Date.now());
  }
  
  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheTime.clear();
  }
  
  /**
   * 카드셋 목록 가져오기
   */
  abstract getCardSets(): Promise<string[]>;
  
  /**
   * 필터 옵션 가져오기
   */
  abstract getFilterOptions(): Promise<string[]>;
  
  /**
   * 파일 목록 가져오기
   */
  abstract getFiles(): Promise<string[]>;
  
  /**
   * 카드 목록 가져오기
   */
  abstract getCards(cardService: any): Promise<any[]>;
  
  /**
   * 설정 초기화
   */
  reset(): void {
    this.currentCardSet = null;
    this.isFixed = false;
    this.clearCache();
  }
} 