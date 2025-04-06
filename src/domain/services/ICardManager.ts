import { ICard } from '../models/Card';
import { TFile } from 'obsidian';

/**
 * 카드 관리자 인터페이스
 */
export interface ICardManager {
  /**
   * 파일로부터 카드 객체를 가져옵니다.
   * @param file 파일
   * @returns 카드 객체 또는 undefined
   */
  getCardByFile(file: TFile): ICard | undefined;

  /**
   * 카드 ID로부터 카드 객체를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 객체 또는 undefined
   */
  getCardById(cardId: string): ICard | undefined;

  /**
   * 모든 카드 객체를 가져옵니다.
   * @returns 카드 객체 배열
   */
  getAllCards(): ICard[];

  /**
   * 카드 객체를 생성합니다.
   * @param file 파일
   * @returns 카드 객체
   */
  createCard(file: TFile): ICard;

  /**
   * 카드 객체를 업데이트합니다.
   * @param card 카드 객체
   */
  updateCard(card: ICard): void;

  /**
   * 카드 객체를 삭제합니다.
   * @param cardId 카드 ID
   */
  deleteCard(cardId: string): void;
} 