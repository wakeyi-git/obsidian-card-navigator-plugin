import { DomainEvent } from './DomainEvent';
import { IPreset } from '../models/Preset';

/**
 * 프리셋 생성 이벤트
 */
export class PresetCreatedEvent extends DomainEvent {
  constructor(public readonly preset: IPreset) {
    super('preset:created');
  }
}

/**
 * 프리셋 업데이트 이벤트
 */
export class PresetUpdatedEvent extends DomainEvent {
  constructor(public readonly preset: IPreset) {
    super('preset:updated');
  }
}

/**
 * 프리셋 삭제 이벤트
 */
export class PresetDeletedEvent extends DomainEvent {
  constructor(public readonly presetId: string) {
    super('preset:deleted');
  }
}

/**
 * 프리셋 적용 이벤트
 */
export class PresetAppliedEvent extends DomainEvent {
  constructor(public readonly preset: IPreset) {
    super('preset:applied');
  }
} 