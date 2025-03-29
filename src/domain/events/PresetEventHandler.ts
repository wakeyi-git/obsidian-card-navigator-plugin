import { IPresetService } from '../services/PresetService';
import { IDomainEventHandler } from './IDomainEventHandler';
import {
  PresetEvent,
  PresetCreatedEvent,
  PresetUpdatedEvent,
  PresetDeletedEvent,
  PresetMappingCreatedEvent,
  PresetMappingUpdatedEvent,
  PresetMappingDeletedEvent,
  PresetMappingPriorityUpdatedEvent,
  PresetImportedEvent,
  PresetExportedEvent
} from './PresetEvents';
import { IPresetConfig } from '../models/Preset';
import { Preset, IPreset, IPresetMapping } from '@/domain/models/Preset';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { App } from 'obsidian';

/**
 * 프리셋 이벤트 핸들러
 */
export class PresetEventHandler implements IDomainEventHandler<PresetEvent> {
  constructor(
    private readonly app: App,
    private readonly presetService: IPresetService,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {}

  /**
   * 이벤트를 처리합니다.
   */
  async handle(event: PresetEvent): Promise<void> {
    console.debug(`[CardNavigator] 이벤트 처리 시작: ${event.constructor.name}`);
    
    try {
      switch (event.constructor.name) {
        case 'PresetCreatedEvent':
          await this.handlePresetCreated(event as PresetCreatedEvent);
          break;
        case 'PresetUpdatedEvent':
          await this.handlePresetUpdated(event as PresetUpdatedEvent);
          break;
        case 'PresetDeletedEvent':
          await this.handlePresetDeleted(event as PresetDeletedEvent);
          break;
        case 'PresetMappingCreatedEvent':
          await this.handlePresetMappingCreated(event as PresetMappingCreatedEvent);
          break;
        case 'PresetMappingUpdatedEvent':
          await this.handlePresetMappingUpdated(event as PresetMappingUpdatedEvent);
          break;
        case 'PresetMappingDeletedEvent':
          await this.handlePresetMappingDeleted(event as PresetMappingDeletedEvent);
          break;
        case 'PresetMappingPriorityUpdatedEvent':
          await this.handlePresetMappingPriorityUpdated(event as PresetMappingPriorityUpdatedEvent);
          break;
        case 'PresetImportedEvent':
          await this.handlePresetImported(event as PresetImportedEvent);
          break;
        case 'PresetExportedEvent':
          await this.handlePresetExported(event as PresetExportedEvent);
          break;
        default:
          console.warn(`[CardNavigator] 알 수 없는 이벤트 타입: ${event.constructor.name}`);
      }
    } catch (error) {
      console.error(`[CardNavigator] 이벤트 처리 중 오류 발생: ${event.constructor.name}`, error);
      throw error;
    }
  }

  /**
   * IPreset을 Preset으로 변환합니다.
   */
  private convertToPreset(preset: IPreset): Preset {
    const newPreset = new Preset(
      preset.id,
      preset.name,
      preset.description,
      preset.cardSetConfig,
      preset.layoutConfig,
      preset.cardRenderConfig
    );

    // 기존 매핑들을 새 프리셋에 추가
    preset.mappings.forEach(mapping => {
      newPreset.addMapping(mapping);
    });

    return newPreset;
  }

  /**
   * 프리셋 생성 이벤트 처리
   */
  private async handlePresetCreated(event: PresetCreatedEvent): Promise<void> {
    const preset = this.convertToPreset(event.preset);
    this.eventDispatcher.dispatch(new PresetCreatedEvent(preset));
  }

  /**
   * 프리셋 업데이트 이벤트 처리
   */
  private async handlePresetUpdated(event: PresetUpdatedEvent): Promise<void> {
    const preset = this.convertToPreset(event.preset);
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 프리셋 삭제 이벤트 처리
   */
  private async handlePresetDeleted(event: PresetDeletedEvent): Promise<void> {
    const presetId = event.presetId;
    this.eventDispatcher.dispatch(new PresetDeletedEvent(presetId));
  }

  /**
   * 프리셋 매핑 생성 이벤트 처리
   */
  private async handlePresetMappingCreated(event: PresetMappingCreatedEvent): Promise<void> {
    const preset = await this.presetService.getPreset(event.presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${event.presetId}`);
    }

    this.eventDispatcher.dispatch(new PresetMappingCreatedEvent(preset.id, event.mapping));
  }

  /**
   * 프리셋 매핑 업데이트 이벤트 처리
   */
  private async handlePresetMappingUpdated(event: PresetMappingUpdatedEvent): Promise<void> {
    const preset = await this.presetService.getPreset(event.presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${event.presetId}`);
    }

    this.eventDispatcher.dispatch(new PresetMappingUpdatedEvent(preset.id, event.mapping));
  }

  /**
   * 프리셋 매핑 삭제 이벤트 처리
   */
  private async handlePresetMappingDeleted(event: PresetMappingDeletedEvent): Promise<void> {
    const preset = await this.presetService.getPreset(event.presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${event.presetId}`);
    }

    this.eventDispatcher.dispatch(new PresetMappingDeletedEvent(preset.id, event.mappingId));
  }

  /**
   * 프리셋 매핑 우선순위 업데이트 이벤트 처리
   */
  private async handlePresetMappingPriorityUpdated(event: PresetMappingPriorityUpdatedEvent): Promise<void> {
    const preset = await this.presetService.getPreset(event.presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${event.presetId}`);
    }

    this.eventDispatcher.dispatch(new PresetMappingPriorityUpdatedEvent(preset.id, event.priority));
  }

  /**
   * 프리셋 가져오기 이벤트 처리
   */
  private async handlePresetImported(event: PresetImportedEvent): Promise<void> {
    const preset = this.convertToPreset(event.preset);
    const config: IPresetConfig = {
      name: preset.name,
      description: preset.description,
      cardSetConfig: preset.cardSetConfig,
      layoutConfig: preset.layoutConfig,
      cardRenderConfig: preset.cardRenderConfig,
      mappings: preset.mappings
    };
    await this.presetService.createPreset(config);
  }

  /**
   * 프리셋 내보내기 이벤트 처리
   */
  private async handlePresetExported(event: PresetExportedEvent): Promise<void> {
    const preset = this.convertToPreset(event.preset);
    await this.presetService.updatePreset(preset);
  }
} 