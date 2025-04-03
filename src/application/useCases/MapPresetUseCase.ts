import { IUseCase } from './IUseCase';
import { IPresetManager } from '../../domain/managers/IPresetManager';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

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
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): MapPresetUseCase {
    if (!MapPresetUseCase.instance) {
      const container = Container.getInstance();
      MapPresetUseCase.instance = new MapPresetUseCase(
        container.resolve('IPresetManager'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return MapPresetUseCase.instance;
  }

  /**
   * 프리셋 매핑
   * @param input 입력
   */
  async execute(input: MapPresetInput): Promise<void> {
    const perfMark = 'MapPresetUseCase.execute';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 매핑 시작', { input });

      switch (input.type) {
        case 'folder':
          await this.presetManager.mapPresetToFolder(input.value, input.presetId);
          break;
        case 'tag':
          await this.presetManager.mapPresetToTag(input.value, input.presetId);
          break;
      }

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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 