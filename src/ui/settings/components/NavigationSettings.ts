import { Setting } from 'obsidian';
import { IPluginWithSettings } from '@/ui/settings/SettingsTab';

/**
 * 네비게이션 설정 컴포넌트
 */
export class NavigationSettings {
  constructor(
    private containerEl: HTMLElement,
    private plugin: IPluginWithSettings
  ) {}

  /**
   * 설정 표시
   */
  display(): void {
    new Setting(this.containerEl)
      .setName('네비게이션 설정')
      .setHeading();

    // 키보드 내비게이션 활성화
    new Setting(this.containerEl)
      .setName('키보드 내비게이션')
      .setDesc('키보드로 카드 간 이동이 가능합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('keyboardNavigationEnabled'))
          .onChange(async (value) => {
            this.plugin.setSetting('keyboardNavigationEnabled', value);
            await this.plugin.saveSettings();
          });
      });

    // 스크롤 동작
    new Setting(this.containerEl)
      .setName('스크롤 동작')
      .setDesc('카드로 이동할 때의 스크롤 동작을 설정합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('smooth', '부드러운 스크롤')
          .addOption('instant', '즉시 스크롤')
          .setValue(this.plugin.getSetting('scrollBehavior'))
          .onChange(async (value) => {
            this.plugin.setSetting('scrollBehavior', value);
            await this.plugin.saveSettings();
          });
      });

    // 활성 카드 자동 포커스
    new Setting(this.containerEl)
      .setName('활성 카드 자동 포커스')
      .setDesc('현재 활성화된 파일의 카드에 자동으로 포커스합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('autoFocusActiveCard'))
          .onChange(async (value) => {
            this.plugin.setSetting('autoFocusActiveCard', value);
            await this.plugin.saveSettings();
          });
      });

    // 단축키 설정
    new Setting(this.containerEl)
      .setName('단축키 설정')
      .setDesc('네비게이션 관련 단축키를 설정합니다.')
      .addButton(button => {
        button
          .setButtonText('단축키 설정 열기')
          .onClick(() => {
            // 단축키 설정을 여는 명령어 추가
            this.plugin.addCommand({
              id: 'open-hotkeys',
              name: '단축키 설정 열기',
              callback: () => {
                // 단축키 설정 열기
                const settingsView = this.plugin.app.workspace.getLeavesOfType('markdown').find(leaf => 
                  leaf.getViewState().type === 'settings'
                );
                
                if (settingsView) {
                  this.plugin.app.workspace.revealLeaf(settingsView);
                } else {
                  this.plugin.app.workspace.getLeaf('tab').setViewState({
                    type: 'settings',
                    state: { settingTab: 'hotkeys' }
                  });
                }
              }
            });
          });
      });
  }
} 