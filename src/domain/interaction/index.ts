/**
 * 선택 관련 타입
 */
export type {
  SelectionMode,
  ISelectionState,
  ISelectionManager
} from './selection/Selection';

/**
 * 배치 작업 관련 타입
 */
export type {
  BatchActionType,
  IBatchActionParams,
  IBatchActionResult,
  IBatchActionCardResult,
  IBatchActionAdditionalData,
  IBatchActionResultData,
  IBatchActionHandler
} from './batch/BatchAction';

export type { IBatchActionRegistry } from './batch/BatchActionRegistry';
export { BatchActionRegistry } from './batch/BatchActionRegistry';

/**
 * 이벤트 관련 타입 재내보내기
 */
export {
  EventType,
  type IEventPayloads,
  type BaseEventPayload
} from '../../core/events/EventTypes';

export {
  type IEventBus,
  type EventHandler,
  type IEventSubscription
} from '../../core/events/DomainEvent';

export { DomainEventBus } from '../../core/events/DomainEventBus';
