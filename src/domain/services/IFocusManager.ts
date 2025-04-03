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
 * 포커스 매니저 인터페이스
 */
export interface IFocusManager {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 파일로 포커스 설정
   * @param file 파일
   */
  focusByFile(file: TFile): void;

  /**
   * 카드로 포커스 설정
   * @param card 카드
   */
  focusByCard(card: ICard): void;

  /**
   * 방향으로 포커스 이동
   * @param direction 방향
   */
  moveFocus(direction: FocusDirection): void;

  /**
   * 현재 포커스된 카드 조회
   */
  getFocusedCard(): ICard | null;

  /**
   * 현재 포커스된 파일 조회
   */
  getFocusedFile(): TFile | null;

  /**
   * 포커스된 카드를 뷰포트 중앙에 위치
   */
  centerFocusedCard(): void;

  /**
   * 포커스 UI 업데이트
   */
  updateFocusUI(): void;
} 