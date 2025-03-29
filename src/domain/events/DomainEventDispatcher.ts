import { IDomainEvent } from './DomainEvent';
import { IDomainEventHandler } from './IDomainEventHandler';

/**
 * 도메인 이벤트 디스패처
 */
export class DomainEventDispatcher {
  private handlers: Map<string, IDomainEventHandler<IDomainEvent>[]> = new Map();
  private eventHistory: IDomainEvent[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;

  /**
   * 이벤트 핸들러를 등록합니다.
   */
  register<T extends IDomainEvent>(
    eventName: string,
    handler: IDomainEventHandler<T>
  ): void {
    console.debug(`[CardNavigator] 이벤트 핸들러 등록: ${eventName}`);
    
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)?.push(handler as IDomainEventHandler<IDomainEvent>);
  }

  /**
   * 이벤트를 디스패치합니다.
   */
  async dispatch(event: IDomainEvent): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.handlers.get(eventName) || [];

    console.debug(`[CardNavigator] 이벤트 디스패치 시작: ${eventName}`);
    
    // 이벤트 히스토리에 추가
    this.addToHistory(event);

    try {
      await Promise.all(
        handlers.map(async handler => {
          try {
            console.debug(`[CardNavigator] 핸들러 실행: ${handler.constructor.name}`);
            await handler.handle(event);
          } catch (error) {
            console.error(`[CardNavigator] 핸들러 실행 중 오류 발생: ${handler.constructor.name}`, error);
            throw error;
          }
        })
      );
      console.debug(`[CardNavigator] 이벤트 디스패치 완료: ${eventName}`);
    } catch (error) {
      console.error(`[CardNavigator] 이벤트 디스패치 중 오류 발생: ${eventName}`, error);
      throw error;
    }
  }

  /**
   * 모든 핸들러를 제거합니다.
   */
  clear(): void {
    console.debug('[CardNavigator] 모든 이벤트 핸들러 제거');
    this.handlers.clear();
    this.eventHistory = [];
  }

  /**
   * 이벤트 히스토리에 이벤트를 추가합니다.
   */
  private addToHistory(event: IDomainEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY_SIZE) {
      this.eventHistory.shift();
    }
  }

  /**
   * 이벤트 히스토리를 반환합니다.
   */
  getEventHistory(): IDomainEvent[] {
    return [...this.eventHistory];
  }
} 