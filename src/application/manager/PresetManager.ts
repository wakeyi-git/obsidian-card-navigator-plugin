import { IPreset } from '../../domain/models/Preset';
import { ICardRenderConfig } from '../../domain/models/CardRenderConfig';
import { ICardStyle } from '../../domain/models/CardStyle';
import { ISearchFilter } from '../../domain/models/SearchFilter';
import { ISortConfig } from '../../domain/models/SortConfig';
import { DEFAULT_LAYOUT_CONFIG } from '../../domain/models/LayoutConfig';
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
import { ICardSetConfig } from '@/domain/models/CardSet';
import { CardSetType } from '@/domain/models/CardSet';

/**
 * 프리셋 관리자 구현체
 */
export class PresetManager implements IPresetManager {
  private static instance: PresetManager;
  private presets: Map<string, IPreset> = new Map();
  private folderMappings: Map<string, string> = new Map(); // folderPath -> presetId
  private tagMappings: Map<string, string> = new Map(); // tag -> presetId
  private mappingPriorities: Array<{ folderPathOrTag: string; presetId: string; priority: number }> = [];
  private currentPresetId: string | null = null;

  private constructor(
    private readonly app: App,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      const container = Container.getInstance();
      PresetManager.instance = new PresetManager(
        container.resolve('App'),
        container.resolve('IEventDispatcher'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return PresetManager.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const perfMark = 'PresetManager.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 관리자 초기화 시작');
      
      this.presets.clear();
      this.folderMappings.clear();
      this.tagMappings.clear();
      this.mappingPriorities = [];
      this.currentPresetId = null;

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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const perfMark = 'PresetManager.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param config 프리셋 설정
   */
  async createPreset(name: string, description: string, config: {
    renderConfig: ICardRenderConfig;
    cardStyle: ICardStyle;
    searchFilter: ISearchFilter;
    sortConfig: ISortConfig;
  }): Promise<IPreset> {
    const perfMark = 'PresetManager.createPreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 생성 시작', { name });

      // 프리셋 ID 생성
      const presetId = `preset-${Date.now()}`;

      // 카드셋 설정 생성
      const cardSetConfig: ICardSetConfig = {
        cardSetGeneral: {
          cardSetType: CardSetType.FOLDER
        },
        folderCardSet: {
          folderCardSetMode: 'active',
          fixedFolderPath: '',
          includeSubfolders: true
        },
        tagCardSet: {
          tagCardSetMode: 'active',
          fixedTag: ''
        },
        linkCardSet: {
          includeBacklinks: true,
          includeOutgoingLinks: false,
          linkLevel: 1
        },
        searchFilter: config.searchFilter,
        sortConfig: config.sortConfig,
        validate: () => true,
        preview: function() {
          return this;
        }
      };

      // 프리셋 생성
      const preset: IPreset = {
        metadata: {
          id: presetId,
          name,
          description,
          category: '사용자 정의',
          createdAt: new Date(),
          updatedAt: new Date(),
          mappings: []
        },
        config: {
          cardSetConfig,
          layoutConfig: {
            ...DEFAULT_LAYOUT_CONFIG,
            cardHeightFixed: false,
            cardMinWidth: 300,
            cardMinHeight: 200,
            cardGap: 16,
            cardPadding: 16
          },
          cardRenderConfig: config.renderConfig,
          cardStyle: config.cardStyle
        },
        validate() {
          return true;
        },
        preview() {
          return {
            metadata: this.metadata,
            config: this.config
          };
        }
      };

      // 프리셋 저장
      this.presets.set(presetId, preset);

      // 이벤트 발생
      this.eventDispatcher.dispatch(new PresetCreatedEvent(preset));

      this.analyticsService.trackEvent('preset_created', {
        presetId,
        name,
        category: preset.metadata.category
      });

      this.loggingService.info('프리셋 생성 완료', { presetId });
      return preset;
    } catch (error) {
      this.loggingService.error('프리셋 생성 실패', { error, name });
      this.errorHandler.handleError(error as Error, 'PresetManager.createPreset');
      throw new PresetServiceError(
        '프리셋 생성 중 오류가 발생했습니다.',
        undefined,
        name,
        'create',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 수정
   * @param preset 프리셋
   */
  async updatePreset(preset: IPreset): Promise<void> {
    const perfMark = 'PresetManager.updatePreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 수정 시작', { presetId: preset.metadata.id });

      const existingPreset = await this.getPreset(preset.metadata.id);
      if (!existingPreset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.', preset.metadata.id, preset.metadata.name);
      }

      // 프리셋 업데이트
      const updatedPreset: IPreset = {
        metadata: {
          ...preset.metadata,
          updatedAt: new Date()
        },
        config: preset.config,
        validate() {
          return true;
        },
        preview() {
          return {
            metadata: this.metadata,
            config: this.config
          };
        }
      };

      this.presets.set(preset.metadata.id, updatedPreset);

      // 이벤트 발생
      this.eventDispatcher.dispatch(new PresetUpdatedEvent(updatedPreset));

      this.analyticsService.trackEvent('preset_updated', {
        presetId: preset.metadata.id,
        name: preset.metadata.name,
        category: preset.metadata.category
      });

      this.loggingService.info('프리셋 수정 완료', { presetId: preset.metadata.id });
    } catch (error) {
      this.loggingService.error('프리셋 수정 실패', { error, presetId: preset.metadata.id });
      this.errorHandler.handleError(error as Error, 'PresetManager.updatePreset');
      throw new PresetServiceError(
        '프리셋 수정 중 오류가 발생했습니다.',
        preset.metadata.id,
        preset.metadata.name,
        'update',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 삭제
   * @param presetId 프리셋 ID
   */
  async deletePreset(presetId: string): Promise<void> {
    const perfMark = 'PresetManager.deletePreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 삭제 시작', { presetId });

      const preset = await this.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.', presetId);
      }

      // 프리셋 삭제
      this.presets.delete(presetId);

      // 매핑 제거
      this.folderMappings.forEach((mappedPresetId, folderPath) => {
        if (mappedPresetId === presetId) {
          this.folderMappings.delete(folderPath);
        }
      });

      this.tagMappings.forEach((mappedPresetId, tag) => {
        if (mappedPresetId === presetId) {
          this.tagMappings.delete(tag);
        }
      });

      // 매핑 우선순위 업데이트
      this.mappingPriorities = this.mappingPriorities.filter(
        mapping => mapping.presetId !== presetId
      );

      // 현재 프리셋인 경우 초기화
      if (this.currentPresetId === presetId) {
        this.currentPresetId = null;
      }

      // 이벤트 발생
      this.eventDispatcher.dispatch(new PresetDeletedEvent(preset));

      this.analyticsService.trackEvent('preset_deleted', {
        presetId,
        name: preset.metadata.name,
        category: preset.metadata.category
      });

      this.loggingService.info('프리셋 삭제 완료', { presetId });
    } catch (error) {
      this.loggingService.error('프리셋 삭제 실패', { error, presetId });
      this.errorHandler.handleError(error as Error, 'PresetManager.deletePreset');
      throw new PresetServiceError(
        '프리셋 삭제 중 오류가 발생했습니다.',
        presetId,
        undefined,
        'delete',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 적용
   * @param presetId 프리셋 ID
   */
  async applyPreset(presetId: string): Promise<void> {
    const perfMark = 'PresetManager.applyPreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 적용 시작', { presetId });

      const preset = await this.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.', presetId);
      }

      this.currentPresetId = presetId;

      // 이벤트 발생
      this.eventDispatcher.dispatch(new PresetAppliedEvent(preset));

      this.analyticsService.trackEvent('preset_applied', {
        presetId,
        name: preset.metadata.name,
        category: preset.metadata.category
      });

      this.loggingService.info('프리셋 적용 완료', { presetId });
    } catch (error) {
      this.loggingService.error('프리셋 적용 실패', { error, presetId });
      this.errorHandler.handleError(error as Error, 'PresetManager.applyPreset');
      throw new PresetServiceError(
        '프리셋 적용 중 오류가 발생했습니다.',
        presetId,
        undefined,
        'apply',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 목록 조회
   */
  async getPresets(): Promise<IPreset[]> {
    const perfMark = 'PresetManager.getPresets';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 목록 조회 시작');
      const presets = Array.from(this.presets.values());
      this.loggingService.info('프리셋 목록 조회 완료', { count: presets.length });
      return presets;
    } catch (error) {
      this.loggingService.error('프리셋 목록 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.getPresets');
      throw new PresetServiceError(
        '프리셋 목록 조회 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'load',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 조회
   * @param presetId 프리셋 ID
   */
  async getPreset(presetId: string): Promise<IPreset | null> {
    const perfMark = 'PresetManager.getPreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 조회 시작', { presetId });
      const preset = this.presets.get(presetId) || null;
      this.loggingService.info('프리셋 조회 완료', { presetId, found: !!preset });
      return preset;
    } catch (error) {
      this.loggingService.error('프리셋 조회 실패', { error, presetId });
      this.errorHandler.handleError(error as Error, 'PresetManager.getPreset');
      throw new PresetServiceError(
        '프리셋 조회 중 오류가 발생했습니다.',
        presetId,
        undefined,
        'load',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 폴더에 프리셋 매핑
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  async mapPresetToFolder(folderPath: string, presetId: string): Promise<void> {
    const perfMark = 'PresetManager.mapPresetToFolder';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('폴더 프리셋 매핑 시작', { folderPath, presetId });

      const preset = await this.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.', presetId);
      }

      this.folderMappings.set(folderPath, presetId);

      // 매핑 우선순위 추가
      const priority = this.mappingPriorities.length;
      this.mappingPriorities.push({
        folderPathOrTag: folderPath,
        presetId,
        priority
      });

      this.analyticsService.trackEvent('preset_mapped_to_folder', {
        presetId,
        folderPath,
        priority
      });

      this.loggingService.info('폴더 프리셋 매핑 완료', { folderPath, presetId });
    } catch (error) {
      this.loggingService.error('폴더 프리셋 매핑 실패', { error, folderPath, presetId });
      this.errorHandler.handleError(error as Error, 'PresetManager.mapPresetToFolder');
      throw new PresetServiceError(
        '폴더 프리셋 매핑 중 오류가 발생했습니다.',
        presetId,
        undefined,
        'mapFolder',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 태그에 프리셋 매핑
   * @param tag 태그
   * @param presetId 프리셋 ID
   */
  async mapPresetToTag(tag: string, presetId: string): Promise<void> {
    const perfMark = 'PresetManager.mapPresetToTag';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('태그 프리셋 매핑 시작', { tag, presetId });

      const preset = await this.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.', presetId);
      }

      this.tagMappings.set(tag, presetId);

      // 매핑 우선순위 추가
      const priority = this.mappingPriorities.length;
      this.mappingPriorities.push({
        folderPathOrTag: tag,
        presetId,
        priority
      });

      this.analyticsService.trackEvent('preset_mapped_to_tag', {
        presetId,
        tag,
        priority
      });

      this.loggingService.info('태그 프리셋 매핑 완료', { tag, presetId });
    } catch (error) {
      this.loggingService.error('태그 프리셋 매핑 실패', { error, tag, presetId });
      this.errorHandler.handleError(error as Error, 'PresetManager.mapPresetToTag');
      throw new PresetServiceError(
        '태그 프리셋 매핑 중 오류가 발생했습니다.',
        presetId,
        undefined,
        'mapTag',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 매핑 제거
   * @param folderPathOrTag 폴더 경로 또는 태그
   */
  async removePresetMapping(folderPathOrTag: string): Promise<void> {
    const perfMark = 'PresetManager.removePresetMapping';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 매핑 제거 시작', { folderPathOrTag });

      this.folderMappings.delete(folderPathOrTag);
      this.tagMappings.delete(folderPathOrTag);

      // 매핑 우선순위 업데이트
      this.mappingPriorities = this.mappingPriorities.filter(
        mapping => mapping.folderPathOrTag !== folderPathOrTag
      );

      this.analyticsService.trackEvent('preset_mapping_removed', {
        folderPathOrTag
      });

      this.loggingService.info('프리셋 매핑 제거 완료', { folderPathOrTag });
    } catch (error) {
      this.loggingService.error('프리셋 매핑 제거 실패', { error, folderPathOrTag });
      this.errorHandler.handleError(error as Error, 'PresetManager.removePresetMapping');
      throw new PresetServiceError(
        '프리셋 매핑 제거 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'removeMapping',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
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
    const perfMark = 'PresetManager.updatePresetMappingPriority';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 매핑 우선순위 업데이트 시작', { mappingsCount: mappings.length });

      // 우선순위 유효성 검사
      const priorities = mappings.map(m => m.priority);
      const uniquePriorities = new Set(priorities);
      if (priorities.length !== uniquePriorities.size) {
        throw new PresetServiceError('중복된 우선순위가 있습니다.');
      }

      // 매핑 존재 여부 확인
      for (const mapping of mappings) {
        const preset = await this.getPreset(mapping.presetId);
        if (!preset) {
          throw new PresetServiceError('프리셋을 찾을 수 없습니다.', mapping.presetId);
        }
      }

      this.mappingPriorities = mappings;

      this.analyticsService.trackEvent('preset_mapping_priorities_updated', {
        mappingsCount: mappings.length
      });

      this.loggingService.info('프리셋 매핑 우선순위 업데이트 완료', { mappingsCount: mappings.length });
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 현재 적용된 프리셋 조회
   */
  async getCurrentPreset(): Promise<IPreset | null> {
    const perfMark = 'PresetManager.getCurrentPreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('현재 프리셋 조회 시작');
      if (!this.currentPresetId) {
        this.loggingService.info('현재 프리셋 없음');
        return null;
      }
      const preset = await this.getPreset(this.currentPresetId);
      this.loggingService.info('현재 프리셋 조회 완료', { presetId: this.currentPresetId });
      return preset;
    } catch (error) {
      this.loggingService.error('현재 프리셋 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.getCurrentPreset');
      throw new PresetServiceError(
        '현재 프리셋 조회 중 오류가 발생했습니다.',
        this.currentPresetId || undefined,
        undefined,
        'load',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   */
  async exportPreset(presetId: string): Promise<string> {
    const perfMark = 'PresetManager.exportPreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 내보내기 시작', { presetId });

      const preset = await this.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.', presetId);
      }

      const presetJson = JSON.stringify(preset, null, 2);

      this.analyticsService.trackEvent('preset_exported', {
        presetId,
        name: preset.metadata.name,
        category: preset.metadata.category
      });

      this.loggingService.info('프리셋 내보내기 완료', { presetId });
      return presetJson;
    } catch (error) {
      this.loggingService.error('프리셋 내보내기 실패', { error, presetId });
      this.errorHandler.handleError(error as Error, 'PresetManager.exportPreset');
      throw new PresetServiceError(
        '프리셋 내보내기 중 오류가 발생했습니다.',
        presetId,
        undefined,
        'export',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 프리셋 가져오기
   * @param presetJson 프리셋 JSON 문자열
   */
  async importPreset(presetJson: string): Promise<IPreset> {
    const perfMark = 'PresetManager.importPreset';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 가져오기 시작');

      const preset = JSON.parse(presetJson) as IPreset;

      // 프리셋 유효성 검사
      if (!preset.metadata.id || !preset.metadata.name) {
        throw new PresetServiceError('잘못된 프리셋 형식입니다.');
      }

      // 프리셋 저장
      this.presets.set(preset.metadata.id, preset);

      // 이벤트 발생
      this.eventDispatcher.dispatch(new PresetCreatedEvent(preset));

      this.analyticsService.trackEvent('preset_imported', {
        presetId: preset.metadata.id,
        name: preset.metadata.name,
        category: preset.metadata.category
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 