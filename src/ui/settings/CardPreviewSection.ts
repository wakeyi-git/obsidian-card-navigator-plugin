import { Setting } from 'obsidian';
import { CardContentType } from '../../domain/card/Card';
import { BaseSettingSection } from './BaseSettingSection';
import { CardPreview } from '../components/CardPreview';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 카드 미리보기 설정 섹션
 * 카드 미리보기를 표시하는 섹션입니다.
 */
export class CardPreviewSection extends BaseSettingSection {
  private cardPreview: CardPreview | null = null;
  private previewContainer: HTMLElement | null = null;
  
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
    containerEl.createEl('h3', { text: '카드 미리보기' });
    
    // 미리보기 설명 추가
    containerEl.createEl('p', { 
      text: '설정 변경 시 아래 미리보기가 실시간으로 업데이트됩니다. 실제 카드 모양과 동일하게 표시됩니다.',
      cls: 'setting-item-description'
    });
    
    // 미리보기 컨테이너 생성
    this.previewContainer = containerEl.createDiv({ cls: 'card-navigator-preview-container' });
    
    // 미리보기 스타일 설정
    this.previewContainer.style.padding = '20px';
    this.previewContainer.style.marginTop = '10px';
    this.previewContainer.style.marginBottom = '20px';
    this.previewContainer.style.border = '1px solid var(--background-modifier-border)';
    this.previewContainer.style.borderRadius = '5px';
    this.previewContainer.style.backgroundColor = 'var(--background-secondary)';
    
    // 미리보기 카드 생성
    this.createCardPreview();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 미리보기 업데이트 버튼
    this.createSetting(containerEl, '미리보기 업데이트', '설정이 제대로 반영되지 않는 경우 수동으로 미리보기를 업데이트합니다.')
      .addButton(button => button
        .setButtonText('업데이트')
        .onClick(() => {
          this.updateCardPreview();
        }));
    
    // 미리보기 샘플 데이터 설정
    this.createSetting(containerEl, '샘플 데이터', '미리보기에 사용할 샘플 데이터를 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('sample1', '샘플 1: 기본 노트')
        .addOption('sample2', '샘플 2: 태그가 있는 노트')
        .addOption('sample3', '샘플 3: 프론트매터가 있는 노트')
        .setValue(this.settingsService.getSettings().previewSampleType || 'sample1')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ previewSampleType: value });
          this.updateCardPreview();
        }));
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 UI 변경 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_UI_CHANGED, (data) => {
      console.log('설정 UI 변경 이벤트 발생:', data);
      this.updateCardPreview();
    });
    
    // 설정 미리보기 업데이트 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_PREVIEW_UPDATE, (data) => {
      console.log('설정 미리보기 업데이트 이벤트 발생:', data);
      this.updateCardPreview();
    });
    
    // 설정 변경 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_CHANGED, (data) => {
      console.log('설정 변경 이벤트 발생:', data);
      this.updateCardPreview();
    });
  }
  
  /**
   * 카드 미리보기 생성
   */
  private createCardPreview(): void {
    if (!this.previewContainer) return;
    
    // 기존 미리보기 제거
    this.previewContainer.empty();
    
    // 카드 미리보기 생성
    const plugin = this.settingsService.getPlugin();
    if (plugin) {
      this.cardPreview = new CardPreview(plugin);
      
      // 미리보기 컨테이너에 카드 미리보기 추가
      this.cardPreview.render(this.previewContainer);
    }
  }
  
  /**
   * 카드 미리보기 업데이트
   */
  public updateCardPreview(): void {
    if (this.cardPreview) {
      this.cardPreview.update();
    } else {
      this.createCardPreview();
    }
  }
  
  /**
   * 섹션 언로드
   * 이벤트 리스너를 제거합니다.
   */
  unload(): void {
    // 이벤트 리스너 제거
    this.eventBus.off(EventType.SETTINGS_UI_CHANGED, () => {});
    this.eventBus.off(EventType.SETTINGS_PREVIEW_UPDATE, () => {});
    this.eventBus.off(EventType.SETTINGS_CHANGED, () => {});
    
    // 카드 미리보기 제거
    if (this.cardPreview) {
      this.cardPreview = null;
    }
    
    // 컨테이너 초기화
    if (this.previewContainer) {
      this.previewContainer.empty();
      this.previewContainer = null;
    }
  }
} 