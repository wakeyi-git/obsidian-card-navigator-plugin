import { DomainEvent } from './DomainEvent';

/**
 * 이벤트 핸들러 타입
 */
export type EventHandler = (event: DomainEvent) => Promise<void>; 