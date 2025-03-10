import { IPreset, IPresetApplyResult } from './Preset';

/**
 * 매핑 타입
 * 프리셋 매핑 타입을 정의합니다.
 */
export type PresetMappingType = 'folder' | 'tag' | 'created' | 'modified' | 'property';

/**
 * 날짜 범위
 * 날짜 기반 매핑을 위한 범위를 정의합니다.
 */
export interface IDateRange {
  /**
   * 시작일 (ISO 문자열)
   */
  start?: string;
  
  /**
   * 종료일 (ISO 문자열)
   */
  end?: string;
  
  /**
   * 상대적 날짜 범위 (시작일/종료일 대신 사용 가능)
   */
  relative?: {
    /**
     * 단위
     */
    unit: 'day' | 'week' | 'month' | 'year';
    
    /**
     * 값
     */
    value: number;
    
    /**
     * 기준점
     */
    reference: 'now' | 'start-of-week' | 'start-of-month' | 'start-of-year';
  };
  
  /**
   * 날짜 패턴
   * 특정 패턴에 맞는 날짜를 매핑합니다.
   */
  pattern?: {
    /**
     * 패턴 타입
     */
    type: 'weekday' | 'month' | 'year' | 'day-of-month';
    
    /**
     * 패턴 값
     * - weekday: 0-6 (일요일-토요일)
     * - month: 0-11 (1월-12월)
     * - year: 연도
     * - day-of-month: 1-31
     */
    value: number | number[];
  };
}

/**
 * 프로퍼티 조건
 * 프로퍼티 기반 매핑을 위한 조건을 정의합니다.
 */
export interface IPropertyCondition {
  /**
   * 프로퍼티 키
   */
  key: string;
  
  /**
   * 연산자
   */
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than' | 'exists' | 'not-exists';
  
  /**
   * 프로퍼티 값
   * operator가 'exists' 또는 'not-exists'인 경우 사용하지 않습니다.
   */
  value?: any;
}

/**
 * 프리셋 매핑 인터페이스
 * 폴더, 태그, 날짜 등에 프리셋을 매핑하기 위한 인터페이스입니다.
 */
export interface IPresetMapping {
  /**
   * 매핑 ID
   */
  id: string;
  
  /**
   * 매핑 타입
   */
  type: PresetMappingType;
  
  /**
   * 매핑 대상
   * - folder: 폴더 경로
   * - tag: 태그 이름
   * - created/modified: 사용하지 않음 (dateRange 사용)
   * - property: 사용하지 않음 (propertyCondition 사용)
   */
  target?: string;
  
  /**
   * 날짜 범위 (created/modified 타입인 경우)
   */
  dateRange?: IDateRange;
  
  /**
   * 프로퍼티 조건 (property 타입인 경우)
   */
  propertyCondition?: IPropertyCondition;
  
  /**
   * 하위 폴더 포함 여부 (folder 타입인 경우)
   */
  includeSubfolders?: boolean;
  
  /**
   * 프리셋 ID
   */
  presetId: string;
  
  /**
   * 우선 순위
   * 숫자가 낮을수록 우선 순위가 높습니다.
   */
  priority: number;
  
  /**
   * 설명
   */
  description?: string;
}

/**
 * 프리셋 컨텍스트 인터페이스
 * 프리셋 적용 컨텍스트를 정의합니다.
 */
export interface IPresetContext {
  /**
   * 폴더 경로
   */
  folderPath?: string;
  
  /**
   * 태그 목록
   */
  tags?: string[];
  
  /**
   * 생성일
   */
  creationDate?: Date;
  
  /**
   * 수정일
   */
  modificationDate?: Date;
}

/**
 * 프리셋 매핑 평가 결과
 * 프리셋 매핑 평가 결과를 정의합니다.
 */
export interface IPresetMappingEvaluationResult {
  /**
   * 매핑 ID
   */
  mappingId: string;
  
  /**
   * 프리셋 ID
   */
  presetId: string;
  
  /**
   * 매칭 여부
   */
  matches: boolean;
  
  /**
   * 우선 순위
   */
  priority: number;
}

/**
 * 날짜 기반 매핑 평가 컨텍스트
 * 날짜 기반 매핑 평가에 필요한 정보를 정의합니다.
 */
export interface IDateMappingEvaluationContext {
  /**
   * 생성일
   */
  createdDate?: Date;
  
  /**
   * 수정일
   */
  modifiedDate?: Date;
}

/**
 * 프로퍼티 기반 매핑 평가 컨텍스트
 * 프로퍼티 기반 매핑 평가에 필요한 정보를 정의합니다.
 */
export interface IPropertyMappingEvaluationContext {
  /**
   * 프로퍼티 맵
   */
  properties: Record<string, any>;
}

/**
 * 프리셋 매핑 평가 컨텍스트
 * 프리셋 매핑 평가에 필요한 정보를 정의합니다.
 */
export interface IPresetMappingEvaluationContext {
  /**
   * 파일 경로
   */
  filePath: string;
  
  /**
   * 태그 목록
   */
  tags: string[];
  
  /**
   * 날짜 컨텍스트
   */
  dateContext: IDateMappingEvaluationContext;
  
  /**
   * 프로퍼티 컨텍스트
   */
  propertyContext: IPropertyMappingEvaluationContext;
}

/**
 * 프리셋 관리자 인터페이스
 * 프리셋 관리 기능을 정의합니다.
 */
export interface IPresetManager {
  /**
   * 모든 프리셋 가져오기
   * @returns 프리셋 목록
   */
  getAllPresets(): IPreset[];
  
  /**
   * 프리셋 가져오기
   * @param id 프리셋 ID
   * @returns 프리셋 또는 undefined
   */
  getPreset(id: string): IPreset | undefined;
  
  /**
   * 프리셋 추가
   * @param preset 프리셋
   * @returns 추가된 프리셋
   */
  addPreset(preset: IPreset): IPreset;
  
  /**
   * 프리셋 업데이트
   * @param id 프리셋 ID
   * @param preset 업데이트할 프리셋 데이터
   * @returns 업데이트된 프리셋
   */
  updatePreset(id: string, preset: Partial<IPreset>): IPreset;
  
  /**
   * 프리셋 삭제
   * @param id 프리셋 ID
   * @returns 삭제 성공 여부
   */
  deletePreset(id: string): boolean;
  
  /**
   * 프리셋 적용
   * @param id 프리셋 ID
   * @returns 적용 결과
   */
  applyPreset(id: string): IPresetApplyResult;
  
  /**
   * 모든 매핑 가져오기
   * @returns 매핑 목록
   */
  getAllMappings(): IPresetMapping[];
  
  /**
   * 매핑 가져오기
   * @param id 매핑 ID
   * @returns 매핑 또는 undefined
   */
  getMapping(id: string): IPresetMapping | undefined;
  
  /**
   * 매핑 추가
   * @param mapping 매핑
   * @returns 추가된 매핑
   */
  addMapping(mapping: IPresetMapping): IPresetMapping;
  
  /**
   * 매핑 업데이트
   * @param id 매핑 ID
   * @param mapping 업데이트할 매핑 데이터
   * @returns 업데이트된 매핑
   */
  updateMapping(id: string, mapping: Partial<IPresetMapping>): IPresetMapping;
  
  /**
   * 매핑 삭제
   * @param id 매핑 ID
   * @returns 삭제 성공 여부
   */
  deleteMapping(id: string): boolean;
  
  /**
   * 매핑 평가
   * 주어진 컨텍스트에 대해 모든 매핑을 평가합니다.
   * @param context 평가 컨텍스트
   * @returns 평가 결과 목록
   */
  evaluateMappings(context: IPresetMappingEvaluationContext): IPresetMappingEvaluationResult[];
  
  /**
   * 폴더 매핑 평가
   * 주어진 파일 경로가 폴더 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param filePath 파일 경로
   * @returns 일치 여부
   */
  evaluateFolderMapping(mapping: IPresetMapping, filePath: string): boolean;
  
  /**
   * 태그 매핑 평가
   * 주어진 태그 목록이 태그 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param tags 태그 목록
   * @returns 일치 여부
   */
  evaluateTagMapping(mapping: IPresetMapping, tags: string[]): boolean;
  
  /**
   * 날짜 매핑 평가
   * 주어진 날짜가 날짜 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param date 날짜
   * @returns 일치 여부
   */
  evaluateDateMapping(mapping: IPresetMapping, date: Date): boolean;
  
  /**
   * 프로퍼티 매핑 평가
   * 주어진 프로퍼티가 프로퍼티 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param properties 프로퍼티 맵
   * @returns 일치 여부
   */
  evaluatePropertyMapping(mapping: IPresetMapping, properties: Record<string, any>): boolean;
  
  /**
   * 프로퍼티 조건 평가
   * 주어진 프로퍼티가 조건을 만족하는지 평가합니다.
   * @param condition 프로퍼티 조건
   * @param properties 프로퍼티 맵
   * @returns 만족 여부
   */
  evaluatePropertyCondition(condition: IPropertyCondition, properties: Record<string, any>): boolean;
}

/**
 * 프리셋 매니저 클래스
 * 프리셋 관리 기능을 제공합니다.
 */
export class PresetManager implements IPresetManager {
  /**
   * 프리셋 목록
   */
  private presets: Map<string, IPreset> = new Map();
  
  /**
   * 매핑 목록
   */
  private mappings: IPresetMapping[] = [];
  
  /**
   * 생성자
   */
  constructor() {
    // 초기화 로직
  }
  
  /**
   * 모든 프리셋 가져오기
   * @returns 프리셋 목록
   */
  getAllPresets(): IPreset[] {
    return Array.from(this.presets.values());
  }
  
  /**
   * 프리셋 가져오기
   * @param id 프리셋 ID
   * @returns 프리셋 또는 undefined
   */
  getPreset(id: string): IPreset | undefined {
    return this.presets.get(id);
  }
  
  /**
   * 프리셋 추가
   * @param preset 프리셋
   * @returns 추가된 프리셋
   */
  addPreset(preset: IPreset): IPreset {
    this.presets.set(preset.id, preset);
    return preset;
  }
  
  /**
   * 프리셋 업데이트
   * @param id 프리셋 ID
   * @param preset 업데이트할 프리셋 데이터
   * @returns 업데이트된 프리셋
   */
  updatePreset(id: string, preset: Partial<IPreset>): IPreset {
    const existingPreset = this.presets.get(id);
    if (!existingPreset) {
      throw new Error(`프리셋을 찾을 수 없습니다: ${id}`);
    }
    
    const updatedPreset = { ...existingPreset, ...preset, updatedAt: Date.now() };
    this.presets.set(id, updatedPreset);
    return updatedPreset;
  }
  
  /**
   * 프리셋 삭제
   * @param id 프리셋 ID
   * @returns 삭제 성공 여부
   */
  deletePreset(id: string): boolean {
    return this.presets.delete(id);
  }
  
  /**
   * 프리셋 적용
   * @param id 프리셋 ID
   * @returns 적용 결과
   */
  applyPreset(id: string): IPresetApplyResult {
    const preset = this.presets.get(id);
    if (!preset) {
      return {
        presetId: id,
        presetName: '',
        success: false,
        appliedSettings: [],
        errorMessage: `프리셋을 찾을 수 없습니다: ${id}`
      };
    }
    
    // 프리셋 적용 로직 구현
    return {
      presetId: id,
      presetName: preset.name,
      success: true,
      appliedSettings: []
    };
  }
  
  /**
   * 모든 매핑 가져오기
   * @returns 매핑 목록
   */
  getAllMappings(): IPresetMapping[] {
    return [...this.mappings];
  }
  
  /**
   * 매핑 가져오기
   * @param id 매핑 ID
   * @returns 매핑 또는 undefined
   */
  getMapping(id: string): IPresetMapping | undefined {
    return this.mappings.find(mapping => mapping.id === id);
  }
  
  /**
   * 매핑 추가
   * @param mapping 매핑
   * @returns 추가된 매핑
   */
  addMapping(mapping: IPresetMapping): IPresetMapping {
    this.mappings.push(mapping);
    return mapping;
  }
  
  /**
   * 매핑 업데이트
   * @param id 매핑 ID
   * @param mapping 업데이트할 매핑 데이터
   * @returns 업데이트된 매핑
   */
  updateMapping(id: string, mapping: Partial<IPresetMapping>): IPresetMapping {
    const index = this.mappings.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error(`매핑을 찾을 수 없습니다: ${id}`);
    }
    
    const updatedMapping = { ...this.mappings[index], ...mapping };
    this.mappings[index] = updatedMapping;
    return updatedMapping;
  }
  
  /**
   * 매핑 삭제
   * @param id 매핑 ID
   * @returns 삭제 성공 여부
   */
  deleteMapping(id: string): boolean {
    const index = this.mappings.findIndex(m => m.id === id);
    if (index === -1) {
      return false;
    }
    
    this.mappings.splice(index, 1);
    return true;
  }
  
  /**
   * 매핑 평가
   * 주어진 컨텍스트에 대해 모든 매핑을 평가합니다.
   * @param context 평가 컨텍스트
   * @returns 평가 결과 목록
   */
  evaluateMappings(context: IPresetMappingEvaluationContext): IPresetMappingEvaluationResult[] {
    const results: IPresetMappingEvaluationResult[] = [];
    
    for (const mapping of this.mappings) {
      let matches = false;
      
      switch (mapping.type) {
        case 'folder':
          matches = this.evaluateFolderMapping(mapping, context.filePath);
          break;
          
        case 'tag':
          matches = this.evaluateTagMapping(mapping, context.tags);
          break;
          
        case 'created':
          if (context.dateContext.createdDate) {
            matches = this.evaluateDateMapping(mapping, context.dateContext.createdDate);
          }
          break;
          
        case 'modified':
          if (context.dateContext.modifiedDate) {
            matches = this.evaluateDateMapping(mapping, context.dateContext.modifiedDate);
          }
          break;
          
        case 'property':
          matches = this.evaluatePropertyMapping(mapping, context.propertyContext.properties);
          break;
      }
      
      results.push({
        mappingId: mapping.id,
        presetId: mapping.presetId,
        matches,
        priority: mapping.priority
      });
    }
    
    return results;
  }
  
  /**
   * 폴더 매핑 평가
   * 주어진 파일 경로가 폴더 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param filePath 파일 경로
   * @returns 일치 여부
   */
  evaluateFolderMapping(mapping: IPresetMapping, filePath: string): boolean {
    if (mapping.type !== 'folder' || !mapping.target) {
      return false;
    }
    
    const folderPath = mapping.target;
    
    if (mapping.includeSubfolders) {
      // 하위 폴더 포함 검사
      return filePath.startsWith(folderPath);
    } else {
      // 정확한 폴더 검사
      const fileFolder = filePath.substring(0, filePath.lastIndexOf('/'));
      return fileFolder === folderPath;
    }
  }
  
  /**
   * 태그 매핑 평가
   * 주어진 태그 목록이 태그 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param tags 태그 목록
   * @returns 일치 여부
   */
  evaluateTagMapping(mapping: IPresetMapping, tags: string[]): boolean {
    if (mapping.type !== 'tag' || !mapping.target) {
      return false;
    }
    
    const tagName = mapping.target;
    return tags.includes(tagName);
  }
  
  /**
   * 날짜 매핑 평가
   * 주어진 날짜가 날짜 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param date 날짜
   * @returns 일치 여부
   */
  evaluateDateMapping(mapping: IPresetMapping, date: Date): boolean {
    if ((mapping.type !== 'created' && mapping.type !== 'modified') || !mapping.dateRange) {
      return false;
    }
    
    const { dateRange } = mapping;
    
    // 시작일/종료일 검사
    if (dateRange.start || dateRange.end) {
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      if (startDate && date < startDate) {
        return false;
      }
      
      if (endDate && date > endDate) {
        return false;
      }
      
      return true;
    }
    
    // 상대적 날짜 범위 검사
    if (dateRange.relative) {
      // 상대적 날짜 범위 로직 구현
      return true;
    }
    
    // 날짜 패턴 검사
    if (dateRange.pattern) {
      // 날짜 패턴 로직 구현
      return true;
    }
    
    return false;
  }
  
  /**
   * 프로퍼티 매핑 평가
   * 주어진 프로퍼티가 프로퍼티 매핑과 일치하는지 평가합니다.
   * @param mapping 매핑
   * @param properties 프로퍼티 맵
   * @returns 일치 여부
   */
  evaluatePropertyMapping(mapping: IPresetMapping, properties: Record<string, any>): boolean {
    if (mapping.type !== 'property' || !mapping.propertyCondition) {
      return false;
    }
    
    return this.evaluatePropertyCondition(mapping.propertyCondition, properties);
  }
  
  /**
   * 프로퍼티 조건 평가
   * 주어진 프로퍼티가 조건을 만족하는지 평가합니다.
   * @param condition 프로퍼티 조건
   * @param properties 프로퍼티 맵
   * @returns 만족 여부
   */
  evaluatePropertyCondition(condition: IPropertyCondition, properties: Record<string, any>): boolean {
    const { key, operator, value } = condition;
    const propertyValue = properties[key];
    
    switch (operator) {
      case 'equals':
        return propertyValue === value;
        
      case 'not-equals':
        return propertyValue !== value;
        
      case 'contains':
        if (typeof propertyValue === 'string') {
          return propertyValue.includes(String(value));
        }
        return false;
        
      case 'not-contains':
        if (typeof propertyValue === 'string') {
          return !propertyValue.includes(String(value));
        }
        return true;
        
      case 'greater-than':
        return propertyValue > value;
        
      case 'less-than':
        return propertyValue < value;
        
      case 'exists':
        return propertyValue !== undefined;
        
      case 'not-exists':
        return propertyValue === undefined;
        
      default:
        return false;
    }
  }
}