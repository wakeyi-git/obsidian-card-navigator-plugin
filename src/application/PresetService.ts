import { IPreset, PresetData, Preset } from '../domain/preset/Preset';

/**
 * 프리셋 서비스 인터페이스
 * 프리셋 관리를 위한 인터페이스입니다.
 */
export interface IPresetService {
  /**
   * 모든 프리셋 가져오기
   * @returns 모든 프리셋 목록
   */
  getAllPresets(): IPreset[];
  
  /**
   * 특정 ID의 프리셋 가져오기
   * @param id 프리셋 ID
   * @returns 프리셋 또는 null
   */
  getPresetById(id: string): IPreset | null;
  
  /**
   * 프리셋 추가
   * @param preset 추가할 프리셋
   * @returns 추가된 프리셋
   */
  addPreset(preset: IPreset): IPreset;
  
  /**
   * 새 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명 (선택 사항)
   * @returns 생성된 프리셋
   */
  createPreset(name: string, description?: string): Promise<IPreset>;
  
  /**
   * 프리셋 업데이트
   * @param id 업데이트할 프리셋 ID
   * @param preset 업데이트할 프리셋 데이터
   * @returns 업데이트된 프리셋
   */
  updatePreset(id: string, preset: Partial<IPreset>): IPreset | null;
  
  /**
   * 프리셋 삭제
   * @param id 삭제할 프리셋 ID
   * @returns 삭제 성공 여부
   */
  deletePreset(id: string): boolean;
  
  /**
   * 프리셋 적용
   * @param id 적용할 프리셋 ID
   * @returns 적용 성공 여부
   */
  applyPreset(id: string): boolean;
  
  /**
   * 프리셋 저장
   * 현재 설정을 새 프리셋으로 저장합니다.
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @returns 저장된 프리셋
   */
  saveCurrentAsPreset(name: string, description?: string): IPreset;
  
  /**
   * 프리셋 내보내기
   * @param id 내보낼 프리셋 ID
   * @returns 직렬화된 프리셋 데이터
   */
  exportPreset(id: string): PresetData | null;
  
  /**
   * 프리셋 가져오기
   * @param data 가져올 프리셋 데이터
   * @returns 가져온 프리셋
   */
  importPreset(data: PresetData): IPreset | null;
}

/**
 * 프리셋 서비스 구현 클래스
 * 프리셋 관리를 위한 클래스입니다.
 */
export class PresetService implements IPresetService {
  private presets: Map<string, IPreset>;
  
  /**
   * 생성자
   * @param settings 설정 객체 (선택 사항)
   */
  constructor(settings?: any) {
    this.presets = new Map<string, IPreset>();
    
    // 설정에서 프리셋 로드
    if (settings && settings.presets) {
      const presetNames = settings.presets || [];
      
      presetNames.forEach((presetName: string) => {
        const presetKey = `preset_${presetName}`;
        const presetData = settings[presetKey];
        
        if (presetData) {
          const preset = new Preset(
            presetData.id || presetName,
            presetData.name || presetName,
            presetData.description || '',
            presetData.settings || {}
          );
          
          this.presets.set(preset.id, preset);
        }
      });
    }
  }
  
  getAllPresets(): IPreset[] {
    return Array.from(this.presets.values());
  }
  
  getPresetById(id: string): IPreset | null {
    return this.presets.get(id) || null;
  }
  
  addPreset(preset: IPreset): IPreset {
    this.presets.set(preset.id, preset);
    return preset;
  }
  
  async createPreset(name: string, description?: string): Promise<IPreset> {
    // 새 프리셋 ID 생성 (UUID 형식)
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    
    // 프리셋 객체 생성
    const preset = new Preset(
      id,
      name,
      description
    );
    
    // 프리셋 추가
    this.addPreset(preset);
    
    return preset;
  }
  
  updatePreset(id: string, presetData: Partial<IPreset>): IPreset | null {
    const preset = this.getPresetById(id);
    if (!preset) {
      return null;
    }
    
    // 프리셋 업데이트
    Object.assign(preset, presetData);
    
    return preset;
  }
  
  deletePreset(id: string): boolean {
    return this.presets.delete(id);
  }
  
  applyPreset(id: string): boolean {
    const preset = this.getPresetById(id);
    if (!preset) {
      return false;
    }
    
    // 프리셋 적용 로직
    // 실제 구현에서는 카드 세트, 레이아웃, 필터, 정렬, 검색 등을 설정
    
    return true;
  }
  
  saveCurrentAsPreset(name: string, description?: string): IPreset {
    // 현재 설정으로 새 프리셋 생성
    const id = `preset-${Date.now()}`;
    const preset = new Preset(id, name, description);
    
    // 현재 설정 저장
    // 실제 구현에서는 현재 카드 세트, 레이아웃, 필터, 정렬, 검색 등을 저장
    
    this.addPreset(preset);
    
    return preset;
  }
  
  exportPreset(id: string): PresetData | null {
    const preset = this.getPresetById(id);
    if (!preset) {
      return null;
    }
    
    return preset.serialize();
  }
  
  importPreset(data: PresetData): IPreset | null {
    try {
      // 프리셋 데이터 검증
      if (!data.id || !data.name) {
        return null;
      }
      
      // 새 프리셋 생성
      const preset = new Preset(data.id, data.name, data.description);
      
      // 프리셋 데이터 설정
      // 실제 구현에서는 카드 세트, 레이아웃, 필터, 정렬, 검색 등을 설정
      
      this.addPreset(preset);
      
      return preset;
    } catch (error) {
      console.error('Error importing preset:', error);
      return null;
    }
  }
  
  /**
   * 프리셋 초기화
   * 모든 프리셋을 초기화합니다.
   */
  clearPresets(): void {
    this.presets.clear();
  }
  
  /**
   * 프리셋 복제
   * @param id 복제할 프리셋 ID
   * @returns 복제된 프리셋
   */
  clonePreset(id: string): IPreset | null {
    const preset = this.getPresetById(id);
    if (!preset) {
      return null;
    }
    
    const clonedPreset = preset.clone();
    clonedPreset.id = `preset-${Date.now()}`;
    clonedPreset.name = `${preset.name} (복사본)`;
    
    this.addPreset(clonedPreset);
    
    return clonedPreset;
  }
} 