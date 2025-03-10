import { ICard } from '../card/Card';
import { ICardSet } from '../cardset/CardSet';
import { ISort, IPrioritySettings } from '../sorting/SortingInterfaces';

/**
 * 카드 리스트 인터페이스
 * 정렬된 카드 목록을 정의합니다.
 */
export interface ICardList {
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  getCards(): ICard[];
  
  /**
   * 특정 위치의 카드 가져오기
   * @param index 인덱스
   * @returns 카드 또는 undefined
   */
  getCardAt(index: number): ICard | undefined;
  
  /**
   * 카드 목록 크기 가져오기
   * @returns 카드 목록 크기
   */
  getSize(): number;
  
  /**
   * 정렬 적용하기
   * @param sort 정렬 객체
   * @returns 정렬된 카드 리스트
   */
  applySort(sort: ISort): ICardList;
  
  /**
   * 우선 순위 설정 적용하기
   * @param prioritySettings 우선 순위 설정
   * @returns 우선 순위가 적용된 카드 리스트
   */
  applyPrioritySettings(prioritySettings: IPrioritySettings): ICardList;
  
  /**
   * 페이지네이션 적용하기
   * @param page 페이지 번호
   * @param pageSize 페이지 크기
   * @returns 페이지네이션이 적용된 카드 리스트
   */
  applyPagination(page: number, pageSize: number): ICardList;
  
  /**
   * 현재 적용된 정렬 가져오기
   * @returns 현재 정렬 또는 undefined
   */
  getCurrentSort(): ISort | undefined;
  
  /**
   * 원본 카드셋 가져오기
   * @returns 원본 카드셋
   */
  getSourceCardSet(): ICardSet;
}

/**
 * 카드 리스트 팩토리 인터페이스
 * 카드 리스트를 생성하기 위한 인터페이스입니다.
 */
export interface ICardListFactory {
  /**
   * 카드셋으로부터 카드 리스트 생성
   * @param cardSet 카드셋
   * @param sort 정렬 (선택 사항)
   * @param prioritySettings 우선 순위 설정 (선택 사항)
   * @returns 카드 리스트
   */
  createFromCardSet(cardSet: ICardSet, sort?: ISort, prioritySettings?: IPrioritySettings): ICardList;
} 