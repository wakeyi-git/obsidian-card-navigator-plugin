import { BatchActionType, IBatchActionHandler } from './BatchAction';

/**
 * 배치 작업 레지스트리 인터페이스
 */
export interface IBatchActionRegistry {
  /**
   * 배치 작업 핸들러 등록
   */
  register(handler: IBatchActionHandler): void;

  /**
   * 배치 작업 핸들러 제거
   */
  unregister(type: BatchActionType): void;

  /**
   * 배치 작업 핸들러 조회
   */
  getHandler(type: BatchActionType): IBatchActionHandler | undefined;

  /**
   * 등록된 모든 핸들러 조회
   */
  getAllHandlers(): IBatchActionHandler[];

  /**
   * 특정 타입의 핸들러 존재 여부 확인
   */
  hasHandler(type: BatchActionType): boolean;
}

/**
 * 배치 작업 레지스트리 구현
 */
export class BatchActionRegistry implements IBatchActionRegistry {
  private handlers: Map<BatchActionType, IBatchActionHandler> = new Map();

  /**
   * 배치 작업 핸들러 등록
   */
  register(handler: IBatchActionHandler): void {
    const type = handler.getActionType();
    if (this.handlers.has(type)) {
      throw new Error(`Handler for action type '${type}' is already registered`);
    }
    this.handlers.set(type, handler);
  }

  /**
   * 배치 작업 핸들러 제거
   */
  unregister(type: BatchActionType): void {
    this.handlers.delete(type);
  }

  /**
   * 배치 작업 핸들러 조회
   */
  getHandler(type: BatchActionType): IBatchActionHandler | undefined {
    return this.handlers.get(type);
  }

  /**
   * 등록된 모든 핸들러 조회
   */
  getAllHandlers(): IBatchActionHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * 특정 타입의 핸들러 존재 여부 확인
   */
  hasHandler(type: BatchActionType): boolean {
    return this.handlers.has(type);
  }
} 