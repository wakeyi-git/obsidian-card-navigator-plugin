import { Setting, Platform } from 'obsidian';
import { SettingsManager } from '../../../managers/settings/SettingsManager';
import { CardNavigatorSettings } from '../../../core/types/settings.types';

/**
 * 키보드 설정 컴포넌트 클래스
 * 키보드 단축키 관련 설정을 관리하는 컴포넌트입니다.
 */
export class KeyboardSettings {
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
  /**
   * 현재 설정
   */
  private settings: CardNavigatorSettings;
  
  /**
   * 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 키보드 설정 컴포넌트 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsManager 설정 관리자
   */
  constructor(containerEl: HTMLElement, settingsManager: SettingsManager) {
    this.containerEl = containerEl;
    this.settingsManager = settingsManager;
    this.settings = settingsManager.getSettings();
  }
  
  /**
   * 키보드 설정 컴포넌트 표시
   */
  display(): void {
    const keyboardSection = this.containerEl.createEl('div', { cls: 'settings-section' });
    
    keyboardSection.createEl('h3', { text: '키보드 단축키 설정' });
    
    // 키보드 단축키 설정 안내
    const infoEl = keyboardSection.createEl('div', { cls: 'setting-item-info' });
    infoEl.createEl('div', { text: '키보드 단축키는 Obsidian 설정의 단축키 메뉴에서 설정할 수 있습니다.' });
    infoEl.createEl('div', { text: '아래 설정은 카드 네비게이터 뷰 내에서 사용되는 단축키를 설정합니다.' });
    
    this.addNavigationKeySettings(keyboardSection);
    this.addSelectionKeySettings(keyboardSection);
    this.addActionKeySettings(keyboardSection);
    this.addAccessibilitySettings(keyboardSection);
  }
  
  /**
   * 탐색 키 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addNavigationKeySettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '탐색 키' });
    
    // 화살표 키 사용 설정
    new Setting(containerEl)
      .setName('화살표 키 사용')
      .setDesc('화살표 키를 사용하여 카드 간 이동합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.keyboard.useArrowKeys)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              useArrowKeys: value
            });
          });
      });
    
    // 페이지 이동 키 사용 설정
    new Setting(containerEl)
      .setName('페이지 이동 키 사용')
      .setDesc('Page Up/Down 키를 사용하여 페이지 단위로 이동합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.keyboard.usePageKeys)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              usePageKeys: value
            });
          });
      });
    
    // 홈/엔드 키 사용 설정
    new Setting(containerEl)
      .setName('홈/엔드 키 사용')
      .setDesc('Home/End 키를 사용하여 처음/마지막 카드로 이동합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.keyboard.useHomeEndKeys)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              useHomeEndKeys: value
            });
          });
      });
    
    // 스크롤 속도 설정
    new Setting(containerEl)
      .setName('키보드 스크롤 속도')
      .setDesc('키보드로 스크롤할 때의 속도입니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 10, 1)
          .setValue(this.settings.keyboard.scrollSpeed)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              scrollSpeed: value
            });
          });
      });
  }
  
  /**
   * 선택 키 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addSelectionKeySettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '선택 키' });
    
    // 엔터 키 동작 설정
    new Setting(containerEl)
      .setName('엔터 키 동작')
      .setDesc('엔터 키를 눌렀을 때의 동작입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('open', '카드 열기')
          .addOption('edit', '카드 편집')
          .addOption('toggle', '카드 선택 토글')
          .setValue(this.settings.keyboard.enterKeyAction)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              enterKeyAction: value
            });
          });
      });
    
    // 스페이스 키 동작 설정
    new Setting(containerEl)
      .setName('스페이스 키 동작')
      .setDesc('스페이스 키를 눌렀을 때의 동작입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('toggle', '카드 선택 토글')
          .addOption('open', '카드 열기')
          .addOption('preview', '카드 미리보기')
          .setValue(this.settings.keyboard.spaceKeyAction)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              spaceKeyAction: value
            });
          });
      });
    
    // 다중 선택 키 설정
    new Setting(containerEl)
      .setName('다중 선택 키')
      .setDesc('다중 선택을 위해 사용할 키입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('shift', 'Shift')
          .addOption('ctrl', Platform.isMacOS ? 'Command' : 'Ctrl')
          .addOption('alt', Platform.isMacOS ? 'Option' : 'Alt')
          .setValue(this.settings.keyboard.multiSelectKey)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              multiSelectKey: value
            });
          });
      });
  }
  
  /**
   * 액션 키 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addActionKeySettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '액션 키' });
    
    // 편집 키 설정
    new Setting(containerEl)
      .setName('편집 키')
      .setDesc('카드를 편집 모드로 열기 위한 키입니다.')
      .addText(text => {
        text
          .setValue(this.settings.keyboard.editKey)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              editKey: value
            });
          });
      });
    
    // 삭제 키 설정
    new Setting(containerEl)
      .setName('삭제 키')
      .setDesc('카드를 삭제하기 위한 키입니다.')
      .addText(text => {
        text
          .setValue(this.settings.keyboard.deleteKey)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              deleteKey: value
            });
          });
      });
    
    // 복제 키 설정
    new Setting(containerEl)
      .setName('복제 키')
      .setDesc('카드를 복제하기 위한 키입니다.')
      .addText(text => {
        text
          .setValue(this.settings.keyboard.duplicateKey)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              duplicateKey: value
            });
          });
      });
    
    // 링크 복사 키 설정
    new Setting(containerEl)
      .setName('링크 복사 키')
      .setDesc('카드 링크를 복사하기 위한 키입니다.')
      .addText(text => {
        text
          .setValue(this.settings.keyboard.copyLinkKey)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              copyLinkKey: value
            });
          });
      });
    
    // 검색 키 설정
    new Setting(containerEl)
      .setName('검색 키')
      .setDesc('검색 바에 포커스하기 위한 키입니다.')
      .addText(text => {
        text
          .setValue(this.settings.keyboard.searchKey)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              searchKey: value
            });
          });
      });
    
    // 정렬 키 설정
    new Setting(containerEl)
      .setName('정렬 키')
      .setDesc('정렬 메뉴를 열기 위한 키입니다.')
      .addText(text => {
        text
          .setValue(this.settings.keyboard.sortKey)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              sortKey: value
            });
          });
      });
  }
  
  /**
   * 접근성 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addAccessibilitySettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '접근성 설정' });
    
    // 키보드 도움말 오버레이 키 설정
    new Setting(containerEl)
      .setName('키보드 도움말 오버레이 키')
      .setDesc('키보드 단축키 도움말 오버레이를 표시하기 위한 키입니다.')
      .addText(text => {
        text
          .setValue(this.settings.keyboard.helpOverlayKey)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              helpOverlayKey: value
            });
          });
      });
    
    // 스크린 리더 호환성 설정
    new Setting(containerEl)
      .setName('스크린 리더 호환성')
      .setDesc('스크린 리더와의 호환성을 향상시킵니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.keyboard.screenReaderCompatibility)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              screenReaderCompatibility: value
            });
          });
      });
    
    // 키보드 포커스 표시 설정
    new Setting(containerEl)
      .setName('키보드 포커스 표시')
      .setDesc('키보드 포커스를 시각적으로 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.keyboard.showKeyboardFocus)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              showKeyboardFocus: value
            });
          });
      });
    
    // 키보드 단축키 충돌 감지 설정
    new Setting(containerEl)
      .setName('키보드 단축키 충돌 감지')
      .setDesc('다른 플러그인과의 키보드 단축키 충돌을 감지합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.keyboard.detectKeyboardConflicts)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('keyboard', {
              ...this.settings.keyboard,
              detectKeyboardConflicts: value
            });
          });
      });
  }
} 