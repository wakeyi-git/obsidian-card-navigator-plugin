import { TFile } from 'obsidian';
import { ITagPresetManager } from '../../core/interfaces/manager/ITagPresetManager';
import { IPresetManager } from '../../core/interfaces/manager/IPresetManager';
import { ISettingsManager } from '../../core/interfaces/manager/ISettingsManager';
import { TagPresetMapping } from '../../core/types/preset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ErrorCode } from '../../core/constants/error.constants';
import { Log } from '../../utils/log/Log';

/**
 * 태그 프리셋 관리자 클래스
 * 태그별 프리셋을 관리하는 클래스입니다.
 */
export class TagPresetManager implements ITagPresetManager {
  /**
   * 프리셋 관리자
   */
  private presetManager: IPresetManager | null = null;
  
  /**
   * 설정 관리자
   */
  private settingsManager: ISettingsManager | null = null;
  
  /**
   * 태그-프리셋 매핑
   */
  private tagPresetMapping: TagPresetMapping = {};
  
  /**
   * 태그 프리셋 우선순위 매핑
   * 키: 태그 이름, 값: 전역 프리셋보다 우선 적용 여부
   */
  private tagPresetPriorities: Record<string, boolean> = {};
  
  /**
   * 프리셋 자동 적용 여부
   */
  private autoApply: boolean = false;
  
  /**
   * 태그 프리셋 관리자 초기화
   * @param presetManager 프리셋 관리자
   * @param settingsManager 설정 관리자
   */
  async initialize(
    presetManager: IPresetManager, 
    settingsManager: ISettingsManager
  ): Promise<void> {
    try {
      this.presetManager = presetManager;
      this.settingsManager = settingsManager;
      
      const settings = this.settingsManager.getSettings();
      this.autoApply = settings.preset.autoApplyTagPresets ?? true;
      this.tagPresetMapping = settings.preset.tagPresets || {};
      this.tagPresetPriorities = settings.preset.tagPresetPriorities || {};
      
      Log.debug('TagPresetManager initialized', {
        mappingCount: Object.keys(this.tagPresetMapping).length,
        autoApply: this.autoApply,
        prioritiesCount: Object.keys(this.tagPresetPriorities).length
      });
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_MANAGER_INITIALIZATION_ERROR,
        { message: error instanceof Error ? error.message : String(error) },
        true
      );
    }
  }
  
  /**
   * 태그-프리셋 매핑 설정
   * @param mapping 태그-프리셋 매핑
   */
  setTagPresetMapping(mapping: TagPresetMapping): void {
    this.tagPresetMapping = mapping || {};
  }
  
  /**
   * 태그-프리셋 매핑 가져오기
   * @returns 태그-프리셋 매핑
   */
  getTagPresetMapping(): TagPresetMapping {
    return this.tagPresetMapping;
  }
  
  /**
   * 태그에 프리셋 할당
   * @param tagName 태그 이름
   * @param presetId 프리셋 ID
   * @param overrideGlobal 전역 프리셋보다 우선 적용 여부
   */
  async assignPresetToTag(tagName: string, presetId: string, overrideGlobal: boolean = true): Promise<void> {
    try {
      // 태그 이름에서 # 제거
      const cleanTagName = tagName.startsWith('#') ? tagName.substring(1) : tagName;
      
      // 프리셋 ID 유효성 검사
      if (!this.presetManager?.getPreset(presetId)) {
        throw new Error(`프리셋 ID가 유효하지 않습니다: ${presetId}`);
      }
      
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings) {
        throw new Error('설정을 가져올 수 없습니다.');
      }
      
      // 태그-프리셋 매핑 업데이트
      if (!settings.preset.tagPresets) {
        settings.preset.tagPresets = {};
      }
      settings.preset.tagPresets[cleanTagName] = presetId;
      
      // 태그 프리셋 우선순위 설정
      if (!settings.preset.tagPresetPriorities) {
        settings.preset.tagPresetPriorities = {};
      }
      settings.preset.tagPresetPriorities[cleanTagName] = overrideGlobal;
      
      // 설정 저장
      await this.settingsManager?.saveSettings();
      
      Log.debug('Preset assigned to tag', {
        tagName: cleanTagName,
        presetId,
        overrideGlobal
      });
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_ASSIGNMENT_ERROR,
        { tagName },
        true
      );
    }
  }
  
  /**
   * 태그에서 프리셋 할당 해제
   * @param tagName 태그 이름
   */
  async unassignPresetFromTag(tagName: string): Promise<void> {
    try {
      // 태그 이름에서 # 제거
      const cleanTagName = tagName.startsWith('#') ? tagName.substring(1) : tagName;
      
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings) {
        throw new Error('설정을 가져올 수 없습니다.');
      }
      
      // 태그-프리셋 매핑에서 제거
      if (settings.preset.tagPresets && cleanTagName in settings.preset.tagPresets) {
        delete settings.preset.tagPresets[cleanTagName];
      }
      
      // 태그 프리셋 우선순위에서 제거
      if (settings.preset.tagPresetPriorities && cleanTagName in settings.preset.tagPresetPriorities) {
        delete settings.preset.tagPresetPriorities[cleanTagName];
      }
      
      // 설정 저장
      await this.settingsManager?.saveSettings();
      
      Log.debug('Preset unassigned from tag', { tagName: cleanTagName });
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_UNASSIGNMENT_ERROR,
        { tagName },
        true
      );
    }
  }
  
  /**
   * 태그에 할당된 프리셋 ID 가져오기
   * @param tagName 태그 이름
   * @returns 프리셋 ID 또는 null
   */
  getPresetIdForTag(tagName: string): string | null {
    try {
      // 태그 이름에서 # 제거
      const cleanTagName = tagName.startsWith('#') ? tagName.substring(1) : tagName;
      
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings || !settings.preset.tagPresets) {
        return null;
      }
      
      // 태그-프리셋 매핑에서 프리셋 ID 가져오기
      return settings.preset.tagPresets[cleanTagName] || null;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_RETRIEVAL_ERROR,
        { tagName },
        true
      );
      return null;
    }
  }
  
  /**
   * 태그 프리셋 우선순위 설정
   * @param tagName 태그 이름
   * @param overrideGlobal 전역 프리셋보다 우선 적용 여부
   */
  async setTagPresetPriority(tagName: string, overrideGlobal: boolean): Promise<void> {
    try {
      // 태그 이름에서 # 제거
      const cleanTagName = tagName.startsWith('#') ? tagName.substring(1) : tagName;
      
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings) {
        throw new Error('설정을 가져올 수 없습니다.');
      }
      
      // 태그 프리셋 우선순위 설정
      if (!settings.preset.tagPresetPriorities) {
        settings.preset.tagPresetPriorities = {};
      }
      settings.preset.tagPresetPriorities[cleanTagName] = overrideGlobal;
      
      // 설정 저장
      await this.settingsManager?.saveSettings();
      
      Log.debug('Tag preset priority set', {
        tagName: cleanTagName,
        overrideGlobal
      });
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_PRIORITY_ERROR,
        { tagName },
        true
      );
    }
  }
  
  /**
   * 태그 프리셋 우선순위 가져오기
   * @param tagName 태그 이름
   * @returns 전역 프리셋보다 우선 적용 여부
   */
  getTagPresetPriority(tagName: string): boolean {
    try {
      // 태그 이름에서 # 제거
      const cleanTagName = tagName.startsWith('#') ? tagName.substring(1) : tagName;
      
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings || !settings.preset.tagPresetPriorities) {
        return true; // 기본값은 true (태그 프리셋이 전역 프리셋보다 우선)
      }
      
      // 태그 프리셋 우선순위 가져오기
      return settings.preset.tagPresetPriorities[cleanTagName] ?? true;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_PRIORITY_RETRIEVAL_ERROR,
        { tagName },
        true
      );
      return true; // 오류 발생 시 기본값 반환
    }
  }
  
  /**
   * 프리셋 자동 적용 설정
   * @param autoApply 자동 적용 여부
   */
  async setAutoApplyPresets(autoApply: boolean): Promise<void> {
    try {
      this.autoApply = autoApply;
      
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings) {
        throw new Error('설정을 가져올 수 없습니다.');
      }
      
      // 자동 적용 설정 업데이트
      settings.preset.autoApplyTagPresets = autoApply;
      
      // 설정 저장
      await this.settingsManager?.saveSettings();
      
      Log.debug('Auto apply presets set', { autoApply });
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_PRIORITY_ERROR,
        { autoApply: String(autoApply) },
        true
      );
    }
  }
  
  /**
   * 프리셋 자동 적용 여부 가져오기
   * @returns 자동 적용 여부
   */
  getAutoApplyPresets(): boolean {
    return this.autoApply;
  }
  
  /**
   * 파일에 대한 프리셋 선택
   * @param file 파일
   * @returns 프리셋 ID 또는 null
   */
  async selectPresetForFile(file: TFile): Promise<string | null> {
    try {
      // 파일 유효성 검사
      if (!file) {
        return null;
      }
      
      // 자동 적용이 비활성화된 경우
      if (!this.autoApply) {
        return null;
      }
      
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings || !settings.preset.tagPresets) {
        return null;
      }
      
      // 파일에서 태그 가져오기
      const fileTags = await this.getTagsFromFile(file);
      if (!fileTags || fileTags.length === 0) {
        return null;
      }
      
      // 태그에 할당된 프리셋 중 우선순위가 가장 높은 프리셋 선택
      let selectedPresetId: string | null = null;
      
      for (const tag of fileTags) {
        const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
        const presetId = settings.preset.tagPresets[cleanTag];
        
        if (presetId) {
          // 태그 프리셋 우선순위 확인
          const overrideGlobal = this.getTagPresetPriority(cleanTag);
          
          // 전역 프리셋보다 우선 적용되는 경우 또는 아직 선택된 프리셋이 없는 경우
          if (overrideGlobal || !selectedPresetId) {
            selectedPresetId = presetId;
            
            // 전역 프리셋보다 우선 적용되는 경우 즉시 반환
            if (overrideGlobal) {
              break;
            }
          }
        }
      }
      
      return selectedPresetId;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_SELECTION_ERROR,
        { filePath: file.path },
        true
      );
      return null;
    }
  }
  
  /**
   * 파일에서 태그 가져오기
   * @param file 파일
   * @returns 태그 배열
   */
  private async getTagsFromFile(file: TFile): Promise<string[]> {
    try {
      // 메타데이터 캐시에서 파일 캐시 가져오기
      const app = this.presetManager?.app;
      if (!app) {
        return [];
      }
      
      const fileCache = app.metadataCache.getFileCache(file);
      if (!fileCache) {
        return [];
      }
      
      // 태그 배열 초기화
      const tags: string[] = [];
      
      // 프론트매터 태그 추가
      if (fileCache.frontmatter && fileCache.frontmatter.tags) {
        if (Array.isArray(fileCache.frontmatter.tags)) {
          tags.push(...fileCache.frontmatter.tags.map((tag: any) => tag.toString()));
        } else if (typeof fileCache.frontmatter.tags === 'string') {
          tags.push(fileCache.frontmatter.tags);
        }
      }
      
      // 인라인 태그 추가
      if (fileCache.tags) {
        tags.push(...fileCache.tags.map((tag: any) => tag.tag));
      }
      
      return tags;
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.FILE_TAGS_RETRIEVAL_ERROR,
        { filePath: file.path },
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
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings || !settings.preset.tagPresets) {
        return;
      }
      
      // 태그-프리셋 매핑에서 프리셋 ID 업데이트
      let updated = false;
      
      for (const tag in settings.preset.tagPresets) {
        if (settings.preset.tagPresets[tag] === oldPresetId) {
          settings.preset.tagPresets[tag] = newPresetId;
          updated = true;
        }
      }
      
      // 변경사항이 있는 경우 설정 저장
      if (updated) {
        await this.settingsManager?.saveSettings();
        
        Log.debug('Preset ID changed in tag-preset mappings', {
          oldPresetId,
          newPresetId
        });
      }
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_ID_CHANGE_ERROR,
        { oldPresetId, newPresetId },
        true
      );
    }
  }
  
  /**
   * 프리셋 삭제 처리
   * @param presetId 삭제된 프리셋 ID
   */
  async handlePresetDeletion(presetId: string): Promise<void> {
    try {
      // 설정 가져오기
      const settings = this.settingsManager?.getSettings();
      if (!settings || !settings.preset.tagPresets) {
        return;
      }
      
      // 태그-프리셋 매핑에서 삭제된 프리셋 ID 제거
      let updated = false;
      
      for (const tag in settings.preset.tagPresets) {
        if (settings.preset.tagPresets[tag] === presetId) {
          delete settings.preset.tagPresets[tag];
          
          // 태그 프리셋 우선순위에서도 제거
          if (settings.preset.tagPresetPriorities && tag in settings.preset.tagPresetPriorities) {
            delete settings.preset.tagPresetPriorities[tag];
          }
          
          updated = true;
        }
      }
      
      // 변경사항이 있는 경우 설정 저장
      if (updated) {
        await this.settingsManager?.saveSettings();
        
        Log.debug('Preset deleted from tag-preset mappings', { presetId });
      }
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_DELETION_ERROR,
        { presetId },
        true
      );
    }
  }

  /**
   * 태그 프리셋 변경 이벤트 발생
   * @param tag 태그 이름
   * @param presetId 프리셋 ID
   */
  notifyTagPresetChanged(tag: string, presetId: string): void {
    try {
      if (this.presetManager) {
        this.presetManager.notifyTagPresetChanged(tag, presetId);
      }
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_CHANGED_ERROR,
        { tag },
        true
      );
    }
  }

  /**
   * 태그 프리셋 제거 이벤트 발생
   * @param tag 태그 이름
   * @param presetId 프리셋 ID
   */
  notifyTagPresetRemoved(tag: string, presetId: string): void {
    try {
      if (this.presetManager) {
        this.presetManager.notifyTagPresetRemoved(tag, presetId);
      }
    } catch (error) {
      ErrorHandler.handleErrorWithCode(
        ErrorCode.TAG_PRESET_REMOVED_ERROR,
        { tag },
        true
      );
    }
  }

  /**
   * 태그에 프리셋 설정
   * @param tagName 태그 이름
   * @param presetId 프리셋 ID
   */
  async setTagPreset(tagName: string, presetId: string): Promise<void> {
    try {
      // 태그 이름 정리 (# 제거)
      const cleanTag = tagName.startsWith('#') ? tagName.substring(1) : tagName;
      
      // 프리셋 존재 여부 확인
      if (this.presetManager && !this.presetManager.hasPreset(presetId)) {
        throw new Error(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }
      
      // 태그 프리셋 매핑 업데이트
      this.tagPresetMapping[cleanTag] = presetId;
      
      // 설정 저장
      this.setTagPresetMapping(this.tagPresetMapping);
      
      // 이벤트 발생
      if (this.presetManager) {
        this.presetManager.notifyTagPresetChanged(cleanTag, presetId);
      }
      
      Log.debug(`태그 프리셋 설정됨: ${cleanTag} -> ${presetId}`);
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.TAG_PRESET_SET_ERROR,
        `태그 '${tagName}'에 프리셋 '${presetId}'를 설정하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
} 