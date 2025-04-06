import { ICard } from '../models/Card';
import { ICardSet } from '../models/CardSet';
import { ICardSetConfig, CardSetType } from '../models/CardSetConfig';
import { ISortConfig } from '../models/SortConfig';
import { TFile } from 'obsidian';

/**
 * 카드셋 서비스 인터페이스
 * - 카드셋 생성 및 관리
 * - 카드 필터링
 * - 카드 정렬
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
   * @param config 카드셋 설정
   * @returns 생성된 카드셋
   */
  createCardSet(type: CardSetType, config: ICardSetConfig): Promise<ICardSet>;

  /**
   * 카드셋 업데이트
   * @param cardSet 업데이트할 카드셋
   * @param config 카드셋 설정
   * @returns 업데이트된 카드셋
   */
  updateCardSet(cardSet: ICardSet, config: ICardSetConfig): Promise<ICardSet>;

  /**
   * 카드셋에 카드 추가
   * @param cardSet 대상 카드셋
   * @param file 추가할 파일
   */
  addCardToSet(cardSet: ICardSet, file: TFile): Promise<void>;

  /**
   * 카드셋에서 카드 제거
   * @param cardSet 대상 카드셋
   * @param file 제거할 파일
   */
  removeCardFromSet(cardSet: ICardSet, file: TFile): Promise<void>;

  /**
   * 카드셋 유효성 검사
   * @param cardSet 검사할 카드셋
   * @returns 유효성 여부
   */
  validateCardSet(cardSet: ICardSet): boolean;

  /**
   * 카드셋의 카드 필터링
   * @param cardSet 카드셋
   * @param filter 필터 함수
   * @returns 필터링된 카드셋
   */
  filterCards(cardSet: ICardSet, filter: (card: ICard) => boolean): Promise<ICardSet>;

  /**
   * 카드셋의 카드 정렬
   * @param cardSet 카드셋
   * @param sortConfig 정렬 설정
   * @returns 정렬된 카드셋
   */
  sortCards(cardSet: ICardSet, sortConfig: ISortConfig): Promise<ICardSet>;
} 