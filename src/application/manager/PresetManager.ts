import { IPresetManager, IPresetEvent, IPresetState, IPresetMappingState } from '../../domain/managers/IPresetManager';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { IPreset, IPresetMapping, PresetMappingType } from '@/domain/models/Preset';
import { ICard } from '@/domain/models/Card';
import { TFile } from 'obsidian';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 프리셋 관리자 구현체
 */
export class PresetManager implements IPresetManager {
  private static instance: PresetManager;
  private initialized: boolean = false;
  private presetStates: Map<string, IPresetState> = new Map();
  private presetMappingStates: Map<string, IPresetMappingState> = new Map();
  private eventSubscribers: Set<(event: IPresetEvent) => void> = new Set();
  private presets: IPreset[] = [];
  private mappings: IPresetMapping[] = [];

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      const container = Container.getInstance();
      PresetManager.instance = new PresetManager(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return PresetManager.instance;
  }

  /**
   * 초기화
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.logger.debug('프리셋 관리자 초기화 완료');
  }

  /**
   * 정리
   */
  public cleanup(): void {
    const timer = this.performanceMonitor.startTimer('PresetManager.cleanup');
    try {
      this.presetStates.clear();
      this.presetMappingStates.clear();
      this.eventSubscribers.clear();
      this.initialized = false;
      this.logger.debug('프리셋 관리자 정리 완료');
    } catch (error) {
      this.logger.error('프리셋 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'PresetManager.cleanup');
    } finally {
      timer.stop();
    }
  }

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 프리셋 상태 등록
   * @param presetId 프리셋 ID
   * @param state 프리셋 상태
   */
  public registerPresetState(presetId: string, state: IPresetState): void {
    this.presetStates.set(presetId, state);
    this.notifyEvent({
      type: 'preset_created',
      presetId,
      timestamp: new Date()
    });
  }

  /**
   * 프리셋 상태 등록 해제
   * @param presetId 프리셋 ID
   */
  public unregisterPresetState(presetId: string): void {
    this.presetStates.delete(presetId);
    this.notifyEvent({
      type: 'preset_deleted',
      presetId,
      timestamp: new Date()
    });
  }

  /**
   * 프리셋 상태 조회
   * @param presetId 프리셋 ID
   * @returns 프리셋 상태
   */
  public getPresetState(presetId: string): IPresetState | null {
    return this.presetStates.get(presetId) || null;
  }

  /**
   * 모든 프리셋 상태 조회
   * @returns 프리셋 상태 Map
   */
  public getPresetStates(): Map<string, IPresetState> {
    return new Map(this.presetStates);
  }

  /**
   * 프리셋 상태 업데이트
   * @param presetId 프리셋 ID
   * @param state 업데이트할 프리셋 상태
   */
  public updatePresetState(presetId: string, state: Partial<IPresetState>): void {
    const existingState = this.presetStates.get(presetId);
    if (!existingState) {
      return;
    }

    const updatedState = { ...existingState, ...state };
    this.presetStates.set(presetId, updatedState);
    
    this.notifyEvent({
      type: 'preset_updated',
      presetId,
      timestamp: new Date()
    });
  }

  /**
   * 프리셋 매핑 상태 등록
   * @param mappingId 매핑 ID
   * @param state 매핑 상태
   */
  public registerPresetMappingState(mappingId: string, state: IPresetMappingState): void {
    this.presetMappingStates.set(mappingId, state);
    this.notifyEvent({
      type: 'preset_mapping_added',
      presetId: state.presetId,
      mappingId,
      timestamp: new Date()
    });
  }

  /**
   * 프리셋 매핑 상태 등록 해제
   * @param mappingId 매핑 ID
   */
  public unregisterPresetMappingState(mappingId: string): void {
    const mapping = this.presetMappingStates.get(mappingId);
    if (!mapping) {
      return;
    }

    this.presetMappingStates.delete(mappingId);
    this.notifyEvent({
      type: 'preset_mapping_removed',
      presetId: mapping.presetId,
      mappingId,
      timestamp: new Date()
    });
  }

  /**
   * 프리셋 매핑 상태 조회
   * @param mappingId 매핑 ID
   * @returns 매핑 상태
   */
  public getPresetMappingState(mappingId: string): IPresetMappingState | null {
    return this.presetMappingStates.get(mappingId) || null;
  }

  /**
   * 모든 프리셋 매핑 상태 조회
   * @returns 매핑 상태 Map
   */
  public getPresetMappingStates(): Map<string, IPresetMappingState> {
    return new Map(this.presetMappingStates);
  }

  /**
   * 프리셋 매핑 상태 업데이트
   * @param mappingId 매핑 ID
   * @param state 업데이트할 매핑 상태
   */
  public updatePresetMappingState(mappingId: string, state: Partial<IPresetMappingState>): void {
    const existingState = this.presetMappingStates.get(mappingId);
    if (!existingState) {
      return;
    }

    const updatedState = { ...existingState, ...state };
    this.presetMappingStates.set(mappingId, updatedState);

    if (state.priority !== undefined) {
      this.notifyEvent({
        type: 'preset_mapping_priority_updated',
        presetId: existingState.presetId,
        mappingId,
        timestamp: new Date()
      });
    }
  }

  /**
   * 프리셋 이벤트 구독
   * @param callback 이벤트 콜백
   */
  public subscribeToPresetEvents(callback: (event: IPresetEvent) => void): void {
    this.eventSubscribers.add(callback);
  }

  /**
   * 프리셋 이벤트 구독 해제
   * @param callback 이벤트 콜백
   */
  public unsubscribeFromPresetEvents(callback: (event: IPresetEvent) => void): void {
    this.eventSubscribers.delete(callback);
  }

  /**
   * 이벤트 알림
   * @param event 이벤트
   */
  private notifyEvent(event: IPresetEvent): void {
    this.eventSubscribers.forEach(callback => callback(event));
  }

  /**
   * 카드에 적용할 프리셋 목록을 찾습니다.
   * @param card 카드
   * @returns 적용할 프리셋 배열
   */
  findApplicablePresets(card: ICard): IPreset[] {
    return this.mappings
      .filter(mapping => mapping.enabled)
      .filter(mapping => this.isMappingApplicable(mapping, card))
      .sort((a, b) => a.priority - b.priority)
      .map(mapping => this.presets.find(p => p.metadata.id === mapping.presetId))
      .filter((preset): preset is IPreset => preset !== undefined);
  }

  /**
   * 매핑이 적용 가능한지 확인합니다.
   * @param mapping 프리셋 매핑
   * @param card 카드
   * @returns 적용 가능 여부
   */
  private isMappingApplicable(mapping: IPresetMapping, card: ICard): boolean {
    switch (mapping.type) {
      case PresetMappingType.FOLDER:
        return this.isFolderMappingApplicable(mapping, card);
      case PresetMappingType.TAG:
        return this.isTagMappingApplicable(mapping, card);
      case PresetMappingType.CREATED_DATE:
        return this.isDateMappingApplicable(mapping, card.createdAt);
      case PresetMappingType.MODIFIED_DATE:
        return this.isDateMappingApplicable(mapping, card.updatedAt);
      case PresetMappingType.PROPERTY:
        return this.isPropertyMappingApplicable(mapping, card);
      default:
        return false;
    }
  }

  /**
   * 폴더 매핑이 적용 가능한지 확인합니다.
   * @param mapping 프리셋 매핑
   * @param card 카드
   * @returns 적용 가능 여부
   */
  private isFolderMappingApplicable(mapping: IPresetMapping, card: ICard): boolean {
    const folderPath = mapping.target;
    const includeSubfolders = mapping.options?.includeSubfolders ?? false;
    
    if (includeSubfolders) {
      return card.filePath.startsWith(folderPath);
    } else {
      return card.filePath === folderPath;
    }
  }

  /**
   * 태그 매핑이 적용 가능한지 확인합니다.
   * @param mapping 프리셋 매핑
   * @param card 카드
   * @returns 적용 가능 여부
   */
  private isTagMappingApplicable(mapping: IPresetMapping, card: ICard): boolean {
    const tag = mapping.target;
    const includeSubtags = mapping.options?.includeSubtags ?? false;
    
    if (includeSubtags) {
      return card.tags.some(t => t.startsWith(tag));
    } else {
      return card.tags.includes(tag);
    }
  }

  /**
   * 날짜 매핑이 적용 가능한지 확인합니다.
   * @param mapping 프리셋 매핑
   * @param date 날짜
   * @returns 적용 가능 여부
   */
  private isDateMappingApplicable(mapping: IPresetMapping, date: Date): boolean {
    const range = mapping.options?.dateRange;
    if (!range) return false;
    
    return date >= range.start && date <= range.end;
  }

  /**
   * 속성 매핑이 적용 가능한지 확인합니다.
   * @param mapping 프리셋 매핑
   * @param card 카드
   * @returns 적용 가능 여부
   */
  private isPropertyMappingApplicable(mapping: IPresetMapping, card: ICard): boolean {
    const property = mapping.options?.property;
    if (!property) return false;
    
    const value = card.properties[property.name];
    if (!value) return false;
    
    if (property.useRegex) {
      const regex = new RegExp(property.value);
      return regex.test(String(value));
    } else {
      return String(value) === property.value;
    }
  }
}