import { App } from 'obsidian';
import { ICardSet, CardSetType } from '../domain/cardset/CardSet';
import { CardSetFactory } from '../domain/cardset/CardSetFactory';
import { ICardRepository } from '../domain/card/CardRepository';
import { SearchType } from '../domain/cardset/SearchCardSet';
import { ModeType } from '../domain/mode/Mode';

/**
 * 카드 세트 서비스 인터페이스
 * 카드 세트 관리를 위한 인터페이스입니다.
 */
export interface ICardSetService {
  /**
   * 현재 카드 세트 가져오기
   * @returns 현재 카드 세트
   */
  getCurrentCardSet(): ICardSet | null;
  
  /**
   * 카드 세트 선택
   * @param cardSetId 카드 세트 ID
   */
  selectCardSet(cardSetId: string): Promise<void>;
  
  /**
   * 카드 세트 생성
   * @param type 카드 세트 타입
   * @param name 카드 세트 이름
   * @param path 경로 또는 태그
   * @param options 추가 옵션
   * @returns 생성된 카드 세트
   */
  createCardSet(
    type: CardSetType,
    name: string,
    path: string,
    options?: {
      includeSubfolders?: boolean;
      isFixed?: boolean;
      query?: string;
      searchType?: SearchType;
      caseSensitive?: boolean;
      frontmatterKey?: string;
    }
  ): ICardSet;
  
  /**
   * 폴더 카드 세트 생성
   * @param name 카드 세트 이름
   * @param path 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   * @param isFixed 고정 여부
   * @returns 생성된 폴더 카드 세트
   */
  createFolderCardSet(
    name: string,
    path: string,
    includeSubfolders?: boolean,
    isFixed?: boolean
  ): ICardSet;
  
  /**
   * 태그 카드 세트 생성
   * @param name 카드 세트 이름
   * @param tag 태그
   * @param isFixed 고정 여부
   * @returns 생성된 태그 카드 세트
   */
  createTagCardSet(
    name: string,
    tag: string,
    isFixed?: boolean
  ): ICardSet;
  
  /**
   * 검색 카드 세트 생성
   * @param name 카드 세트 이름
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   * @param isFixed 고정 여부
   * @returns 생성된 검색 카드 세트
   */
  createSearchCardSet(
    name: string,
    query: string,
    searchType?: SearchType,
    caseSensitive?: boolean,
    frontmatterKey?: string,
    isFixed?: boolean
  ): ICardSet;
  
  /**
   * 카드 세트 목록 가져오기
   * @returns 카드 세트 목록
   */
  getCardSets(): ICardSet[];
  
  /**
   * 카드 세트 삭제
   * @param cardSetId 카드 세트 ID
   * @returns 삭제 성공 여부
   */
  deleteCardSet(cardSetId: string): boolean;
  
  /**
   * 카드 세트 업데이트
   * @param cardSetId 카드 세트 ID
   * @param options 업데이트할 옵션
   * @returns 업데이트된 카드 세트
   */
  updateCardSet(
    cardSetId: string,
    options: Partial<{
      name: string;
      path: string;
      includeSubfolders: boolean;
      isFixed: boolean;
      query: string;
      searchType: SearchType;
      caseSensitive: boolean;
      frontmatterKey: string;
    }>
  ): ICardSet | null;
  
  /**
   * 현재 모드에 맞는 카드 세트 목록 가져오기
   * @param mode 모드 타입
   * @returns 모드에 맞는 카드 세트 목록
   */
  getCardSetsByMode(mode: ModeType): ICardSet[];
}

/**
 * 카드 세트 서비스 클래스
 * 카드 세트 관리를 위한 서비스 클래스입니다.
 */
export class CardSetService implements ICardSetService {
  private app: App;
  private cardSetFactory: CardSetFactory;
  private cardSets: Map<string, ICardSet> = new Map();
  private currentCardSet: ICardSet | null = null;
  
  constructor(app: App, cardRepository: ICardRepository) {
    this.app = app;
    this.cardSetFactory = new CardSetFactory(cardRepository);
  }
  
  /**
   * 현재 카드 세트 가져오기
   * @returns 현재 카드 세트
   */
  getCurrentCardSet(): ICardSet | null {
    return this.currentCardSet;
  }
  
  /**
   * 카드 세트 선택
   * @param cardSetId 카드 세트 ID
   */
  async selectCardSet(cardSetId: string): Promise<void> {
    const cardSet = this.cardSets.get(cardSetId);
    if (!cardSet) {
      console.error(`[CardSetService] 카드 세트 ID '${cardSetId}'를 찾을 수 없습니다.`);
      return;
    }
    
    console.log(`[CardSetService] 카드 세트 '${cardSet.name}' 선택`);
    this.currentCardSet = cardSet;
  }
  
  /**
   * 카드 세트 생성
   * @param type 카드 세트 타입
   * @param name 카드 세트 이름
   * @param path 경로 또는 태그
   * @param options 추가 옵션
   * @returns 생성된 카드 세트
   */
  createCardSet(
    type: CardSetType,
    name: string,
    path: string,
    options: {
      includeSubfolders?: boolean;
      isFixed?: boolean;
      query?: string;
      searchType?: SearchType;
      caseSensitive?: boolean;
      frontmatterKey?: string;
    } = {}
  ): ICardSet {
    const cardSet = this.cardSetFactory.createCardSet(type, name, path, options);
    this.cardSets.set(cardSet.id, cardSet);
    return cardSet;
  }
  
  /**
   * 폴더 카드 세트 생성
   * @param name 카드 세트 이름
   * @param path 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   * @param isFixed 고정 여부
   * @returns 생성된 폴더 카드 세트
   */
  createFolderCardSet(
    name: string,
    path: string,
    includeSubfolders = true,
    isFixed = false
  ): ICardSet {
    const cardSet = this.cardSetFactory.createFolderCardSet(name, path, includeSubfolders, isFixed);
    this.cardSets.set(cardSet.id, cardSet);
    return cardSet;
  }
  
  /**
   * 태그 카드 세트 생성
   * @param name 카드 세트 이름
   * @param tag 태그
   * @param isFixed 고정 여부
   * @returns 생성된 태그 카드 세트
   */
  createTagCardSet(
    name: string,
    tag: string,
    isFixed = false
  ): ICardSet {
    const cardSet = this.cardSetFactory.createTagCardSet(name, tag, isFixed);
    this.cardSets.set(cardSet.id, cardSet);
    return cardSet;
  }
  
  /**
   * 검색 카드 세트 생성
   * @param name 카드 세트 이름
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   * @param isFixed 고정 여부
   * @returns 생성된 검색 카드 세트
   */
  createSearchCardSet(
    name: string,
    query: string,
    searchType: SearchType = 'content',
    caseSensitive = false,
    frontmatterKey?: string,
    isFixed = false
  ): ICardSet {
    const cardSet = this.cardSetFactory.createSearchCardSet(
      name,
      query,
      searchType,
      caseSensitive,
      frontmatterKey,
      isFixed
    );
    this.cardSets.set(cardSet.id, cardSet);
    return cardSet;
  }
  
  /**
   * 카드 세트 목록 가져오기
   * @returns 카드 세트 목록
   */
  getCardSets(): ICardSet[] {
    return Array.from(this.cardSets.values());
  }
  
  /**
   * 카드 세트 삭제
   * @param cardSetId 카드 세트 ID
   * @returns 삭제 성공 여부
   */
  deleteCardSet(cardSetId: string): boolean {
    // 현재 선택된 카드 세트인 경우 선택 해제
    if (this.currentCardSet && this.currentCardSet.id === cardSetId) {
      this.currentCardSet = null;
    }
    
    return this.cardSets.delete(cardSetId);
  }
  
  /**
   * 카드 세트 업데이트
   * @param cardSetId 카드 세트 ID
   * @param options 업데이트할 옵션
   * @returns 업데이트된 카드 세트
   */
  updateCardSet(
    cardSetId: string,
    options: Partial<{
      name: string;
      path: string;
      includeSubfolders: boolean;
      isFixed: boolean;
      query: string;
      searchType: SearchType;
      caseSensitive: boolean;
      frontmatterKey: string;
    }>
  ): ICardSet | null {
    const cardSet = this.cardSets.get(cardSetId);
    if (!cardSet) {
      console.error(`[CardSetService] 카드 세트 ID '${cardSetId}'를 찾을 수 없습니다.`);
      return null;
    }
    
    // 기본 속성 업데이트
    const updateOptions: Partial<{
      name: string;
      path: string;
      includeSubfolders: boolean;
      isFixed: boolean;
    }> = {};
    
    if (options.name !== undefined) {
      updateOptions.name = options.name;
    }
    
    if (options.path !== undefined) {
      updateOptions.path = options.path;
    }
    
    if (options.includeSubfolders !== undefined) {
      updateOptions.includeSubfolders = options.includeSubfolders;
    }
    
    if (options.isFixed !== undefined) {
      updateOptions.isFixed = options.isFixed;
    }
    
    // 기본 속성 업데이트
    cardSet.update(updateOptions);
    
    // 검색 카드 세트인 경우 추가 속성 업데이트
    if (cardSet.type === 'search') {
      const searchCardSet = cardSet as any;
      
      if (options.query !== undefined) {
        searchCardSet.updateQuery(options.query);
      }
      
      if (options.searchType !== undefined) {
        searchCardSet.updateSearchType(options.searchType, options.frontmatterKey);
      }
      
      if (options.caseSensitive !== undefined) {
        searchCardSet.updateCaseSensitive(options.caseSensitive);
      }
    }
    
    return cardSet;
  }
  
  /**
   * 현재 모드에 맞는 카드 세트 목록 가져오기
   * @param mode 모드 타입
   * @returns 모드에 맞는 카드 세트 목록
   */
  getCardSetsByMode(mode: ModeType): ICardSet[] {
    return this.getCardSets().filter(cardSet => cardSet.mode === mode || cardSet.type === 'search');
  }
} 