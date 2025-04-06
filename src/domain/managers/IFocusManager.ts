import { ICard } from '../models/Card';
import { TFile } from 'obsidian';

/**
 * 포커스 방향
 */
export enum FocusDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

/**
 * 포커스 관리자 인터페이스
 */
export interface IFocusManager {
  /**
   * 초기화
   */
  initialize(): Promise<void>;

  /**
   * 정리
   */
  cleanup(): Promise<void>;

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean;

  /**
   * 파일로 포커스 설정
   * @param file 파일
   */
  focusByFile(file: TFile): Promise<void>;

  /**
   * 카드로 포커스 설정
   * @param card 카드
   */
  focusCard(card: ICard): Promise<void>;

  /**
   * 방향으로 포커스 이동
   * @param direction 방향
   */
  moveFocus(direction: FocusDirection): Promise<void>;

  /**
   * 포커스된 카드 반환
   * @returns 포커스된 카드
   */
  getFocusedCard(): ICard | null;
} 