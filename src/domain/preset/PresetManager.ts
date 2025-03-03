import { IPreset, Preset, PresetData } from './Preset';

/**
 * 프리셋 관리자 인터페이스
 * 프리셋을 관리하기 위한 인터페이스입니다.
 */
export interface IPresetManager {
  /**
   * 프리셋 목록
   */
  presets: IPreset[];
  
  /**
   * 현재 선택된 프리셋
   */
  currentPreset: IPreset | null;
  
  /**
   * 프리셋 추가
   * @param preset 추가할 프리셋
   * @returns 추가된 프리셋
   */
  addPreset(preset: IPreset): IPreset;
  
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
   * 프리셋 가져오기
   * @param id 가져올 프리셋 ID
   * @returns 프리셋
   */
  getPreset(id: string): IPreset | null;
  
  /**
   * 프리셋 선택
   * @param id 선택할 프리셋 ID
   * @returns 선택된 프리셋
   */
  selectPreset(id: string): IPreset | null;
  
  /**
   * 프리셋 직렬화
   * @returns 직렬화된 프리셋 데이터 목록
   */
  serialize(): PresetData[];
  
  /**
   * 프리셋 역직렬화
   * @param data 역직렬화할 프리셋 데이터 목록
   */
  deserialize(data: PresetData[]): void;
}

/**
 * 프리셋 관리자 클래스
 * 프리셋을 관리하기 위한 클래스입니다.
 */
export class PresetManager implements IPresetManager {
  presets: IPreset[] = [];
  currentPreset: IPreset | null = null;
  
  constructor(presets: IPreset[] = []) {
    this.presets = presets;
    
    if (presets.length > 0) {
      this.currentPreset = presets[0];
    }
  }
  
  addPreset(preset: IPreset): IPreset {
    // ID 중복 확인
    const existingPreset = this.getPreset(preset.id);
    if (existingPreset) {
      throw new Error(`Preset with ID ${preset.id} already exists`);
    }
    
    this.presets.push(preset);
    return preset;
  }
  
  updatePreset(id: string, presetData: Partial<IPreset>): IPreset | null {
    const index = this.presets.findIndex(p => p.id === id);
    if (index === -1) {
      return null;
    }
    
    const preset = this.presets[index];
    const updatedPreset = { ...preset, ...presetData };
    
    // 업데이트된 프리셋이 IPreset 인터페이스를 구현하는지 확인
    if (
      typeof updatedPreset.clone !== 'function' ||
      typeof updatedPreset.serialize !== 'function'
    ) {
      return null;
    }
    
    this.presets[index] = updatedPreset as IPreset;
    
    // 현재 선택된 프리셋이 업데이트된 경우 현재 프리셋도 업데이트
    if (this.currentPreset && this.currentPreset.id === id) {
      this.currentPreset = this.presets[index];
    }
    
    return this.presets[index];
  }
  
  deletePreset(id: string): boolean {
    const index = this.presets.findIndex(p => p.id === id);
    if (index === -1) {
      return false;
    }
    
    this.presets.splice(index, 1);
    
    // 현재 선택된 프리셋이 삭제된 경우 현재 프리셋을 null로 설정
    if (this.currentPreset && this.currentPreset.id === id) {
      this.currentPreset = this.presets.length > 0 ? this.presets[0] : null;
    }
    
    return true;
  }
  
  getPreset(id: string): IPreset | null {
    return this.presets.find(p => p.id === id) || null;
  }
  
  selectPreset(id: string): IPreset | null {
    const preset = this.getPreset(id);
    if (preset) {
      this.currentPreset = preset;
    }
    return preset;
  }
  
  serialize(): PresetData[] {
    return this.presets.map(preset => preset.serialize());
  }
  
  deserialize(data: PresetData[]): void {
    this.presets = data.map(presetData => {
      return new Preset(
        presetData.id,
        presetData.name,
        presetData.description
      );
    });
    
    if (this.presets.length > 0) {
      this.currentPreset = this.presets[0];
    } else {
      this.currentPreset = null;
    }
  }
  
  /**
   * 기본 프리셋 생성
   * @param id 프리셋 ID
   * @param name 프리셋 이름
   * @returns 생성된 기본 프리셋
   */
  createDefaultPreset(id: string, name: string): IPreset {
    const preset = new Preset(
      id,
      name,
      '기본 프리셋'
    );
    
    this.addPreset(preset);
    return preset;
  }
}