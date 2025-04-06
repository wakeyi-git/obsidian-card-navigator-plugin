import { IUseCase } from './IUseCase';
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
 * 프리셋 적용 유즈케이스의 입력 데이터
 */
export interface ApplyPresetInput {
  /**
   * 적용할 프리셋
   */
  preset: IPreset;
}

/**
 * 프리셋 적용 유즈케이스
 */
export class ApplyPresetUseCase implements IUseCase<ApplyPresetInput, IPreset> {
  private static instance: ApplyPresetUseCase;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public static getInstance(): ApplyPresetUseCase {
    if (!ApplyPresetUseCase.instance) {
      const container = Container.getInstance();
      ApplyPresetUseCase.instance = new ApplyPresetUseCase(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return ApplyPresetUseCase.instance;
  }

  async execute(input: ApplyPresetInput): Promise<IPreset> {
    const startTime = performance.now();
    const timer = this.performanceMonitor.startTimer('applyPreset');
    this.loggingService.info('프리셋 적용 시작', { presetId: input.preset.metadata.id });

    try {
      // 1. 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.PRESET_APPLIED,
        {
          preset: input.preset
        }
      );
      this.eventDispatcher.dispatch(event);

      const duration = performance.now() - startTime;
      this.analyticsService.trackEvent('preset_applied', {
        presetId: input.preset.metadata.id,
        duration
      });

      this.loggingService.info('프리셋 적용 완료', { presetId: input.preset.metadata.id });
      return input.preset;
    } catch (error) {
      this.errorHandler.handleError(error, '프리셋 적용 중 오류 발생');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 