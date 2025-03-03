import { Setting } from 'obsidian';
import { SettingsManager } from '../../../managers/settings/SettingsManager';
import { PresetManager } from '../../../managers/preset/PresetManager';
import { CardNavigatorSettings } from '../../../core/types/settings.types';
import { Preset } from '../../../core/models/Preset';
import { TagPresetModal } from '../../modals/TagPresetModal';
import { PresetTargetModal, PresetTargetType } from '../../modals/PresetTargetModal';
import { App } from 'obsidian';

/**
 * 프리셋 설정 컴포넌트 클래스
 * 프리셋 관련 설정을 관리하는 컴포넌트입니다.
 */
export class PresetSettings {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
  /**
   * 프리셋 관리자
   */
  private presetManager: PresetManager;
  
  /**
   * 현재 설정
   */
  private settings: CardNavigatorSettings;
  
  /**
   * 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 프리셋 설정 컴포넌트 생성자
   * @param app Obsidian 앱 인스턴스
   * @param containerEl 컨테이너 요소
   * @param settingsManager 설정 관리자
   * @param presetManager 프리셋 관리자
   */
  constructor(
    app: App,
    containerEl: HTMLElement,
    settingsManager: SettingsManager,
    presetManager: PresetManager
  ) {
    this.app = app;
    this.containerEl = containerEl;
    this.settingsManager = settingsManager;
    this.presetManager = presetManager;
    this.settings = settingsManager.getSettings();
  }
  
  /**
   * 프리셋 설정 컴포넌트 표시
   */
  display(): void {
    const { containerEl } = this;
    
    // 프리셋 관리 설정 추가
    this.addPresetManagementSettings(containerEl);
    
    // 폴더별 프리셋 설정 추가
    this.addFolderPresetSettings(containerEl);
    
    // 태그별 프리셋 설정 추가
    this.addTagPresetSettings(containerEl);
    
    // 프리셋 우선순위 설정 추가
    this.addPrioritySettings(containerEl);
    
    // 프리셋 가져오기/내보내기 설정 추가
    this.addPresetImportExportSettings(containerEl);
  }
  
  /**
   * 프리셋 관리 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addPresetManagementSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '프리셋 관리' });
    
    // 현재 프리셋 설정
    const activePreset = this.presetManager.getActivePreset();
    
    new Setting(containerEl)
      .setName('현재 프리셋')
      .setDesc('현재 사용 중인 프리셋입니다.')
      .addDropdown(dropdown => {
        // 모든 프리셋 가져오기
        const presets = this.presetManager.getAllPresets();
        
        // 드롭다운 옵션 추가
        dropdown.addOption('', '기본 설정');
        presets.forEach(preset => {
          dropdown.addOption(preset.name, preset.name);
        });
        
        // 현재 프리셋 선택
        dropdown.setValue(activePreset ? activePreset.name : '');
        
        // 변경 이벤트 리스너
        dropdown.onChange(async (value) => {
          if (value) {
            this.presetManager.setActivePreset(value);
          } else {
            this.presetManager.setActivePreset(null);
          }
          
          // 설정 업데이트
          this.settings = this.settingsManager.getSettings();
          
          // 설정 탭 다시 표시
          this.display();
        });
      });
    
    // 프리셋 관리 버튼
    new Setting(containerEl)
      .setName('프리셋 관리')
      .setDesc('프리셋을 생성, 수정, 삭제합니다.')
      .addButton(button => {
        button
          .setButtonText('새 프리셋 저장')
          .onClick(async () => {
            // 프리셋 이름 입력 모달 표시
            const presetName = await this.promptForPresetName();
            if (presetName) {
              // 현재 설정으로 프리셋 생성
              await this.presetManager.createPresetWithSettings(
                presetName,
                this.settingsManager.getSettings()
              );
              
              // 설정 탭 다시 표시
              this.display();
            }
          });
      })
      .addButton(button => {
        button
          .setButtonText('현재 프리셋 업데이트')
          .setDisabled(!activePreset)
          .onClick(async () => {
            if (activePreset) {
              // 현재 설정으로 프리셋 업데이트
              await this.presetManager.updatePreset(
                activePreset.name,
                this.settingsManager.getSettings()
              );
              
              // 설정 탭 다시 표시
              this.display();
            }
          });
      })
      .addButton(button => {
        button
          .setButtonText('현재 프리셋 삭제')
          .setDisabled(!activePreset)
          .onClick(async () => {
            if (activePreset) {
              // 프리셋 삭제 확인 모달 표시
              const confirmed = await this.confirmPresetDeletion(activePreset.name);
              if (confirmed) {
                // 프리셋 삭제
                await this.presetManager.deletePreset(activePreset.name);
                
                // 설정 탭 다시 표시
                this.display();
              }
            }
          });
      });
    
    // 프리셋 자동 적용
    const autoApplyContainer = containerEl.createDiv({ cls: 'card-navigator-setting-item' });
    autoApplyContainer.createEl('h3', { text: '프리셋 자동 적용' });
    
    // 프리셋 자동 적용
    const autoApplyPresetsSetting = autoApplyContainer.createDiv({ cls: 'card-navigator-setting-control-row' });
    const autoApplyPresetsCheckbox = autoApplyPresetsSetting.createEl('input', {
      type: 'checkbox',
      checked: this.settings.preset.autoApplyPresets
    });
    autoApplyPresetsSetting.createEl('label', { text: '파일을 열 때 자동으로 프리셋을 적용합니다.' });
    
    autoApplyPresetsCheckbox.addEventListener('change', async () => {
      this.settings.preset.autoApplyPresets = autoApplyPresetsCheckbox.checked;
      await this.settingsManager.saveSettings();
    });
    
    // 폴더 프리셋 자동 적용
    const autoApplyFolderPresetsSetting = autoApplyContainer.createDiv({ cls: 'card-navigator-setting-control-row' });
    const autoApplyFolderPresetsCheckbox = autoApplyFolderPresetsSetting.createEl('input', {
      type: 'checkbox',
      checked: this.settings.preset.autoApplyFolderPresets
    });
    autoApplyFolderPresetsSetting.createEl('label', { text: '폴더 프리셋을 자동으로 적용합니다.' });
    
    autoApplyFolderPresetsCheckbox.addEventListener('change', async () => {
      this.settings.preset.autoApplyFolderPresets = autoApplyFolderPresetsCheckbox.checked;
      await this.settingsManager.saveSettings();
    });
    
    // 태그 프리셋 자동 적용
    const autoApplyTagPresetsSetting = autoApplyContainer.createDiv({ cls: 'card-navigator-setting-control-row' });
    const autoApplyTagPresetsCheckbox = autoApplyTagPresetsSetting.createEl('input', {
      type: 'checkbox',
      checked: this.settings.preset.autoApplyTagPresets
    });
    autoApplyTagPresetsSetting.createEl('label', { text: '태그 프리셋을 자동으로 적용합니다.' });
    
    autoApplyTagPresetsCheckbox.addEventListener('change', async () => {
      this.settings.preset.autoApplyTagPresets = autoApplyTagPresetsCheckbox.checked;
      await this.settingsManager.saveSettings();
    });
  }
  
  /**
   * 폴더 프리셋 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addFolderPresetSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '폴더별 프리셋' });
    
    // 폴더별 프리셋 설정
    const folderPresets = this.settings.preset.folderPresets || {};
    const presets = this.presetManager.getAllPresets();
    
    // 전역 기본 프리셋 설정
    const globalPresetContainer = containerEl.createDiv({ cls: 'card-navigator-setting-item' });
    globalPresetContainer.createEl('h3', { text: '전역 기본 프리셋' });
    
    const globalPresetDesc = globalPresetContainer.createEl('p', { 
      cls: 'card-navigator-setting-description',
      text: '모든 노트에 기본적으로 적용되는 프리셋입니다.' 
    });
    
    const globalPresetDropdownContainer = globalPresetContainer.createDiv({ cls: 'card-navigator-setting-control' });
    const globalPresetDropdown = globalPresetDropdownContainer.createEl('select', { cls: 'dropdown' });
    
    // 기본 옵션 추가
    globalPresetDropdown.createEl('option', {
      value: '',
      text: '없음',
      selected: !this.settings.preset.defaultPresetId
    });
    
    // 프리셋 옵션 추가
    this.presetManager.getAllPresets().forEach(preset => {
      globalPresetDropdown.createEl('option', {
        value: preset.id,
        text: preset.name,
        selected: preset.id === this.settings.preset.defaultPresetId
      });
    });
    
    // 변경 이벤트 리스너
    globalPresetDropdown.addEventListener('change', async () => {
      this.settings.preset.defaultPresetId = globalPresetDropdown.value || undefined;
      await this.settingsManager.saveSettings();
    });
    
    // 설정 버튼 추가
    const globalPresetSettingsButton = globalPresetDropdownContainer.createEl('button', {
      cls: 'card-navigator-button card-navigator-button-small',
      text: '설정'
    });
    
    globalPresetSettingsButton.addEventListener('click', () => {
      const modal = new PresetTargetModal(
        this.app,
        this.presetManager,
        PresetTargetType.GLOBAL,
        {
          presetId: this.settings.preset.defaultPresetId || undefined,
          onSave: async (data) => {
            this.settings.preset.defaultPresetId = data.presetId;
            await this.settingsManager.saveSettings();
            
            // 드롭다운 업데이트
            globalPresetDropdown.value = data.presetId;
          }
        }
      );
      
      modal.open();
    });
    
    // 폴더별 프리셋 목록
    const folderPresetList = containerEl.createEl('div', { cls: 'folder-preset-list' });
    
    // 폴더별 프리셋 항목 추가
    Object.entries(folderPresets).forEach(([folderPath, presetId]) => {
      this.addFolderPresetItem(folderPresetList, folderPath, presetId);
    });
    
    // 폴더 프리셋 추가 버튼
    new Setting(containerEl)
      .setName('폴더 프리셋 추가')
      .setDesc('특정 폴더에 프리셋을 할당합니다.')
      .addButton(button => {
        button
          .setButtonText('폴더 프리셋 추가')
          .onClick(async () => {
            const modal = new PresetTargetModal(
              this.app,
              this.presetManager,
              PresetTargetType.FOLDER,
              {
                onSaveFolder: (folderPath, presetId, overrideGlobal) => {
                  // 폴더 프리셋 추가
                  const updatedFolderPresets = {
                    ...this.settings.preset.folderPresets,
                    [folderPath]: presetId
                  };
                  
                  // 우선순위 설정 저장
                  if (!this.settings.preset.folderPresetPriorities) {
                    this.settings.preset.folderPresetPriorities = {};
                  }
                  this.settings.preset.folderPresetPriorities[folderPath] = overrideGlobal;
                  
                  // 설정 업데이트
                  this.settingsManager.setSetting('preset', {
                    ...this.settings.preset,
                    folderPresets: updatedFolderPresets
                  });
                  
                  // 설정 탭 다시 표시
                  this.display();
                }
              }
            );
            modal.open();
          });
      });
  }
  
  /**
   * 폴더 프리셋 항목 추가
   * @param containerEl 컨테이너 요소
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  private addFolderPresetItem(containerEl: HTMLElement, folderPath: string, presetId: string): void {
    const presets = this.presetManager.getAllPresets();
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // 폴더 프리셋 우선순위 정보 가져오기
    const folderPresetPriority = this.settings.preset.folderPresetPriorities?.[folderPath] ?? true;
    
    // 폴더 프리셋 항목 컨테이너
    const itemContainer = containerEl.createDiv({ cls: 'card-navigator-folder-preset-item' });
    
    // 폴더 경로 표시
    const folderPathEl = itemContainer.createDiv({ cls: 'card-navigator-folder-preset-path' });
    folderPathEl.createSpan({ text: folderPath, cls: 'card-navigator-folder-path' });
    
    // 프리셋 이름 표시
    const presetEl = itemContainer.createDiv({ cls: 'card-navigator-folder-preset-preset' });
    presetEl.createSpan({ text: preset.name, cls: 'card-navigator-preset-name' });
    
    // 우선순위 표시
    const priorityEl = itemContainer.createDiv({ cls: 'card-navigator-folder-preset-priority' });
    priorityEl.createSpan({ 
      text: folderPresetPriority ? '폴더 우선' : '전역 우선',
      cls: `card-navigator-priority ${folderPresetPriority ? 'priority-folder' : 'priority-global'}`
    });
    
    // 작업 버튼 표시
    const actionEl = itemContainer.createDiv({ cls: 'card-navigator-folder-preset-action' });
    
    // 편집 버튼
    const editButton = actionEl.createEl('button', {
      text: '편집',
      cls: 'card-navigator-button card-navigator-button-small'
    });
    
    // 삭제 버튼
    const deleteButton = actionEl.createEl('button', {
      text: '삭제',
      cls: 'card-navigator-button card-navigator-button-small card-navigator-button-danger'
    });
    
    // 편집 버튼 클릭 이벤트
    editButton.addEventListener('click', () => {
      const modal = new PresetTargetModal(
        this.app,
        this.presetManager,
        PresetTargetType.FOLDER,
        {
          onSaveFolder: (newFolderPath, newPresetId, overrideGlobal) => {
            const updatedFolderPresets = { ...this.settings.preset.folderPresets };
            
            // 기존 폴더 프리셋 삭제
            delete updatedFolderPresets[folderPath];
            
            // 새 폴더 프리셋 설정
            updatedFolderPresets[newFolderPath] = newPresetId;
            
            // 우선순위 설정 저장
            if (!this.settings.preset.folderPresetPriorities) {
              this.settings.preset.folderPresetPriorities = {};
            }
            
            // 기존 우선순위 설정 삭제
            if (this.settings.preset.folderPresetPriorities[folderPath]) {
              delete this.settings.preset.folderPresetPriorities[folderPath];
            }
            
            // 새 우선순위 설정 저장
            this.settings.preset.folderPresetPriorities[newFolderPath] = overrideGlobal;
            
            // 설정 업데이트
            this.settingsManager.setSetting('preset', {
              ...this.settings.preset,
              folderPresets: updatedFolderPresets
            });
            
            // 설정 탭 다시 표시
            this.display();
          }
        },
        {
          folderPath: folderPath,
          presetId: presetId,
          overrideGlobal: folderPresetPriority
        }
      );
      modal.open();
    });
    
    // 삭제 버튼 클릭 이벤트
    deleteButton.addEventListener('click', async () => {
      const updatedFolderPresets = { ...this.settings.preset.folderPresets };
      
      // 폴더 프리셋 제거
      delete updatedFolderPresets[folderPath];
      
      // 우선순위 설정 삭제
      if (this.settings.preset.folderPresetPriorities) {
        delete this.settings.preset.folderPresetPriorities[folderPath];
      }
      
      // 설정 업데이트
      await this.settingsManager.setSetting('preset', {
        ...this.settings.preset,
        folderPresets: updatedFolderPresets
      });
      
      // 설정 탭 다시 표시
      this.display();
    });
  }
  
  /**
   * 프리셋 우선순위 설정 UI 추가
   * @param containerEl 컨테이너 요소
   */
  private addPrioritySettings(containerEl: HTMLElement): void {
    try {
      containerEl.createEl('h3', { text: '프리셋 우선순위 설정' });
      
      // 우선순위 설정
      const priorityContainer = containerEl.createDiv({ cls: 'card-navigator-setting-item' });
      priorityContainer.createEl('h3', { text: '프리셋 우선순위 설정' });
      
      const priorityDesc = priorityContainer.createEl('p', { 
        cls: 'card-navigator-setting-description',
        text: '여러 프리셋이 적용 가능한 경우 우선순위를 결정합니다.' 
      });
      
      // 기본 우선순위 순서
      const priorityOrderContainer = priorityContainer.createDiv({ cls: 'card-navigator-setting-control-row' });
      priorityOrderContainer.createEl('label', { text: '기본 우선순위 순서:' });
      const priorityOrderSelect = priorityOrderContainer.createEl('select');
      
      // 옵션 추가
      const priorityOptions = [
        { value: 'tag-folder-global', text: '태그 > 폴더 > 전역' },
        { value: 'folder-tag-global', text: '폴더 > 태그 > 전역' },
        { value: 'custom', text: '사용자 정의 (개별 설정 사용)' }
      ];
      
      priorityOptions.forEach(option => {
        priorityOrderSelect.createEl('option', {
          value: option.value,
          text: option.text,
          selected: this.settings.preset.defaultPriorityOrder === option.value
        });
      });
      
      priorityOrderSelect.addEventListener('change', async () => {
        this.settings.preset.defaultPriorityOrder = priorityOrderSelect.value as any;
        await this.settingsManager.saveSettings();
      });
      
      // 충돌 해결 방식
      const conflictResolutionContainer = priorityContainer.createDiv({ cls: 'card-navigator-setting-control-row' });
      conflictResolutionContainer.createEl('label', { text: '충돌 해결 방식:' });
      const conflictResolutionSelect = conflictResolutionContainer.createEl('select');
      
      // 옵션 추가
      const conflictOptions = [
        { value: 'priority-only', text: '우선순위가 높은 프리셋만 적용' },
        { value: 'merge-priority', text: '프리셋 병합 (우선순위 순서대로)' },
        { value: 'merge-custom', text: '프리셋 병합 (사용자 정의 규칙)' }
      ];
      
      conflictOptions.forEach(option => {
        conflictResolutionSelect.createEl('option', {
          value: option.value,
          text: option.text,
          selected: this.settings.preset.conflictResolution === option.value
        });
      });
      
      conflictResolutionSelect.addEventListener('change', async () => {
        this.settings.preset.conflictResolution = conflictResolutionSelect.value as any;
        await this.settingsManager.saveSettings();
      });
    } catch (error) {
      console.error('프리셋 우선순위 설정 UI 렌더링 중 오류가 발생했습니다:', error);
    }
  }
  
  /**
   * 프리셋 가져오기/내보내기 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addPresetImportExportSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '프리셋 가져오기/내보내기' });
    
    // 프리셋 가져오기/내보내기 버튼
    new Setting(containerEl)
      .setName('프리셋 가져오기/내보내기')
      .setDesc('프리셋을 파일로 가져오거나 내보냅니다.')
      .addButton(button => {
        button
          .setButtonText('프리셋 내보내기')
          .onClick(() => {
            // 프리셋 내보내기
            this.exportPresets();
          });
      })
      .addButton(button => {
        button
          .setButtonText('프리셋 가져오기')
          .onClick(() => {
            // 프리셋 가져오기
            this.importPresets();
          });
      });
  }
  
  /**
   * 프리셋 이름 입력 프롬프트 표시
   * @returns 입력된 프리셋 이름 또는 null
   */
  private async promptForPresetName(): Promise<string | null> {
    // 실제 구현에서는 모달 사용
    return prompt('새 프리셋 이름을 입력하세요:');
  }
  
  /**
   * 프리셋 선택 프롬프트 표시
   * @returns 선택된 프리셋 이름 또는 null
   */
  private async promptForPresetSelection(): Promise<string | null> {
    const presets = this.presetManager.getAllPresets();
    
    if (presets.length === 0) {
      alert('사용 가능한 프리셋이 없습니다. 먼저 프리셋을 생성하세요.');
      return null;
    }
    
    // 실제 구현에서는 모달 사용
    const presetNames = presets.map(preset => preset.name);
    const presetList = presetNames.join(', ');
    
    return prompt(`프리셋을 선택하세요 (${presetList}):`);
  }
  
  /**
   * 폴더 경로 입력 프롬프트 표시
   * @returns 입력된 폴더 경로 또는 null
   */
  private async promptForFolderPath(): Promise<string | null> {
    // 실제 구현에서는 모달 사용
    return prompt('폴더 경로를 입력하세요:');
  }
  
  /**
   * 프리셋 삭제 확인 모달 표시
   * @param presetName 삭제할 프리셋 이름
   * @returns 확인 여부
   */
  private async confirmPresetDeletion(presetName: string): Promise<boolean> {
    // 실제 구현에서는 모달 사용
    return confirm(`"${presetName}" 프리셋을 삭제하시겠습니까?`);
  }
  
  /**
   * 프리셋 내보내기
   */
  private exportPresets(): void {
    // 모든 프리셋 가져오기
    const presets = this.presetManager.getAllPresets();
    
    if (presets.length === 0) {
      alert('내보낼 프리셋이 없습니다.');
      return;
    }
    
    // JSON 문자열로 변환
    const json = JSON.stringify(presets, null, 2);
    
    // 다운로드 링크 생성
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 다운로드 링크 클릭
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-navigator-presets.json';
    a.click();
    
    // URL 해제
    URL.revokeObjectURL(url);
  }
  
  /**
   * 프리셋 가져오기
   */
  private importPresets(): void {
    // 파일 입력 요소 생성
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    // 파일 선택 이벤트 리스너
    input.addEventListener('change', async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // 파일 읽기
          const text = await file.text();
          
          // JSON 파싱
          const presets = JSON.parse(text) as Preset[];
          
          // 프리셋 가져오기
          for (const preset of presets) {
            await this.presetManager.createPresetWithSettings(preset.name, preset.settings);
          }
          
          // 설정 탭 다시 표시
          this.display();
          
          alert(`${presets.length}개의 프리셋을 성공적으로 가져왔습니다.`);
        } catch (error) {
          console.error('프리셋 가져오기 실패:', error);
          alert('프리셋 가져오기에 실패했습니다. 파일 형식을 확인하세요.');
        }
      }
    });
    
    // 파일 선택 다이얼로그 표시
    input.click();
  }
  
  /**
   * 태그별 프리셋 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addTagPresetSettings(containerEl: HTMLElement): void {
    try {
      // 태그 프리셋 섹션 생성
      containerEl.createEl('h3', { text: '태그 프리셋 설정' });
      
      // 태그 프리셋 자동 적용 설정
      new Setting(containerEl)
        .setName('태그 프리셋 자동 적용')
        .setDesc('노트에 태그가 있을 때 자동으로 해당 태그의 프리셋을 적용합니다.')
        .addToggle(toggle => {
          toggle.setValue(this.settings.preset.autoApplyTagPresets)
            .onChange(value => {
              this.settings.preset.autoApplyTagPresets = value;
              this.settingsManager.saveSettings();
            });
        });
      
      // 전역 프리셋 정보 표시
      const globalPreset = this.presetManager.getGlobalDefaultPreset();
      if (globalPreset) {
        containerEl.createEl('div', {
          text: `현재 전역 프리셋: ${globalPreset.name}`,
          cls: 'card-navigator-info-text'
        });
      }
      
      // 프리셋 적용 모드 설정
      new Setting(containerEl)
        .setName('프리셋 적용 모드')
        .setDesc('여러 프리셋이 적용 가능할 때 어떤 프리셋을 적용할지 설정합니다.')
        .addDropdown(dropdown => {
          dropdown.addOption('folder-only', '폴더 프리셋만 적용')
            .addOption('tag-only', '태그 프리셋만 적용')
            .addOption('folder-first', '폴더 프리셋 우선 (없으면 태그 프리셋)')
            .addOption('tag-first', '태그 프리셋 우선 (없으면 폴더 프리셋)')
            .addOption('merged', '모든 프리셋 병합')
            .setValue(this.settings.preset.presetApplyMode)
            .onChange(value => {
              this.settings.preset.presetApplyMode = value as PresetApplyMode;
              this.settingsManager.saveSettings();
              
              // 병합 모드일 때만 병합 전략 설정 표시
              const mergeStrategyEl = containerEl.querySelector('.preset-merge-strategy-setting');
              if (mergeStrategyEl) {
                mergeStrategyEl.toggleClass('is-hidden', value !== 'merged');
              }
            });
        });
      
      // 병합 전략 설정 (병합 모드일 때만 표시)
      const mergeStrategySetting = new Setting(containerEl)
        .setClass('preset-merge-strategy-setting')
        .setName('프리셋 병합 전략')
        .setDesc('프리셋을 병합할 때 충돌을 어떻게 해결할지 설정합니다.')
        .addDropdown(dropdown => {
          dropdown.addOption('folder-override', '폴더 프리셋 기반 (태그 프리셋이 덮어씀)')
            .addOption('tag-override', '태그 프리셋 기반 (폴더 프리셋이 덮어씀)')
            .addOption('deep-merge', '깊은 병합 (객체 속성별 병합)')
            .setValue(this.settings.preset.presetMergeStrategy)
            .onChange(value => {
              this.settings.preset.presetMergeStrategy = value as PresetMergeStrategy;
              this.settingsManager.saveSettings();
            });
        });
      
      // 병합 모드가 아닐 때 숨김
      if (this.settings.preset.presetApplyMode !== 'merged') {
        mergeStrategySetting.settingEl.addClass('is-hidden');
      }
      
      // 태그 프리셋 목록 컨테이너
      const tagPresetListContainer = containerEl.createDiv({ cls: 'card-navigator-tag-preset-list' });
      
      // 태그 프리셋 헤더
      const tagPresetHeader = tagPresetListContainer.createDiv({ cls: 'card-navigator-tag-preset-header' });
      tagPresetHeader.createDiv({ cls: 'card-navigator-tag-preset-tag-header', text: '태그' });
      tagPresetHeader.createDiv({ cls: 'card-navigator-tag-preset-preset-header', text: '프리셋' });
      tagPresetHeader.createDiv({ cls: 'card-navigator-tag-preset-priority-header', text: '우선순위' });
      tagPresetHeader.createDiv({ cls: 'card-navigator-tag-preset-action-header', text: '작업' });
      
      // 태그 프리셋 콘텐츠
      const tagPresetContent = tagPresetListContainer.createDiv({ cls: 'card-navigator-tag-preset-content' });
      
      // 태그 프리셋 목록 표시
      const tagPresets = this.presetManager.getAllTagPresets();
      const presets = this.presetManager.getAllPresets();
      
      // 태그 프리셋이 없는 경우 안내 메시지 표시
      if (Object.keys(tagPresets).length === 0) {
        const emptyMessage = tagPresetContent.createDiv({ cls: 'card-navigator-tag-preset-item' });
        emptyMessage.createDiv({ text: '등록된 태그 프리셋이 없습니다.', cls: 'card-navigator-tag-preset-empty' });
      } else {
        // 태그 프리셋 목록 표시
        Object.entries(tagPresets).forEach(([tag, presetId]) => {
          const preset = presets.find(p => p.id === presetId);
          if (!preset) return;
          
          // 태그 프리셋 우선순위 정보 가져오기
          const tagPresetPriority = this.settings.preset.tagPresetPriorities?.[tag] ?? true;
          
          const tagPresetItem = tagPresetContent.createDiv({ cls: 'card-navigator-tag-preset-item' });
          
          // 태그 표시
          const tagEl = tagPresetItem.createDiv({ cls: 'card-navigator-tag-preset-tag' });
          tagEl.createSpan({ text: `#${tag}`, cls: 'card-navigator-tag' });
          
          // 프리셋 이름 표시
          const presetEl = tagPresetItem.createDiv({ cls: 'card-navigator-tag-preset-preset' });
          presetEl.createSpan({ text: preset.name, cls: 'card-navigator-preset-name' });
          
          // 우선순위 표시
          const priorityEl = tagPresetItem.createDiv({ cls: 'card-navigator-tag-preset-priority' });
          priorityEl.createSpan({ 
            text: tagPresetPriority ? '태그 우선' : '전역 우선',
            cls: `card-navigator-priority ${tagPresetPriority ? 'priority-tag' : 'priority-global'}`
          });
          
          // 작업 버튼 표시
          const actionEl = tagPresetItem.createDiv({ cls: 'card-navigator-tag-preset-action' });
          
          // 편집 버튼
          const editButton = actionEl.createEl('button', {
            text: '편집',
            cls: 'card-navigator-button card-navigator-button-small'
          });
          
          // 삭제 버튼
          const deleteButton = actionEl.createEl('button', {
            text: '삭제',
            cls: 'card-navigator-button card-navigator-button-small card-navigator-button-danger'
          });
          
          // 편집 버튼 클릭 이벤트
          editButton.addEventListener('click', () => {
            const modal = new PresetTargetModal(
              this.app,
              this.presetManager,
              PresetTargetType.TAG,
              {
                onSaveTag: (tag, presetId, overrideGlobal) => {
                  // 기존 태그 프리셋 삭제
                  this.presetManager.removeTagPreset(tag);
                  
                  // 새 태그 프리셋 설정
                  this.presetManager.setTagPreset(tag, presetId);
                  
                  // 우선순위 설정 저장
                  if (!this.settings.preset.tagPresetPriorities) {
                    this.settings.preset.tagPresetPriorities = {};
                  }
                  this.settings.preset.tagPresetPriorities[tag] = overrideGlobal;
                  
                  // 설정 저장
                  this.settingsManager.saveSettings();
                  
                  // UI 업데이트
                  this.display();
                }
              },
              {
                tag: tag,
                presetId: presetId,
                overrideGlobal: tagPresetPriority
              }
            );
            modal.open();
          });
          
          // 삭제 버튼 클릭 이벤트
          deleteButton.addEventListener('click', () => {
            // 태그 프리셋 삭제
            this.presetManager.removeTagPreset(tag);
            
            // 우선순위 설정 삭제
            if (this.settings.preset.tagPresetPriorities) {
              delete this.settings.preset.tagPresetPriorities[tag];
            }
            
            // 설정 저장
            this.settingsManager.saveSettings();
            
            // UI 업데이트
            this.display();
          });
        });
      }
      
      // 태그 프리셋 추가 버튼
      const addTagPresetContainer = containerEl.createDiv({ cls: 'card-navigator-add-tag-preset' });
      const addTagPresetButton = addTagPresetContainer.createEl('button', {
        text: '태그 프리셋 추가',
        cls: 'card-navigator-button'
      });
      
      // 태그 프리셋 추가 버튼 클릭 이벤트
      addTagPresetButton.addEventListener('click', () => {
        const modal = new PresetTargetModal(
          this.app,
          this.presetManager,
          PresetTargetType.TAG,
          {
            onSaveTag: (tag, presetId, overrideGlobal) => {
              // 태그 프리셋 설정
              this.presetManager.setTagPreset(tag, presetId);
              
              // 우선순위 설정 저장
              if (!this.settings.preset.tagPresetPriorities) {
                this.settings.preset.tagPresetPriorities = {};
              }
              this.settings.preset.tagPresetPriorities[tag] = overrideGlobal;
              
              // 설정 저장
              this.settingsManager.saveSettings();
              
              // UI 업데이트
              this.display();
            }
          }
        );
        modal.open();
      });
    } catch (error) {
      console.error('태그 프리셋 설정 UI 렌더링 중 오류가 발생했습니다:', error);
    }
  }
} 