import { IUseCase } from './IUseCase';
import { IPresetManager } from '../../domain/managers/IPresetManager';
import { IPreset } from '../../domain/models/Preset';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DEFAULT_SEARCH_FILTER } from '@/domain/models/SearchFilter';
import { DEFAULT_SORT_CONFIG } from '@/domain/models/SortConfig';

/**
 * 프리셋 관리 유즈케이스의 입력 데이터
 */
export interface ManagePresetInput {
  /**
   * 프리셋 관리 타입
   */
  type: 'create' | 'update' | 'delete' | 'clone' | 'export';

  /**
   * 프리셋 데이터
   * - create: 새로운 프리셋 생성
   * - update: 기존 프리셋 업데이트
   * - delete: 프리셋 삭제
   * - clone: 프리셋 복제
   * - export: 프리셋 내보내기
   */
  preset?: IPreset;
}

/**
 * 프리셋 관리 유즈케이스
 */
export class ManagePresetUseCase implements IUseCase<ManagePresetInput, IPreset | void> {
  private static instance: ManagePresetUseCase;

  private constructor(
    private readonly presetManager: IPresetManager,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  public static getInstance(): ManagePresetUseCase {
    if (!ManagePresetUseCase.instance) {
      const container = Container.getInstance();
      ManagePresetUseCase.instance = new ManagePresetUseCase(
        container.resolve<IPresetManager>('IPresetManager'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService')
      );
    }
    return ManagePresetUseCase.instance;
  }

  async execute(input: ManagePresetInput): Promise<IPreset | void> {
    const startTime = performance.now();
    this.loggingService.info('프리셋 관리 시작', { type: input.type });

    try {
      let result: IPreset | void = undefined;

      switch (input.type) {
        case 'create':
          if (input.preset) {
            result = await this.presetManager.createPreset(
              input.preset.metadata.name,
              input.preset.metadata.description || '',
              {
                renderConfig: input.preset.config.cardRenderConfig,
                cardStyle: input.preset.config.cardStyle,
                searchFilter: input.preset.config.cardSetConfig.searchFilter || DEFAULT_SEARCH_FILTER,
                sortConfig: input.preset.config.cardSetConfig.sortConfig || DEFAULT_SORT_CONFIG
              }
            );
          }
          break;

        case 'update':
          if (input.preset) {
            result = await this.presetManager.updatePreset(input.preset);
          }
          break;

        case 'delete':
          if (input.preset) {
            await this.presetManager.deletePreset(input.preset.metadata.id);
          }
          break;

        case 'clone':
          if (input.preset) {
            const clonedPreset = await this.presetManager.getPreset(input.preset.metadata.id);
            if (clonedPreset) {
              result = await this.presetManager.createPreset(
                `${clonedPreset.metadata.name} (복사본)`,
                clonedPreset.metadata.description || '',
                {
                  renderConfig: clonedPreset.config.cardRenderConfig,
                  cardStyle: clonedPreset.config.cardStyle,
                  searchFilter: clonedPreset.config.cardSetConfig.searchFilter || DEFAULT_SEARCH_FILTER,
                  sortConfig: clonedPreset.config.cardSetConfig.sortConfig || DEFAULT_SORT_CONFIG
                }
              );
            }
          }
          break;

        case 'export':
          if (input.preset) {
            const presetJson = await this.presetManager.exportPreset(input.preset.metadata.id);
            result = await this.presetManager.importPreset(presetJson);
          }
          break;
      }

      const duration = performance.now() - startTime;
      this.performanceMonitor.startMeasure('managePreset');
      this.performanceMonitor.endMeasure('managePreset');
      this.analyticsService.trackEvent('preset_managed', {
        type: input.type,
        duration
      });

      this.loggingService.info('프리셋 관리 완료', { type: input.type });
      return result;
    } catch (error) {
      this.errorHandler.handleError(error, '프리셋 관리 중 오류 발생');
      throw error;
    }
  }
} 