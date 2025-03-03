import { Menu } from 'obsidian';
import { Preset } from '../../../core/models/Preset';
import { PresetManager } from '../../../managers/preset/PresetManager';

/**
 * 프리셋 메뉴 컴포넌트 클래스
 * 프리셋 메뉴를 생성하고 관리합니다.
 */
export class PresetMenu {
  /**
   * 메뉴 객체
   */
  private menu: Menu;
  
  /**
   * 프리셋 관리자
   */
  private presetManager: PresetManager;
  
  /**
   * 현재 선택된 프리셋 이름
   */
  private currentPresetName: string | null = null;
  
  /**
   * 프리셋 변경 콜백
   */
  private presetChangeCallback: ((presetName: string) => void) | null = null;
  
  /**
   * 프리셋 메뉴 컴포넌트 생성자
   * @param presetManager 프리셋 관리자
   */
  constructor(presetManager: PresetManager) {
    this.presetManager = presetManager;
    this.menu = new Menu();
  }
  
  /**
   * 메뉴 표시
   * @param targetElement 메뉴를 표시할 대상 요소
   */
  show(targetElement: HTMLElement): void {
    // 기존 메뉴 닫기
    this.menu.hide();
    
    // 새 메뉴 생성
    this.menu = new Menu();
    
    // 프리셋 목록 가져오기
    const presets = this.presetManager.getAllPresets();
    
    // 프리셋 옵션 추가
    this.addPresetOptions(presets);
    
    // 구분선 추가
    this.menu.addSeparator();
    
    // 프리셋 관리 옵션 추가
    this.addPresetManagementOptions();
    
    // 메뉴 표시
    this.menu.showAtPosition({
      x: targetElement.getBoundingClientRect().left,
      y: targetElement.getBoundingClientRect().bottom
    });
  }
  
  /**
   * 메뉴 숨기기
   */
  hide(): void {
    this.menu.hide();
  }
  
  /**
   * 현재 프리셋 설정
   * @param presetName 프리셋 이름
   */
  setCurrentPreset(presetName: string | null): void {
    this.currentPresetName = presetName;
  }
  
  /**
   * 프리셋 변경 이벤트 리스너 등록
   * @param callback 콜백 함수
   */
  onPresetChange(callback: (presetName: string) => void): void {
    this.presetChangeCallback = callback;
  }
  
  /**
   * 프리셋 옵션 추가
   * @param presets 프리셋 목록
   */
  private addPresetOptions(presets: Preset[]): void {
    this.menu.addItem(item => {
      item
        .setTitle('프리셋 선택')
        .setDisabled(true);
    });
    
    if (presets.length === 0) {
      this.menu.addItem(item => {
        item
          .setTitle('저장된 프리셋 없음')
          .setDisabled(true);
      });
      return;
    }
    
    presets.forEach(preset => {
      this.menu.addItem(item => {
        const isSelected = this.currentPresetName === preset.name;
        
        item
          .setTitle(preset.name)
          .setIcon(isSelected ? 'lucide-check' : 'lucide-bookmark')
          .setChecked(isSelected)
          .onClick(() => {
            this.currentPresetName = preset.name;
            this.notifyPresetChange(preset.name);
          });
      });
    });
  }
  
  /**
   * 프리셋 관리 옵션 추가
   */
  private addPresetManagementOptions(): void {
    // 현재 설정을 새 프리셋으로 저장
    this.menu.addItem(item => {
      item
        .setTitle('현재 설정을 새 프리셋으로 저장')
        .setIcon('lucide-save')
        .onClick(() => {
          this.showSavePresetDialog();
        });
    });
    
    // 현재 프리셋이 선택된 경우에만 표시할 옵션
    if (this.currentPresetName) {
      // 현재 프리셋 업데이트
      this.menu.addItem(item => {
        item
          .setTitle('현재 프리셋 업데이트')
          .setIcon('lucide-refresh-cw')
          .onClick(() => {
            this.updateCurrentPreset();
          });
      });
      
      // 현재 프리셋 삭제
      this.menu.addItem(item => {
        item
          .setTitle('현재 프리셋 삭제')
          .setIcon('lucide-trash-2')
          .onClick(() => {
            this.deleteCurrentPreset();
          });
      });
    }
    
    // 프리셋 가져오기/내보내기
    this.menu.addItem(item => {
      item
        .setTitle('프리셋 가져오기/내보내기')
        .setIcon('lucide-download')
        .onClick(() => {
          this.showImportExportDialog();
        });
    });
  }
  
  /**
   * 프리셋 저장 대화상자 표시
   */
  private showSavePresetDialog(): void {
    // 실제 구현에서는 모달 대화상자를 표시해야 함
    // 여기서는 간단한 프롬프트로 대체
    const presetName = prompt('새 프리셋 이름을 입력하세요:');
    if (presetName) {
      this.saveNewPreset(presetName);
    }
  }
  
  /**
   * 새 프리셋 저장
   * @param presetName 프리셋 이름
   */
  private saveNewPreset(presetName: string): void {
    try {
      // 프리셋 관리자를 통해 현재 설정으로 새 프리셋 생성
      this.presetManager.createPresetWithSettings(presetName, {
        description: '사용자 생성 프리셋',
        // 실제 구현에서는 현재 설정을 가져와야 함
        settings: {}
      });
      
      // 현재 프리셋 업데이트
      this.currentPresetName = presetName;
      
      // 콜백 호출
      this.notifyPresetChange(presetName);
      
      // 성공 메시지 표시
      console.log(`프리셋 "${presetName}"이(가) 저장되었습니다.`);
    } catch (error) {
      // 오류 메시지 표시
      console.error('프리셋 저장 중 오류 발생:', error);
    }
  }
  
  /**
   * 현재 프리셋 업데이트
   */
  private updateCurrentPreset(): void {
    if (!this.currentPresetName) return;
    
    try {
      // 프리셋 관리자를 통해 현재 프리셋 업데이트
      const preset = this.presetManager.getPreset(this.currentPresetName);
      if (preset) {
        // 실제 구현에서는 현재 설정을 가져와야 함
        const updatedSettings = { ...preset.settings };
        
        this.presetManager.updatePreset(this.currentPresetName, {
          ...preset,
          settings: updatedSettings
        });
        
        // 성공 메시지 표시
        console.log(`프리셋 "${this.currentPresetName}"이(가) 업데이트되었습니다.`);
      }
    } catch (error) {
      // 오류 메시지 표시
      console.error('프리셋 업데이트 중 오류 발생:', error);
    }
  }
  
  /**
   * 현재 프리셋 삭제
   */
  private deleteCurrentPreset(): void {
    if (!this.currentPresetName) return;
    
    // 삭제 확인
    const confirmed = confirm(`프리셋 "${this.currentPresetName}"을(를) 삭제하시겠습니까?`);
    if (!confirmed) return;
    
    try {
      // 프리셋 관리자를 통해 현재 프리셋 삭제
      this.presetManager.deletePreset(this.currentPresetName);
      
      // 현재 프리셋 초기화
      this.currentPresetName = null;
      
      // 성공 메시지 표시
      console.log(`프리셋 "${this.currentPresetName}"이(가) 삭제되었습니다.`);
    } catch (error) {
      // 오류 메시지 표시
      console.error('프리셋 삭제 중 오류 발생:', error);
    }
  }
  
  /**
   * 가져오기/내보내기 대화상자 표시
   */
  private showImportExportDialog(): void {
    // 실제 구현에서는 모달 대화상자를 표시해야 함
    // 여기서는 간단한 서브메뉴로 대체
    
    // 기존 메뉴 닫기
    this.menu.hide();
    
    // 새 메뉴 생성
    const importExportMenu = new Menu();
    
    // 가져오기 옵션
    importExportMenu.addItem(item => {
      item
        .setTitle('프리셋 가져오기')
        .setIcon('lucide-upload')
        .onClick(() => {
          // 실제 구현에서는 파일 선택 대화상자를 표시해야 함
          console.log('프리셋 가져오기 기능은 실제 구현에서 구현해야 합니다.');
        });
    });
    
    // 내보내기 옵션
    importExportMenu.addItem(item => {
      item
        .setTitle('모든 프리셋 내보내기')
        .setIcon('lucide-download')
        .onClick(() => {
          // 실제 구현에서는 파일 저장 대화상자를 표시해야 함
          console.log('프리셋 내보내기 기능은 실제 구현에서 구현해야 합니다.');
        });
    });
    
    // 현재 프리셋이 선택된 경우에만 표시할 옵션
    if (this.currentPresetName) {
      importExportMenu.addItem(item => {
        item
          .setTitle(`현재 프리셋 "${this.currentPresetName}" 내보내기`)
          .setIcon('lucide-download')
          .onClick(() => {
            // 실제 구현에서는 파일 저장 대화상자를 표시해야 함
            console.log('현재 프리셋 내보내기 기능은 실제 구현에서 구현해야 합니다.');
          });
      });
    }
    
    // 메뉴 표시
    importExportMenu.showAtMouseEvent(new MouseEvent('click'));
  }
  
  /**
   * 프리셋 변경 알림
   * @param presetName 프리셋 이름
   */
  private notifyPresetChange(presetName: string): void {
    if (this.presetChangeCallback) {
      this.presetChangeCallback(presetName);
    }
  }
} 