import { App, Notice, TFile, TFolder } from 'obsidian';
import { IPresetManager } from '../../core/interfaces/manager/IPresetManager';
import { IFolderPresetManager } from '../../core/interfaces/manager/IFolderPresetManager';
import { ITagPresetManager } from '../../core/interfaces/manager/ITagPresetManager';
import { ISettingsManager } from '../../core/interfaces/manager/ISettingsManager';
import { Preset } from '../../core/models/Preset';
import { IPreset, PresetData, PresetSettings, PresetConflictResolution } from '../../core/types/preset.types';
import { FolderPresetMapping, TagPresetMapping, PresetManagementOptions, PresetApplyMode } from '../../core/types/preset.types';
import { CardNavigatorSettings } from '../../core/types/settings.types';
import { FolderPresetManager } from './FolderPresetManager';
import { TagPresetManager } from './TagPresetManager';
import { EventManager } from '../event/EventManager';
import { PresetEvent, PresetEventHandler, PresetEventData } from '../../core/types/event.types';
import { FolderPresetMap } from '../../core/types/preset.types';
import { Log } from '../../utils/log/Log';
import { ErrorCode } from '../../core/constants/error.constants';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { v4 as uuidv4 } from 'uuid';
import { SettingsManager } from '../../managers/settings/SettingsManager';

/**
 * 프리셋 관리자 클래스
 * 카드 네비게이터의 프리셋을 관리하는 클래스입니다.
 */
export class PresetManager implements IPresetManager {
  /**
   * Obsidian 앱 인스턴스
   */
  public readonly app: App;
  
  /**
   * 설정 관리자
   */
  public readonly settingsManager: ISettingsManager;
  
  /**
   * 이벤트 관리자
   */
  private eventManager: EventManager;
  
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
   * 태그별 프리셋 맵
   */
  private tagPresets: TagPresetMapping = {};
  
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
   * 파일별 적용된 프리셋 맵
   */
  private appliedPresets: Map<string, string> = new Map();
  
  /**
   * 폴더 프리셋 관리자
   */
  public folderPresetManager: IFolderPresetManager;

  /**
   * 태그 프리셋 관리자
   */
  public tagPresetManager: ITagPresetManager;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param settingsManager 설정 관리자
   * @param eventManager 이벤트 관리자
   * @param options 프리셋 관리 옵션
   */
  constructor(
    app: App, 
    settingsManager: ISettingsManager,
    eventManager: EventManager,
    options: Partial<PresetManagementOptions> = {}
  ) {
    this.app = app;
    this.settingsManager = settingsManager;
    this.eventManager = eventManager;
    
    // 기본 옵션과 사용자 옵션 병합
    this.options = {
      autoApplyFolderPresets: false,
      autoApplyTagPresets: false,
      ...options
    };
    
    // 폴더 프리셋 관리자와 태그 프리셋 관리자 초기화
    this.folderPresetManager = new FolderPresetManager(app);
    this.tagPresetManager = new TagPresetManager();
  }
  
  /**
   * 프리셋 관리자 초기화
   */
  async initialize(): Promise<void> {
    try {
      // 프리셋 폴더 확인
      await this.ensurePresetFolder();
      
      // 프리셋 로드
      await this.loadPresets();
      
      // 기본 프리셋 생성 여부 확인
      if (this.presets.size === 0) {
        // 기본 프리셋 생성
        const defaultPreset = this.createDefaultPreset();
        this.presets.set(defaultPreset.id, defaultPreset);
        
        // 기본 프리셋을 활성 프리셋으로 설정
        this.activePresetName = defaultPreset.id;
        this.globalDefaultPresetId = defaultPreset.id;
      } else {
        // 마지막 활성 프리셋 설정
        if (this.options.lastActivePresetId && this.presets.has(this.options.lastActivePresetId)) {
          this.activePresetName = this.options.lastActivePresetId;
        }
        
        // 전역 기본 프리셋 설정
        if (this.options.globalDefaultPresetId && this.presets.has(this.options.globalDefaultPresetId)) {
          this.globalDefaultPresetId = this.options.globalDefaultPresetId;
        }
      }
      
      // 폴더 프리셋 관리자 초기화
      if (this.folderPresetManager) {
        this.folderPresetManager.initialize(
          this,
          this.settingsManager
        );
      }

      // 태그 프리셋 관리자 초기화
      if (this.tagPresetManager) {
        this.tagPresetManager.initialize(
          this,
          this.settingsManager
        );
      }

      Log.debug('PresetManager initialized', {
        presetCount: this.presets.size,
        activePreset: this.activePresetName,
        globalDefaultPreset: this.globalDefaultPresetId
      });
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.PRESET_MANAGER_INITIALIZATION_ERROR,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * 기본 프리셋 생성
   * @returns 기본 프리셋
   */
  private createDefaultPreset(): Preset {
    try {
      // 기본 설정 가져오기
      const defaultSettings = Preset.getDefaultSettings();
      
      // 기본 프리셋 생성
      return new Preset(
        'default',
        '기본 프리셋',
        '카드 네비게이터의 기본 설정을 포함한 프리셋입니다.',
        defaultSettings,
        true
      );
    } catch (error: any) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_CREATION_ERROR,
        { message: error.message },
        true
      );
      
      // 오류 발생 시 빈 프리셋 반환
      return new Preset(
        'default',
        '기본 프리셋',
        '오류로 인해 생성된 기본 프리셋입니다.',
        {}
      );
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
   * 프리셋이 존재하는지 확인합니다.
   * @param presetId 프리셋 ID
   * @returns 프리셋 존재 여부
   */
  hasPreset(presetId: string): boolean {
    return this.presets.has(presetId);
  }
  
  /**
   * 프리셋 가져오기
   * @param presetId 프리셋 ID
   * @returns 프리셋 또는 null
   */
  getPreset(presetId: string): IPreset | null {
    const preset = this.presets.get(presetId);
    return preset || null;
  }
  
  /**
   * 이름으로 프리셋 가져오기
   * @param name 프리셋 이름
   * @returns 프리셋 또는 null
   */
  getPresetByName(name: string): IPreset | null {
    for (const preset of this.presets.values()) {
      if (preset.name === name) {
        return preset;
      }
    }
    return null;
  }
  
  /**
   * 전역 기본 프리셋을 가져옵니다.
   * @returns 전역 기본 프리셋 또는 undefined
   */
  getGlobalDefaultPreset(): Preset | undefined {
    const settings = this.settingsManager.getSettings();
    const defaultPresetId = settings.preset.defaultPresetId;
    
    if (defaultPresetId) {
      const preset = this.getPreset(defaultPresetId);
      // null을 undefined로 변환하고, IPreset을 Preset으로 타입 캐스팅
      return preset ? this.presets.get(defaultPresetId) : undefined;
    }
    
    return undefined;
  }
  
  /**
   * 전역 기본 프리셋 ID 가져오기
   * @returns 전역 기본 프리셋 ID
   */
  getGlobalDefaultPresetId(): string | null {
    // 전역 기본 프리셋 ID가 설정되어 있고, 해당 프리셋이 존재하는 경우
    if (this.globalDefaultPresetId && this.presets.has(this.globalDefaultPresetId)) {
      return this.globalDefaultPresetId;
    }
    
    // 글로벌 프리셋 반환
    return this.options.globalDefaultPresetId || null;
  }
  
  /**
   * 전역 기본 프리셋 설정하기
   * @param presetId 프리셋 ID
   */
  setGlobalDefaultPreset(presetId: string): void {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        return;
      }
      
      // 전역 기본 프리셋 ID 설정
      this.globalDefaultPresetId = presetId;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_UPDATE_ERROR,
        { message: `전역 기본 프리셋 설정 중 오류가 발생했습니다: ${presetId}`, error: error instanceof Error ? error.message : String(error) },
        true
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
   * @returns 생성된 프리셋
   */
  async createPreset(name: string, description?: string): Promise<IPreset> {
    return this.createPresetInternal(name, description);
  }
  
  /**
   * 설정을 포함한 프리셋 생성하기
   * @param name 프리셋 이름
   * @param settings 프리셋 설정
   * @param isDefault 기본 프리셋 여부
   * @param description 프리셋 설명
   * @param basePresetId 기반 프리셋 ID
   * @returns 생성된 프리셋
   */
  async createPresetWithSettings(
    name: string,
    settings?: Partial<CardNavigatorSettings>,
    isDefault: boolean = false,
    description?: string,
    basePresetId?: string
  ): Promise<IPreset> {
    return this.createPresetInternal(name, description, settings, isDefault, basePresetId);
  }
  
  /**
   * 프리셋 내부 생성 로직
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param settings 프리셋 설정
   * @param isDefault 기본 프리셋 여부
   * @param basePresetId 기반 프리셋 ID
   * @returns 생성된 프리셋
   * @private
   */
  private async createPresetInternal(
    name: string,
    description?: string,
    settings?: Partial<CardNavigatorSettings>,
    isDefault: boolean = false,
    basePresetId?: string
  ): Promise<IPreset> {
    try {
      // 이름이 비어있는지 확인
      if (!name || name.trim() === '') {
        ErrorHandler.handleErrorWithCode(
          ErrorCode.PRESET_CREATION_ERROR,
          { message: '프리셋 이름은 비워둘 수 없습니다.' },
          true
        );
        throw new Error('프리셋 이름은 비워둘 수 없습니다.');
      }

      // 이름 중복 확인
      const existingPreset = this.getPresetByName(name);
      if (existingPreset) {
        ErrorHandler.handleErrorWithCode(
          ErrorCode.PRESET_CREATION_ERROR,
          { message: `'${name}' 이름의 프리셋이 이미 존재합니다.` },
          true
        );
        throw new Error(`'${name}' 이름의 프리셋이 이미 존재합니다.`);
      }

      // 프리셋 ID 생성
      const presetId = this.generatePresetId(name);

      // 기본 설정 가져오기
      let presetSettings: PresetSettings;

      // 기반 프리셋이 있는 경우 해당 프리셋의 설정을 기반으로 함
      if (basePresetId && this.presets.has(basePresetId)) {
        const basePreset = this.presets.get(basePresetId);
        if (basePreset) {
          presetSettings = { ...basePreset.settings };
        } else {
          presetSettings = Preset.getDefaultSettings();
        }
      } else {
        // 기본 설정 사용
        presetSettings = Preset.getDefaultSettings();
      }

      // 사용자 설정이 있는 경우 병합
      if (settings) {
        presetSettings = {
          ...presetSettings,
          ...settings
        };
      }

      // 프리셋 생성
      const now = Date.now();
      const preset = new Preset({
        id: presetId,
        name,
        description: description || '',
        isDefault,
        settings: presetSettings,
        createdAt: now,
        updatedAt: now
      });

      // 프리셋 맵에 추가
      this.presets.set(presetId, preset);

      // 파일에 저장
      await this.savePresetToFile(preset);

      // 기본 프리셋으로 설정된 경우 전역 기본 프리셋 ID 업데이트
      if (isDefault) {
        this.globalDefaultPresetId = presetId;
        await this.saveGlobalSettings();
      }

      // 프리셋 생성 이벤트 발생
      this.notifyPresetCreated(preset);

      return preset;
    } catch (error: any) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_CREATION_ERROR,
        { 
          message: `프리셋 생성 중 오류가 발생했습니다: ${name}`,
          error: error instanceof Error ? error.message : String(error) 
        },
        true
      );
      throw error;
    }
  }
  
  /**
   * 프리셋 업데이트
   * @param presetId 프리셋 ID
   * @param updates 업데이트할 내용
   * @returns 업데이트된 프리셋
   */
  async updatePreset(presetId: string, updates: Partial<IPreset>): Promise<IPreset> {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        throw new Error(`Preset with ID ${presetId} not found`);
      }
      
      const preset = this.presets.get(presetId)!;
      
      // 이름 업데이트
      if (updates.name !== undefined) {
        preset.name = updates.name;
      }
      
      // 설명 업데이트
      if (updates.description !== undefined) {
        preset.description = updates.description;
      }
      
      // 설정 업데이트
      if (updates.settings !== undefined) {
        preset.updateSettings(updates.settings);
      }
      
      // 프리셋 파일 저장 시도
      this.savePresetToFile(preset).catch(error => {
        ErrorHandler.handleErrorWithCode(
          ErrorCode.FILE_WRITE_ERROR,
          { message: `프리셋 파일 저장 중 오류가 발생했습니다: ${presetId}`, error: error instanceof Error ? error.message : String(error) },
          true
        );
      });
      
      return preset;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_UPDATE_ERROR,
        { message: `프리셋 업데이트 중 오류가 발생했습니다: ${presetId}`, error: error instanceof Error ? error.message : String(error) },
        true
      );
      
      throw new Error(`프리셋 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 프리셋 삭제
   * @param presetId 프리셋 ID
   * @returns 성공 여부
   */
  async deletePreset(presetId: string): Promise<boolean> {
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
      const result = this.presets.delete(presetId);
      
      // 프리셋 삭제 이벤트 발생
      this.notifyPresetDeleted(presetId);
      
      // 비동기적으로 파일 삭제
      await this.deletePresetFile(presetId);
      
      return result;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_DELETION_ERROR,
        { message: `프리셋 삭제 중 오류가 발생했습니다: ${presetId}`, error: error instanceof Error ? error.message : String(error) },
        true
      );
      
      return false;
    }
  }
  
  /**
   * 프리셋 파일 삭제
   * @param presetId 프리셋 ID
   */
  private async deletePresetFile(presetId: string): Promise<void> {
    try {
      // 프리셋 폴더 경로 가져오기
      const folderPath = this.options.presetFolderPath || 'presets';
      
      // 파일 경로 생성
      const filePath = `${folderPath}/${presetId}.json`;
      
      // 파일 존재 확인
      if (await this.app.vault.adapter.exists(filePath)) {
        // 파일 삭제
        await this.app.vault.adapter.remove(filePath);
        console.log(`프리셋 파일 삭제됨: ${filePath}`);
      } else {
        console.warn(`프리셋 파일이 존재하지 않습니다: ${filePath}`);
      }
    } catch (error: any) {
      console.error(`프리셋 파일 삭제 오류: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * 프리셋 복제
   * @param presetId 복제할 프리셋 ID
   * @param newName 새 프리셋 이름
   * @returns 복제된 프리셋
   */
  async clonePreset(presetId: string, newName: string): Promise<IPreset> {
    try {
      // 프리셋이 존재하는지 확인
      if (!this.presets.has(presetId)) {
        throw new Error(`Preset with ID ${presetId} not found`);
      }
      
      const sourcePreset = this.presets.get(presetId)!;
      const clonedPresetId = uuidv4();
      const clonedPreset = sourcePreset.clone(clonedPresetId, newName);
      
      // 프리셋 맵에 추가
      this.presets.set(clonedPresetId, clonedPreset);
      
      // 프리셋 파일 저장
      await this.savePresetToFile(clonedPreset);
      
      return clonedPreset;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_CREATION_ERROR,
        { message: `프리셋 복제 중 오류가 발생했습니다: ${presetId}`, error: error instanceof Error ? error.message : String(error) },
        true
      );
      
      throw error;
    }
  }
  
  /**
   * 프리셋 가져오기
   * @param data 가져올 프리셋 데이터
   * @returns 가져온 프리셋 목록
   */
  async importPreset(data: string): Promise<IPreset[]> {
    try {
      // JSON 문자열을 파싱하여 프리셋 데이터 배열로 변환
      let presetDataArray: PresetData[];
      try {
        const parsed = JSON.parse(data);
        presetDataArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        throw new Error('프리셋 데이터 파싱 중 오류가 발생했습니다');
      }
      
      const importedPresets: IPreset[] = [];
      
      // 각 프리셋 데이터를 처리
      for (const presetData of presetDataArray) {
        // 필수 필드 확인
        if (!presetData.id || !presetData.name) {
          console.warn('프리셋 데이터에 필수 필드가 누락되었습니다. 건너뜁니다.');
          continue;
        }
        
        // ID 충돌 확인 및 처리
        let finalPresetId = presetData.id;
        if (this.presets.has(finalPresetId)) {
          // 새 ID 생성
          finalPresetId = `${presetData.id}-${Date.now()}`;
          console.log(`프리셋 ID 충돌 감지. 새 ID로 가져오기: ${finalPresetId}`);
          presetData.id = finalPresetId;
        }
        
        // 생성 및 수정 날짜 확인
        if (!presetData.createdAt) {
          presetData.createdAt = Date.now();
        }
        
        presetData.updatedAt = Date.now();
        
        // 프리셋 객체 생성
        const preset = new Preset(presetData);
        
        // 프리셋 맵에 추가
        this.presets.set(preset.id, preset);
        
        // 프리셋 파일 저장
        await this.savePresetToFile(preset);
        
        importedPresets.push(preset);
      }
      
      return importedPresets;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_IMPORT_ERROR,
        { message: '프리셋 가져오기 중 오류가 발생했습니다', error: error instanceof Error ? error.message : String(error) },
        true
      );
      
      throw error;
    }
  }
  
  /**
   * 프리셋 내보내기
   * @param presetIds 내보낼 프리셋 ID 목록
   * @returns 내보낸 프리셋 데이터 JSON 문자열
   */
  async exportPreset(presetIds: string[]): Promise<string> {
    try {
      const presetDataList: PresetData[] = [];
      
      // 각 프리셋 ID에 대해 처리
      for (const presetId of presetIds) {
        // 프리셋이 존재하는지 확인
        if (!this.presets.has(presetId)) {
          ErrorHandler.handleErrorWithCode(
            ErrorCode.PRESET_NOT_FOUND,
            { name: presetId },
            false
          );
          continue; // 존재하지 않는 프리셋은 건너뜁니다
        }
        
        // 프리셋 가져오기
        const preset = this.presets.get(presetId);
        if (preset) {
          // 프리셋 데이터 추가
          presetDataList.push(preset.toData());
        }
      }
      
      // 프리셋 데이터가 없는 경우
      if (presetDataList.length === 0) {
        throw new Error('내보낼 프리셋이 없습니다');
      }
      
      // JSON 문자열로 변환하여 반환
      return JSON.stringify(presetDataList, null, 2);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_EXPORT_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
      
      throw error;
    }
  }
  
  /**
   * 모든 프리셋 데이터 가져오기
   * @returns 프리셋 데이터 배열
   */
  getAllPresetData(): PresetData[] {
    return Array.from(this.presets.values()).map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
      settings: preset.settings
    }));
  }
  
  /**
   * 프리셋 ID 변경
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   * @returns 성공 여부
   */
  async changePresetId(oldPresetId: string, newPresetId: string): Promise<boolean> {
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
      const preset = this.presets.get(oldPresetId);
      if (!preset) {
        return false;
      }
      
      // 프리셋 복제
      const newPreset = preset.clone(newPresetId);
      
      // 새 프리셋 추가
      this.presets.set(newPresetId, newPreset);
      
      // 기존 프리셋 삭제
      this.presets.delete(oldPresetId);
      
      // 폴더 프리셋 매핑 업데이트
      for (const folderPath in this.folderPresets) {
        if (this.folderPresets[folderPath] === oldPresetId) {
          this.folderPresets[folderPath] = newPresetId;
        }
      }
      
      // 태그 프리셋 매핑 업데이트
      for (const tag in this.tagPresets) {
        if (this.tagPresets[tag] === oldPresetId) {
          this.tagPresets[tag] = newPresetId;
        }
      }
      
      // 활성 프리셋 업데이트
      if (this.activePresetName === oldPresetId) {
        this.activePresetName = newPresetId;
      }
      
      // 전역 기본 프리셋 업데이트
      if (this.globalDefaultPresetId === oldPresetId) {
        this.globalDefaultPresetId = newPresetId;
      }
      
      // 이벤트 발생
      this.notifyPresetIdChanged(oldPresetId, newPresetId);
      
      return true;
    } catch (error) {
      console.error(`프리셋 ID 변경 중 오류가 발생했습니다: ${error}`);
      return false;
    }
  }
  
  /**
   * 프리셋 폴더 확인 및 생성
   */
  private async ensurePresetFolder(): Promise<void> {
    try {
      // 프리셋 폴더 경로 가져오기
      const folderPath = this.options.presetFolderPath || 'presets';
      
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
      // 프리셋 폴더 경로 가져오기
      const folderPath = this.options.presetFolderPath || 'presets';
      
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
          const content = await this.app.vault.adapter.read(file);
          const presetData = JSON.parse(content);
          
          // 프리셋 생성 및 추가
          const preset = new Preset(presetData);
          this.presets.set(preset.id, preset);
          
          console.log(`프리셋 로드됨: ${preset.id}`);
        } catch (error: any) {
          console.error(`프리셋 파일 로드 오류 (${file}): ${error.message}`, error);
        }
      }
      
      console.log(`총 ${this.presets.size}개의 프리셋이 로드되었습니다.`);
    } catch (error: any) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.CARDSET_LOAD_ERROR,
        { message: `프리셋 로드 중 오류가 발생했습니다: ${error.message}`, error: error instanceof Error ? error.message : String(error) },
        true
      );
      throw error;
    }
  }
  
  /**
   * 프리셋을 파일로 저장
   * @param preset 저장할 프리셋
   */
  private async savePresetToFile(preset: Preset): Promise<void> {
    try {
      // 프리셋 폴더 확인
      await this.ensurePresetFolder();
      
      // 프리셋 폴더 경로 가져오기
      const folderPath = this.options.presetFolderPath || 'presets';
      
      // 파일 경로 생성
      const filePath = `${folderPath}/${preset.id}.json`;
      
      // 프리셋 데이터 가져오기
      const presetData = preset.toData();
      
      // JSON 문자열로 변환
      const content = JSON.stringify(presetData, null, 2);
      
      // 파일에 저장
      await this.app.vault.adapter.write(filePath, content);
      
      console.log(`프리셋 파일 저장됨: ${filePath}`);
    } catch (error: any) {
      console.error(`프리셋 파일 저장 오류: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * 이벤트를 발생시킵니다.
   * @param event 이벤트 유형
   * @param data 이벤트 데이터
   */
  private triggerEvent(event: PresetEvent, data: any): void {
    // 이벤트 관리자를 통해 이벤트 발생
    this.eventManager.triggerEvent(event, data);
    
    // 기존 이벤트 핸들러 호출 (하위 호환성 유지)
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`이벤트 핸들러 실행 중 오류 발생: ${error}`);
          }
        });
      }
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
    return this.options.globalDefaultPresetId || undefined;
  }
  
  /**
   * 모든 폴더 프리셋 매핑 가져오기
   * @returns 폴더 프리셋 매핑
   */
  getAllFolderPresets(): Record<string, string> {
    return { ...this.folderPresets };
  }

  /**
   * 폴더에 프리셋 설정
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  async setFolderPreset(folderPath: string, presetId: string): Promise<void> {
    try {
      // 프리셋 ID 유효성 검사
      if (!this.presets.has(presetId)) {
        throw new Error(`프리셋 ID가 유효하지 않습니다: ${presetId}`);
      }
      
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더 프리셋 매핑 업데이트
      this.folderPresets[normalizedPath] = presetId;
      
      // 설정 저장
      await this.settingsManager.updateFolderPresetMapping(this.folderPresets);
      
      // 이벤트 발생
      this.notifyFolderPresetChanged(normalizedPath, presetId);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_SET_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  /**
   * 폴더에서 프리셋 제거
   * @param folderPath 폴더 경로
   * @returns 제거 성공 여부
   */
  async removeFolderPreset(folderPath: string): Promise<boolean> {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더 프리셋이 존재하는지 확인
      if (!this.folderPresets[normalizedPath]) {
        return false;
      }
      
      // 제거할 프리셋 ID 저장
      const presetId = this.folderPresets[normalizedPath];
      
      // 폴더 프리셋 매핑에서 제거
      delete this.folderPresets[normalizedPath];
      
      // 설정 저장
      await this.settingsManager.updateFolderPresetMapping(this.folderPresets);
      
      // 이벤트 발생
      this.notifyFolderPresetRemoved(normalizedPath, presetId);
      
      return true;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_REMOVE_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
      return false;
    }
  }

  /**
   * 폴더 프리셋 우선순위 설정
   * @param folderPath 폴더 경로
   * @param overrideGlobal 전역 프리셋보다 우선 적용 여부
   */
  async setFolderPresetPriority(folderPath: string, overrideGlobal: boolean): Promise<void> {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더 프리셋이 존재하는지 확인
      if (!this.folderPresets[normalizedPath]) {
        throw new Error(`폴더 프리셋을 찾을 수 없습니다: ${normalizedPath}`);
      }
      
      // 폴더 프리셋 우선순위 설정
      if (!this.options.folderPresetPriorities) {
        this.options.folderPresetPriorities = {};
      }
      
      this.options.folderPresetPriorities[normalizedPath] = overrideGlobal;
      
      // 설정 저장
      await this.settingsManager.updateFolderPresetPriorities(this.options.folderPresetPriorities);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_PRIORITY_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  /**
   * 폴더 프리셋 우선순위 가져오기
   * @param folderPath 폴더 경로
   * @returns 전역 프리셋보다 우선 적용 여부
   */
  getFolderPresetPriority(folderPath: string): boolean {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더 프리셋 우선순위 반환
      if (this.options.folderPresetPriorities && this.options.folderPresetPriorities[normalizedPath] !== undefined) {
        return this.options.folderPresetPriorities[normalizedPath];
      }
      
      return false;
    } catch (error: any) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_PRIORITY_RETRIEVAL_ERROR,
        { message: `폴더 프리셋 우선순위 가져오기 중 오류가 발생했습니다: ${error.message}`, error: error instanceof Error ? error.message : String(error) },
        true
      );
      return false;
    }
  }

  /**
   * 폴더 경로 정규화
   * @param folderPath 폴더 경로
   * @returns 정규화된 폴더 경로
   */
  private normalizeFolderPath(folderPath: string): string {
    // 앞뒤 슬래시 제거
    return folderPath.replace(/^\/+|\/+$/g, '');
  }

  /**
   * 프리셋 자동 적용 여부 설정
   * @param autoApply 자동 적용 여부
   */
  async setAutoApplyPresets(autoApply: boolean): Promise<void> {
    try {
      this.options.autoApplyPresets = autoApply;
      
      // 폴더 프리셋 자동 적용 여부 설정
      await this.setAutoApplyFolderPresets(autoApply);
      
      // 태그 프리셋 자동 적용 여부 설정
      await this.setAutoApplyTagPresets(autoApply);
      
      // 설정 저장
      await this.settingsManager.updatePresetManagementOptions(this.options);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_AUTO_APPLY_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  /**
   * 폴더 프리셋 자동 적용 여부 설정
   * @param autoApply 자동 적용 여부
   */
  async setAutoApplyFolderPresets(autoApply: boolean): Promise<void> {
    try {
      this.options.autoApplyFolderPresets = autoApply;
      
      // 폴더 프리셋 관리자에 설정 전달
      if (this.folderPresetManager) {
        await this.folderPresetManager.setAutoApplyPresets(autoApply);
      }
      
      // 설정 저장
      await this.settingsManager.updatePresetManagementOptions(this.options);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_AUTO_APPLY_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  /**
   * 태그 프리셋 자동 적용 여부 설정
   * @param autoApply 자동 적용 여부
   */
  async setAutoApplyTagPresets(autoApply: boolean): Promise<void> {
    try {
      this.options.autoApplyTagPresets = autoApply;
      await this.settingsManager.updatePresetManagementOptions(this.options);
      
      Log.debug(`태그 프리셋 자동 적용 설정이 ${autoApply ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_AUTO_APPLY_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
      throw error;
    }
  }

  /**
   * 기본 우선순위 순서 설정
   * @param priorityOrder 우선순위 순서
   */
  async setDefaultPriorityOrder(priorityOrder: 'tag-folder-global' | 'folder-tag-global' | 'custom'): Promise<void> {
    try {
      this.options.defaultPriorityOrder = priorityOrder;
      
      // 설정 저장
      await this.settingsManager.updatePresetManagementOptions(this.options);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_PRIORITY_ORDER_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  /**
   * 충돌 해결 방법 설정
   * @param conflictResolution 충돌 해결 방법
   */
  async setConflictResolution(conflictResolution: PresetConflictResolution): Promise<void> {
    try {
      this.options.conflictResolution = conflictResolution;
      
      // 설정 저장
      await this.settingsManager.updatePresetManagementOptions(this.options);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_CONFLICT_RESOLUTION_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  /**
   * 프리셋 폴더 변경 이벤트를 발생시킵니다.
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  public notifyFolderPresetChanged(folderPath: string, presetId: string): void {
    try {
      const eventData: PresetEventData = {
        type: PresetEvent.FOLDER_PRESET_CHANGED,
        timestamp: Date.now(),
        data: {
          folderPath,
          presetId
        }
      };
      
      // 이벤트 핸들러 호출
      this.triggerEvent(PresetEvent.FOLDER_PRESET_CHANGED, eventData);
      
      // Obsidian 이벤트 발생
      this.app.workspace.trigger('card-navigator:folder-preset-changed', folderPath, presetId);
    } catch (error: any) {
      console.error(`폴더 프리셋 변경 이벤트 발생 중 오류: ${error.message}`, error);
    }
  }

  /**
   * 폴더 프리셋 제거 이벤트를 발생시킵니다.
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  public notifyFolderPresetRemoved(folderPath: string, presetId: string): void {
    try {
      const eventData: PresetEventData = {
        type: PresetEvent.FOLDER_PRESET_REMOVED,
        timestamp: Date.now(),
        data: {
          folderPath,
          presetId
        }
      };
      
      // 이벤트 핸들러 호출
      this.triggerEvent(PresetEvent.FOLDER_PRESET_REMOVED, eventData);
      
      // Obsidian 이벤트 발생
      this.app.workspace.trigger('card-navigator:folder-preset-removed', folderPath, presetId);
    } catch (error: any) {
      console.error(`폴더 프리셋 제거 이벤트 발생 중 오류: ${error.message}`, error);
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_REMOVED_ERROR,
        { message: error.message, folderPath, presetId },
        true
      );
    }
  }

  /**
   * 프리셋 삭제 이벤트를 발생시킵니다.
   * @param presetId 삭제된 프리셋 ID
   */
  public notifyPresetDeleted(presetId: string): void {
    try {
      const eventData: PresetEventData = {
        type: PresetEvent.PRESET_DELETED,
        timestamp: Date.now(),
        data: {
          presetId
        }
      };
      
      // 이벤트 핸들러 호출
      this.triggerEvent(PresetEvent.PRESET_DELETED, eventData);
      
      // Obsidian 이벤트 발생
      this.app.workspace.trigger('card-navigator:preset-deleted', presetId);
    } catch (error: any) {
      console.error(`프리셋 삭제 이벤트 발생 중 오류: ${error.message}`, error);
    }
  }

  /**
   * 프리셋 ID 변경 이벤트를 발생시킵니다.
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   */
  public notifyPresetIdChanged(oldPresetId: string, newPresetId: string): void {
    try {
      const eventData: PresetEventData = {
        type: PresetEvent.PRESET_ID_CHANGED,
        timestamp: Date.now(),
        data: {
          oldPresetId,
          newPresetId
        }
      };
      
      // 이벤트 핸들러 호출
      this.triggerEvent(PresetEvent.PRESET_ID_CHANGED, eventData);
      
      // Obsidian 이벤트 발생
      this.app.workspace.trigger('card-navigator:preset-id-changed', oldPresetId, newPresetId);
    } catch (error: any) {
      console.error(`프리셋 ID 변경 이벤트 발생 중 오류: ${error.message}`, error);
    }
  }

  /**
   * 프리셋 적용
   * @param presetId 적용할 프리셋 ID
   * @returns 성공 여부
   */
  async applyPreset(presetId: string): Promise<boolean> {
    try {
      // 프리셋 가져오기
      const preset = this.getPreset(presetId);
      
      if (!preset) {
        throw new Error(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }
      
      // 설정 적용
      await this.settingsManager.applyPresetSettings(preset.settings);
      
      // 활성 프리셋 ID 저장
      this.activePresetName = preset.name;
      
      // 이벤트 발생
      this.triggerEvent(PresetEvent.PRESET_APPLIED, { 
        type: PresetEvent.PRESET_APPLIED,
        timestamp: Date.now(),
        presetId, 
        settings: preset.settings 
      });
      
      console.log(`프리셋 적용됨: ${presetId}`);
      
      return true;
    } catch (error: any) {
      console.error(`프리셋 적용 중 오류: ${error.message}`, error);
      return false;
    }
  }

  /**
   * 프리셋 데이터 가져오기
   * @param presetDataJson 프리셋 데이터 JSON 문자열
   * @returns 가져온 프리셋 배열
   */
  async importPresets(presetDataJson: string): Promise<Preset[]> {
    try {
      // JSON 파싱
      const presetDataArray = JSON.parse(presetDataJson);
      
      if (!Array.isArray(presetDataArray)) {
        throw new Error('유효하지 않은 프리셋 데이터 형식입니다.');
      }
      
      // 프리셋 가져오기
      const importedPresets: Preset[] = [];
      
      for (const presetData of presetDataArray) {
        const presets = await this.importPreset(JSON.stringify(presetData));
        if (presets && presets.length > 0) {
          importedPresets.push(...presets.map(p => p as Preset));
        }
      }
      
      // 이벤트 발생
      this.triggerEvent(PresetEvent.PRESETS_IMPORTED, { 
        type: PresetEvent.PRESETS_IMPORTED,
        timestamp: Date.now(),
        presets: importedPresets 
      });
      
      console.log(`Imported ${importedPresets.length} presets`);
      return importedPresets;
    } catch (error: any) {
      console.error(`프리셋 가져오기 중 오류: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 프리셋 내보내기
   * @returns 내보낸 프리셋 데이터 JSON 문자열
   */
  async exportPresets(): Promise<string> {
    try {
      // 모든 프리셋 데이터 가져오기
      const presetDataArray = this.getAllPresetData();
      
      // JSON 문자열로 변환
      const presetDataJson = JSON.stringify(presetDataArray, null, 2);
      
      // 이벤트 발생
      this.triggerEvent(PresetEvent.PRESETS_EXPORTED, { 
        type: PresetEvent.PRESETS_EXPORTED,
        timestamp: Date.now(),
        presets: presetDataArray 
      });
      
      console.log(`Exported ${presetDataArray.length} presets`);
      return presetDataJson;
    } catch (error: any) {
      console.error(`프리셋 내보내기 중 오류: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * 태그에 대한 프리셋 ID 가져오기
   * @param tag 태그 이름
   * @returns 프리셋 ID 또는 undefined
   */
  getTagPreset(tag: string): string | undefined {
    try {
      return this.tagPresets[tag];
    } catch (error: any) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_RETRIEVAL_ERROR,
        { message: `태그 프리셋 가져오기 중 오류가 발생했습니다: ${error.message}`, error: error instanceof Error ? error.message : String(error) },
        true
      );
      return undefined;
    }
  }

  /**
   * 모든 태그 프리셋 매핑 가져오기
   * @returns 태그 프리셋 매핑
   */
  getAllTagPresets(): TagPresetMapping {
    return this.tagPresets;
  }

  /**
   * 태그에 프리셋 설정
   * @param tag 태그 이름
   * @param presetId 프리셋 ID
   */
  async setTagPreset(tag: string, presetId: string): Promise<void> {
    try {
      // 태그 이름에서 # 제거
      const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
      
      // 프리셋 ID 유효성 검사
      if (!this.presets.has(presetId)) {
        throw new Error(`프리셋 ID가 유효하지 않습니다: ${presetId}`);
      }
      
      // 태그 프리셋 매핑 업데이트
      this.tagPresets[cleanTag] = presetId;
      
      // 설정 저장
      await this.settingsManager.updateTagPresetMapping(this.tagPresets);
      
      // 이벤트 발생
      this.notifyTagPresetChanged(cleanTag, presetId);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_SET_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }

  /**
   * 태그에서 프리셋 제거
   * @param tag 태그 이름
   * @returns 제거 성공 여부
   */
  async removeTagPreset(tag: string): Promise<boolean> {
    try {
      // 태그 이름에서 # 제거
      const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
      
      // 태그 프리셋이 존재하는지 확인
      if (!this.tagPresets[cleanTag]) {
        return false;
      }
      
      // 제거할 프리셋 ID 저장
      const presetId = this.tagPresets[cleanTag];
      
      // 태그 프리셋 매핑에서 제거
      delete this.tagPresets[cleanTag];
      
      // 설정 저장
      await this.settingsManager.updateTagPresetMapping(this.tagPresets);
      
      // 이벤트 발생
      this.notifyTagPresetRemoved(cleanTag, presetId);
      
      return true;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_REMOVE_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
      return false;
    }
  }

  /**
   * 태그 프리셋 우선순위 설정
   * @param tag 태그 이름
   * @param overrideGlobal 글로벌 프리셋 재정의 여부
   */
  async setTagPresetPriority(tag: string, overrideGlobal: boolean): Promise<void> {
    try {
      // 태그 이름 정규화
      const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;
      
      // 태그 프리셋이 존재하는지 확인
      if (!this.tagPresets[normalizedTag]) {
        throw new Error(`태그 '${normalizedTag}'에 할당된 프리셋이 없습니다.`);
      }
      
      // 태그 프리셋 우선순위 설정
      this.options.tagPresetPriorities = this.options.tagPresetPriorities || {};
      this.options.tagPresetPriorities[normalizedTag] = overrideGlobal;
      
      // 설정 저장
      await this.settingsManager.updatePresetManagementOptions(this.options);
      
      // 태그 프리셋 관리자가 있는 경우 우선순위 설정
      if (this.tagPresetManager) {
        await this.tagPresetManager.setTagPresetPriority(normalizedTag, overrideGlobal);
      }
      
      Log.debug(`태그 프리셋 우선순위 설정: ${normalizedTag}, 글로벌 재정의: ${overrideGlobal}`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_PRIORITY_ERROR,
        { message: error instanceof Error ? error.message : String(error), tag, overrideGlobalStr: String(overrideGlobal) },
        true
      );
    }
  }

  public notifyTagPresetChanged(tag: string, presetId: string): void {
    try {
      const eventData: PresetEventData = {
        type: PresetEvent.TAG_PRESET_CHANGED,
        timestamp: Date.now(),
        data: {
          tag,
          presetId
        }
      };
      
      // 이벤트 핸들러 호출
      this.triggerEvent(PresetEvent.TAG_PRESET_CHANGED, eventData);
      
      // Obsidian 이벤트 발생
      this.app.workspace.trigger('card-navigator:tag-preset-changed', tag, presetId);
    } catch (error: any) {
      console.error(`태그 프리셋 변경 이벤트 발생 중 오류: ${error.message}`, error);
    }
  }

  /**
   * 태그 프리셋 제거 이벤트를 발생시킵니다.
   * @param tag 태그 이름
   * @param presetId 프리셋 ID
   */
  public notifyTagPresetRemoved(tag: string, presetId: string): void {
    try {
      const eventData: PresetEventData = {
        type: PresetEvent.TAG_PRESET_REMOVED,
        timestamp: Date.now(),
        data: {
          tag,
          presetId
        }
      };
      
      // 이벤트 핸들러 호출
      this.triggerEvent(PresetEvent.TAG_PRESET_REMOVED, eventData);
      
      // Obsidian 이벤트 발생
      this.app.workspace.trigger('card-navigator:tag-preset-removed', tag, presetId);
    } catch (error: any) {
      console.error(`태그 프리셋 제거 이벤트 발생 중 오류: ${error.message}`, error);
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_REMOVED_ERROR,
        { message: error.message, tag, presetId },
        true
      );
    }
  }

  /**
   * 파일에 맞는 프리셋 선택 및 적용
   * @param file 파일
   * @returns 적용된 프리셋 ID 또는 null
   */
  async selectAndApplyPresetForFile(file: TFile): Promise<string | null> {
    try {
      if (!file) {
        return null;
      }

      let selectedPresetId: string | null = null;

      switch (this.options.presetApplyMode) {
        case PresetApplyMode.TAG_FIRST:
          // 태그 > 폴더 > 전역 순서로 프리셋 선택
          selectedPresetId = await this.tagPresetManager.selectPresetForFile(file);
          if (!selectedPresetId) {
            selectedPresetId = await this.folderPresetManager.selectPresetForFile(file);
          }
          if (!selectedPresetId) {
            selectedPresetId = this.getGlobalDefaultPresetId();
          }
          break;
          
        case PresetApplyMode.FOLDER_FIRST:
          // 폴더 > 태그 > 전역 순서로 프리셋 선택
          selectedPresetId = await this.folderPresetManager.selectPresetForFile(file);
          if (!selectedPresetId) {
            selectedPresetId = await this.tagPresetManager.selectPresetForFile(file);
          }
          if (!selectedPresetId) {
            selectedPresetId = this.getGlobalDefaultPresetId();
          }
          break;
          
        case PresetApplyMode.FOLDER_ONLY:
          // 폴더 프리셋만 적용
          selectedPresetId = await this.folderPresetManager.selectPresetForFile(file);
          if (!selectedPresetId) {
            selectedPresetId = this.getGlobalDefaultPresetId();
          }
          break;
          
        case PresetApplyMode.TAG_ONLY:
          // 태그 프리셋만 적용
          selectedPresetId = await this.tagPresetManager.selectPresetForFile(file);
          if (!selectedPresetId) {
            selectedPresetId = this.getGlobalDefaultPresetId();
          }
          break;
          
        case PresetApplyMode.MERGED:
          // 병합 전략에 따라 프리셋 병합
          // 이 부분은 복잡한 병합 로직이 필요하므로 별도 구현
          break;
          
        default:
          // 기본값: 폴더 > 태그 > 전역 순서
          selectedPresetId = await this.folderPresetManager.selectPresetForFile(file);
          if (!selectedPresetId) {
            selectedPresetId = await this.tagPresetManager.selectPresetForFile(file);
          }
          if (!selectedPresetId) {
            selectedPresetId = this.getGlobalDefaultPresetId();
          }
          break;
      }

      if (selectedPresetId) {
        await this.applyPreset(selectedPresetId);
        return selectedPresetId;
      }

      return null;
    } catch (error: unknown) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_SELECTION_ERROR,
        { filePath: file?.path || 'unknown' },
        true
      );
      return null;
    }
  }

  /**
   * Obsidian 앱 인스턴스 가져오기
   * @returns Obsidian 앱 인스턴스
   */
  getApp(): App {
    return this.app;
  }

  /**
   * 프리셋 설정 가져오기
   * @param presetId 프리셋 ID
   * @returns 프리셋 설정
   */
  getPresetSettings(presetId: string): PresetSettings {
    try {
      // 프리셋 ID가 유효한지 확인
      if (!presetId || !this.presets.has(presetId)) {
        // 유효하지 않은 경우 기본 설정 반환
        ErrorHandler.handleErrorWithCode(
          ErrorCode.PRESET_NOT_FOUND,
          { presetId },
          false
        );
        return Preset.getDefaultSettings();
      }
      
      // 프리셋 데이터 가져오기
      const presetData = this.presets.get(presetId);
      
      // 프리셋 데이터가 없는 경우 기본 설정 반환
      if (!presetData) {
        ErrorHandler.handleErrorWithCode(
          ErrorCode.PRESET_NOT_FOUND,
          { presetId },
          false
        );
        return Preset.getDefaultSettings();
      }
      
      // 프리셋 설정 반환
      return presetData.settings;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.PRESET_SETTINGS_GET_ERROR,
        { message: error instanceof Error ? error.message : String(error), presetId },
        true
      );
      
      // 오류 발생 시 기본 설정 반환
      return Preset.getDefaultSettings();
    }
  }

  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  on(event: PresetEvent, handler: PresetEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    const handlers = this.eventHandlers.get(event);
    if (handlers && !handlers.includes(handler)) {
      handlers.push(handler);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
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
      
      // 핸들러가 없으면 이벤트 제거
      if (handlers.length === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: PresetEvent, data: PresetEventData): void {
    this.triggerEvent(event, data);
  }

  /**
   * 활성 프리셋 ID 가져오기
   * @returns 활성 프리셋 ID
   */
  getActivePresetId(): string | null {
    // activePresetName이 있으면 반환, 없으면 null 반환
    return this.activePresetName;
  }

  /**
   * 기본 프리셋 ID 가져오기
   * @returns 기본 프리셋 ID
   */
  getDefaultPresetId(): string | null {
    return this.options.defaultPresetId || null;
  }

  /**
   * 프리셋 이름을 기반으로 고유한 ID를 생성합니다.
   * @param name 프리셋 이름
   * @returns 생성된 프리셋 ID
   */
  private generatePresetId(name: string): string {
    // 이름에서 공백과 특수문자 제거하고 소문자로 변환
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // 타임스탬프 추가하여 고유성 보장
    const timestamp = Date.now().toString(36);
    
    return `${baseId}-${timestamp}`;
  }

  /**
   * 프리셋 생성 이벤트를 발생시킵니다.
   * @param preset 생성된 프리셋
   */
  private notifyPresetCreated(preset: IPreset): void {
    this.triggerEvent(PresetEvent.PRESET_CREATED, {
      type: PresetEvent.PRESET_CREATED,
      timestamp: Date.now(),
      preset
    });
  }

  /**
   * 전역 설정을 저장합니다.
   */
  private async saveGlobalSettings(): Promise<void> {
    await this.settingsManager.updatePresetManagementOptions({
      globalDefaultPresetId: this.globalDefaultPresetId ?? undefined
    });
  }
}