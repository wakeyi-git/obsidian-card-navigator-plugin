import { DomainEvent } from './DomainEvent';
import { IPreset, IPresetMapping } from '../models/Preset';

/**
 * 프리셋 이벤트 타입
 */
export type PresetEvent =
  | PresetCreatedEvent
  | PresetUpdatedEvent
  | PresetDeletedEvent
  | PresetMappingCreatedEvent
  | PresetMappingUpdatedEvent
  | PresetMappingDeletedEvent
  | PresetMappingPriorityUpdatedEvent
  | PresetImportedEvent
  | PresetExportedEvent;

/**
 * 프리셋 이벤트 타입 열거형
 */
export enum PresetEventType {
    PRESET_CREATED = 'PRESET_CREATED',
    PRESET_UPDATED = 'PRESET_UPDATED',
    PRESET_DELETED = 'PRESET_DELETED',
    PRESET_MAPPING_CREATED = 'PRESET_MAPPING_CREATED',
    PRESET_MAPPING_UPDATED = 'PRESET_MAPPING_UPDATED',
    PRESET_MAPPING_DELETED = 'PRESET_MAPPING_DELETED',
    PRESET_MAPPING_PRIORITY_UPDATED = 'PRESET_MAPPING_PRIORITY_UPDATED',
    PRESET_IMPORTED = 'PRESET_IMPORTED',
    PRESET_EXPORTED = 'PRESET_EXPORTED'
}

/**
 * 프리셋 생성 이벤트
 */
export class PresetCreatedEvent extends DomainEvent {
  constructor(public readonly preset: IPreset) {
    super(PresetEventType.PRESET_CREATED);
  }
}

/**
 * 프리셋 업데이트 이벤트
 */
export class PresetUpdatedEvent extends DomainEvent {
  constructor(public readonly preset: IPreset) {
    super(PresetEventType.PRESET_UPDATED);
  }
}

/**
 * 프리셋 삭제 이벤트
 */
export class PresetDeletedEvent extends DomainEvent {
  constructor(public readonly presetId: string) {
    super(PresetEventType.PRESET_DELETED);
  }
}

/**
 * 프리셋 매핑 생성 이벤트
 */
export class PresetMappingCreatedEvent extends DomainEvent {
  constructor(
    public readonly presetId: string,
    public readonly mapping: IPresetMapping
  ) {
    super(PresetEventType.PRESET_MAPPING_CREATED);
  }
}

/**
 * 프리셋 매핑 업데이트 이벤트
 */
export class PresetMappingUpdatedEvent extends DomainEvent {
  constructor(
    public readonly presetId: string,
    public readonly mapping: IPresetMapping
  ) {
    super(PresetEventType.PRESET_MAPPING_UPDATED);
  }
}

/**
 * 프리셋 매핑 삭제 이벤트
 */
export class PresetMappingDeletedEvent extends DomainEvent {
  constructor(
    public readonly presetId: string,
    public readonly mappingId: string
  ) {
    super(PresetEventType.PRESET_MAPPING_DELETED);
  }
}

/**
 * 프리셋 매핑 우선순위 업데이트 이벤트
 */
export class PresetMappingPriorityUpdatedEvent extends DomainEvent {
  constructor(
    public readonly presetId: string,
    public readonly priority: number
  ) {
    super(PresetEventType.PRESET_MAPPING_PRIORITY_UPDATED);
  }
}

/**
 * 프리셋 가져오기 이벤트
 */
export class PresetImportedEvent extends DomainEvent {
  constructor(public readonly preset: IPreset) {
    super(PresetEventType.PRESET_IMPORTED);
  }
}

/**
 * 프리셋 내보내기 이벤트
 */
export class PresetExportedEvent extends DomainEvent {
  constructor(public readonly preset: IPreset) {
    super(PresetEventType.PRESET_EXPORTED);
  }
} 