import { IPresetService } from '@/domain/services/application/IPresetService';
import { 
  IPreset, 
  IPresetMapping, 
  IPresetMetadata, 
  Preset, 
  DEFAULT_PRESET_CONTENT_CONFIG,
} from '@/domain/models/Preset';
import { ICardSection, DEFAULT_RENDER_CONFIG } from '@/domain/models/Card';
import { ICardSetConfig, CardSetType } from '@/domain/models/CardSet';
import { ILayoutConfig, LayoutType } from '@/domain/models/Layout';
import { ISortConfig, SortType, SortOrder } from '@/domain/models/Sort';
import { ISearchConfig, DEFAULT_SEARCH_CONFIG } from '@/domain/models/Search';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { PresetServiceError } from '@/domain/errors/PresetServiceError';
import { v4 as uuidv4 } from 'uuid';
import { CardNavigatorError } from '@/domain/errors/CardNavigatorError';
import { DomainEventType } from '@/domain/events/DomainEventType';

/**
 * 프리셋 서비스 구현체
 */
export class PresetService implements IPresetService {
  private static instance: PresetService;
  private presets: Map<string, IPreset> = new Map();
  private mappings: Map<string, IPresetMapping> = new Map();
  private eventCallbacks: ((event: any) => void)[] = [];
  private currentPresetId: string | null = null;
  private currentPreset: IPreset | null = null;
  private initialized: boolean = false;
  private errorHandler: IErrorHandler;
  private loggingService: ILoggingService;
  private performanceMonitor: IPerformanceMonitor;
  private analyticsService: IAnalyticsService;
  private eventDispatcher: IEventDispatcher;

  private constructor() {
    const container = Container.getInstance();
    this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
    this.loggingService = container.resolve<ILoggingService>('ILoggingService');
    this.performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
    this.analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
    this.eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
  }

  public static getInstance(): PresetService {
    if (!PresetService.instance) {
      PresetService.instance = new PresetService();
    }
    return PresetService.instance;
  }

  /**
   * 초기화
   */
  public async initialize(): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetService.initialize');
    try {
      if (this.initialized) {
        this.loggingService.warn('프리셋 서비스가 이미 초기화되어 있습니다.');
        return;
      }

      this.loggingService.debug('프리셋 서비스 초기화 시작');
      await this.loadDefaultPreset();
      this.initialized = true;
      this.loggingService.info('프리셋 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('프리셋 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.initialize');
    } finally {
      timer.stop();
    }
  }

  /**
   * 정리
   */
  public async cleanup(): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetService.cleanup');
    try {
      this.loggingService.debug('프리셋 서비스 정리 시작');
      this.presets.clear();
      this.mappings.clear();
      this.eventCallbacks = [];
      this.currentPresetId = null;
      this.currentPreset = null;
      this.initialized = false;
      this.loggingService.info('프리셋 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('프리셋 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.cleanup');
    } finally {
      timer.stop();
    }
  }

  /**
   * 기본 프리셋 로드
   */
  public async loadDefaultPreset(): Promise<IPreset> {
    const timer = this.performanceMonitor.startTimer('PresetService.loadDefaultPreset');
    try {
      this.loggingService.debug('기본 프리셋 로드 시작');

      // 기본 프리셋 조회
      const presets = await this.getAllPresets();
      const defaultPreset = presets.find(p => p.metadata.name === 'default');

      if (!defaultPreset) {
        this.loggingService.debug('기본 프리셋이 없습니다. 생성합니다.');
        
        // 기본 프리셋 생성
        const defaultPreset = await this.createPreset(
          'default',
          '기본 프리셋',
          '기본',
          {
            type: 'header',
            displayOptions: {
              showTitle: true,
              showFileName: true,
              showFirstHeader: true,
              showContent: false,
              showTags: true,
              showCreatedAt: true,
              showUpdatedAt: true,
              showProperties: false,
              renderConfig: DEFAULT_RENDER_CONFIG
            },
            style: {
              classes: ['card-header'],
              backgroundColor: 'var(--background-primary)',
              fontSize: '14px',
              color: 'var(--text-normal)',
              border: {
                width: '1px',
                color: 'var(--background-modifier-border)',
                style: 'solid',
                radius: '8px'
              },
              padding: '12px 16px',
              boxShadow: 'var(--shadow-s)',
              lineHeight: 'var(--line-height-normal)',
              fontFamily: 'var(--font-family)'
            }
          },
          {
            criteria: {
              type: CardSetType.FOLDER,
              folderMode: 'active',
              folderPath: '',
              tagMode: 'active',
              tag: '',
              filePath: ''
            },
            filter: {
              includeSubfolders: true
            }
          },
          {
            type: LayoutType.MASONRY,
            fixedCardHeight: false,
            cardThresholdWidth: 300,
            cardThresholdHeight: 200,
            cardGap: 16,
            padding: 16
          },
          {
            type: SortType.NAME,
            order: SortOrder.ASC,
            field: 'fileName',
            direction: 'asc',
            priorityTags: [],
            priorityFolders: []
          },
          {
            ...DEFAULT_SEARCH_CONFIG,
            criteria: {
              query: '',
              scope: 'all',
              caseSensitive: false,
              useRegex: false,
              wholeWord: false
            }
          }
        );

        this.loggingService.info('기본 프리셋 생성 완료');
        return defaultPreset;
      }

      this.loggingService.info('기본 프리셋 로드 완료');
      return defaultPreset;
    } catch (error) {
      this.loggingService.error('기본 프리셋 로드 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.loadDefaultPreset');
      throw new CardNavigatorError('기본 프리셋 로드에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 현재 적용된 프리셋 가져오기
   */
  public async getCurrentPreset(): Promise<IPreset | null> {
    return this.currentPreset;
  }

  /**
   * 프리셋 생성
   */
  public async createPreset(
    name: string,
    description: string,
    category: string,
    cardSection: ICardSection,
    cardSetConfig: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    sortConfig: ISortConfig,
    searchConfig: ISearchConfig
  ): Promise<IPreset> {
    const timer = this.performanceMonitor.startTimer('PresetService.createPreset');
    try {
      this.loggingService.debug('프리셋 생성 시작');

      const preset = new Preset(
        {
          id: uuidv4(),
          name,
          description,
          category,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          cardStateStyle: DEFAULT_PRESET_CONTENT_CONFIG.cardStateStyle,
          cardSections: {
            header: cardSection,
            body: cardSection,
            footer: cardSection
          },
          cardRenderConfig: DEFAULT_PRESET_CONTENT_CONFIG.cardRenderConfig,
          cardSetConfig,
          layoutConfig,
          searchConfig,
          sortConfig
        }
      );

      this.presets.set(preset.metadata.id, preset);
      this.notifyEvent('create', preset.metadata.id, preset);

      this.loggingService.info('프리셋 생성 완료', { presetId: preset.metadata.id });
      return preset;
    } catch (error) {
      this.loggingService.error('프리셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.createPreset');
      throw new PresetServiceError('프리셋 생성 중 오류가 발생했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 유효성 검사
   */
  public validatePreset(preset: IPreset): boolean {
    try {
      if (!preset.metadata || !preset.config) {
        return false;
      }

      if (!preset.metadata.id || !preset.metadata.name) {
        return false;
      }

      if (!preset.config.cardSetConfig || !preset.config.layoutConfig || 
          !preset.config.searchConfig || !preset.config.sortConfig) {
        return false;
      }

      return true;
    } catch (error) {
      this.loggingService.error('프리셋 유효성 검사 실패', { error, presetId: preset.metadata.id });
      return false;
    }
  }

  /**
   * 프리셋 업데이트
   */
  public async updatePreset(
    preset: IPreset,
    cardSection: ICardSection,
    cardSetConfig: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    sortConfig: ISortConfig,
    searchConfig: ISearchConfig
  ): Promise<IPreset> {
    const timer = this.performanceMonitor.startTimer('PresetService.updatePreset');
    try {
      this.loggingService.debug('프리셋 업데이트 시작');

      const updatedPreset = new Preset(
        {
          ...preset.metadata,
          updatedAt: new Date()
        },
        {
          ...preset.config,
          cardSections: {
            header: cardSection,
            body: cardSection,
            footer: cardSection
          },
          cardSetConfig,
          layoutConfig,
          sortConfig,
          searchConfig
        }
      );

      this.presets.set(updatedPreset.metadata.id, updatedPreset);
      this.notifyEvent('update', updatedPreset.metadata.id, updatedPreset);

      this.loggingService.info('프리셋 업데이트 완료', { presetId: preset.metadata.id });
      return updatedPreset;
    } catch (error) {
      this.loggingService.error('프리셋 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.updatePreset');
      throw new PresetServiceError('프리셋 업데이트 중 오류가 발생했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 삭제
   */
  public async deletePreset(presetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetService.deletePreset');
    
    try {
      this.loggingService.debug('프리셋 삭제 시작', { presetId });

      // 프리셋 존재 여부 확인
      const preset = this.presets.get(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }

      // 기본 프리셋 삭제 방지
      if (preset.metadata.name === 'default') {
        throw new PresetServiceError('기본 프리셋은 삭제할 수 없습니다.');
      }

      // 현재 적용된 프리셋인 경우
      if (this.currentPresetId === presetId) {
        this.currentPresetId = null;
        this.currentPreset = null;
        this.loggingService.warn('현재 적용된 프리셋이 삭제되었습니다.', { presetId });
      }

      // 매핑된 프리셋 삭제
      const mappingsToDelete = preset.mappingIds.map(mappingId => mappingId);
      
      mappingsToDelete.forEach(mappingId => {
        this.mappings.delete(mappingId);
        this.loggingService.debug('프리셋 매핑 삭제', { mappingId });
      });

      // 프리셋 삭제
      this.presets.delete(presetId);
      
      // 이벤트 발생
      this.notifyEvent(DomainEventType.PRESET_DELETED, presetId);
      
      this.loggingService.info('프리셋 삭제 완료', { 
        presetId,
        name: preset.metadata.name,
        category: preset.metadata.category,
        deletedMappings: mappingsToDelete.length
      });
    } catch (error) {
      const errorMessage = error instanceof PresetServiceError 
        ? error.message 
        : '프리셋 삭제 중 오류가 발생했습니다.';
      
      this.loggingService.error('프리셋 삭제 실패', { 
        error,
        presetId
      });
      
      this.errorHandler.handleError(error as Error, 'PresetService.deletePreset');
      throw new PresetServiceError(errorMessage);
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 적용
   */
  public async applyPreset(presetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetService.applyPreset');
    try {
      this.loggingService.debug('프리셋 적용 시작', { presetId });

      const preset = this.presets.get(presetId);
      if (!preset) {
        throw new Error(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }

      this.currentPreset = preset;
      this.currentPresetId = presetId;
      this.notifyEvent('apply', presetId, preset);

      this.loggingService.info('프리셋 적용 완료', { presetId });
    } catch (error) {
      this.loggingService.error('프리셋 적용 실패', { error, presetId });
      this.errorHandler.handleError(error as Error, 'PresetService.applyPreset');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 복제
   */
  public async clonePreset(presetId: string, newName: string): Promise<IPreset | null> {
    const timer = this.performanceMonitor.startTimer('PresetService.clonePreset');
    try {
      this.loggingService.debug('프리셋 복제 시작', { presetId, newName });
      const preset = this.presets.get(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.');
      }

      const metadata: IPresetMetadata = {
        id: uuidv4(),
        name: newName,
        description: preset.metadata.description,
        category: preset.metadata.category,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const clonedPreset = new Preset(metadata, preset.config);
      this.presets.set(clonedPreset.metadata.id, clonedPreset);
      this.notifyEvent('clone', clonedPreset.metadata.id, clonedPreset);

      this.loggingService.info('프리셋 복제 완료', { 
        originalPresetId: presetId, 
        clonedPresetId: clonedPreset.metadata.id 
      });
      return clonedPreset;
    } catch (error) {
      this.loggingService.error('프리셋 복제 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.clonePreset');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   */
  public async exportPreset(presetId: string): Promise<string> {
    const timer = this.performanceMonitor.startTimer('PresetService.exportPreset');
    try {
      this.loggingService.debug('프리셋 내보내기 시작', { presetId });
      const preset = this.presets.get(presetId);
      if (!preset) {
        throw new PresetServiceError('프리셋을 찾을 수 없습니다.');
      }

      const presetJson = JSON.stringify(preset);
      this.loggingService.info('프리셋 내보내기 완료', { presetId });
      return presetJson;
    } catch (error) {
      this.loggingService.error('프리셋 내보내기 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.exportPreset');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 가져오기
   * @param presetJson 프리셋 JSON
   */
  public async importPreset(presetJson: string): Promise<IPreset | null> {
    const timer = this.performanceMonitor.startTimer('PresetService.importPreset');
    try {
      this.loggingService.debug('프리셋 가져오기 시작');
      const presetData = JSON.parse(presetJson);
      const preset = new Preset(
        presetData.metadata,
        presetData.config
      );

      if (!this.validatePreset(preset)) {
        throw new PresetServiceError('프리셋 데이터가 유효하지 않습니다.');
      }

      this.presets.set(preset.metadata.id, preset);
      this.notifyEvent('import', preset.metadata.id, preset);

      this.loggingService.info('프리셋 가져오기 완료', { presetId: preset.metadata.id });
      return preset;
    } catch (error) {
      this.loggingService.error('프리셋 가져오기 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.importPreset');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 매핑 생성
   */
  public async createPresetMapping(
    presetId: string,
    mapping: Omit<IPresetMapping, 'id'>
  ): Promise<IPresetMapping | null> {
    const timer = this.performanceMonitor.startTimer('PresetService.createPresetMapping');
    
    try {
      this.loggingService.debug('프리셋 매핑 생성 시작', { presetId });

      // 프리셋 존재 여부 확인
      const preset = this.presets.get(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }

      // 매핑 유효성 검사
      if (!mapping.type || !mapping.target) {
        throw new PresetServiceError('매핑 유형과 대상은 필수입니다.');
      }

      // 매핑 ID 생성
      const mappingId = uuidv4();
      const newMapping: IPresetMapping = {
        ...mapping,
        id: mappingId
      };

      // 매핑 추가
      this.mappings.set(mappingId, newMapping);
      
      // 이벤트 발생
      this.notifyEvent('createMapping', mappingId, newMapping);
      
      this.loggingService.info('프리셋 매핑 생성 완료', { 
        mappingId,
        type: newMapping.type,
        target: newMapping.target
      });
      
      return newMapping;
    } catch (error) {
      const errorMessage = error instanceof PresetServiceError 
        ? error.message 
        : '프리셋 매핑 생성 중 오류가 발생했습니다.';
      
      this.loggingService.error('프리셋 매핑 생성 실패', { 
        error,
        presetId
      });
      
      this.errorHandler.handleError(error as Error, 'PresetService.createPresetMapping');
      throw new PresetServiceError(errorMessage);
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 매핑 업데이트
   */
  public async updatePresetMapping(
    mappingId: string,
    mapping: Partial<IPresetMapping>
  ): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetService.updatePresetMapping');
    
    try {
      this.loggingService.debug('프리셋 매핑 업데이트 시작', { mappingId });

      // 매핑 존재 여부 확인
      const existingMapping = this.mappings.get(mappingId);
      if (!existingMapping) {
        throw new PresetServiceError(`매핑을 찾을 수 없습니다: ${mappingId}`);
      }

      // 매핑 유효성 검사
      if (mapping.type && !mapping.target) {
        throw new PresetServiceError('매핑 유형이 변경되면 대상도 필수입니다.');
      }

      // 매핑 업데이트
      const updatedMapping: IPresetMapping = {
        ...existingMapping,
        ...mapping
      };

      this.mappings.set(mappingId, updatedMapping);
      
      // 이벤트 발생
      this.notifyEvent('updateMapping', mappingId, updatedMapping);
      
      this.loggingService.info('프리셋 매핑 업데이트 완료', { 
        mappingId,
        type: updatedMapping.type,
        target: updatedMapping.target
      });
    } catch (error) {
      const errorMessage = error instanceof PresetServiceError 
        ? error.message 
        : '프리셋 매핑 업데이트 중 오류가 발생했습니다.';
      
      this.loggingService.error('프리셋 매핑 업데이트 실패', { 
        error,
        mappingId
      });
      
      this.errorHandler.handleError(error as Error, 'PresetService.updatePresetMapping');
      throw new PresetServiceError(errorMessage);
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 매핑 삭제
   */
  public async deletePresetMapping(mappingId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetService.deletePresetMapping');
    
    try {
      this.loggingService.debug('프리셋 매핑 삭제 시작', { mappingId });

      // 매핑 존재 여부 확인
      const mapping = this.mappings.get(mappingId);
      if (!mapping) {
        throw new PresetServiceError(`매핑을 찾을 수 없습니다: ${mappingId}`);
      }

      // 매핑 삭제
      this.mappings.delete(mappingId);
      
      // 이벤트 발생
      this.notifyEvent('deleteMapping', mappingId);
      
      this.loggingService.info('프리셋 매핑 삭제 완료', { 
        mappingId,
        type: mapping.type,
        target: mapping.target
      });
    } catch (error) {
      const errorMessage = error instanceof PresetServiceError 
        ? error.message 
        : '프리셋 매핑 삭제 중 오류가 발생했습니다.';
      
      this.loggingService.error('프리셋 매핑 삭제 실패', { 
        error,
        mappingId
      });
      
      this.errorHandler.handleError(error as Error, 'PresetService.deletePresetMapping');
      throw new PresetServiceError(errorMessage);
    } finally {
      timer.stop();
    }
  }

  /**
   * 매핑 우선순위 업데이트
   * @param mappingIds 매핑 ID 목록
   */
  public async updateMappingPriority(mappingIds: string[]): Promise<void> {
    const timer = this.performanceMonitor.startTimer('PresetService.updateMappingPriority');
    try {
      this.loggingService.debug('매핑 우선순위 업데이트 시작', { mappingIds });
      const updatedMappings = new Map<string, IPresetMapping>();
      
      for (const mappingId of mappingIds) {
        const mapping = this.mappings.get(mappingId);
        if (mapping) {
          updatedMappings.set(mappingId, mapping);
        }
      }

      this.mappings = updatedMappings;
      this.notifyEvent('updateMappingPriority', '', mappingIds);

      this.loggingService.info('매핑 우선순위 업데이트 완료', { mappingIds });
    } catch (error) {
      this.loggingService.error('매핑 우선순위 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.updateMappingPriority');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 프리셋 이벤트 구독
   * @param callback 콜백 함수
   */
  public subscribeToPresetEvents(callback: (event: any) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * 프리셋 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  public unsubscribeFromPresetEvents(callback: (event: any) => void): void {
    this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
  }

  /**
   * 이벤트 알림
   * @param type 이벤트 타입
   * @param presetId 프리셋 ID
   * @param data 이벤트 데이터
   */
  private notifyEvent(type: string, presetId: string, data?: any): void {
    const event = { type, presetId, data };
    this.eventCallbacks.forEach(callback => callback(event));
  }

  /**
   * 프리셋 가져오기
   * @param presetId 프리셋 ID
   */
  public async getPreset(presetId: string): Promise<IPreset | null> {
    return this.presets.get(presetId) || null;
  }

  /**
   * 모든 프리셋 가져오기
   */
  public async getAllPresets(): Promise<IPreset[]> {
    return Array.from(this.presets.values());
  }
} 