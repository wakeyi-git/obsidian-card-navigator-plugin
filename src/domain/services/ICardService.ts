import { ICard } from '../models/Card';
import { ICardConfig } from '../models/CardConfig';
import { TFile } from 'obsidian';
import { ICardFactory } from '../factories/ICardFactory';

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드 팩토리를 설정합니다.
   * @param cardFactory 카드 팩토리
   */
  setCardFactory(cardFactory: ICardFactory): void;

  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @param config 카드 설정
   * @returns 생성된 카드
   */
  createCardFromFile(file: TFile, config: ICardConfig): Promise<ICard>;

  /**
   * 파일로부터 카드를 가져옵니다.
   * @param file 파일
   * @returns 카드 또는 null
   */
  getCardByFile(file: TFile): Promise<ICard | null>;

  /**
   * 카드 업데이트
   * @param card 업데이트할 카드
   * @param config 카드 설정
   * @returns 업데이트된 카드
   */
  updateCard(card: ICard, config: ICardConfig): Promise<ICard>;

  /**
   * 카드 삭제
   * @param card 삭제할 카드
   */
  deleteCard(card: ICard): Promise<void>;

  /**
   * 카드 유효성 검사
   * @param card 검사할 카드
   * @returns 유효성 여부
   */
  validateCard(card: ICard): boolean;
} 