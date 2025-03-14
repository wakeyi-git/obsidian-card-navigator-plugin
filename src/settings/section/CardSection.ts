import { Setting } from 'obsidian';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';
import { CardPreviewSection } from './CardPreviewSection';
import CardNavigatorPlugin from '../../main';

/**
 * 카드 설정 섹션
 * 카드 기본 설정을 표시하는 섹션입니다.
 */
export class CardSection extends BaseSettingSection {
  private previewSection: CardPreviewSection | null = null;
  
  /**
   * 생성자
   * @param sectionId 섹션 ID
   */
  constructor(sectionId: string) {
    super(sectionId);
  }
  
  /**
   * 섹션 표시
   * @param containerEl 컨테이너 요소
   */
  display(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '카드 설정' });
    containerEl.createEl('p', { 
      text: '카드의 내용과 스타일 설정을 구성합니다. 미리보기의 카드, 헤더, 바디, 풋터를 클릭하여 각 부분의 설정을 변경하세요.', 
      cls: 'setting-item-description' 
    });
    
    // 카드 미리보기 섹션 생성
    const previewSectionContainer = containerEl.createDiv({ cls: 'card-preview-section-container' });
    
    // 플러그인 인스턴스 가져오기
    const plugin = this.settingsService.getPlugin() as CardNavigatorPlugin;
    
    // 카드 미리보기 섹션 생성
    this.previewSection = new CardPreviewSection(
      previewSectionContainer,
      this.settingsService,
      this.eventBus,
      plugin
    );
    
    // 미리보기 섹션 초기화 및 표시
    this.previewSection.initialize();
    this.previewSection.displayContent();
  }
  
  /**
   * 섹션 언로드
   */
  unload(): void {
    super.unload();
    
    // 미리보기 섹션 언로드
    if (this.previewSection) {
      this.previewSection.unload();
      this.previewSection = null;
    }
  }
}