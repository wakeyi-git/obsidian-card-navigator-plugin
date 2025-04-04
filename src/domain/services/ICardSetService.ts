import { ICard } from '../models/Card';
import { ICardSet } from '../models/CardSet';
import { CardSetType } from '../models/CardSet';
import { ISortConfig } from '../models/SortConfig';

/**
 * 카드셋 서비스 인터페이스
 * - 카드셋 생성 및 관리
 * - 카드셋 필터링
 * - 카드셋 정렬
 */
export interface ICardSetService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드셋 생성
   * @param type 카드셋 타입
   * @param criteria 기준 (폴더 경로 또는 태그)
   * @param options 옵션
   */
  createCardSet(
    type: CardSetType,
    criteria: string,
    options?: {
      includeSubfolders?: boolean;
      sortConfig?: ISortConfig;
    }
  ): Promise<ICardSet>;

  /**
   * 카드셋 업데이트
   * @param cardSet 카드셋
   */
  updateCardSet(cardSet: ICardSet): Promise<void>;

  /**
   * 카드셋 삭제
   * @param cardSetId 카드셋 ID
   */
  deleteCardSet(cardSetId: string): Promise<void>;

  /**
   * 카드셋 가져오기
   * @param cardSetId 카드셋 ID
   */
  getCardSet(cardSetId: string): Promise<ICardSet | null>;

  /**
   * 모든 카드셋 가져오기
   */
  getAllCardSets(): Promise<ICardSet[]>;

  /**
   * 폴더별 카드셋 가져오기
   * @param folderPath 폴더 경로
   */
  getCardSetByFolder(folderPath: string): Promise<ICardSet | null>;

  /**
   * 태그별 카드셋 가져오기
   * @param tag 태그
   */
  getCardSetByTag(tag: string): Promise<ICardSet | null>;

  /**
   * 카드셋 필터링
   * @param cardSet 카드셋
   * @param filter 필터 함수
   */
  filterCardSet(
    cardSet: ICardSet,
    filter: (card: ICard) => boolean
  ): Promise<ICardSet>;

  /**
   * 카드셋 정렬
   * @param cardSet 카드셋
   * @param sortConfig 정렬 설정
   */
  sortCardSet(
    cardSet: ICardSet,
    sortConfig: ISortConfig
  ): Promise<ICardSet>;

  /**
   * 카드셋 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToCardSetEvents(callback: (event: {
    type: 'create' | 'update' | 'delete' | 'filter' | 'sort';
    cardSetId: string;
    data?: any;
  }) => void): void;

  /**
   * 카드셋 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromCardSetEvents(callback: (event: any) => void): void;

  /**
   * ID로 카드를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 또는 null
   */
  getCardById(cardId: string): ICard | null;
} 