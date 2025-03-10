import { IPreset, IPresetApplyResult } from '../domain/preset/Preset';
import { IPresetContext, IPresetManager, IPresetMapping, PresetMappingType } from '../domain/preset/PresetManager';
import { ICard } from '../domain/card/Card';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { EventType } from '../domain/events/EventTypes';

/**
 * 프리셋 서비스 클래스
 * 프리셋 관련 애플리케이션 유스케이스를 구현합니다.
 */
export class PresetService {
  /**
   * 프리셋 매니저
   */
  private presetManager: IPresetManager;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 생성자
   * @param presetManager 프리셋 매니저
   */
  constructor(presetManager: IPresetManager) {
    this.presetManager = presetManager;
    this.eventBus = DomainEventBus.getInstance();
  }
  
  /**
   * 프리셋 적용
   * @param presetId 프리셋 ID
   * @returns 적용 결과
   */
  applyPreset(presetId: string): IPresetApplyResult {
    const result = this.presetManager.applyPreset(presetId);
    
    if (result.success) {
      // 프리셋 적용 이벤트 발생
      this.eventBus.emit(EventType.SETTINGS_CHANGED, {
        settings: { presetId },
        changedKeys: ['presetId']
      });
    }
    
    return result;
  }
  
  /**
   * 카드에 프리셋 적용
   * @param presetId 프리셋 ID
   * @param card 카드
   */
  applyPresetToCard(presetId: string, card: ICard): void {
    const preset = this.presetManager.getPreset(presetId);
    if (!preset) return;
    
    // 카드에 프리셋 적용 로직 구현
    // 이 로직은 카드의 표시 설정 등을 변경합니다.
    
    // 카드 업데이트 이벤트 발생
    this.eventBus.emit(EventType.CARD_DISPLAY_SETTINGS_CHANGED, {
      settings: preset.cardDisplaySettings || {}
    });
  }
  
  /**
   * 컨텍스트에 맞는 최적의 프리셋 찾기
   * @param context 컨텍스트 정보
   * @returns 프리셋 또는 undefined
   */
  findBestPresetForContext(context: IPresetContext): IPreset | undefined {
    // 컨텍스트 정보를 평가 컨텍스트로 변환
    const evaluationContext = this.createEvaluationContext(context);
    
    // 모든 매핑 평가
    const results = this.presetManager.evaluateMappings(evaluationContext);
    
    // 매칭되는 매핑 중 우선순위가 가장 높은 것 선택
    const matchingResults = results.filter(result => result.matches);
    if (matchingResults.length === 0) return undefined;
    
    // 우선순위 기준 정렬 (낮은 값이 높은 우선순위)
    matchingResults.sort((a, b) => a.priority - b.priority);
    
    // 가장 높은 우선순위의 매핑에 해당하는 프리셋 반환
    const bestResult = matchingResults[0];
    return this.presetManager.getPreset(bestResult.presetId);
  }
  
  /**
   * 폴더에 적용할 프리셋 찾기
   * @param folderPath 폴더 경로
   * @returns 프리셋 또는 undefined
   */
  findPresetForFolder(folderPath: string): IPreset | undefined {
    return this.findBestPresetForContext({ folderPath });
  }
  
  /**
   * 태그에 적용할 프리셋 찾기
   * @param tag 태그 이름
   * @returns 프리셋 또는 undefined
   */
  findPresetForTag(tag: string): IPreset | undefined {
    return this.findBestPresetForContext({ tags: [tag] });
  }
  
  /**
   * 생성일 기반 프리셋 찾기
   * @param date 날짜
   * @returns 프리셋 또는 undefined
   */
  findPresetForCreationDate(date: Date): IPreset | undefined {
    return this.findBestPresetForContext({ creationDate: date });
  }
  
  /**
   * 수정일 기반 프리셋 찾기
   * @param date 날짜
   * @returns 프리셋 또는 undefined
   */
  findPresetForModificationDate(date: Date): IPreset | undefined {
    return this.findBestPresetForContext({ modificationDate: date });
  }
  
  /**
   * 프리셋 내보내기
   * @param id 프리셋 ID
   * @returns JSON 문자열
   */
  exportPreset(id: string): string {
    const preset = this.presetManager.getPreset(id);
    if (!preset) return '';
    
    return JSON.stringify(preset, null, 2);
  }
  
  /**
   * 프리셋 가져오기
   * @param json JSON 문자열
   * @returns 가져온 프리셋
   */
  importPreset(json: string): IPreset | undefined {
    try {
      const preset = JSON.parse(json) as IPreset;
      
      // 기본 유효성 검사
      if (!preset.id || !preset.name) {
        throw new Error('유효하지 않은 프리셋 형식');
      }
      
      // 프리셋 추가
      return this.presetManager.addPreset(preset);
    } catch (error) {
      console.error('프리셋 가져오기 실패:', error);
      return undefined;
    }
  }
  
  /**
   * 현재 설정으로 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param settings 현재 설정
   * @returns 생성된 프리셋
   */
  createPresetFromCurrentSettings(
    name: string,
    description: string,
    settings: any
  ): IPreset {
    // 현재 설정에서 프리셋 관련 설정 추출
    const preset: IPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      cardSetSourceType: settings.cardSetSourceType,
      cardSetSource: settings.cardSetSource,
      layoutType: settings.layoutType,
      sortType: settings.sortType,
      sortDirection: settings.sortDirection,
      cardDisplaySettings: settings.cardDisplaySettings,
      layoutSettings: settings.layoutSettings,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // 프리셋 추가
    return this.presetManager.addPreset(preset);
  }
  
  /**
   * 프리셋으로 현재 설정 업데이트
   * @param id 프리셋 ID
   * @param currentSettings 현재 설정
   * @returns 업데이트된 프리셋
   */
  updatePresetWithCurrentSettings(
    id: string,
    currentSettings: any
  ): IPreset | undefined {
    const preset = this.presetManager.getPreset(id);
    if (!preset) return undefined;
    
    // 현재 설정에서 프리셋 관련 설정 추출
    const updatedPreset: Partial<IPreset> = {
      cardSetSourceType: currentSettings.cardSetSourceType,
      cardSetSource: currentSettings.cardSetSource,
      layoutType: currentSettings.layoutType,
      sortType: currentSettings.sortType,
      sortDirection: currentSettings.sortDirection,
      cardDisplaySettings: currentSettings.cardDisplaySettings,
      layoutSettings: currentSettings.layoutSettings,
      updatedAt: Date.now()
    };
    
    // 프리셋 업데이트
    return this.presetManager.updatePreset(id, updatedPreset);
  }
  
  /**
   * 프리셋 복제
   * @param id 복제할 프리셋 ID
   * @param newName 새 프리셋 이름
   * @returns 복제된 프리셋
   */
  clonePreset(id: string, newName: string): IPreset | undefined {
    const preset = this.presetManager.getPreset(id);
    if (!preset) return undefined;
    
    // 새 프리셋 생성
    const clonedPreset: IPreset = {
      ...preset,
      id: `preset-${Date.now()}`,
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // 프리셋 추가
    return this.presetManager.addPreset(clonedPreset);
  }
  
  /**
   * 타입별 매핑 가져오기
   * @param type 매핑 타입
   * @returns 매핑 목록
   */
  getMappingsByType(type: PresetMappingType): IPresetMapping[] {
    return this.presetManager.getAllMappings().filter(mapping => mapping.type === type);
  }
  
  /**
   * 매핑 우선순위 변경
   * @param id 매핑 ID
   * @param newPriority 새 우선순위
   * @returns 성공 여부
   */
  changeMappingPriority(id: string, newPriority: number): boolean {
    const mapping = this.presetManager.getMapping(id);
    if (!mapping) return false;
    
    try {
      this.presetManager.updateMapping(id, { priority: newPriority });
      return true;
    } catch (error) {
      console.error('매핑 우선순위 변경 실패:', error);
      return false;
    }
  }
  
  /**
   * 매핑 위로 이동 (우선순위 증가)
   * @param id 매핑 ID
   * @returns 성공 여부
   */
  moveMappingUp(id: string): boolean {
    const mapping = this.presetManager.getMapping(id);
    if (!mapping) return false;
    
    const mappings = this.presetManager.getAllMappings();
    const index = mappings.findIndex(m => m.id === id);
    if (index <= 0) return false;
    
    const prevMapping = mappings[index - 1];
    
    // 우선순위 교환
    try {
      this.presetManager.updateMapping(id, { priority: prevMapping.priority });
      this.presetManager.updateMapping(prevMapping.id, { priority: mapping.priority });
      return true;
    } catch (error) {
      console.error('매핑 위로 이동 실패:', error);
      return false;
    }
  }
  
  /**
   * 매핑 아래로 이동 (우선순위 감소)
   * @param id 매핑 ID
   * @returns 성공 여부
   */
  moveMappingDown(id: string): boolean {
    const mapping = this.presetManager.getMapping(id);
    if (!mapping) return false;
    
    const mappings = this.presetManager.getAllMappings();
    const index = mappings.findIndex(m => m.id === id);
    if (index < 0 || index >= mappings.length - 1) return false;
    
    const nextMapping = mappings[index + 1];
    
    // 우선순위 교환
    try {
      this.presetManager.updateMapping(id, { priority: nextMapping.priority });
      this.presetManager.updateMapping(nextMapping.id, { priority: mapping.priority });
      return true;
    } catch (error) {
      console.error('매핑 아래로 이동 실패:', error);
      return false;
    }
  }
  
  /**
   * 평가 컨텍스트 생성
   * @param context 컨텍스트 정보
   * @returns 평가 컨텍스트
   */
  private createEvaluationContext(context: IPresetContext): any {
    return {
      filePath: context.folderPath || '',
      tags: context.tags || [],
      dateContext: {
        createdDate: context.creationDate,
        modifiedDate: context.modificationDate
      },
      propertyContext: {
        properties: {}
      }
    };
  }
} 