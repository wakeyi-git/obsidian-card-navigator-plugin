import { App, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { BaseSettingSection } from './BaseSettingSection';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 카드 일반 설정 섹션 클래스
 */
export class CardGeneralSection extends BaseSettingSection {
  /**
   * 플러그인 인스턴스
   */
  protected plugin!: CardNavigatorPlugin;
  
  /**
   * 앱 인스턴스
   */
  protected app!: App;

  /**
   * 생성자
   * @param id 섹션 ID
   */
  constructor(id: string) {
    super(id);
  }
  
  /**
   * 섹션 초기화
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  initialize(settingsService: ISettingsService, eventBus: DomainEventBus): void {
    super.initialize(settingsService, eventBus);
    this.plugin = settingsService.getPlugin() as CardNavigatorPlugin;
    this.app = this.plugin.app;
  }

  /**
   * 설정 표시
   * @param containerEl 컨테이너 요소
   */
  display(containerEl: HTMLElement): void {
    containerEl.empty();
    containerEl.createEl('h3', { text: '일반' });

    // 플러그인 활성화 설정
    new Setting(containerEl)
      .setName('플러그인 활성화')
      .setDesc('카드 네비게이터 플러그인을 활성화합니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enabled)
        .onChange(async (value) => {
          this.plugin.settings.enabled = value;
          await this.plugin.saveSettings();
          this.plugin.refreshViews();
        })
      );

    // 자동 새로고침 설정
    new Setting(containerEl)
      .setName('자동 새로고침')
      .setDesc('파일 변경 시 카드 뷰를 자동으로 새로고침합니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoRefresh)
        .onChange(async (value) => {
          this.plugin.settings.autoRefresh = value;
          await this.plugin.saveSettings();
        })
      );

    // 디버그 모드 설정
    new Setting(containerEl)
      .setName('디버그 모드')
      .setDesc('디버그 정보를 콘솔에 출력합니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.debugMode ?? false)
        .onChange(async (value) => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();
        })
      );
  }
} 