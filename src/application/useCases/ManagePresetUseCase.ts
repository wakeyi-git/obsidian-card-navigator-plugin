import { IUseCase } from './IUseCase';
import { IPresetManager } from '../../domain/managers/IPresetManager';
import { IPreset } from '../../domain/models/Preset';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DEFAULT_SEARCH_CONFIG } from '@/domain/models/SearchConfig';
import { DEFAULT_SORT_CONFIG } from '@/domain/models/SortConfig';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

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
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public static getInstance(): ManagePresetUseCase {
    if (!ManagePresetUseCase.instance) {
      const container = Container.getInstance();
      ManagePresetUseCase.instance = new ManagePresetUseCase(
        container.resolve<IPresetManager>('IPresetManager'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return ManagePresetUseCase.instance;
  }

  async execute(input: ManagePresetInput): Promise<IPreset | void> {
    const startTime = performance.now();
    const timer = this.performanceMonitor.startTimer('managePreset');
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
                cardConfig: input.preset.config.cardConfig,
                cardSetConfig: input.preset.config.cardSetConfig,
                searchConfig: input.preset.config.searchConfig || DEFAULT_SEARCH_CONFIG,
                sortConfig: input.preset.config.sortConfig || DEFAULT_SORT_CONFIG,
                layoutConfig: input.preset.config.layoutConfig
              }
            );

            // 이벤트 발송
            if (result !== undefined) {
              const event = new DomainEvent(
                DomainEventType.PRESET_CREATED,
                {
                  preset: result
                }
              );
              this.eventDispatcher.dispatch(event);
            }
          }
          break;

        case 'update':
          if (input.preset) {
            result = await this.presetManager.updatePreset(input.preset);

            // 이벤트 발송
            if (result !== undefined) {
              const event = new DomainEvent(
                DomainEventType.PRESET_UPDATED,
                {
                  preset: result
                }
              );
              this.eventDispatcher.dispatch(event);
            }
          }
          break;

        case 'delete':
          if (input.preset) {
            await this.presetManager.deletePreset(input.preset.metadata.id);

            // 이벤트 발송
            const event = new DomainEvent(
              DomainEventType.PRESET_DELETED,
              {
                preset: input.preset
              }
            );
            this.eventDispatcher.dispatch(event);
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
                  cardConfig: clonedPreset.config.cardConfig,
                  cardSetConfig: clonedPreset.config.cardSetConfig,
                  searchConfig: clonedPreset.config.searchConfig || DEFAULT_SEARCH_CONFIG,
                  sortConfig: clonedPreset.config.sortConfig || DEFAULT_SORT_CONFIG,
                  layoutConfig: clonedPreset.config.layoutConfig
                }
              );

              // 이벤트 발송
              if (result !== undefined) {
                const event = new DomainEvent(
                  DomainEventType.PRESET_CREATED,
                  {
                    preset: result
                  }
                );
                this.eventDispatcher.dispatch(event);
              }
            }
          }
          break;

        case 'export':
          if (input.preset) {
            const presetJson = await this.presetManager.exportPreset(input.preset.metadata.id);
            result = await this.presetManager.importPreset(presetJson);

            // 이벤트 발송
            if (result !== undefined) {
              const event = new DomainEvent(
                DomainEventType.PRESET_CREATED,
                {
                  preset: result
                }
              );
              this.eventDispatcher.dispatch(event);
            }
          }
          break;
      }

      const duration = performance.now() - startTime;
      this.analyticsService.trackEvent('preset_managed', {
        type: input.type,
        duration
      });

      this.loggingService.info('프리셋 관리 완료', { type: input.type });
      return result;
    } catch (error) {
      this.errorHandler.handleError(error, '프리셋 관리 중 오류 발생');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 