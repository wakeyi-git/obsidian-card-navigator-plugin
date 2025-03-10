import { ICard } from '../card/Card';
import { 
  BatchActionType, 
  BatchActionHandler, 
  IBatchActionManager, 
  IBatchActionParams, 
  IBatchActionResult 
} from './BatchActions';

/**
 * 일괄 작업 관리자 클래스
 * 일괄 작업 관련 기능을 제공합니다.
 */
export class BatchActionManager implements IBatchActionManager {
  /**
   * 일괄 작업 핸들러 맵
   */
  private handlers: Map<BatchActionType, BatchActionHandler> = new Map();
  
  /**
   * 생성자
   */
  constructor() {
    // 기본 핸들러 등록
    this.registerDefaultHandlers();
  }
  
  /**
   * 기본 핸들러 등록
   */
  private registerDefaultHandlers(): void {
    // 여기에 기본 핸들러 등록 로직 구현
    // 실제 구현은 애플리케이션 레이어에서 수행
  }
  
  /**
   * 일괄 작업 실행
   * @param cards 대상 카드 목록
   * @param params 작업 매개변수
   * @returns 작업 결과
   */
  async executeBatchAction(cards: ICard[], params: IBatchActionParams): Promise<IBatchActionResult> {
    const { type } = params;
    
    // 핸들러 가져오기
    const handler = this.handlers.get(type);
    
    // 핸들러가 없는 경우
    if (!handler) {
      return {
        success: false,
        processedCount: 0,
        failedCount: cards.length,
        errorMessage: `지원되지 않는 일괄 작업 타입: ${type}`
      };
    }
    
    try {
      // 핸들러 실행
      return await handler(cards, params);
    } catch (error: unknown) {
      // 오류 처리
      const errorMessage = error instanceof Error 
        ? error.message 
        : '알 수 없는 오류가 발생했습니다';
        
      return {
        success: false,
        processedCount: 0,
        failedCount: cards.length,
        errorMessage: `일괄 작업 실행 중 오류 발생: ${errorMessage}`
      };
    }
  }
  
  /**
   * 일괄 작업 핸들러 등록
   * @param type 작업 타입
   * @param handler 핸들러 함수
   */
  registerBatchActionHandler(type: BatchActionType, handler: BatchActionHandler): void {
    this.handlers.set(type, handler);
  }
  
  /**
   * 일괄 작업 핸들러 제거
   * @param type 작업 타입
   */
  unregisterBatchActionHandler(type: BatchActionType): void {
    this.handlers.delete(type);
  }
  
  /**
   * 지원되는 일괄 작업 타입 목록 가져오기
   * @returns 지원되는 작업 타입 목록
   */
  getSupportedBatchActionTypes(): BatchActionType[] {
    return Array.from(this.handlers.keys());
  }
} 