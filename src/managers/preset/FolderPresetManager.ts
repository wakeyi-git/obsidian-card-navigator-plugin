import { App } from 'obsidian';
import { IFolderPresetManager } from '../../core/interfaces/IFolderPresetManager';
import { Preset } from '../../core/models/Preset';
import { FolderPresetMapping } from '../../core/types/preset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

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
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    this.app = app;
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
   */
  assignPresetToFolder(folderPath: string, presetId: string): void {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더-프리셋 매핑 업데이트
      this.folderPresetMap[normalizedPath] = presetId;
    } catch (error) {
      ErrorHandler.handleError(
        `폴더에 프리셋 할당 중 오류가 발생했습니다: ${folderPath}`,
        error
      );
    }
  }
  
  /**
   * 폴더에서 프리셋 할당 해제
   * @param folderPath 폴더 경로
   */
  unassignPresetFromFolder(folderPath: string): void {
    try {
      // 폴더 경로 정규화
      const normalizedPath = this.normalizeFolderPath(folderPath);
      
      // 폴더-프리셋 매핑에서 제거
      if (normalizedPath in this.folderPresetMap) {
        delete this.folderPresetMap[normalizedPath];
      }
    } catch (error) {
      ErrorHandler.handleError(
        `폴더에서 프리셋 할당 해제 중 오류가 발생했습니다: ${folderPath}`,
        error
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
      
      // 정확한 폴더 경로 매칭
      if (normalizedPath in this.folderPresetMap) {
        return this.folderPresetMap[normalizedPath];
      }
      
      // 상위 폴더 검색
      const parentFolders = this.getParentFolders(normalizedPath);
      for (const parentPath of parentFolders) {
        if (parentPath in this.folderPresetMap) {
          return this.folderPresetMap[parentPath];
        }
      }
      
      return null;
    } catch (error) {
      ErrorHandler.handleError(
        `폴더에 할당된 프리셋 ID 가져오기 중 오류가 발생했습니다: ${folderPath}`,
        error
      );
      
      return null;
    }
  }
  
  /**
   * 프리셋 자동 적용 여부 설정
   * @param autoApply 자동 적용 여부
   */
  setAutoApplyPresets(autoApply: boolean): void {
    this.autoApplyPresets = autoApply;
  }
  
  /**
   * 프리셋 자동 적용 여부 가져오기
   * @returns 자동 적용 여부
   */
  getAutoApplyPresets(): boolean {
    return this.autoApplyPresets;
  }
  
  /**
   * 현재 활성 파일의 폴더에 할당된 프리셋 ID 가져오기
   * @returns 프리셋 ID 또는 null
   */
  getPresetIdForActiveFolder(): string | null {
    try {
      // 현재 활성 파일 가져오기
      const activeFile = this.app.workspace.getActiveFile();
      
      // 활성 파일이 없으면 null 반환
      if (!activeFile) {
        return null;
      }
      
      // 활성 파일의 폴더 경로 가져오기
      const folderPath = this.getFolderPathFromFilePath(activeFile.path);
      
      // 폴더에 할당된 프리셋 ID 가져오기
      return this.getPresetIdForFolder(folderPath);
    } catch (error) {
      ErrorHandler.handleError(
        '현재 활성 파일의 폴더에 할당된 프리셋 ID 가져오기 중 오류가 발생했습니다.',
        error
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
      ErrorHandler.handleError(
        `프리셋 ID가 사용 중인지 확인 중 오류가 발생했습니다: ${presetId}`,
        error
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
      ErrorHandler.handleError(
        `프리셋 ID를 사용 중인 폴더 경로 목록 가져오기 중 오류가 발생했습니다: ${presetId}`,
        error
      );
      
      return [];
    }
  }
  
  /**
   * 프리셋 ID 변경 처리
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   */
  handlePresetIdChange(oldPresetId: string, newPresetId: string): void {
    try {
      // 폴더-프리셋 매핑에서 이전 프리셋 ID를 새 프리셋 ID로 변경
      for (const folderPath in this.folderPresetMap) {
        if (this.folderPresetMap[folderPath] === oldPresetId) {
          this.folderPresetMap[folderPath] = newPresetId;
        }
      }
    } catch (error) {
      ErrorHandler.handleError(
        `프리셋 ID 변경 처리 중 오류가 발생했습니다: ${oldPresetId} -> ${newPresetId}`,
        error
      );
    }
  }
  
  /**
   * 프리셋 삭제 처리
   * @param presetId 프리셋 ID
   */
  handlePresetDeletion(presetId: string): void {
    try {
      // 폴더-프리셋 매핑에서 프리셋 ID와 일치하는 항목 제거
      for (const folderPath in this.folderPresetMap) {
        if (this.folderPresetMap[folderPath] === presetId) {
          delete this.folderPresetMap[folderPath];
        }
      }
    } catch (error) {
      ErrorHandler.handleError(
        `프리셋 삭제 처리 중 오류가 발생했습니다: ${presetId}`,
        error
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
} 