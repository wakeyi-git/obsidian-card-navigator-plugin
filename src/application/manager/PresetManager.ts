import { IPreset, IPresetMapping, PresetMappingType } from '../../domain/models/Preset';
import { ICardConfig } from '../../domain/models/CardConfig';
import { ICardSetConfig } from '../../domain/models/CardSetConfig';
import { ILayoutConfig } from '../../domain/models/LayoutConfig';
import { ISearchConfig } from '../../domain/models/SearchConfig';
import { ISortConfig } from '../../domain/models/SortConfig';
import { IPresetManager } from '../../domain/managers/IPresetManager';
import { PresetServiceError } from '../../domain/errors/PresetServiceError';
import { PresetCreatedEvent, PresetUpdatedEvent, PresetDeletedEvent, PresetAppliedEvent } from '../../domain/events/PresetEvents';
import { App } from 'obsidian';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { IPresetService } from '@/domain/services/IPresetService';

/**
 * 프리셋 관리자 구현체
 */
export class PresetManager implements IPresetManager {
  private static instance: PresetManager;
  private presetService: IPresetService;
  private errorHandler: IErrorHandler;
  private loggingService: ILoggingService;
  private performanceMonitor: IPerformanceMonitor;
  private analyticsService: IAnalyticsService;
  private eventDispatcher: IEventDispatcher;
  private app: App;

  private constructor() {
    const container = Container.getInstance();
    this.presetService = container.resolve<IPresetService>('IPresetService');
    this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
    this.loggingService = container.resolve<ILoggingService>('ILoggingService');
    this.performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
    this.analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
    this.eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
    this.app = container.resolve<App>('App');
  }

  public static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager();
    }
    return PresetManager.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const timer = this.performanceMonitor.startTimer('PresetManager.initialize');
    try {
      this.loggingService.debug('프리셋 관리자 초기화 시작');
      
      this.presetService.initialize();

      this.loggingService.info('프리셋 관리자 초기화 완료');
    } catch (error) {
      this.loggingService.error('프리셋 관리자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.initialize');
      throw new PresetServiceError(
        '프리셋 관리자 초기화 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'initialize',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('PresetManager.cleanup');
    try {
      this.loggingService.debug('프리셋 관리자 정리 시작');
      this.initialize();
      this.loggingService.info('프리셋 관리자 정리 완료');
    } catch (error) {
      this.loggingService.error('프리셋 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.cleanup');
      throw new PresetServiceError(
        '프리셋 관리자 정리 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'cleanup',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param config 프리셋 설정
   */
  async createPreset(
    name: string,
    description: string,
    config: {
      cardConfig: ICardConfig;
      cardSetConfig: ICardSetConfig;
      layoutConfig: ILayoutConfig;
      sortConfig: ISortConfig;
      searchConfig: ISearchConfig;
    }
  ): Promise<IPreset> {
    const timer = this.performanceMonitor.startTimer('PresetManager.createPreset');
    try {
      this.loggingService.debug('프리셋 생성 시작');

      const preset = await this.presetService.createPreset(
        name,
        description,
        'default',
        config.cardConfig,
        config.cardSetConfig,
        config.layoutConfig,
        config.sortConfig,
        config.searchConfig
      );

      this.eventDispatcher.dispatch(new PresetCreatedEvent(preset));

      this.analyticsService.trackEvent('preset_created', {
        presetId: preset.metadata.id,
        name: preset.metadata.name,
        description
      });

      this.loggingService.info('프리셋 생성 완료', { presetId: preset.metadata.id });
      return preset;
    } catch (error) {
      this.loggingService.error('프리셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.createPreset');
      throw new PresetServiceError(
        '프리셋 생성 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'create',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 수정
   * @param preset 프리셋
   */
  async updatePreset(preset: IPreset): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.updatePreset');
    try {
      this.loggingService.debug('프리셋 업데이트 시작');

      await this.presetService.updatePreset(
        preset,
        preset.config.cardConfig,
        preset.config.cardSetConfig,
        preset.config.layoutConfig,
        preset.config.sortConfig,
        preset.config.searchConfig
      );

      this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));

      this.analyticsService.trackEvent('preset_updated', {
        presetId: preset.metadata.id,
        name: preset.metadata.name
      });

      this.loggingService.info('프리셋 업데이트 완료', { presetId: preset.metadata.id });
    } catch (error) {
      this.loggingService.error('프리셋 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.updatePreset');
      throw new PresetServiceError(
        '프리셋 업데이트 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'update',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 삭제
   * @param presetId 프리셋 ID
   */
  async deletePreset(presetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.deletePreset');
    try {
      this.loggingService.debug('프리셋 삭제 시작');

      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.');
      }

      await this.presetService.deletePreset(presetId);

      this.eventDispatcher.dispatch(new PresetDeletedEvent(preset));

      this.analyticsService.trackEvent('preset_deleted', {
        presetId: preset.metadata.id,
        name: preset.metadata.name
      });

      this.loggingService.info('프리셋 삭제 완료', { presetId });
    } catch (error) {
      this.loggingService.error('프리셋 삭제 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.deletePreset');
      throw new PresetServiceError(
        '프리셋 삭제 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'delete',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 복제
   * @param presetId 프리셋 ID
   * @param newName 새 프리셋 이름
   */
  async clonePreset(presetId: string, newName: string): Promise<IPreset | null> {
    const timer = this.performanceMonitor.startTimer('PresetManager.clonePreset');
    try {
      this.loggingService.debug('프리셋 복제 시작');

      const clonedPreset = await this.presetService.clonePreset(presetId, newName);
      if (!clonedPreset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.');
      }

      this.eventDispatcher.dispatch(new PresetCreatedEvent(clonedPreset));

      this.analyticsService.trackEvent('preset_cloned', {
        originalPresetId: presetId,
        clonedPresetId: clonedPreset.metadata.id,
        newName
      });

      this.loggingService.info('프리셋 복제 완료', { 
        originalPresetId: presetId,
        clonedPresetId: clonedPreset.metadata.id
      });
      return clonedPreset;
    } catch (error) {
      this.loggingService.error('프리셋 복제 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.clonePreset');
      throw new PresetServiceError(
        '프리셋 복제 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'create',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 적용
   * @param presetId 프리셋 ID
   */
  async applyPreset(presetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.applyPreset');
    try {
      this.loggingService.debug('프리셋 적용 시작');

      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.');
      }

      await this.presetService.applyPreset(presetId);

      this.eventDispatcher.dispatch(new PresetAppliedEvent(preset));

      this.analyticsService.trackEvent('preset_applied', {
        presetId: preset.metadata.id,
        name: preset.metadata.name
      });

      this.loggingService.info('프리셋 적용 완료', { presetId });
    } catch (error) {
      this.loggingService.error('프리셋 적용 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.applyPreset');
      throw new PresetServiceError(
        '프리셋 적용 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'apply',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 목록 조회
   */
  async getPresets(): Promise<IPreset[]> {
    return this.presetService.getAllPresets();
  }

  /**
   * 프리셋 조회
   * @param presetId 프리셋 ID
   */
  async getPreset(presetId: string): Promise<IPreset | null> {
    return this.presetService.getPreset(presetId);
  }

  /**
   * 프리셋 매핑 생성
   * @param presetId 프리셋 ID
   * @param mapping 매핑
   */
  async createPresetMapping(
    presetId: string,
    mapping: {
      folderPathOrTag: string;
      priority: number;
    }
  ): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.createPresetMapping');
    try {
      this.loggingService.debug('프리셋 매핑 생성 시작', { presetId, mapping });

      await this.presetService.createPresetMapping(presetId, {
        type: mapping.folderPathOrTag.startsWith('#') ? PresetMappingType.TAG : PresetMappingType.FOLDER,
        value: mapping.folderPathOrTag,
        priority: mapping.priority
      } as Omit<IPresetMapping, 'id'>);

      this.analyticsService.trackEvent('preset_mapping_created', {
        presetId,
        folderPathOrTag: mapping.folderPathOrTag,
        priority: mapping.priority
      });

      this.loggingService.info('프리셋 매핑 생성 완료', { presetId, mapping });
    } catch (error) {
      this.loggingService.error('프리셋 매핑 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.createPresetMapping');
      throw new PresetServiceError(
        '프리셋 매핑 생성 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'mapFolder',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 매핑 업데이트
   * @param mappingId 매핑 ID
   * @param mapping 매핑
   */
  async updatePresetMapping(
    mappingId: string,
    mapping: {
      folderPathOrTag?: string;
      priority?: number;
    }
  ): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.updatePresetMapping');
    try {
      this.loggingService.debug('프리셋 매핑 업데이트 시작', { mappingId, mapping });

      await this.presetService.updatePresetMapping(mappingId, mapping);

      this.analyticsService.trackEvent('preset_mapping_updated', {
        mappingId,
        ...mapping
      });

      this.loggingService.info('프리셋 매핑 업데이트 완료', { mappingId, mapping });
    } catch (error) {
      this.loggingService.error('프리셋 매핑 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.updatePresetMapping');
      throw new PresetServiceError(
        '프리셋 매핑 업데이트 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'updatePriority',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 매핑 삭제
   * @param mappingId 매핑 ID
   */
  async deletePresetMapping(mappingId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.deletePresetMapping');
    try {
      this.loggingService.debug('프리셋 매핑 삭제 시작', { mappingId });

      await this.presetService.deletePresetMapping(mappingId);

      this.analyticsService.trackEvent('preset_mapping_deleted', {
        mappingId
      });

      this.loggingService.info('프리셋 매핑 삭제 완료', { mappingId });
    } catch (error) {
      this.loggingService.error('프리셋 매핑 삭제 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.deletePresetMapping');
      throw new PresetServiceError(
        '프리셋 매핑 삭제 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'removeMapping',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 매핑 우선순위 업데이트
   * @param mappingIds 매핑 ID 목록
   */
  async updateMappingPriority(mappingIds: string[]): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.updateMappingPriority');
    try {
      this.loggingService.debug('매핑 우선순위 업데이트 시작', { mappingIds });

      await this.presetService.updateMappingPriority(mappingIds);

      this.analyticsService.trackEvent('preset_mapping_priority_updated', {
        mappingCount: mappingIds.length
      });

      this.loggingService.info('매핑 우선순위 업데이트 완료', { mappingCount: mappingIds.length });
    } catch (error) {
      this.loggingService.error('매핑 우선순위 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.updateMappingPriority');
      throw new PresetServiceError(
        '매핑 우선순위 업데이트 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'updatePriority',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 현재 적용된 프리셋 조회
   */
  async getCurrentPreset(): Promise<IPreset | null> {
    return this.presetService.getCurrentPreset();
  }

  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   */
  async exportPreset(presetId: string): Promise<string> {
    const timer = this.performanceMonitor.startTimer('PresetManager.exportPreset');
    try {
      this.loggingService.debug('프리셋 내보내기 시작');

      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.');
      }

      const exportedData = await this.presetService.exportPreset(presetId);

      this.analyticsService.trackEvent('preset_exported', {
        presetId: preset.metadata.id,
        name: preset.metadata.name
      });

      this.loggingService.info('프리셋 내보내기 완료', { presetId });
      return exportedData;
    } catch (error) {
      this.loggingService.error('프리셋 내보내기 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.exportPreset');
      throw new PresetServiceError(
        '프리셋 내보내기 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'export',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 가져오기
   * @param data 내보낸 프리셋 데이터
   */
  async importPreset(data: string): Promise<IPreset> {
    const timer = this.performanceMonitor.startTimer('PresetManager.importPreset');
    try {
      this.loggingService.debug('프리셋 가져오기 시작');

      const preset = await this.presetService.importPreset(data);
      if (!preset) {
        throw new PresetServiceError('잘못된 프리셋 형식입니다.');
      }

      this.eventDispatcher.dispatch(new PresetCreatedEvent(preset));

      this.analyticsService.trackEvent('preset_imported', {
        presetId: preset.metadata.id,
        name: preset.metadata.name
      });

      this.loggingService.info('프리셋 가져오기 완료', { presetId: preset.metadata.id });
      return preset;
    } catch (error) {
      this.loggingService.error('프리셋 가져오기 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.importPreset');
      throw new PresetServiceError(
        '프리셋 가져오기 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'import',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 폴더에 프리셋 매핑
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  async mapPresetToFolder(folderPath: string, presetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.mapPresetToFolder');
    try {
      this.loggingService.debug('폴더에 프리셋 매핑 시작', { folderPath, presetId });

      await this.presetService.createPresetMapping(presetId, {
        type: PresetMappingType.FOLDER,
        value: folderPath,
        priority: 0
      } as Omit<IPresetMapping, 'id'>);

      this.analyticsService.trackEvent('preset_mapped_to_folder', {
        folderPath,
        presetId
      });

      this.loggingService.info('폴더에 프리셋 매핑 완료', { folderPath, presetId });
    } catch (error) {
      this.loggingService.error('폴더에 프리셋 매핑 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.mapPresetToFolder');
      throw new PresetServiceError(
        '폴더에 프리셋 매핑 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'mapFolder',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 태그에 프리셋 매핑
   * @param tag 태그
   * @param presetId 프리셋 ID
   */
  async mapPresetToTag(tag: string, presetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.mapPresetToTag');
    try {
      this.loggingService.debug('태그에 프리셋 매핑 시작', { tag, presetId });

      await this.presetService.createPresetMapping(presetId, {
        type: PresetMappingType.TAG,
        value: tag,
        priority: 0
      } as Omit<IPresetMapping, 'id'>);

      this.analyticsService.trackEvent('preset_mapped_to_tag', {
        tag,
        presetId
      });

      this.loggingService.info('태그에 프리셋 매핑 완료', { tag, presetId });
    } catch (error) {
      this.loggingService.error('태그에 프리셋 매핑 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.mapPresetToTag');
      throw new PresetServiceError(
        '태그에 프리셋 매핑 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'mapTag',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 매핑 제거
   * @param folderPathOrTag 폴더 경로 또는 태그
   */
  async removePresetMapping(folderPathOrTag: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.removePresetMapping');
    try {
      this.loggingService.debug('프리셋 매핑 제거 시작', { folderPathOrTag });

      const presets = await this.presetService.getAllPresets();
      const preset = presets.find(p => p.mappings.some(m => m.value === folderPathOrTag));
      if (!preset) {
        throw new PresetServiceError('매핑을 찾을 수 없습니다.');
      }

      const mapping = preset.mappings.find(m => m.value === folderPathOrTag);
      if (!mapping) {
        throw new PresetServiceError('매핑을 찾을 수 없습니다.');
      }

      await this.presetService.deletePresetMapping(mapping.id);

      this.analyticsService.trackEvent('preset_mapping_removed', {
        folderPathOrTag
      });

      this.loggingService.info('프리셋 매핑 제거 완료', { folderPathOrTag });
    } catch (error) {
      this.loggingService.error('프리셋 매핑 제거 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.removePresetMapping');
      throw new PresetServiceError(
        '프리셋 매핑 제거 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'removeMapping',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 매핑 우선순위 업데이트
   * @param mappings 매핑 목록
   */
  async updatePresetMappingPriority(mappings: Array<{
    folderPathOrTag: string;
    presetId: string;
    priority: number;
  }>): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetManager.updatePresetMappingPriority');
    try {
      this.loggingService.debug('프리셋 매핑 우선순위 업데이트 시작', { mappings });

      const presets = await this.presetService.getAllPresets();
      const mappingIds = mappings.map(m => {
        const preset = presets.find(p => p.metadata.id === m.presetId);
        if (!preset) {
          throw new PresetServiceError('프리셋을 찾을 수 없습니다.');
        }

        const mapping = preset.mappings.find(pm => pm.value === m.folderPathOrTag);
        if (!mapping) {
          throw new PresetServiceError('매핑을 찾을 수 없습니다.');
        }

        return mapping.id;
      });

      await this.presetService.updateMappingPriority(mappingIds);

      this.analyticsService.trackEvent('preset_mapping_priority_updated', {
        mappingCount: mappings.length
      });

      this.loggingService.info('프리셋 매핑 우선순위 업데이트 완료', { mappingCount: mappings.length });
    } catch (error) {
      this.loggingService.error('프리셋 매핑 우선순위 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.updatePresetMappingPriority');
      throw new PresetServiceError(
        '프리셋 매핑 우선순위 업데이트 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'updatePriority',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }
} 