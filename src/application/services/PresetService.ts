import { IPresetService } from '../../domain/services/IPresetService';
import { IPreset, IPresetMapping, PresetMappingType } from '../../domain/models/Preset';
import { ICardRenderConfig } from '../../domain/models/CardRenderConfig';
import { ILayoutConfig } from '../../domain/models/LayoutConfig';
import { ISortConfig } from '../../domain/models/SortConfig';
import { DEFAULT_PRESET_CONFIG } from '../../domain/models/Preset';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';

/**
 * 프리셋 서비스 구현체
 */
export class PresetService implements IPresetService {
  private static instance: PresetService;
  private presets: Map<string, IPreset> = new Map();
  private mappings: Map<string, IPresetMapping> = new Map();
  private eventCallbacks: ((event: any) => void)[] = [];
  private currentPresetId: string | null = null;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): PresetService {
    if (!PresetService.instance) {
      const container = Container.getInstance();
      PresetService.instance = new PresetService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return PresetService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const perfMark = 'PresetService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 서비스 초기화 시작');
      
      // 기본 프리셋 로드
      this.loadDefaultPreset();
      
      this.loggingService.info('프리셋 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('프리셋 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.initialize');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const perfMark = 'PresetService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('프리셋 서비스 정리 시작');
      
      this.presets.clear();
      this.mappings.clear();
      this.eventCallbacks = [];
      this.currentPresetId = null;
      
      this.loggingService.info('프리셋 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('프리셋 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.cleanup');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 기본 프리셋 로드
   */
  public loadDefaultPreset(): void {
    try {
      this.loggingService.debug('기본 프리셋 로드 시작');
      
      // Plugin 인스턴스 가져오기
      const container = Container.getInstance();
      const plugin = container.resolve<any>('Plugin');
      
      // 기본 프리셋 적용
      const defaultPresetId = 'default';
      const defaultPreset: IPreset = {
        metadata: {
          id: defaultPresetId,
          name: '기본 프리셋',
          category: '기본',
          createdAt: new Date(),
          updatedAt: new Date(),
          mappings: []
        },
        config: {
          ...DEFAULT_PRESET_CONFIG,
          // 플러그인 설정의 cardStyle 적용
          cardStyle: plugin.settings.cardStyle || DEFAULT_PRESET_CONFIG.cardStyle,
          // 플러그인 설정의 cardRenderConfig 적용
          cardRenderConfig: plugin.settings.cardRenderConfig || DEFAULT_PRESET_CONFIG.cardRenderConfig
        },
        validate: () => true,
        preview: function() {
          return {
            metadata: this.metadata,
            config: this.config
          };
        }
      };
      
      // 기본 프리셋 등록
      this.presets.set(defaultPresetId, defaultPreset);
      
      // 현재 프리셋으로 설정
      this.currentPresetId = defaultPresetId;
      
      this.loggingService.info('기본 프리셋 로드 완료', {
        hasCardStyle: !!plugin.settings.cardStyle,
        hasRenderConfig: !!plugin.settings.cardRenderConfig
      });
    } catch (error) {
      this.loggingService.error('기본 프리셋 로드 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetService.loadDefaultPreset');
    }
  }

  /**
   * 현재 적용된 프리셋 가져오기
   * @returns 현재 프리셋 또는 null
   */
  getCurrentPreset(): IPreset | null {
    if (!this.currentPresetId) {
      return null;
    }
    return this.presets.get(this.currentPresetId) || null;
  }

  /**
   * 프리셋 생성
   * @param name 프리셋 이름
   * @param type 프리셋 타입
   * @param config 프리셋 설정
   */
  async createPreset(
    name: string,
    type: PresetMappingType,
    config: {
      cardRenderConfig?: ICardRenderConfig;
      layoutConfig?: ILayoutConfig;
      sortConfig?: ISortConfig;
    }
  ): Promise<IPreset> {
    const presetId = crypto.randomUUID();
    const preset: IPreset = {
      metadata: {
        id: presetId,
        name,
        category: type.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        mappings: []
      },
      config: {
        cardSetConfig: DEFAULT_PRESET_CONFIG.cardSetConfig,
        layoutConfig: config.layoutConfig || DEFAULT_PRESET_CONFIG.layoutConfig,
        cardRenderConfig: config.cardRenderConfig || DEFAULT_PRESET_CONFIG.cardRenderConfig,
        cardStyle: DEFAULT_PRESET_CONFIG.cardStyle
      },
      validate: function() {
        return this.metadata.id !== '' && this.metadata.name !== '';
      },
      preview: function() {
        return {
          metadata: this.metadata,
          config: this.config
        };
      }
    };

    this.presets.set(presetId, preset);
    this.notifyEvent('create', presetId, preset);
    return preset;
  }

  /**
   * 프리셋 업데이트
   * @param preset 프리셋
   */
  async updatePreset(preset: IPreset): Promise<void> {
    this.presets.set(preset.metadata.id, preset);
    this.notifyEvent('update', preset.metadata.id, preset);
  }

  /**
   * 프리셋 삭제
   * @param presetId 프리셋 ID
   */
  async deletePreset(presetId: string): Promise<void> {
    this.presets.delete(presetId);
    this.notifyEvent('delete', presetId);
  }

  /**
   * 프리셋 가져오기
   * @param presetId 프리셋 ID
   */
  async getPreset(presetId: string): Promise<IPreset | null> {
    return this.presets.get(presetId) || null;
  }

  /**
   * 모든 프리셋 가져오기
   */
  async getAllPresets(): Promise<IPreset[]> {
    return Array.from(this.presets.values());
  }

  /**
   * 프리셋 적용
   * @param presetId 프리셋 ID
   */
  async applyPreset(presetId: string): Promise<void> {
    const preset = await this.getPreset(presetId);
    if (preset) {
      this.currentPresetId = presetId;
      this.notifyEvent('apply', presetId, preset);
    }
  }

  /**
   * 프리셋 복제
   * @param presetId 프리셋 ID
   * @param newName 새 이름
   */
  async clonePreset(presetId: string, newName: string): Promise<IPreset | null> {
    const preset = await this.getPreset(presetId);
    if (preset) {
      const newPresetId = crypto.randomUUID();
      const clonedPreset: IPreset = {
        metadata: {
          ...preset.metadata,
          id: newPresetId,
          name: newName,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        config: preset.config,
        validate: preset.validate,
        preview: preset.preview
      };

      this.presets.set(newPresetId, clonedPreset);
      this.notifyEvent('clone', newPresetId, clonedPreset);
      return clonedPreset;
    }
    return null;
  }

  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   */
  async exportPreset(presetId: string): Promise<string> {
    const preset = await this.getPreset(presetId);
    if (preset) {
      return JSON.stringify(preset);
    }
    return '';
  }

  /**
   * 프리셋 가져오기
   * @param presetJson 프리셋 JSON
   */
  async importPreset(presetJson: string): Promise<IPreset | null> {
    try {
      const preset = JSON.parse(presetJson) as IPreset;
      if (preset.validate()) {
        this.presets.set(preset.metadata.id, preset);
        this.notifyEvent('import', preset.metadata.id, preset);
        return preset;
      }
    } catch (error) {
      console.error('프리셋 가져오기 실패:', error);
    }
    return null;
  }

  /**
   * 프리셋 매핑 생성
   * @param presetId 프리셋 ID
   * @param mapping 매핑
   */
  async createPresetMapping(
    presetId: string,
    mapping: Omit<IPresetMapping, 'id'>
  ): Promise<IPresetMapping | null> {
    const preset = await this.getPreset(presetId);
    if (preset) {
      const mappingId = crypto.randomUUID();
      const newMapping: IPresetMapping = {
        ...mapping,
        id: mappingId
      };

      const updatedPreset: IPreset = {
        ...preset,
        metadata: {
          ...preset.metadata,
          mappings: [...preset.metadata.mappings, newMapping]
        }
      };

      this.presets.set(presetId, updatedPreset);
      this.mappings.set(mappingId, newMapping);
      this.notifyEvent('mappingCreate', mappingId, newMapping);
      return newMapping;
    }
    return null;
  }

  /**
   * 프리셋 매핑 업데이트
   * @param mappingId 매핑 ID
   * @param mapping 매핑
   */
  async updatePresetMapping(
    mappingId: string,
    mapping: Partial<IPresetMapping>
  ): Promise<void> {
    const existingMapping = this.mappings.get(mappingId);
    if (existingMapping) {
      const updatedMapping = { ...existingMapping, ...mapping };
      this.mappings.set(mappingId, updatedMapping);
      this.notifyEvent('mappingUpdate', mappingId, updatedMapping);
    }
  }

  /**
   * 프리셋 매핑 삭제
   * @param mappingId 매핑 ID
   */
  async deletePresetMapping(mappingId: string): Promise<void> {
    this.mappings.delete(mappingId);
    this.notifyEvent('mappingDelete', mappingId);
  }

  /**
   * 매핑 우선순위 업데이트
   * @param mappingIds 매핑 ID 목록
   */
  async updateMappingPriority(mappingIds: string[]): Promise<void> {
    mappingIds.forEach((id, index) => {
      const mapping = this.mappings.get(id);
      if (mapping) {
        const updatedMapping = { ...mapping, priority: index };
        this.mappings.set(id, updatedMapping);
        this.notifyEvent('mappingPriorityUpdate', id, updatedMapping);
      }
    });
  }

  /**
   * 프리셋 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToPresetEvents(callback: (event: any) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * 프리셋 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromPresetEvents(callback: (event: any) => void): void {
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
} 