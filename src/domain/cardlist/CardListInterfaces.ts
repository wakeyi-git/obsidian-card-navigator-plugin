import { ICard } from '../card/Card';
import { ICardSet } from '../cardset/CardSet';

/**
 * 정렬 타입 정의
 */
export type SortType = 'filename' | 'created' | 'modified' | 'frontmatter' | 'tag' | 'folder';

/**
 * 정렬 방향 정의
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 우선 순위 설정 인터페이스
 * 카드 정렬 시 특정 태그나 폴더를 우선시하기 위한 인터페이스입니다.
 */
export interface IPrioritySettings {
  /**
   * 우선 순위 태그 목록
   * 이 태그들을 포함하는 카드가 목록의 상단에 먼저 표시됩니다.
   */
  priorityTags: string[];
  
  /**
   * 우선 순위 폴더 목록
   * 이 폴더들에 있는 카드가 목록의 상단에 먼저 표시됩니다.
   */
  priorityFolders: string[];
  
  /**
   * 우선 순위 적용 여부
   * true인 경우 우선 순위 태그와 폴더를 적용합니다.
   */
  applyPriorities: boolean;
}

/**
 * 정렬 인터페이스
 * 카드를 정렬하기 위한 인터페이스입니다.
 */
export interface ISort {
  /**
   * 정렬 타입
   */
  type: SortType;
  
  /**
   * 정렬 방향
   */
  direction: SortDirection;
  
  /**
   * 프론트매터 키 (frontmatter 타입인 경우)
   */
  frontmatterKey?: string;
  
  /**
   * 우선 순위 설정
   * 카드 정렬 시 특정 태그나 폴더를 우선시하기 위한 설정입니다.
   */
  prioritySettings?: IPrioritySettings;
  
  /**
   * 정렬 적용
   * 주어진 카드 목록에 정렬을 적용합니다.
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  apply(cards: ICard[]): ICard[];
  
  /**
   * 정렬 방향 전환
   * 현재 정렬 방향을 반대로 전환합니다.
   */
  toggleDirection(): void;
  
  /**
   * 두 카드 비교
   * 정렬 기준에 따라 두 카드를 비교합니다.
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @returns 비교 결과 (-1, 0, 1)
   */
  compare(a: ICard, b: ICard): number;
  
  /**
   * 우선 순위 설정 적용
   * 우선 순위 태그와 폴더를 기준으로 카드를 정렬합니다.
   * @param cards 카드 목록
   * @returns 우선 순위가 적용된 카드 목록
   */
  applyPriorities(cards: ICard[]): ICard[];
}

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