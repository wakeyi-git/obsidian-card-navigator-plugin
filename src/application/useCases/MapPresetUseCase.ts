import { IUseCase } from './IUseCase';
import { IPresetManager } from '../../domain/managers/IPresetManager';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IPreset } from '@/domain/models/Preset';

/**
 * 프리셋 매핑 유스케이스 입력
 */
export interface MapPresetInput {
  /** 매핑 타입 */
  type: 'folder' | 'tag';
  /** 매핑 값 */
  value: string;
  /** 프리셋 ID */
  presetId: string;
  /** 하위 폴더 포함 여부 */
  includeSubfolders?: boolean;
}

/**
 * 프리셋 매핑 유스케이스
 */
export class MapPresetUseCase implements IUseCase<MapPresetInput, void> {
  private static instance: MapPresetUseCase;

  private constructor(
    private readonly presetManager: IPresetManager,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): MapPresetUseCase {
    if (!MapPresetUseCase.instance) {
      const container = Container.getInstance();
      MapPresetUseCase.instance = new MapPresetUseCase(
        container.resolve('IPresetManager'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return MapPresetUseCase.instance;
  }

  /**
   * 프리셋 매핑
   * @param input 입력
   */
  async execute(input: MapPresetInput): Promise<void> {
    const timer = this.performanceMonitor.startTimer('MapPresetUseCase.execute');
    try {
      this.loggingService.debug('프리셋 매핑 시작', { input });

      let preset: IPreset | null = null;
      switch (input.type) {
        case 'folder':
          await this.presetManager.mapPresetToFolder(input.value, input.presetId);
          preset = await this.presetManager.getPreset(input.presetId);
          break;
        case 'tag':
          await this.presetManager.mapPresetToTag(input.value, input.presetId);
          preset = await this.presetManager.getPreset(input.presetId);
          break;
      }

      if (!preset) {
        throw new Error(`프리셋을 찾을 수 없습니다: ${input.presetId}`);
      }

      // 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.PRESET_APPLIED,
        { preset }
      );
      this.eventDispatcher.dispatch(event);

      this.analyticsService.trackEvent('preset_mapped', {
        type: input.type,
        value: input.value,
        presetId: input.presetId
      });

      this.loggingService.info('프리셋 매핑 완료', { input });
    } catch (error) {
      this.loggingService.error('프리셋 매핑 실패', { error, input });
      this.errorHandler.handleError(error as Error, 'MapPresetUseCase.execute');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 