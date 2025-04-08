import { ICard } from '../../models/Card';
import { TFile } from 'obsidian';

/**
 * 선택 타입
 */
export enum SelectionType {
  /** 단일 선택 */
  SINGLE = 'SINGLE',
  /** 범위 선택 */
  RANGE = 'RANGE',
  /** 토글 선택 */
  TOGGLE = 'TOGGLE',
  /** 전체 선택 */
  ALL = 'ALL'
}

/**
 * 카드 선택 서비스 인터페이스
 */
export interface ICardSelectionService {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 카드 선택
   * @param file 파일
   */
  selectCard(file: TFile): void;

  /**
   * 카드 범위 선택
   * @param file 파일
   */
  selectRange(file: TFile): void;

  /**
   * 카드 선택 토글
   * @param file 파일
   */
  toggleCardSelection(file: TFile): void;

  /**
   * 모든 카드 선택
   */
  selectAllCards(): void;

  /**
   * 선택 해제
   */
  clearSelection(): void;

  /**
   * 선택된 카드 목록 조회
   */
  getSelectedCards(): ICard[];

  /**
   * 선택된 파일 목록 조회
   */
  getSelectedFiles(): TFile[];

  /**
   * 선택된 카드 수 조회
   */
  getSelectedCount(): number;

  /**
   * 선택 UI 업데이트
   */
  updateSelectionUI(): void;
} 