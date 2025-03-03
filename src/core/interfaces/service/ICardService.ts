import { TFile } from 'obsidian';
import { Card } from '../../models/Card';
import { CardData } from '../../types/card.types';

/**
 * 카드 서비스 인터페이스
 * 개별 카드 데이터의 생성, 변환, 관리를 담당합니다.
 */
export interface ICardService {
  /**
   * 서비스 초기화
   * @param options 초기화 옵션
   */
  initialize(options?: any): void;
  
  /**
   * 파일에서 카드 생성
   * @param file Obsidian 파일
   * @returns 생성된 카드 객체
   */
  createCardFromFile(file: TFile): Promise<Card>;
  
  /**
   * 카드 데이터 생성
   * @param file Obsidian 파일
   * @returns 생성된 카드 데이터
   */
  createCardData(file: TFile): Promise<CardData>;
  
  /**
   * 카드 데이터 업데이트
   * @param card 업데이트할 카드
   * @returns 업데이트된 카드
   */
  updateCardData(card: Card): Promise<Card>;
  
  /**
   * 카드 ID로 카드 찾기
   * @param cardId 카드 ID
   * @returns 찾은 카드 또는 undefined
   */
  getCardById(cardId: string): Card | undefined;
  
  /**
   * 파일 경로로 카드 찾기
   * @param filePath 파일 경로
   * @returns 찾은 카드 또는 undefined
   */
  getCardByPath(filePath: string): Card | undefined;
  
  /**
   * 카드 캐시 초기화
   */
  clearCache(): void;
  
  /**
   * 카드 캐시 새로고침
   * @returns 새로고침된 카드 목록
   */
  refreshCache(): Promise<Card[]>;
  
  /**
   * 카드 목록 가져오기
   * @returns 현재 캐시된 카드 목록
   */
  getCards(): Card[];
} 