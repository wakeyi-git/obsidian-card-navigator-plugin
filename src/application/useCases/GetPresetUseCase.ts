import { IUseCase } from './IUseCase';
import { IPresetManager } from '../../domain/managers/IPresetManager';
import { IPreset } from '../../domain/models/Preset';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 프리셋 조회 유즈케이스의 입력 데이터
 */
export interface GetPresetInput {
  /**
   * 조회할 프리셋 ID
   */
  presetId: string;
}

/**
 * 프리셋 조회 유즈케이스
 */
export class GetPresetUseCase implements IUseCase<GetPresetInput, IPreset> {
  private static instance: GetPresetUseCase;

  private constructor(
    private readonly presetManager: IPresetManager,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public static getInstance(): GetPresetUseCase {
    if (!GetPresetUseCase.instance) {
      const container = Container.getInstance();
      GetPresetUseCase.instance = new GetPresetUseCase(
        container.resolve<IPresetManager>('IPresetManager'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return GetPresetUseCase.instance;
  }

  async execute(input: GetPresetInput): Promise<IPreset> {
    const startTime = performance.now();
    const timer = this.performanceMonitor.startTimer('getPreset');
    this.loggingService.info('프리셋 조회 시작', { presetId: input.presetId });

    try {
      const preset = await this.presetManager.getPreset(input.presetId);
      if (!preset) {
        throw new Error(`프리셋을 찾을 수 없습니다: ${input.presetId}`);
      }

      // 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.PRESET_APPLIED,
        {
          preset
        }
      );
      this.eventDispatcher.dispatch(event);

      const duration = performance.now() - startTime;
      this.analyticsService.trackEvent('preset_get', {
        presetId: input.presetId,
        duration
      });

      this.loggingService.info('프리셋 조회 완료', { presetId: input.presetId });
      return preset;
    } catch (error) {
      this.errorHandler.handleError(error, '프리셋 조회 중 오류 발생');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 