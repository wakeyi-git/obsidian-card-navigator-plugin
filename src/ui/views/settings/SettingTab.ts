import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { CardSection } from '../../../infrastructure/storage/settings/CardSection';
import { CardHeaderSection } from '../../../infrastructure/storage/settings/CardHeaderSection';
import { CardBodySection } from '../../../infrastructure/storage/settings/CardBodySection';
import { CardFooterSection } from '../../../infrastructure/storage/settings/CardFooterSection';
import { CardSetSection } from '../../../infrastructure/storage/settings/CardSetSection';
import { CardSortSection } from '../../../infrastructure/storage/settings/SortSection';
import { CardFilterSection } from '../../../infrastructure/storage/settings/FilterSection';
import { CardPreviewSection } from '../../../infrastructure/storage/settings/CardPreviewSection';
import { CardGeneralSection } from '../../../infrastructure/storage/settings/GeneralSection';
import { CardLayoutSection } from '../../../infrastructure/storage/settings/LayoutSection';
import { CardInteractionSection } from '../../../infrastructure/storage/settings/InteractionSection';
import { CardPresetSection } from '../../../infrastructure/storage/settings/PresetSection';
import { ISettingSection } from '../../../infrastructure/storage/settings/BaseSettingSection';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { EventType } from '../../../domain/events/EventTypes';
import { TabContainer } from '../../components/settings/TabContainer';

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
    // 섹션은 display() 메서드에서 생성하여 containerEl을 전달할 수 있도록 함
    this.sections.clear();
  }
  
  /**
   * 설정 UI 표시
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // 탭 컨테이너 생성
    const tabContainer = new TabContainer(containerEl);
    
    // 카드 탭 생성
    const cardTabContent = tabContainer.addTab('card', '카드');
    
    // 카드 섹션 생성 및 표시
    const cardSection = new CardSection(cardTabContent, this.settingsService, this.eventBus);
    this.sections.set('card', cardSection);
    cardSection.display(cardTabContent);
    
    // 카드셋 탭 생성
    const cardSetTabContent = tabContainer.addTab('card-set', '카드셋');
    
    // 카드셋 섹션 생성 및 표시
    const cardSetSection = new CardSetSection(cardSetTabContent, this.settingsService, this.eventBus);
    this.sections.set('card-set', cardSetSection);
    cardSetSection.display(cardSetTabContent);
    
    // 정렬 섹션 생성 및 표시
    const cardSortSection = new CardSortSection(cardSetTabContent, this.settingsService, this.eventBus);
    this.sections.set('card-sort', cardSortSection);
    cardSortSection.display(cardSetTabContent);
    
    // 필터 섹션 생성 및 표시
    const cardFilterSection = new CardFilterSection(cardSetTabContent, this.settingsService, this.eventBus);
    this.sections.set('card-filter', cardFilterSection);
    cardFilterSection.display(cardSetTabContent);
    
    // 레이아웃 탭 생성
    const layoutTabContent = tabContainer.addTab('layout', '레이아웃');
    
    // 레이아웃 섹션 생성 및 표시
    const cardLayoutSection = new CardLayoutSection(layoutTabContent, this.settingsService, this.eventBus);
    this.sections.set('layout', cardLayoutSection);
    cardLayoutSection.display(layoutTabContent);
    
    // 상호작용 탭 생성
    const interactionTabContent = tabContainer.addTab('interaction', '상호작용');
    
    // 상호작용 섹션 생성 및 표시
    const cardInteractionSection = new CardInteractionSection(interactionTabContent, this.settingsService, this.eventBus);
    this.sections.set('interaction', cardInteractionSection);
    cardInteractionSection.display(interactionTabContent);
    
    // 프리셋 탭 생성
    const presetTabContent = tabContainer.addTab('preset', '프리셋');
    
    // 프리셋 섹션 생성 및 표시
    const cardPresetSection = new CardPresetSection(presetTabContent, this.settingsService, this.eventBus);
    this.sections.set('preset', cardPresetSection);
    cardPresetSection.display(presetTabContent);
    
    // 일반 탭 생성
    const generalTabContent = tabContainer.addTab('general', '일반');
    
    // 일반 섹션 생성 및 표시
    const cardGeneralSection = new CardGeneralSection(generalTabContent, this.settingsService, this.eventBus);
    this.sections.set('card-general', cardGeneralSection);
    cardGeneralSection.display(generalTabContent);
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
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
   * 설정 탭이 숨겨질 때 호출됩니다.
   */
  hide(): void {
    // 부모 클래스의 hide 메서드 호출
    super.hide();
  }
} 