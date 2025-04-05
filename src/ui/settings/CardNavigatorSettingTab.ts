import { App, PluginSettingTab } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardSettingsSection } from './sections/CardSettingsSection';
import { CardSetSettingsSection } from './sections/CardSetSettingsSection';
import { LayoutSettingsSection } from './sections/LayoutSettingsSection';
import { SearchSettingsSection } from './sections/SearchSettingsSection';
import { SortSettingsSection } from './sections/SortSettingsSection';
import { PresetSettingsSection } from './sections/PresetSettingsSection';
/**
 * 카드 내비게이터 설정 탭
 */
export class CardNavigatorSettingTab extends PluginSettingTab {
  private cardSettings: CardSettingsSection;
  private cardSetSettings: CardSetSettingsSection;
  private layoutSettings: LayoutSettingsSection;
  private searchSettings: SearchSettingsSection;
  private sortSettings: SortSettingsSection;
  private presetSettings: PresetSettingsSection;
  constructor(
    app: App,
    private plugin: CardNavigatorPlugin
  ) {
    super(app, plugin);
    this.cardSettings = new CardSettingsSection(plugin);
    this.cardSetSettings = new CardSetSettingsSection(plugin);
    this.layoutSettings = new LayoutSettingsSection(plugin);
    this.searchSettings = new SearchSettingsSection(plugin);
    this.sortSettings = new SortSettingsSection(plugin);
    this.presetSettings = new PresetSettingsSection(plugin);
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
      { id: 'search', name: '검색 설정', section: this.searchSettings },
      { id: 'sort', name: '정렬 설정', section: this.sortSettings },
      { id: 'preset', name: '프리셋 설정', section: this.presetSettings },
    ];

    // 현재 활성화된 탭 ID
    let activeTabId = 'card';

    // 탭 버튼 생성
    tabs.forEach((tab, index) => {
      const tabButton = tabContainer.createEl('button', { text: tab.name });
      tabButton.addClass('card-navigator-settings-tab');
      if (index === 0) {
        tabButton.addClass('active');
      }

      // 탭 클릭 이벤트
      tabButton.addEventListener('click', () => {
        // 이미 활성 탭이면 무시
        if (activeTabId === tab.id) {
          return;
        }
        
        // 이전 탭 정리 (cleanup 메서드가 있는 경우)
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && 'cleanup' in activeTab.section && typeof activeTab.section.cleanup === 'function') {
          try {
            console.log(`이전 탭(${activeTabId}) 정리 실행`);
            activeTab.section.cleanup();
          } catch (error) {
            console.error(`${activeTabId} 탭 정리 중 오류:`, error);
          }
        }
        
        // 활성 탭 변경
        activeTabId = tab.id;
        
        // 활성 탭 변경
        tabContainer.querySelectorAll('.card-navigator-settings-tab').forEach(btn => {
          btn.removeClass('active');
        });
        tabButton.addClass('active');

        // 탭 내용 표시
        tabContentContainer.empty();
        tab.section.create(tabContentContainer);
        
        console.log(`${tab.id} 탭으로 전환 완료`);
      });
    });

    // 첫 번째 탭 내용 표시
    tabs[0].section.create(tabContentContainer);
  }
} 