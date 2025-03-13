import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardSection } from './CardSection';
import { CardHeaderSection } from './CardHeaderSection';
import { CardBodySection } from './CardBodySection';
import { CardFooterSection } from './CardFooterSection';
import { CardSetSection } from './CardSetSection';
import { CardSortSection } from './CardSortSection';
import { CardFilterSection } from './CardFilterSection';
import { CardPreviewSection } from './CardPreviewSection';
import { CardGeneralSection } from './CardGeneralSection';
import { ISettingSection } from './BaseSettingSection';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';

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
      new CardHeaderSection('card-header'),
      new CardBodySection('card-body'),
      new CardFooterSection('card-footer'),
      new CardSetSection('card-set'),
      new CardSortSection('card-sort'),
      new CardFilterSection('card-filter'),
      new CardPreviewSection('card-preview'),
      new CardGeneralSection('card-general')
    ];
    
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
    
    // 미리보기 섹션 표시 (상단에 배치)
    const previewContainer = containerEl.createDiv({ cls: 'card-navigator-preview-container' });
    const previewSection = this.sections.get('card-preview');
    if (previewSection) {
      previewSection.display(previewContainer);
    }
    
    // 설정 섹션 컨테이너 생성
    const settingsContainer = containerEl.createDiv({ cls: 'card-navigator-settings-container' });
    
    // 설정 섹션 스타일 적용
    settingsContainer.style.display = 'flex';
    settingsContainer.style.flexDirection = 'column';
    settingsContainer.style.gap = '20px';
    
    // 카드 섹션 표시
    const cardSectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardSection = this.sections.get('card');
    if (cardSection) {
      cardSection.display(cardSectionContainer);
    }
    
    // 카드 헤더 섹션 표시
    const cardHeaderSectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardHeaderSection = this.sections.get('card-header');
    if (cardHeaderSection) {
      cardHeaderSection.display(cardHeaderSectionContainer);
    }
    
    // 카드 바디 섹션 표시
    const cardBodySectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardBodySection = this.sections.get('card-body');
    if (cardBodySection) {
      cardBodySection.display(cardBodySectionContainer);
    }
    
    // 카드 풋터 섹션 표시
    const cardFooterSectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardFooterSection = this.sections.get('card-footer');
    if (cardFooterSection) {
      cardFooterSection.display(cardFooterSectionContainer);
    }
    
    // 카드셋 섹션 표시
    const cardSetSectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardSetSection = this.sections.get('card-set');
    if (cardSetSection) {
      cardSetSection.display(cardSetSectionContainer);
    }
    
    // 카드 정렬 섹션 표시
    const cardSortSectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardSortSection = this.sections.get('card-sort');
    if (cardSortSection) {
      cardSortSection.display(cardSortSectionContainer);
    }
    
    // 카드 필터 섹션 표시
    const cardFilterSectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardFilterSection = this.sections.get('card-filter');
    if (cardFilterSection) {
      cardFilterSection.display(cardFilterSectionContainer);
    }
    
    // 카드 일반 섹션 표시
    const cardGeneralSectionContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    const cardGeneralSection = this.sections.get('card-general');
    if (cardGeneralSection) {
      cardGeneralSection.display(cardGeneralSectionContainer);
    }
    
    // 고급 설정 섹션 추가
    const advancedSettingsContainer = settingsContainer.createDiv({ cls: 'card-navigator-section-container' });
    advancedSettingsContainer.createEl('h2', { text: '고급 설정' });
    
    // 디버그 모드 설정 추가
    new Setting(advancedSettingsContainer)
      .setName('디버그 모드')
      .setDesc('개발 중 디버깅을 위한 로그를 출력합니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.debugMode || false)
        .onChange(async (value) => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();
        })
      );
  }
  
  /**
   * 설정 탭이 숨겨질 때 호출됩니다.
   * 이벤트 리스너를 제거합니다.
   */
  hide(): void {
    // 부모 클래스의 hide 메서드 호출
    super.hide();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 UI 변경 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_UI_CHANGED, (data) => {
      this.updateCardPreview(data.sectionId);
    });
    
    // 설정 미리보기 업데이트 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_PREVIEW_UPDATE, (data) => {
      this.updateCardPreview(data.sectionId);
    });
  }
  
  /**
   * 카드 미리보기 업데이트
   * @param sectionId 업데이트를 요청한 섹션 ID
   */
  updateCardPreview(sectionId: string): void {
    const previewSection = this.sections.get('card-preview');
    if (previewSection) {
      const previewContainer = this.containerEl.querySelector('.card-navigator-preview-container');
      if (previewContainer) {
        previewContainer.empty();
        previewSection.display(previewContainer as HTMLElement);
      }
    }
  }
} 