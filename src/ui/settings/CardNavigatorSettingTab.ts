import { App, PluginSettingTab, Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardSettingsSection } from './sections/CardSettingsSection';
import { CardSetSettingsSection } from './sections/CardSetSettingsSection';
import { LayoutSettingsSection } from './sections/LayoutSettingsSection';
import { PresetSettingsSection } from './sections/PresetSettingsSection';
import { SearchSettingsSection } from './sections/SearchSettingsSection';
import { SortSettingsSection } from './sections/SortSettingsSection';

/**
 * 카드 내비게이터 설정 탭
 */
export class CardNavigatorSettingTab extends PluginSettingTab {
  private cardSettings: CardSettingsSection;
  private cardSetSettings: CardSetSettingsSection;
  private layoutSettings: LayoutSettingsSection;
  private presetSettings: PresetSettingsSection;
  private searchSettings: SearchSettingsSection;
  private sortSettings: SortSettingsSection;

  constructor(
    app: App,
    private plugin: CardNavigatorPlugin
  ) {
    super(app, plugin);
    this.cardSettings = new CardSettingsSection(plugin);
    this.cardSetSettings = new CardSetSettingsSection(plugin);
    this.layoutSettings = new LayoutSettingsSection(plugin);
    this.presetSettings = new PresetSettingsSection(plugin);
    this.searchSettings = new SearchSettingsSection(plugin);
    this.sortSettings = new SortSettingsSection(plugin);
  }

  /**
   * 설정 UI 표시
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 탭 컨테이너 생성
    const tabContainer = containerEl.createDiv('card-navigator-settings-tabs');
    const tabContentContainer = containerEl.createDiv('card-navigator-settings-content');

    // 탭 목록 생성
    const tabs = [
      { id: 'card', name: '카드 설정', section: this.cardSettings },
      { id: 'cardSet', name: '카드셋 설정', section: this.cardSetSettings },
      { id: 'layout', name: '레이아웃 설정', section: this.layoutSettings },
      { id: 'preset', name: '프리셋 설정', section: this.presetSettings },
      { id: 'search', name: '검색 설정', section: this.searchSettings },
      { id: 'sort', name: '정렬 설정', section: this.sortSettings }
    ];

    // 탭 버튼 생성
    tabs.forEach((tab, index) => {
      const tabButton = tabContainer.createEl('button', { text: tab.name });
      tabButton.addClass('card-navigator-settings-tab');
      if (index === 0) {
        tabButton.addClass('active');
      }

      // 탭 클릭 이벤트
      tabButton.addEventListener('click', () => {
        // 활성 탭 변경
        tabContainer.querySelectorAll('.card-navigator-settings-tab').forEach(btn => {
          btn.removeClass('active');
        });
        tabButton.addClass('active');

        // 탭 내용 표시
        tabContentContainer.empty();
        tab.section.create(tabContentContainer);
      });
    });

    // 첫 번째 탭 내용 표시
    tabs[0].section.create(tabContentContainer);
  }
} 