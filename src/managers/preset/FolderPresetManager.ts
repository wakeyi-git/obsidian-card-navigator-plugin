import { App, TFile } from 'obsidian';
import { IFolderPresetManager } from '../../core/interfaces/manager/IFolderPresetManager';
import { IPresetManager } from '../../core/interfaces/manager/IPresetManager';
import { Preset } from '../../core/models/Preset';
import { FolderPresetMapping } from '../../core/types/preset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ErrorCode } from '../../core/constants/error.constants';
import { Log } from '../../utils/log/Log';
import { ISettingsManager } from '../../core/interfaces/manager/ISettingsManager';

/**
 * 폴더별 프리셋 관리자 클래스
 * 폴더별 프리셋을 관리하는 클래스입니다.
 */
export class FolderPresetManager implements IFolderPresetManager {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 폴더-프리셋 매핑
   */
  private folderPresetMap: FolderPresetMapping = {};
  
  /**
   * 프리셋 자동 적용 여부
   */
  private autoApplyPresets: boolean = true;
  
  /**
   * 프리셋 관리자
   */
  private presetManager: IPresetManager | null = null;
  
  /**
   * 폴더 프리셋 우선순위 매핑
   */
  private folderPresetPriorities: Record<string, boolean> = {};
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    this.app = app;
  }
  
  /**
   * 폴더 프리셋 관리자 초기화
   * @param presetManager 프리셋 관리자
   * @param settingsManager 설정 관리자
   */
  initialize(
    presetManager: IPresetManager, 
    settingsManager: ISettingsManager
  ): void {
    try {
      this.presetManager = presetManager;
      
      // 설정에서 폴더 프리셋 매핑 및 자동 적용 여부 로드
      const settings = settingsManager.getSettings();
      this.folderPresetMap = settings.presetManagement.folderPresetMappings || {};
      this.autoApplyPresets = settings.presetManagement.autoApplyPresets ?? true;
      this.folderPresetPriorities = settings.presetManagement.folderPresetPriorities || {};
      
      Log.debug('폴더 프리셋 관리자 초기화 완료', {
        folderPresetCount: Object.keys(this.folderPresetMap).length,
        autoApply: this.autoApplyPresets
      });
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_MANAGER_INITIALIZATION_ERROR,
        { message: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * 설정 저장
   * 프리셋 관리자를 통해 설정을 저장합니다.
   */
  private saveSettings(): void {
    // 프리셋 관리자를 통해 설정 저장 이벤트 발생
    if (this.presetManager) {
      // 이벤트 발생 또는 설정 저장 로직
      // 실제 저장은 상위 PresetManager에서 처리
    }
  }
  
  /**
   * 활성 파일 변경 이벤트 리스너 등록
   */
  private registerActiveFileChangeListener(): void {
    this.app.workspace.on('file-open', (file: TFile | null) => {
      if (this.autoApplyPresets) {
        this.handleActiveFileChange(file);
      }
    });
  }
  
  /**
   * 폴더-프리셋 매핑 설정
   * @param mapping 폴더-프리셋 매핑
   */
  setFolderPresetMapping(mapping: FolderPresetMapping): void {
    this.folderPresetMap = { ...mapping };
  }
  
  /**
   * 폴더-프리셋 매핑 가져오기
   * @returns 폴더-프리셋 매핑
   */
  getFolderPresetMapping(): FolderPresetMapping {
    return { ...this.folderPresetMap };
  }
  
  /**
   * 폴더에 프리셋 할당
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   * @param overrideGlobal 전역 프리셋보다 우선 적용 여부
   */
  async assignPresetToFolder(folderPath: string, presetId: string, overrideGlobal: boolean = false): Promise<void> {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 프리셋 ID 유효성 검사
      if (this.presetManager && !this.presetManager.hasPreset(presetId)) {
        throw new Error(`프리셋 ID가 유효하지 않습니다: ${presetId}`);
      }
      
      // 폴더 프리셋 매핑 업데이트
      this.folderPresetMap[normalizedPath] = presetId;
      
      // 폴더 프리셋 우선순위 설정
      this.folderPresetPriorities[normalizedPath] = overrideGlobal;
      
      // 설정 저장
      this.saveSettings();
      
      // 이벤트 발생
      if (this.presetManager) {
        this.presetManager.notifyFolderPresetChanged(normalizedPath, presetId);
      }
      
      Log.debug(`폴더 프리셋 할당됨: ${normalizedPath} -> ${presetId}`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_ASSIGNMENT_ERROR,
        { folderPath, message: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * 폴더에서 프리셋 할당 해제
   * @param folderPath 폴더 경로
   */
  async unassignPresetFromFolder(folderPath: string): Promise<void> {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더 프리셋이 존재하는지 확인
      if (!this.folderPresetMap[normalizedPath]) {
        return;
      }
      
      // 제거할 프리셋 ID 저장
      const presetId = this.folderPresetMap[normalizedPath];
      
      // 폴더 프리셋 매핑에서 제거
      delete this.folderPresetMap[normalizedPath];
      
      // 폴더 프리셋 우선순위에서 제거
      if (this.folderPresetPriorities[normalizedPath]) {
        delete this.folderPresetPriorities[normalizedPath];
      }
      
      // 설정 저장
      this.saveSettings();
      
      // 이벤트 발생
      if (this.presetManager) {
        this.presetManager.notifyFolderPresetRemoved(normalizedPath, presetId);
      }
      
      Log.debug(`폴더 프리셋 할당 해제됨: ${normalizedPath}`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_UNASSIGNMENT_ERROR,
        { folderPath, message: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * 폴더에 할당된 프리셋 ID 가져오기
   * @param folderPath 폴더 경로
   * @returns 프리셋 ID 또는 null
   */
  getPresetIdForFolder(folderPath: string): string | null {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더-프리셋 매핑에서 프리셋 ID 가져오기
      return this.folderPresetMap[normalizedPath] || null;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_RETRIEVAL_ERROR,
        { folderPath },
        true
      );
      return null;
    }
  }
  
  /**
   * 프리셋 자동 적용 여부 설정
   * @param autoApply 자동 적용 여부
   */
  async setAutoApplyPresets(autoApply: boolean): Promise<void> {
    try {
      this.autoApplyPresets = autoApply;
      
      // 설정 저장
      this.saveSettings();
      
      Log.debug(`폴더 프리셋 자동 적용 설정됨: ${autoApply}`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_AUTO_APPLY_ERROR,
        { message: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * 프리셋 자동 적용 여부 가져오기
   * @returns 자동 적용 여부
   */
  getAutoApplyPresets(): boolean {
    return this.autoApplyPresets;
  }
  
  /**
   * 현재 활성 폴더에 할당된 프리셋 ID를 가져옵니다.
   * @returns 프리셋 ID 또는 null
   */
  getPresetIdForActiveFolder(): string | null {
    try {
      // 활성 파일 가져오기
      const activeFile = this.app.workspace.getActiveFile();
      
      // 활성 파일이 없으면 null 반환
      if (!activeFile) {
        return null;
      }
      
      // 활성 파일의 폴더 경로 가져오기
      const folderPath = this.getFolderPathFromFilePath(activeFile.path);
      
      // 폴더 경로에 할당된 프리셋 ID 가져오기
      return this.getPresetIdForFolder(folderPath);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_RETRIEVAL_ERROR,
        { filePath: this.app.workspace.getActiveFile()?.path || 'unknown' },
        true
      );
      return null;
    }
  }
  
  /**
   * 프리셋 ID가 사용 중인지 확인
   * @param presetId 프리셋 ID
   * @returns 사용 중 여부
   */
  isPresetInUse(presetId: string): boolean {
    try {
      // 폴더-프리셋 매핑에서 프리셋 ID 검색
      return Object.values(this.folderPresetMap).includes(presetId);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_IN_USE_CHECK_ERROR,
        { presetId },
        true
      );
      return false;
    }
  }
  
  /**
   * 프리셋 ID를 사용 중인 폴더 경로 목록 가져오기
   * @param presetId 프리셋 ID
   * @returns 폴더 경로 목록
   */
  getFoldersUsingPreset(presetId: string): string[] {
    try {
      // 폴더-프리셋 매핑에서 프리셋 ID와 일치하는 폴더 경로 필터링
      return Object.entries(this.folderPresetMap)
        .filter(([_, id]) => id === presetId)
        .map(([folderPath, _]) => folderPath);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_USAGE_RETRIEVAL_ERROR,
        { presetId },
        true
      );
      return [];
    }
  }
  
  /**
   * 프리셋 ID 변경 처리
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   */
  async handlePresetIdChange(oldPresetId: string, newPresetId: string): Promise<void> {
    try {
      // 모든 폴더 프리셋 매핑 순회
      for (const folderPath in this.folderPresetMap) {
        // 이전 프리셋 ID와 일치하는 경우 새 프리셋 ID로 업데이트
        if (this.folderPresetMap[folderPath] === oldPresetId) {
          this.folderPresetMap[folderPath] = newPresetId;
        }
      }
      
      // 설정 저장
      this.saveSettings();
      
      Log.debug(`폴더 프리셋 ID 변경됨: ${oldPresetId} -> ${newPresetId}`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_UPDATE_ERROR,
        { oldPresetId, newPresetId, message: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * 프리셋 삭제 처리
   * @param presetId 삭제된 프리셋 ID
   */
  async handlePresetDeletion(presetId: string): Promise<void> {
    try {
      // 삭제된 프리셋을 사용하는 폴더 목록 가져오기
      const affectedFolders = this.getFoldersUsingPreset(presetId);
      
      // 각 폴더에서 프리셋 할당 해제
      for (const folderPath of affectedFolders) {
        delete this.folderPresetMap[folderPath];
        
        // 폴더 프리셋 우선순위에서도 제거
        if (this.folderPresetPriorities[folderPath]) {
          delete this.folderPresetPriorities[folderPath];
        }
      }
      
      // 설정 저장
      this.saveSettings();
      
      Log.debug(`프리셋 삭제로 인한 폴더 프리셋 할당 해제: ${presetId}, 영향받은 폴더 수: ${affectedFolders.length}`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_REMOVE_ERROR,
        { presetId, message: error instanceof Error ? error.message : String(error) }
      );
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
   * 상위 폴더 경로 목록 가져오기
   * @param folderPath 폴더 경로
   * @returns 상위 폴더 경로 목록 (가장 가까운 상위 폴더부터)
   */
  private getParentFolders(folderPath: string): string[] {
    const parentFolders: string[] = [];
    let currentPath = folderPath;
    
    while (currentPath.includes('/')) {
      currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
      parentFolders.push(currentPath);
    }
    
    return parentFolders;
  }
  
  /**
   * 파일 경로에서 폴더 경로 가져오기
   * @param filePath 파일 경로
   * @returns 폴더 경로
   */
  private getFolderPathFromFilePath(filePath: string): string {
    const lastSlashIndex = filePath.lastIndexOf('/');
    
    if (lastSlashIndex === -1) {
      return '';
    }
    
    return filePath.substring(0, lastSlashIndex);
  }
  
  /**
   * 현재 파일에 적합한 프리셋 ID 선택
   * @param file 현재 파일
   * @returns 선택된 프리셋 ID
   */
  async selectPresetForFile(file: TFile): Promise<string> {
    try {
      // 파일이 없으면 빈 문자열 반환
      if (!file) {
        return '';
      }
      
      // 파일 경로에서 폴더 경로 가져오기
      const folderPath = this.getFolderPathFromFilePath(file.path);
      
      // 폴더에 할당된 프리셋 ID 가져오기
      const presetId = this.getPresetIdForFolder(folderPath);
      
      // 프리셋 ID가 없거나 프리셋 관리자가 없으면 빈 문자열 반환
      if (!presetId || !this.presetManager) {
        return '';
      }
      
      // 프리셋이 존재하는지 확인
      const preset = this.presetManager.getPreset(presetId);
      if (!preset) {
        return '';
      }
      
      return presetId;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_SELECTION_ERROR,
        { filePath: file.path },
        true
      );
      return '';
    }
  }
  
  /**
   * 활성 파일 변경 처리
   * @param file 활성 파일
   */
  async handleActiveFileChange(file: TFile | null): Promise<void> {
    try {
      if (!file || !this.autoApplyPresets) {
        return;
      }
      
      // 파일 경로에서 폴더 경로 추출
      const folderPath = this.getFolderPathFromFilePath(file.path);
      
      // 폴더에 할당된 프리셋 ID 가져오기
      const presetId = this.getPresetIdForFolder(folderPath);
      
      // 프리셋 ID가 있고 프리셋 관리자가 있는 경우 프리셋 적용
      if (presetId && this.presetManager) {
        await this.presetManager.applyPreset(presetId);
        Log.debug(`활성 파일 변경으로 인한 폴더 프리셋 적용: ${folderPath} -> ${presetId}`);
      }
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_AUTO_APPLY_ERROR,
        { message: error instanceof Error ? error.message : String(error) }
      );
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
      if (!this.folderPresetMap[normalizedPath]) {
        throw new Error(`폴더 프리셋을 찾을 수 없습니다: ${normalizedPath}`);
      }
      
      // 폴더 프리셋 우선순위 설정
      this.folderPresetPriorities[normalizedPath] = overrideGlobal;
      
      // 설정 저장
      this.saveSettings();
      
      Log.debug(`폴더 프리셋 우선순위 설정됨: ${normalizedPath}, ${overrideGlobal}`);
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_PRIORITY_ERROR,
        { folderPath, message: error instanceof Error ? error.message : String(error) }
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
      
      // 폴더 프리셋 우선순위 가져오기
      return this.folderPresetPriorities[normalizedPath] ?? true;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_PRIORITY_RETRIEVAL_ERROR,
        { folderPath },
        true
      );
      return true;
    }
  }
  
  /**
   * 폴더 프리셋 변경 이벤트 발생
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  notifyFolderPresetChanged(folderPath: string, presetId: string): void {
    try {
      if (this.presetManager) {
        this.presetManager.notifyFolderPresetChanged(folderPath, presetId);
      }
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_UPDATE_ERROR,
        { folderPath },
        true
      );
    }
  }
  
  /**
   * 폴더 프리셋 제거 이벤트 발생
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  notifyFolderPresetRemoved(folderPath: string, presetId: string): void {
    try {
      if (this.presetManager) {
        this.presetManager.notifyFolderPresetRemoved(folderPath, presetId);
      }
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FOLDER_PRESET_DELETE_ERROR,
        { folderPath },
        true
      );
    }
  }
} 