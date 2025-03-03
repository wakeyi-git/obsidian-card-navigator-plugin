import { App, Modal, Setting, TextComponent, DropdownComponent, Notice, ToggleComponent, TFolder } from 'obsidian';
import { IPresetManager } from '../../core/interfaces/manager/IPresetManager';
import { Preset } from '../../core/models/Preset';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ErrorCode } from '../../core/constants/error.constants';
import { IPreset } from '../../core/types/preset.types';
import { IFolderPresetManager } from '../../core/interfaces/manager/IFolderPresetManager';
import { ITagPresetManager } from '../../core/interfaces/manager/ITagPresetManager';
import { MODAL_CLASS_NAMES } from '../../styles/components/modal.styles';

/**
 * 프리셋 적용 대상 유형
 */
export enum PresetTargetType {
  GLOBAL = 'global',
  FOLDER = 'folder',
  TAG = 'tag'
}

/**
 * 프리셋 적용 대상 모달 컴포넌트
 * 프리셋을 전역, 폴더, 태그에 연결하는 통합 모달 컴포넌트입니다.
 */
export class PresetTargetModal extends Modal {
  /**
   * 프리셋 적용 대상 유형
   */
  private targetType: PresetTargetType;
  
  /**
   * 태그 이름 (태그 타입일 경우)
   */
  private tagName: string = '';
  
  /**
   * 폴더 경로 (폴더 타입일 경우)
   */
  private folderPath: string = '';
  
  /**
   * 선택된 프리셋 ID
   */
  private selectedPresetId: string = '';
  
  /**
   * 태그/폴더 입력 컴포넌트
   */
  private targetInput: TextComponent = null!;
  
  /**
   * 프리셋 드롭다운 컴포넌트
   */
  private presetDropdown: DropdownComponent = null!;
  
  /**
   * 전역 프리셋보다 우선 적용 여부
   */
  private overrideGlobalPreset: boolean = true;
  
  /**
   * 사용 가능한 프리셋 목록
   */
  private availablePresets: Preset[] = [];
  
  /**
   * 저장 콜백 함수 - 태그 타입
   */
  private onSaveTag?: (tag: string, presetId: string, overrideGlobal: boolean) => void;
  
  /**
   * 저장 콜백 함수 - 폴더 타입
   */
  private onSaveFolder?: (folderPath: string, presetId: string, overrideGlobal: boolean) => void;
  
  /**
   * 저장 콜백 함수 - 전역 타입
   */
  private onSaveGlobal?: (presetId: string) => void;
  
  /**
   * 태그 프리셋 관리자
   */
  private tagPresetManager?: ITagPresetManager;
  
  /**
   * 폴더 프리셋 관리자
   */
  private folderPresetManager?: IFolderPresetManager;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param presetManager 프리셋 관리자
   * @param targetType 프리셋 적용 대상 유형
   * @param callbacks 콜백 함수 객체
   * @param initialValues 초기 값 객체
   * @param managers 추가 관리자 객체
   */
  constructor(
    app: App,
    private presetManager: IPresetManager,
    targetType: PresetTargetType,
    callbacks: {
      onSaveTag?: (tag: string, presetId: string, overrideGlobal: boolean) => void;
      onSaveFolder?: (folderPath: string, presetId: string, overrideGlobal: boolean) => void;
      onSaveGlobal?: (presetId: string) => void;
    },
    initialValues?: {
      tag?: string;
      folderPath?: string;
      presetId?: string;
      overrideGlobal?: boolean;
    },
    managers?: {
      tagPresetManager?: ITagPresetManager;
      folderPresetManager?: IFolderPresetManager;
    }
  ) {
    super(app);
    this.targetType = targetType;
    
    // 콜백 함수 설정
    this.onSaveTag = callbacks.onSaveTag;
    this.onSaveFolder = callbacks.onSaveFolder;
    this.onSaveGlobal = callbacks.onSaveGlobal;
    
    // 초기 값 설정
    if (initialValues) {
      if (initialValues.tag && this.targetType === PresetTargetType.TAG) {
        this.tagName = initialValues.tag;
      }
      
      if (initialValues.folderPath && this.targetType === PresetTargetType.FOLDER) {
        this.folderPath = initialValues.folderPath;
      }
      
      if (initialValues.presetId) {
        this.selectedPresetId = initialValues.presetId;
      }
      
      if (initialValues.overrideGlobal !== undefined) {
        this.overrideGlobalPreset = initialValues.overrideGlobal;
      }
    }
    
    // 추가 관리자 설정
    if (managers) {
      this.tagPresetManager = managers.tagPresetManager;
      this.folderPresetManager = managers.folderPresetManager;
    }
    
    // 사용 가능한 프리셋 가져오기
    this.availablePresets = this.presetManager.getAllPresets();
  }
  
  /**
   * 모달이 열릴 때 호출됩니다.
   */
  onOpen(): void {
    try {
      const { contentEl } = this;
      
      // 모달 제목 설정
      let titleText = '';
      switch (this.targetType) {
        case PresetTargetType.GLOBAL:
          titleText = '전역 프리셋 설정';
          break;
        case PresetTargetType.FOLDER:
          titleText = '폴더 프리셋 설정';
          break;
        case PresetTargetType.TAG:
          titleText = '태그 프리셋 설정';
          break;
      }
      
      contentEl.createEl('h2', { text: titleText });
      
      // 태그/폴더 입력 필드 (전역이 아닌 경우)
      if (this.targetType !== PresetTargetType.GLOBAL) {
        const settingName = this.targetType === PresetTargetType.TAG ? '태그' : '폴더 경로';
        const settingDesc = this.targetType === PresetTargetType.TAG 
          ? '프리셋을 적용할 태그를 입력하세요'
          : '프리셋을 적용할 폴더 경로를 입력하세요';
        const placeholder = this.targetType === PresetTargetType.TAG 
          ? '태그 입력 (예: project)'
          : '폴더 경로 입력 (예: Projects/Work)';
        
        new Setting(contentEl)
          .setName(settingName)
          .setDesc(settingDesc)
          .addText(text => {
            this.targetInput = text;
            text.setValue(this.targetType === PresetTargetType.TAG ? this.tagName : this.folderPath)
              .setPlaceholder(placeholder)
              .onChange(value => {
                if (this.targetType === PresetTargetType.TAG) {
                  this.tagName = value;
                } else {
                  this.folderPath = value;
                }
              });
          });
        
        // 태그 타입인 경우 계층적 태그 설명 추가
        if (this.targetType === PresetTargetType.TAG) {
          contentEl.createEl('div', {
            text: '계층적 태그는 전체 경로를 입력하세요 (예: project/work)',
            cls: MODAL_CLASS_NAMES.INFO.TEXT
          });
        }
      }
      
      // 프리셋 선택 드롭다운
      new Setting(contentEl)
        .setName('프리셋')
        .setDesc(this.getPresetSelectionDescription())
        .addDropdown(dropdown => {
          this.presetDropdown = dropdown;
          
          // 드롭다운 옵션 추가
          this.availablePresets.forEach(preset => {
            dropdown.addOption(preset.id, preset.name);
          });
          
          // 초기 값 설정
          if (this.selectedPresetId && this.availablePresets.some(p => p.id === this.selectedPresetId)) {
            dropdown.setValue(this.selectedPresetId);
          } else if (this.availablePresets.length > 0) {
            dropdown.setValue(this.availablePresets[0].id);
            this.selectedPresetId = this.availablePresets[0].id;
          }
          
          // 변경 이벤트 처리
          dropdown.onChange(value => {
            this.selectedPresetId = value;
          });
        });
      
      // 우선순위 설정 (전역이 아닌 경우)
      if (this.targetType !== PresetTargetType.GLOBAL) {
        new Setting(contentEl)
          .setName('전역 프리셋보다 우선 적용')
          .setDesc(`${this.targetType === PresetTargetType.TAG ? '태그' : '폴더'} 프리셋을 전역 프리셋보다 우선적으로 적용합니다`)
          .addToggle(toggle => {
            toggle.setValue(this.overrideGlobalPreset)
              .onChange(value => {
                this.overrideGlobalPreset = value;
              });
          });
      }
      
      // 전역 프리셋 정보 표시 (전역이 아닌 경우)
      if (this.targetType !== PresetTargetType.GLOBAL) {
        const globalPreset = this.presetManager.getGlobalDefaultPreset();
        if (globalPreset) {
          contentEl.createEl('div', {
            text: `현재 전역 프리셋: ${globalPreset.name}`,
            cls: MODAL_CLASS_NAMES.INFO.TEXT
          });
        }
      }
      
      // 버튼 컨테이너
      const buttonContainer = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.BUTTONS.CONTAINER });
      
      // 취소 버튼
      buttonContainer.createEl('button', {
        text: '취소',
        cls: `${MODAL_CLASS_NAMES.BUTTONS.BUTTON} ${MODAL_CLASS_NAMES.BUTTONS.SMALL} ${MODAL_CLASS_NAMES.BUTTONS.CANCEL}`
      }).addEventListener('click', () => {
        this.close();
      });
      
      // 저장 버튼
      buttonContainer.createEl('button', {
        text: '저장',
        cls: `${MODAL_CLASS_NAMES.BUTTONS.BUTTON} ${MODAL_CLASS_NAMES.BUTTONS.SMALL} ${MODAL_CLASS_NAMES.BUTTONS.SAVE}`
      }).addEventListener('click', () => {
        this.handleSave();
      });
    } catch (error: any) {
      ErrorHandler.getInstance().handleErrorWithCode(
        ErrorCode.RENDER_ERROR,
        { message: `프리셋 대상 모달 열기 중 오류가 발생했습니다: ${error.message}` }
      );
    }
  }
  
  /**
   * 프리셋 선택 설명 텍스트 반환
   */
  private getPresetSelectionDescription(): string {
    switch (this.targetType) {
      case PresetTargetType.GLOBAL:
        return '볼트 전체에 적용할 기본 프리셋을 선택하세요';
      case PresetTargetType.FOLDER:
        return '폴더에 적용할 프리셋을 선택하세요';
      case PresetTargetType.TAG:
        return '태그에 적용할 프리셋을 선택하세요';
      default:
        return '적용할 프리셋을 선택하세요';
    }
  }
  
  /**
   * 저장 버튼 클릭 처리
   */
  private handleSave(): void {
    try {
      // 프리셋 ID 유효성 검사
      if (!this.selectedPresetId) {
        new Notice('프리셋을 선택해주세요.');
        return;
      }
      
      // 대상 유형에 따라 다른 처리
      switch (this.targetType) {
        case PresetTargetType.GLOBAL:
          if (this.onSaveGlobal) {
            this.onSaveGlobal(this.selectedPresetId);
          }
          break;
          
        case PresetTargetType.FOLDER:
          // 폴더 경로 유효성 검사
          if (!this.folderPath) {
            new Notice('폴더 경로를 입력해주세요.');
            return;
          }
          
          // 폴더 프리셋 우선순위 설정
          if (this.folderPresetManager) {
            this.folderPresetManager.setFolderPresetPriority(this.folderPath, this.overrideGlobalPreset);
          }
          
          if (this.onSaveFolder) {
            this.onSaveFolder(this.folderPath, this.selectedPresetId, this.overrideGlobalPreset);
          }
          break;
          
        case PresetTargetType.TAG:
          // 태그 이름 유효성 검사
          if (!this.tagName) {
            new Notice('태그를 입력해주세요.');
            return;
          }
          
          // 태그 프리셋 우선순위 설정
          if (this.tagPresetManager) {
            this.tagPresetManager.setTagPresetPriority(this.tagName, this.overrideGlobalPreset);
          }
          
          if (this.onSaveTag) {
            this.onSaveTag(this.tagName, this.selectedPresetId, this.overrideGlobalPreset);
          }
          break;
      }
      
      this.close();
    } catch (error) {
      ErrorHandler.handleError(
        error,
        ErrorCode.PRESET_TARGET_SAVE_ERROR,
        '프리셋 대상 설정 저장 중 오류가 발생했습니다.'
      );
    }
  }
  
  /**
   * 모달이 닫힐 때 호출됩니다.
   */
  onClose(): void {
    try {
      const { contentEl } = this;
      contentEl.empty();
    } catch (error: any) {
      console.error(`프리셋 대상 모달 닫기 중 오류: ${error.message}`, error);
    }
  }
} 