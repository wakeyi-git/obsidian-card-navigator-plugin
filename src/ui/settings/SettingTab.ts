import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { ModeType } from '../../domain/mode/Mode';
import { renderReactSettings, unmountReactSettings } from './adapters/ReactSettingsAdapter';

// React 컴포넌트 임포트
import ModeSettings from './tabs/ModeSettings';
import CardSettings from './tabs/CardSettings';
import SearchSettings from './tabs/SearchSettings';
import SortSettings from './tabs/SortSettings';
import LayoutSettings from './tabs/LayoutSettings';
import PresetSettings from './tabs/PresetSettings';

/**
 * 카드 네비게이터 설정 탭
 */
export class CardNavigatorSettingTab extends PluginSettingTab {
  plugin: CardNavigatorPlugin;
  activeTab: 'mode' | 'card' | 'search' | 'sort' | 'layout' | 'preset' = 'mode';
  tabButtons: Record<string, HTMLElement> = {};
  reactContainers: Record<string, HTMLElement> = {};
  
  constructor(app: App, plugin: CardNavigatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // 탭 네비게이션 생성
    this.createTabNavigation(containerEl);
    
    // 활성 탭에 따라 설정 섹션 표시
    const contentContainer = containerEl.createDiv('content-container');
    
    switch (this.activeTab) {
      case 'mode':
        this.createModeSettings(contentContainer);
        break;
      case 'card':
        this.createCardSettings(contentContainer);
        break;
      case 'search':
        this.createSearchSettings(contentContainer);
        break;
      case 'sort':
        this.createSortSettings(contentContainer);
        break;
      case 'layout':
        this.createLayoutSettings(contentContainer);
        break;
      case 'preset':
        this.createPresetSettings(contentContainer);
        break;
    }
  }
  
  /**
   * 탭 네비게이션 생성
   */
  createTabNavigation(containerEl: HTMLElement): void {
    const tabsContainer = containerEl.createDiv('card-navigator-tabs');
    
    // 모드 설정 탭
    const modeTab = tabsContainer.createEl('button', {
      text: '모드 설정',
      cls: `card-navigator-tab ${this.activeTab === 'mode' ? 'active' : ''}`
    });
    modeTab.addEventListener('click', () => this.switchTab('mode'));
    this.tabButtons['mode'] = modeTab;
    
    // 카드 설정 탭
    const cardTab = tabsContainer.createEl('button', {
      text: '카드 설정',
      cls: `card-navigator-tab ${this.activeTab === 'card' ? 'active' : ''}`
    });
    cardTab.addEventListener('click', () => this.switchTab('card'));
    this.tabButtons['card'] = cardTab;
    
    // 검색 설정 탭
    const searchTab = tabsContainer.createEl('button', {
      text: '검색 설정',
      cls: `card-navigator-tab ${this.activeTab === 'search' ? 'active' : ''}`
    });
    searchTab.addEventListener('click', () => this.switchTab('search'));
    this.tabButtons['search'] = searchTab;
    
    // 정렬 설정 탭
    const sortTab = tabsContainer.createEl('button', {
      text: '정렬 설정',
      cls: `card-navigator-tab ${this.activeTab === 'sort' ? 'active' : ''}`
    });
    sortTab.addEventListener('click', () => this.switchTab('sort'));
    this.tabButtons['sort'] = sortTab;
    
    // 레이아웃 설정 탭
    const layoutTab = tabsContainer.createEl('button', {
      text: '레이아웃 설정',
      cls: `card-navigator-tab ${this.activeTab === 'layout' ? 'active' : ''}`
    });
    layoutTab.addEventListener('click', () => this.switchTab('layout'));
    this.tabButtons['layout'] = layoutTab;
    
    // 프리셋 설정 탭
    const presetTab = tabsContainer.createEl('button', {
      text: '프리셋 설정',
      cls: `card-navigator-tab ${this.activeTab === 'preset' ? 'active' : ''}`
    });
    presetTab.addEventListener('click', () => this.switchTab('preset'));
    this.tabButtons['preset'] = presetTab;
  }
  
  /**
   * 탭 전환
   * @param tab 활성화할 탭
   */
  switchTab(tab: 'mode' | 'card' | 'search' | 'sort' | 'layout' | 'preset'): void {
    // 이전 탭 비활성화
    this.tabButtons[this.activeTab].removeClass('active');
    
    // 새 탭 활성화
    this.activeTab = tab;
    this.tabButtons[tab].addClass('active');
    
    // 설정 다시 표시
    this.display();
  }
  
  /**
   * 모드 설정 섹션 생성
   */
  createModeSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '모드 설정' });
    
    // React 컴포넌트 렌더링
    this.reactContainers['mode'] = renderReactSettings(ModeSettings, containerEl, this.plugin);
  }
  
  /**
   * 카드 설정 섹션 생성
   */
  createCardSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '카드 설정' });
    
    // React 컴포넌트 렌더링
    this.reactContainers['card'] = renderReactSettings(CardSettings, containerEl, this.plugin);
  }
  
  /**
   * 검색 설정 섹션 생성
   */
  createSearchSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '검색 설정' });
    
    // React 컴포넌트 렌더링
    this.reactContainers['search'] = renderReactSettings(SearchSettings, containerEl, this.plugin);
  }
  
  /**
   * 정렬 설정 섹션 생성
   */
  createSortSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '정렬 설정' });
    
    // React 컴포넌트 렌더링
    this.reactContainers['sort'] = renderReactSettings(SortSettings, containerEl, this.plugin);
  }
  
  /**
   * 레이아웃 설정 섹션 생성
   */
  createLayoutSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '레이아웃 설정' });
    
    // React 컴포넌트 렌더링
    this.reactContainers['layout'] = renderReactSettings(LayoutSettings, containerEl, this.plugin);
  }
  
  /**
   * 프리셋 설정 섹션 생성
   */
  createPresetSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '프리셋 설정' });
    
    // React 컴포넌트 렌더링
    this.reactContainers['preset'] = renderReactSettings(PresetSettings, containerEl, this.plugin);
  }
  
  /**
   * 설정 탭이 닫힐 때 호출되는 메서드
   */
  hide(): void {
    // 모든 React 컴포넌트 언마운트
    Object.values(this.reactContainers).forEach(container => {
      if (container) {
        unmountReactSettings(container);
      }
    });
    
    // 컨테이너 초기화
    this.reactContainers = {};
    
    // 부모 클래스의 hide 메서드 호출
    super.hide();
  }
}