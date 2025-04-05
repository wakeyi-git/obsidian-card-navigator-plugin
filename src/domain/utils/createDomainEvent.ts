import { IDomainEvent } from '../events/DomainEvent';
import { DomainEventType } from '../events/DomainEventType';
import { SimpleEvent } from '../events/BaseEvent';

/**
 * 도메인 이벤트 생성 헬퍼 함수
 * @param eventName 이벤트 이름
 * @param type 이벤트 타입
 * @param data 이벤트 데이터
 * @returns 생성된 도메인 이벤트
 */
export function createDomainEvent<T = any>(
  eventName: string,
  type: DomainEventType,
  data: T
): IDomainEvent<T> {
  return new SimpleEvent<T>(eventName, type, data);
}

/**
 * 카드 관련 도메인 이벤트 생성 헬퍼 함수
 * @param eventName 이벤트 이름
 * @param type 이벤트 타입
 * @param cardId 카드 ID
 * @param metadata 추가 메타데이터
 * @returns 생성된 도메인 이벤트
 */
export function createCardEvent(
  eventName: string,
  type: DomainEventType,
  cardId: string,
  metadata: Record<string, any> = {}
): IDomainEvent<Record<string, any>> {
  return createDomainEvent(eventName, type, {
    cardId,
    ...metadata
  });
}

/**
 * 카드셋 관련 도메인 이벤트 생성 헬퍼 함수
 * @param eventName 이벤트 이름
 * @param type 이벤트 타입
 * @param cardSetId 카드셋 ID
 * @param metadata 추가 메타데이터
 * @returns 생성된 도메인 이벤트
 */
export function createCardSetEvent(
  eventName: string,
  type: DomainEventType,
  cardSetId: string,
  metadata: Record<string, any> = {}
): IDomainEvent<Record<string, any>> {
  return createDomainEvent(eventName, type, {
    cardSetId,
    ...metadata
  });
}

/**
 * 레이아웃 관련 도메인 이벤트 생성 헬퍼 함수
 * @param eventName 이벤트 이름
 * @param type 이벤트 타입
 * @param layoutConfig 레이아웃 설정
 * @returns 생성된 도메인 이벤트
 */
export function createLayoutEvent<T = any>(
  eventName: string,
  type: DomainEventType,
  layoutConfig: T
): IDomainEvent<T> {
  return createDomainEvent(eventName, type, layoutConfig);
} 