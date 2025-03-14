import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardSection } from './CardSection';
import { CardHeaderSection } from './CardHeaderSection';
import { CardBodySection } from './CardBodySection';
import { CardFooterSection } from './CardFooterSection';
import { CardSetSection } from './CardSetSection';
import { CardSortSection } from './SortSection';
import { CardFilterSection } from './FilterSection';
import { CardPreviewSection } from './CardPreviewSection';
import { CardGeneralSection } from './GeneralSection';
import { CardLayoutSection } from './LayoutSection';
import { CardInteractionSection } from './InteractionSection';
import { CardPresetSection } from './PresetSection';
import { ISettingSection } from './BaseSettingSection';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { TabContainer } from '../components/TabContainer';

/**
 * 설정 탭
 * 플러그인 설정 UI를 표시하는 클래스입니다.
 */
export class SettingTab extends PluginSettingTab {
  plugin: CardNavigatorPlugin;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private sections: Map<string, ISettingSection> = new Map();
  
  /**
   * 생성자
   * @param app 앱 인스턴스
   * @param plugin 플러그인 인스턴스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    app: App, 
    plugin: CardNavigatorPlugin, 
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    super(app, plugin);
    this.plugin = plugin;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 섹션 초기화
    this.initializeSections();
  }
  
  /**
   * 섹션 초기화
   */
  private initializeSections(): void {
    // 섹션 생성
    const sections: ISettingSection[] = [
      new CardSection('card'),
      // 헤더, 바디, 풋터 섹션은 CardPreviewSection에서 통합 관리
      // new CardHeaderSection('card-header'),
      // new CardBodySection('card-body'),
      // new CardFooterSection('card-footer'),
      new CardSetSection('card-set'),
      new CardSortSection('card-sort'),
      new CardFilterSection('card-filter'),
      new CardGeneralSection('card-general')
    ];
    
    // 새로운 섹션 생성 및 ID 설정
    const layoutSection = new CardLayoutSection(this.containerEl, this.settingsService, this.eventBus);
    layoutSection.id = 'layout';
    
    const interactionSection = new CardInteractionSection(this.containerEl, this.settingsService, this.eventBus);
    interactionSection.id = 'interaction';
    
    const presetSection = new CardPresetSection(this.containerEl, this.settingsService, this.eventBus);
    presetSection.id = 'preset';
    
    // 새로운 섹션 추가
    sections.push(layoutSection, interactionSection, presetSection);
    
    // 섹션 초기화 및 등록
    sections.forEach(section => {
      section.initialize(this.settingsService, this.eventBus);
      this.sections.set(section.id, section);
    });
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 설정 UI 표시
   */
  display(): void {
    const { containerEl } = this;
    
    // 컨테이너 초기화
    containerEl.empty();
    
    // 플러그인 제목 표시
    containerEl.createEl('h1', { text: '카드 네비게이터 설정' });
    
    // 플러그인 설명 표시
    containerEl.createEl('p', { 
      text: '카드 네비게이터 플러그인의 설정을 구성합니다. 카드 모양, 내용, 정렬, 필터링 등을 설정할 수 있습니다.',
      cls: 'setting-item-description'
    });
    
    // 설정 섹션 컨테이너 생성
    const settingsContainer = containerEl.createDiv({ cls: 'card-navigator-settings-container' });
    
    // 메인 탭 컨테이너 생성
    const mainTabContainer = new TabContainer(settingsContainer, this.eventBus);
    
    // 일반 설정 탭
    const generalTabContent = mainTabContainer.addTab('general', '일반');
    const cardGeneralSection = this.sections.get('card-general');
    if (cardGeneralSection) {
      cardGeneralSection.display(generalTabContent);
    }
    
    // 카드 설정 탭
    const cardTabContent = mainTabContainer.addTab('card', '카드');
    this.createCardTab(cardTabContent);
    
    // 카드셋 설정 탭
    const cardSetTabContent = mainTabContainer.addTab('card-set', '카드셋');
    const cardSetSection = this.sections.get('card-set');
    if (cardSetSection) {
      cardSetSection.display(cardSetTabContent);
    }
    
    // 검색 및 필터 설정 탭
    const searchFilterTabContent = mainTabContainer.addTab('search-filter', '검색 및 필터');
    const cardFilterSection = this.sections.get('card-filter');
    if (cardFilterSection) {
      cardFilterSection.display(searchFilterTabContent);
    }
    
    // 정렬 설정 탭
    const sortTabContent = mainTabContainer.addTab('sort', '정렬');
    const cardSortSection = this.sections.get('card-sort');
    if (cardSortSection) {
      cardSortSection.display(sortTabContent);
    }
    
    // 레이아웃 설정 탭
    const layoutTabContent = mainTabContainer.addTab('layout', '레이아웃');
    const cardLayoutSection = this.sections.get('layout');
    if (cardLayoutSection) {
      cardLayoutSection.display(layoutTabContent);
    }
    
    // 상호작용 설정 탭
    const interactionTabContent = mainTabContainer.addTab('interaction', '상호작용');
    const cardInteractionSection = this.sections.get('interaction');
    if (cardInteractionSection) {
      cardInteractionSection.display(interactionTabContent);
    }
    
    // 프리셋 설정 탭
    const presetTabContent = mainTabContainer.addTab('preset', '프리셋');
    const cardPresetSection = this.sections.get('preset');
    if (cardPresetSection) {
      cardPresetSection.display(presetTabContent);
    }
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_CHANGED, (data) => {
      // 설정이 변경되면 미리보기 업데이트
      this.updateCardPreview('settings-changed');
    });
    
    // 설정 UI 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_UI_CHANGED, (data) => {
      // 설정 UI가 변경되면 미리보기 업데이트
      this.updateCardPreview('settings-ui-changed');
    });
    
    // 탭 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_TAB_CHANGED, (data) => {
      // 탭이 변경되면 미리보기 업데이트
      this.updateCardPreview('settings-tab-changed');
    });
    
    // 프리셋 적용 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_PRESET_APPLIED, (data) => {
      // 프리셋이 적용되면 미리보기 업데이트
      this.updateCardPreview('settings-preset-applied');
    });
  }
  
  /**
   * 카드 미리보기 업데이트
   * @param source 업데이트 소스
   */
  private updateCardPreview(source: string): void {
    // 미리보기 업데이트 이벤트 발생
    this.eventBus.emit(EventType.SETTINGS_PREVIEW_UPDATE, {
      source: source
    });
  }
  
  /**
   * 카드 탭 생성
   * @param containerEl 컨테이너 요소
   */
  private createCardTab(containerEl: HTMLElement): void {
    const cardTabContent = containerEl.createDiv({ cls: 'card-navigator-tab-content' });
    
    // 카드 섹션 표시 (CardSection이 내부적으로 CardPreviewSection을 생성하고 표시함)
    const cardSection = this.sections.get('card');
    if (cardSection) {
      cardSection.display(cardTabContent);
    }
  }
  
  /**
   * 설정 탭이 숨겨질 때 호출됩니다.
   */
  hide(): void {
    // 부모 클래스의 hide 메서드 호출
    super.hide();
  }
} 