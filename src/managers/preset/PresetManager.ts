import { App, Notice, TFile, TFolder } from 'obsidian';
import { IPresetManager } from '../../core/interfaces/IPresetManager';
import { Preset } from '../../core/models/Preset';
import { CardNavigatorSettings } from '../../core/types/settings.types';
import { 
  FolderPresetMap, 
  PresetData, 
  PresetEvent, 
  PresetEventData, 
  PresetEventHandler, 
  PresetExportData, 
  PresetManagementOptions 
} from '../../core/types/preset.types';
import { ErrorCode } from '../../core/constants/error.constants';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { v4 as uuidv4 } from 'uuid';

/**
 * 프리셋 관리자 클래스
 * 카드 네비게이터의 프리셋을 관리하는 클래스입니다.
 */
export class PresetManager implements IPresetManager {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 프리셋 맵
   * 키: 프리셋 ID, 값: 프리셋 객체
   */
  private presets: Map<string, Preset> = new Map();
  
  /**
   * 폴더별 프리셋 맵
   */
  private folderPresets: FolderPresetMap = {};
  
  /**
   * 프리셋 관리 옵션
   */
  private options: PresetManagementOptions;
  
  /**
   * 이벤트 핸들러 맵
   */
  private eventHandlers: Map<PresetEvent, PresetEventHandler[]> = new Map();
  
  /**
   * 현재 활성화된 프리셋 이름
   */
  private activePresetName: string | null = null;
  
  /**
   * 전역 기본 프리셋 ID
   */
  private globalDefaultPresetId: string | null = null;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param options 프리셋 관리 옵션
   */
  constructor(app: App, options: Partial<PresetManagementOptions> = {}) {
    this.app = app;
    
    // 기본 옵션과 사용자 옵션 병합
    this.options = {
      presetFolderPath: '.obsidian/card-navigator/presets',
      globalPreset: null,
      lastActivePreset: null,
      autoApplyPresets: true,
      ...options
    };
  }
  
  /**
   * 프리셋 관리자 초기화
   * @param presetsData 프리셋 데이터 배열
   * @param globalDefaultPresetId 전역 기본 프리셋 ID
   */
  initialize(presetsData: PresetData[], globalDefaultPresetId: string | null): void {
    try {
      // 프리셋 맵 초기화
      this.presets.clear();
      
      // 프리셋 데이터 로드
      for (const presetData of presetsData) {
        const preset = Preset.fromData(presetData);
        this.presets.set(preset.id, preset);
      }
      
      // 전역 기본 프리셋 ID 설정
      this.globalDefaultPresetId = globalDefaultPresetId;
      
      // 프리셋이 없으면 기본 프리셋 생성
      if (this.presets.size === 0) {
        this.createDefaultPreset();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.initialize',
        '프리셋 관리자 초기화 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 기본 프리셋 생성
   * @returns 생성된 기본 프리셋
   */
  private createDefaultPreset(): Preset {
    try {
      const defaultPresetId = uuidv4();
      const defaultPreset = Preset.createDefault(defaultPresetId, '기본 프리셋');
      
      this.presets.set(defaultPresetId, defaultPreset);
      this.globalDefaultPresetId = defaultPresetId;
      
      return defaultPreset;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.createDefaultPreset',
        '기본 프리셋 생성 중 오류가 발생했습니다.',
        error
      );
      
      throw error;
    }
  }
  
  /**
   * 모든 프리셋 가져오기
   * @returns 프리셋 배열
   */
  getAllPresets(): Preset[] {
    return Array.from(this.presets.values());
  }
  
  /**
   * 프리셋 가져오기
   * @param presetId 프리셋 ID
   * @returns 프리셋 객체 또는 undefined
   */
  getPreset(presetId: string): Preset | undefined {
    return this.presets.get(presetId);
  }
  
  /**
   * 전역 기본 프리셋 가져오기
   * @returns 전역 기본 프리셋 또는 undefined
   */
  getGlobalDefaultPreset(): Preset | undefined {
    if (!this.globalDefaultPresetId) {
      return undefined;
    }
    
    return this.presets.get(this.globalDefaultPresetId);
  }
  
  /**
   * 전역 기본 프리셋 ID 가져오기
   * @returns 전역 기본 프리셋 ID 또는 null
   */
  getGlobalDefaultPresetId(): string | null {
    return this.globalDefaultPresetId;
  }
  
  /**
   * 전역 기본 프리셋 설정하기
   * @param presetId 프리셋 ID
   */
  setGlobalDefaultPreset(presetId: string): void {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        throw new Error(`프리셋 ID가 존재하지 않습니다: ${presetId}`);
      }
      
      this.globalDefaultPresetId = presetId;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.setGlobalDefaultPreset',
        `전역 기본 프리셋 설정 중 오류가 발생했습니다: ${presetId}`,
        error
      );
    }
  }
  
  /**
   * 전역 기본 프리셋 해제하기
   */
  clearGlobalDefaultPreset(): void {
    this.globalDefaultPresetId = null;
  }
  
  /**
   * 프리셋 생성하기
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param basePresetId 기반 프리셋 ID (선택 사항)
   * @returns 생성된 프리셋
   */
  createPreset(name: string, description?: string, basePresetId?: string): Preset {
    try {
      const presetId = uuidv4();
      let preset: Preset;
      
      // 기반 프리셋이 있으면 복제
      if (basePresetId && this.presets.has(basePresetId)) {
        const basePreset = this.presets.get(basePresetId)!;
        preset = basePreset.clone(presetId, name);
        
        if (description) {
          preset.description = description;
        }
      } else {
        // 기본 프리셋 생성
        preset = Preset.createDefault(presetId, name);
        
        if (description) {
          preset.description = description;
        }
      }
      
      // 프리셋 맵에 추가
      this.presets.set(presetId, preset);
      
      return preset;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.createPreset',
        `프리셋 생성 중 오류가 발생했습니다: ${name}`,
        error
      );
      
      throw error;
    }
  }
  
  /**
   * 프리셋 업데이트하기
   * @param presetId 프리셋 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 프리셋 또는 undefined
   */
  updatePreset(presetId: string, data: Partial<PresetData>): Preset | undefined {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        return undefined;
      }
      
      const preset = this.presets.get(presetId)!;
      
      // 이름 업데이트
      if (data.name !== undefined) {
        preset.name = data.name;
      }
      
      // 설명 업데이트
      if (data.description !== undefined) {
        preset.description = data.description;
      }
      
      // 설정 업데이트
      if (data.settings !== undefined) {
        preset.updateSettings(data.settings);
      }
      
      return preset;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.updatePreset',
        `프리셋 업데이트 중 오류가 발생했습니다: ${presetId}`,
        error
      );
      
      return undefined;
    }
  }
  
  /**
   * 프리셋 삭제하기
   * @param presetId 프리셋 ID
   * @returns 삭제 성공 여부
   */
  deletePreset(presetId: string): boolean {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        return false;
      }
      
      // 전역 기본 프리셋인 경우 전역 기본 프리셋 해제
      if (this.globalDefaultPresetId === presetId) {
        this.globalDefaultPresetId = null;
      }
      
      // 프리셋 맵에서 삭제
      return this.presets.delete(presetId);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.deletePreset',
        `프리셋 삭제 중 오류가 발생했습니다: ${presetId}`,
        error
      );
      
      return false;
    }
  }
  
  /**
   * 프리셋 복제하기
   * @param presetId 프리셋 ID
   * @param newName 새 프리셋 이름 (선택 사항)
   * @returns 복제된 프리셋 또는 undefined
   */
  clonePreset(presetId: string, newName?: string): Preset | undefined {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        return undefined;
      }
      
      const sourcePreset = this.presets.get(presetId)!;
      const clonedPresetId = uuidv4();
      const clonedPreset = sourcePreset.clone(clonedPresetId, newName);
      
      // 프리셋 맵에 추가
      this.presets.set(clonedPresetId, clonedPreset);
      
      return clonedPreset;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.clonePreset',
        `프리셋 복제 중 오류가 발생했습니다: ${presetId}`,
        error
      );
      
      return undefined;
    }
  }
  
  /**
   * 프리셋 가져오기
   * @param presetData 프리셋 데이터
   * @returns 가져온 프리셋 또는 undefined
   */
  importPreset(presetData: PresetData): Preset | undefined {
    try {
      // 프리셋 ID 중복 확인
      if (this.presets.has(presetData.id)) {
        // 새 ID 생성
        presetData = {
          ...presetData,
          id: uuidv4()
        };
      }
      
      // 프리셋 생성
      const preset = Preset.fromData(presetData);
      
      // 프리셋 맵에 추가
      this.presets.set(preset.id, preset);
      
      return preset;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.importPreset',
        '프리셋 가져오기 중 오류가 발생했습니다.',
        error
      );
      
      return undefined;
    }
  }
  
  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   * @returns 프리셋 데이터 또는 undefined
   */
  exportPreset(presetId: string): PresetData | undefined {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        return undefined;
      }
      
      const preset = this.presets.get(presetId)!;
      
      return preset.toData();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.exportPreset',
        `프리셋 내보내기 중 오류가 발생했습니다: ${presetId}`,
        error
      );
      
      return undefined;
    }
  }
  
  /**
   * 모든 프리셋 데이터 가져오기
   * @returns 프리셋 데이터 배열
   */
  getAllPresetData(): PresetData[] {
    return this.getAllPresets().map(preset => preset.toData());
  }
  
  /**
   * 프리셋 ID 변경하기
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   * @returns 성공 여부
   */
  changePresetId(oldPresetId: string, newPresetId: string): boolean {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(oldPresetId)) {
        return false;
      }
      
      // 새 ID가 이미 존재하는지 확인
      if (this.presets.has(newPresetId)) {
        return false;
      }
      
      // 프리셋 가져오기
      const preset = this.presets.get(oldPresetId)!;
      
      // 프리셋 데이터 복제 및 ID 변경
      const newPresetData: PresetData = {
        ...preset.toData(),
        id: newPresetId
      };
      
      // 새 프리셋 생성
      const newPreset = Preset.fromData(newPresetData);
      
      // 프리셋 맵에 추가
      this.presets.set(newPresetId, newPreset);
      
      // 이전 프리셋 삭제
      this.presets.delete(oldPresetId);
      
      // 전역 기본 프리셋 ID 업데이트
      if (this.globalDefaultPresetId === oldPresetId) {
        this.globalDefaultPresetId = newPresetId;
      }
      
      return true;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'PresetManager.changePresetId',
        `프리셋 ID 변경 중 오류가 발생했습니다: ${oldPresetId} -> ${newPresetId}`,
        error
      );
      
      return false;
    }
  }
  
  /**
   * 프리셋 관리자 초기화
   */
  async initialize(): Promise<void> {
    try {
      // 프리셋 폴더 확인 및 생성
      await this.ensurePresetFolder();
      
      // 프리셋 로드
      await this.loadPresets();
      
      // 마지막 활성 프리셋 설정
      if (this.options.lastActivePreset && this.presets.has(this.options.lastActivePreset)) {
        this.activePresetName = this.options.lastActivePreset;
      } else if (this.options.globalPreset && this.presets.has(this.options.globalPreset)) {
        this.activePresetName = this.options.globalPreset;
      }
      
      // 전역 기본 프리셋 ID 설정
      this.globalDefaultPresetId = this.options.globalPreset;
      
      return Promise.resolve();
    } catch (error: any) {
      console.error(`${ErrorCode.PRESET_INITIALIZATION_ERROR}: ${error.message}`, error);
      return Promise.reject(new Error(`${ErrorCode.PRESET_INITIALIZATION_ERROR}: ${error.message}`));
    }
  }
  
  /**
   * 프리셋 생성
   * @param name 프리셋 이름
   * @param settings 프리셋 설정
   * @param isDefault 기본 프리셋 여부
   * @param description 프리셋 설명
   * @returns 생성된 프리셋
   */
  async createPreset(
    name: string,
    settings: Partial<CardNavigatorSettings>,
    isDefault: boolean = false,
    description?: string
  ): Promise<Preset> {
    try {
      // 이름 중복 확인
      if (this.presets.has(name)) {
        throw new Error(`프리셋 이름 '${name}'이(가) 이미 존재합니다.`);
      }
      
      // 프리셋 생성
      const preset = new Preset(name, settings, isDefault, description);
      
      // 프리셋 맵에 추가
      this.presets.set(name, preset);
      
      // 프리셋 파일 저장
      await this.savePresetToFile(preset);
      
      // 이벤트 발생
      this.triggerEvent('preset-created', { presetName: name });
      
      return preset;
    } catch (error: any) {
      console.error(`${ErrorCode.PRESET_CREATION_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.PRESET_CREATION_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 프리셋 업데이트
   * @param name 프리셋 이름
   * @param settings 업데이트할 설정
   * @param isDefault 기본 프리셋 여부
   * @param description 프리셋 설명
   * @returns 업데이트된 프리셋
   */
  async updatePreset(
    name: string,
    settings: Partial<CardNavigatorSettings>,
    isDefault?: boolean,
    description?: string
  ): Promise<Preset> {
    try {
      // 프리셋 존재 확인
      if (!this.presets.has(name)) {
        throw new Error(`프리셋 '${name}'을(를) 찾을 수 없습니다.`);
      }
      
      // 프리셋 가져오기
      const preset = this.presets.get(name)!;
      
      // 프리셋 업데이트
      preset.update(settings, isDefault, description);
      
      // 프리셋 파일 저장
      await this.savePresetToFile(preset);
      
      // 이벤트 발생
      this.triggerEvent('preset-updated', { presetName: name });
      
      return preset;
    } catch (error: any) {
      console.error(`${ErrorCode.PRESET_UPDATE_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.PRESET_UPDATE_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 프리셋 삭제
   * @param name 프리셋 이름
   * @returns 성공 여부
   */
  async deletePreset(name: string): Promise<boolean> {
    try {
      // 프리셋 존재 확인
      if (!this.presets.has(name)) {
        throw new Error(`프리셋 '${name}'을(를) 찾을 수 없습니다.`);
      }
      
      // 활성 프리셋인 경우 확인
      if (this.activePresetName === name) {
        this.activePresetName = null;
      }
      
      // 글로벌 프리셋인 경우 확인
      if (this.options.globalPreset === name) {
        this.options.globalPreset = null;
      }
      
      // 폴더 프리셋에서 제거
      for (const folderPath in this.folderPresets) {
        if (this.folderPresets[folderPath] === name) {
          delete this.folderPresets[folderPath];
        }
      }
      
      // 프리셋 맵에서 제거
      this.presets.delete(name);
      
      // 프리셋 파일 삭제
      const presetFilePath = `${this.options.presetFolderPath}/${name}.json`;
      if (await this.app.vault.adapter.exists(presetFilePath)) {
        await this.app.vault.adapter.remove(presetFilePath);
      }
      
      // 이벤트 발생
      this.triggerEvent('preset-deleted', { presetName: name });
      
      return true;
    } catch (error: any) {
      console.error(`${ErrorCode.PRESET_DELETION_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.PRESET_DELETION_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 프리셋 가져오기
   * @param data 가져오기 데이터
   * @param overwrite 기존 프리셋 덮어쓰기 여부
   * @returns 가져온 프리셋 이름 배열
   */
  async importPresets(data: PresetExportData, overwrite: boolean = false): Promise<string[]> {
    try {
      const importedPresets: string[] = [];
      
      // 버전 확인
      if (!data.version) {
        throw new Error('유효하지 않은 프리셋 데이터입니다.');
      }
      
      // 프리셋 가져오기
      for (const presetData of data.presets) {
        const { name, settings, isDefault, description } = presetData;
        
        // 이름 중복 확인
        if (this.presets.has(name) && !overwrite) {
          console.warn(`프리셋 '${name}'이(가) 이미 존재합니다. 건너뜁니다.`);
          continue;
        }
        
        // 프리셋 생성 또는 업데이트
        if (this.presets.has(name)) {
          await this.updatePreset(name, settings, isDefault, description);
        } else {
          await this.createPreset(name, settings, isDefault, description);
        }
        
        importedPresets.push(name);
      }
      
      // 이벤트 발생
      this.triggerEvent('presets-imported', { presetNames: importedPresets });
      
      return importedPresets;
    } catch (error: any) {
      console.error(`${ErrorCode.PRESET_IMPORT_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.PRESET_IMPORT_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 폴더 경로에 적합한 프리셋 찾기
   * @param folderPath 폴더 경로
   * @returns 프리셋 또는 undefined
   */
  findPresetForFolder(folderPath: string): Preset | undefined {
    // 폴더 프리셋 이름 가져오기
    const presetName = this.getFolderPreset(folderPath);
    
    // 프리셋 반환
    return presetName ? this.presets.get(presetName) : undefined;
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  on(event: PresetEvent, handler: PresetEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)?.push(handler);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  off(event: PresetEvent, handler: PresetEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * 프리셋 폴더 확인 및 생성
   */
  private async ensurePresetFolder(): Promise<void> {
    try {
      const folderPath = this.options.presetFolderPath;
      
      // 폴더 존재 확인
      if (!(await this.app.vault.adapter.exists(folderPath))) {
        // 폴더 생성
        await this.app.vault.createFolder(folderPath);
      }
    } catch (error: any) {
      console.error(`프리셋 폴더 생성 오류: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * 프리셋 로드
   */
  private async loadPresets(): Promise<void> {
    try {
      const folderPath = this.options.presetFolderPath;
      
      // 폴더 존재 확인
      if (!(await this.app.vault.adapter.exists(folderPath))) {
        return;
      }
      
      // 폴더 내 파일 목록 가져오기
      const files = await this.app.vault.adapter.list(folderPath);
      
      // JSON 파일만 필터링
      const jsonFiles = files.files.filter(file => file.endsWith('.json'));
      
      // 각 파일에서 프리셋 로드
      for (const file of jsonFiles) {
        try {
          // 파일 내용 읽기
          const content = await this.app.vault.adapter.read(file);
          
          // JSON 파싱
          const presetData = JSON.parse(content) as PresetData;
          
          // 프리셋 생성
          const preset = new Preset(
            presetData.name,
            presetData.settings,
            presetData.isDefault,
            presetData.description
          );
          
          // 프리셋 맵에 추가
          this.presets.set(preset.name, preset);
        } catch (error: any) {
          console.warn(`프리셋 파일 로드 오류: ${file}`, error);
          // 개별 파일 오류는 무시하고 계속 진행
        }
      }
    } catch (error: any) {
      console.error(`프리셋 로드 오류: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * 프리셋을 파일로 저장
   * @param preset 저장할 프리셋
   */
  private async savePresetToFile(preset: Preset): Promise<void> {
    try {
      const folderPath = this.options.presetFolderPath;
      const filePath = `${folderPath}/${preset.name}.json`;
      
      // 프리셋 데이터 직렬화
      const presetData = preset.serialize();
      
      // JSON 문자열로 변환
      const content = JSON.stringify(presetData, null, 2);
      
      // 파일 저장
      await this.app.vault.adapter.write(filePath, content);
    } catch (error: any) {
      console.error(`프리셋 파일 저장 오류: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param data 이벤트 데이터
   */
  private triggerEvent(event: PresetEvent, data: PresetEventData): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  /**
   * 폴더 프리셋 가져오기
   * @param folderPath 폴더 경로
   * @returns 프리셋 이름 또는 undefined
   */
  getFolderPreset(folderPath: string): string | undefined {
    // 정확한 폴더 경로 매칭
    if (this.folderPresets[folderPath]) {
      return this.folderPresets[folderPath];
    }
    
    // 상위 폴더 경로 확인
    const folderPaths = Object.keys(this.folderPresets);
    for (const path of folderPaths) {
      if (folderPath.startsWith(path + '/')) {
        return this.folderPresets[path];
      }
    }
    
    // 글로벌 프리셋 반환
    return this.options.globalPreset || undefined;
  }
  
  /**
   * 모든 폴더 프리셋 가져오기
   * @returns 폴더 프리셋 맵
   */
  getAllFolderPresets(): FolderPresetMap {
    return { ...this.folderPresets };
  }
} 
