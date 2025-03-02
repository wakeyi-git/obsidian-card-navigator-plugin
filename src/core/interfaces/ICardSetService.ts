import { TFile } from 'obsidian';
import { Card } from '../models/Card';
import { CardSet } from '../models/CardSet';
import { CardFilterOption, CardGroupOption, CardSetMode, CardSetOptions, CardSortOption } from '../types/cardset.types';

/**
 * 카드 서비스 인터페이스
 * 카드셋 내 카드 관련 기능을 제공합니다.
 */
export interface ICardService {
  /**
   * 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  createCard(file: TFile): Promise<Card>;
  
  /**
   * 카드 가져오기
   * @param cardId 카드 ID
   * @returns 카드
   */
  getCard(cardId: string): Promise<Card | null>;
  
  /**
   * 카드셋에서 모든 카드 가져오기
   * @param cardSet 카드셋
   * @returns 카드 배열
   */
  getCardsFromCardSet(cardSet: CardSet): Promise<Card[]>;
  
  /**
   * 카드 정렬
   * @param cards 카드 배열
   * @param sortOption 정렬 옵션
   * @returns 정렬된 카드 배열
   */
  sortCards(cards: Card[], sortOption: CardSortOption): Promise<Card[]>;
  
  /**
   * 카드 필터링
   * @param cards 카드 배열
   * @param filterOptions 필터 옵션 배열
   * @returns 필터링된 카드 배열
   */
  filterCards(cards: Card[], filterOptions: CardFilterOption[]): Promise<Card[]>;
  
  /**
   * 카드 그룹화
   * @param cards 카드 배열
   * @param groupOption 그룹 옵션
   * @returns 그룹화된 카드 맵
   */
  groupCards(cards: Card[], groupOption: CardGroupOption): Promise<Map<string, Card[]>>;
  
  /**
   * 카드 검색
   * @param cards 카드 배열
   * @param query 검색 쿼리
   * @returns 검색 결과 카드 배열
   */
  searchCards(cards: Card[], query: string): Promise<Card[]>;
  
  /**
   * 카드 업데이트
   * @param cardId 카드 ID
   * @returns 업데이트된 카드
   */
  updateCard(cardId: string): Promise<Card | null>;
  
  /**
   * 카드 서비스 파괴
   */
  destroy(): void;
} 