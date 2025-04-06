import { DomainEvent } from './DomainEvent';
import { IPreset } from '../models/Preset';
import { DomainEventType } from './DomainEventType';

/**
 * 프리셋 생성 이벤트
 */
export class PresetCreatedEvent extends DomainEvent<typeof DomainEventType.PRESET_CREATED> {
  constructor(preset: IPreset) {
    super(DomainEventType.PRESET_CREATED, { preset });
  }
}

/**
 * 프리셋 업데이트 이벤트
 */
export class PresetUpdatedEvent extends DomainEvent<typeof DomainEventType.PRESET_UPDATED> {
  constructor(preset: IPreset) {
    super(DomainEventType.PRESET_UPDATED, { preset });
  }
}

/**
 * 프리셋 삭제 이벤트
 */
export class PresetDeletedEvent extends DomainEvent<typeof DomainEventType.PRESET_DELETED> {
  constructor(preset: IPreset) {
    super(DomainEventType.PRESET_DELETED, { preset });
  }
}

/**
 * 프리셋 적용 이벤트
 */
export class PresetAppliedEvent extends DomainEvent<typeof DomainEventType.PRESET_APPLIED> {
  constructor(preset: IPreset) {
    super(DomainEventType.PRESET_APPLIED, { preset });
  }
} 