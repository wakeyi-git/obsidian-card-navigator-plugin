import { ICard } from '../models/Card';
import { TFile } from 'obsidian';

/**
 * 컨텍스트 메뉴 액션 타입
 */
export enum ContextMenuActionType {
  /** 링크 복사 */
  COPY_LINK = 'COPY_LINK',
  /** 내용 복사 */
  COPY_CONTENT = 'COPY_CONTENT'
}

/**
 * 드래그 앤 드롭 타겟 타입
 */
export enum DragDropTargetType {
  /** 편집기 */
  EDITOR = 'EDITOR',
  /** 카드 */
  CARD = 'CARD'
}

/**
 * 드래그 앤 드롭 타겟
 */
export interface IDragDropTarget {
  /** 타겟 타입 */
  type: DragDropTargetType;
  /** 파일 */
  file?: TFile;
}

/**
 * 카드 상호작용 서비스 인터페이스
 */
export interface ICardInteractionService {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 파일 열기
   * @param file 파일
   */
  openFile(file: TFile): void;

  /**
   * 컨텍스트 메뉴 액션 실행
   * @param file 파일
   * @param action 액션 타입
   */
  executeContextMenuAction(file: TFile, action: ContextMenuActionType): void;

  /**
   * 드래그 앤 드롭 처리
   * @param sourceFile 소스 파일
   * @param target 드래그 앤 드롭 타겟
   */
  handleDragDrop(sourceFile: TFile, target: IDragDropTarget): void;

  /**
   * 인라인 편집 시작
   * @param file 파일
   */
  startInlineEdit(file: TFile): void;

  /**
   * 인라인 편집 종료
   */
  endInlineEdit(): void;

  /**
   * UI 업데이트
   */
  updateUI(): void;
} 