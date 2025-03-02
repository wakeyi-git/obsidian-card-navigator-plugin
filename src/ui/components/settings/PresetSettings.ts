import { Setting } from 'obsidian';
import { SettingsManager } from '../../../managers/settings/SettingsManager';
import { PresetManager } from '../../../managers/preset/PresetManager';
import { CardNavigatorSettings } from '../../../core/types/settings.types';
import { Preset } from '../../../core/models/Preset';

/**
 * 프리셋 설정 컴포넌트 클래스
 * 프리셋 관련 설정을 관리하는 컴포넌트입니다.
 */
export class PresetSettings {
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
   * @param containerEl 컨테이너 요소
   * @param settingsManager 설정 관리자
   * @param presetManager 프리셋 관리자
   */
  constructor(
    containerEl: HTMLElement,
    settingsManager: SettingsManager,
    presetManager: PresetManager
  ) {
    this.containerEl = containerEl;
    this.settingsManager = settingsManager;
    this.presetManager = presetManager;
    this.settings = settingsManager.getSettings();
  }
  
  /**
   * 프리셋 설정 컴포넌트 표시
   */
  display(): void {
    const presetSection = this.containerEl.createEl('div', { cls: 'settings-section' });
    
    presetSection.createEl('h3', { text: '프리셋 설정' });
    
    this.addPresetManagementSettings(presetSection);
    this.addFolderPresetSettings(presetSection);
    this.addPresetImportExportSettings(presetSection);
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
              await this.presetManager.createPreset(
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
    
    // 프리셋 자동 적용 설정
    new Setting(containerEl)
      .setName('프리셋 자동 적용')
      .setDesc('폴더 간 이동 시 적절한 프리셋을 자동으로 적용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.preset.autoApply)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('preset', {
              ...this.settings.preset,
              autoApply: value
            });
          });
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
    new Setting(containerEl)
      .setName('전역 기본 프리셋')
      .setDesc('모든 폴더에 적용되는 기본 프리셋입니다.')
      .addDropdown(dropdown => {
        // 드롭다운 옵션 추가
        dropdown.addOption('', '기본 설정');
        presets.forEach(preset => {
          dropdown.addOption(preset.name, preset.name);
        });
        
        // 현재 전역 기본 프리셋 선택
        dropdown.setValue(this.settings.preset.globalDefaultPreset || '');
        
        // 변경 이벤트 리스너
        dropdown.onChange(async (value) => {
          // 설정 업데이트
          await this.settingsManager.setSetting('preset', {
            ...this.settings.preset,
            globalDefaultPreset: value || null
          });
        });
      });
    
    // 폴더별 프리셋 목록
    const folderPresetList = containerEl.createEl('div', { cls: 'folder-preset-list' });
    
    // 폴더별 프리셋 항목 추가
    Object.entries(folderPresets).forEach(([folderPath, presetName]) => {
      this.addFolderPresetItem(folderPresetList, folderPath, presetName);
    });
    
    // 폴더 프리셋 추가 버튼
    new Setting(containerEl)
      .setName('폴더 프리셋 추가')
      .setDesc('특정 폴더에 프리셋을 할당합니다.')
      .addButton(button => {
        button
          .setButtonText('폴더 프리셋 추가')
          .onClick(async () => {
            // 폴더 경로 입력 모달 표시
            const folderPath = await this.promptForFolderPath();
            if (folderPath) {
              // 프리셋 선택 모달 표시
              const presetName = await this.promptForPresetSelection();
              if (presetName) {
                // 폴더 프리셋 추가
                const updatedFolderPresets = {
                  ...this.settings.preset.folderPresets,
                  [folderPath]: presetName
                };
                
                // 설정 업데이트
                await this.settingsManager.setSetting('preset', {
                  ...this.settings.preset,
                  folderPresets: updatedFolderPresets
                });
                
                // 설정 탭 다시 표시
                this.display();
              }
            }
          });
      });
  }
  
  /**
   * 폴더 프리셋 항목 추가
   * @param containerEl 컨테이너 요소
   * @param folderPath 폴더 경로
   * @param presetName 프리셋 이름
   */
  private addFolderPresetItem(containerEl: HTMLElement, folderPath: string, presetName: string): void {
    const presets = this.presetManager.getAllPresets();
    
    new Setting(containerEl)
      .setName(folderPath)
      .setDesc(`이 폴더에 적용할 프리셋입니다.`)
      .addDropdown(dropdown => {
        // 드롭다운 옵션 추가
        dropdown.addOption('', '기본 설정');
        presets.forEach(preset => {
          dropdown.addOption(preset.name, preset.name);
        });
        
        // 현재 프리셋 선택
        dropdown.setValue(presetName || '');
        
        // 변경 이벤트 리스너
        dropdown.onChange(async (value) => {
          const updatedFolderPresets = { ...this.settings.preset.folderPresets };
          
          if (value) {
            // 프리셋 업데이트
            updatedFolderPresets[folderPath] = value;
          } else {
            // 프리셋 제거
            delete updatedFolderPresets[folderPath];
          }
          
          // 설정 업데이트
          await this.settingsManager.setSetting('preset', {
            ...this.settings.preset,
            folderPresets: updatedFolderPresets
          });
          
          // 설정 탭 다시 표시
          this.display();
        });
      })
      .addButton(button => {
        button
          .setButtonText('삭제')
          .onClick(async () => {
            const updatedFolderPresets = { ...this.settings.preset.folderPresets };
            
            // 폴더 프리셋 제거
            delete updatedFolderPresets[folderPath];
            
            // 설정 업데이트
            await this.settingsManager.setSetting('preset', {
              ...this.settings.preset,
              folderPresets: updatedFolderPresets
            });
            
            // 설정 탭 다시 표시
            this.display();
          });
      });
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
            await this.presetManager.createPreset(preset.name, preset.settings);
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
} 