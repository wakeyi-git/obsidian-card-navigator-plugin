import { ICardRepository } from '../card/CardRepository';
import { ICardSet, CardSetType } from './CardSet';
import { FolderCardSet } from './FolderCardSet';
import { TagCardSet } from './TagCardSet';
import { SearchCardSet, SearchType } from './SearchCardSet';
import { v4 as uuidv4 } from 'uuid';

/**
 * 카드 세트 팩토리 클래스
 * 다양한 타입의 카드 세트를 생성합니다.
 */
export class CardSetFactory {
  private cardRepository: ICardRepository;
  
  constructor(cardRepository: ICardRepository) {
    this.cardRepository = cardRepository;
  }
  
  /**
   * 폴더 카드 세트 생성
   * @param name 카드 세트 이름
   * @param path 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   * @param isFixed 고정 여부
   * @returns 폴더 카드 세트
   */
  createFolderCardSet(
    name: string,
    path: string,
    includeSubfolders = true,
    isFixed = false
  ): FolderCardSet {
    const id = uuidv4();
    return new FolderCardSet(id, name, path, this.cardRepository, includeSubfolders, isFixed);
  }
  
  /**
   * 태그 카드 세트 생성
   * @param name 카드 세트 이름
   * @param tag 태그
   * @param isFixed 고정 여부
   * @returns 태그 카드 세트
   */
  createTagCardSet(
    name: string,
    tag: string,
    isFixed = false
  ): TagCardSet {
    const id = uuidv4();
    return new TagCardSet(id, name, tag, this.cardRepository, isFixed);
  }
  
  /**
   * 검색 카드 세트 생성
   * @param name 카드 세트 이름
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   * @param isFixed 고정 여부
   * @returns 검색 카드 세트
   */
  createSearchCardSet(
    name: string,
    query: string,
    searchType: SearchType = 'content',
    caseSensitive = false,
    frontmatterKey?: string,
    isFixed = false
  ): SearchCardSet {
    const id = uuidv4();
    return new SearchCardSet(
      id,
      name,
      query,
      this.cardRepository,
      searchType,
      caseSensitive,
      frontmatterKey,
      isFixed
    );
  }
  
  /**
   * 카드 세트 생성
   * @param type 카드 세트 타입
   * @param name 카드 세트 이름
   * @param path 경로 또는 태그
   * @param options 추가 옵션
   * @returns 카드 세트
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
    switch (type) {
      case 'folder':
        return this.createFolderCardSet(
          name,
          path,
          options.includeSubfolders,
          options.isFixed
        );
      case 'tag':
        return this.createTagCardSet(
          name,
          path,
          options.isFixed
        );
      case 'search':
        return this.createSearchCardSet(
          name,
          options.query || '',
          options.searchType,
          options.caseSensitive,
          options.frontmatterKey,
          options.isFixed
        );
      default:
        throw new Error(`지원하지 않는 카드 세트 타입: ${type}`);
    }
  }
} 