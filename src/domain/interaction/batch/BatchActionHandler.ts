import { ICard } from '../../card/Card';
import { IBatchActionParams, IBatchActionResult } from './BatchActionTypes';

/**
 * 일괄 작업 핸들러 인터페이스
 * 각 일괄 작업 타입에 대한 구체적인 처리를 담당합니다.
 */
export interface IBatchActionHandler {
  /**
   * 일괄 작업 처리
   * @param cards 대상 카드 목록
   * @param params 작업 매개변수
   * @returns 작업 결과
   */
  handle(cards: ICard[], params: IBatchActionParams): Promise<IBatchActionResult>;
  
  /**
   * 작업 처리 가능 여부 확인
   * @param cards 대상 카드 목록
   * @returns 처리 가능 여부
   */
  canHandle(cards: ICard[]): boolean;
  
  /**
   * 작업 취소
   * 진행 중인 작업을 취소합니다.
   */
  cancel?(): void;
  
  /**
   * 작업 진행률 콜백 설정
   * @param callback 진행률 콜백 함수
   */
  setProgressCallback?(callback: (progress: number) => void): void;
} 