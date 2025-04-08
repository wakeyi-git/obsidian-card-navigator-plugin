import { TFile } from 'obsidian';
import { ICard } from '../../models/Card';

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
 * 포커스 서비스 인터페이스
 * 
 * 포커스 조작을 담당하는 서비스
 */
export interface IFocusService {
  /**
   * 초기화
   */
  initialize(): Promise<void>;

  /**
   * 정리
   */
  cleanup(): Promise<void>;

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

  /**
   * 포커스 이벤트 구독
   * @param callback 이벤트 콜백
   */
  subscribeToFocusEvents(callback: (event: {
    type: 'focus' | 'blur';
    card: ICard;
    previousCard?: ICard;
  }) => void): void;

  /**
   * 포커스 이벤트 구독 해제
   * @param callback 이벤트 콜백
   */
  unsubscribeFromFocusEvents(callback: (event: {
    type: 'focus' | 'blur';
    card: ICard;
    previousCard?: ICard;
  }) => void): void;
} 