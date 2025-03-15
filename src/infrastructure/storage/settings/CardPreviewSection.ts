import { Notice, Setting } from 'obsidian';
import { CardContentType } from '../../../domain/card/Card';
import { BaseSettingSection } from './BaseSettingSection';
import { CardPreview } from '../../../ui/components/settings/CardPreview';
import { EventType } from '../../../domain/events/EventTypes';
import CardNavigatorPlugin from '../../../main';
import { SettingSection } from './SettingSection';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { MultiSelectDropdown } from '../../../ui/components/settings/MultiSelectDropdown';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import { ICardNavigatorSettings } from '../../../domain/settings/SettingsInterfaces';

/**
 * 카드 미리보기 섹션
 * 카드 미리보기를 표시하는 섹션입니다.
 */
export class CardPreviewSection extends SettingSection {
  private plugin: CardNavigatorPlugin;
  private settings: ICardNavigatorSettings;
  
  // 미리보기 요소
  private cardPreview: CardPreview | null = null;
  private previewContainer: HTMLElement | null = null;
  private headerEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private footerEl: HTMLElement | null = null;
  private cardEl: HTMLElement | null = null;
  private selectedComponent: 'header' | 'body' | 'footer' | 'card' | null = null;
  
  // 설정 컨테이너 요소
  private headerSettingsContainer!: HTMLElement;
  private bodySettingsContainer!: HTMLElement;
  private footerSettingsContainer!: HTMLElement;
  private cardSettingsContainer!: HTMLElement;
  
  /**
   * 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   * @param plugin 플러그인 인스턴스
   */
  constructor(
    containerEl: HTMLElement,
    settingsService: ISettingsService,
    eventBus: DomainEventBus,
    plugin: CardNavigatorPlugin
  ) {
    super(containerEl, settingsService, eventBus);
    this.plugin = plugin;
    this.settings = this.settingsService.getSettings();
  }
  
  /**
   * 섹션 초기화
   */
  initialize(): void {
    // 초기화 로직
  }
  
  /**
   * 설정 표시
   */
  displayContent(): void {
    this.containerEl.empty();
    
    // 미리보기 섹션 컨테이너 생성
    const previewSectionContainer = this.containerEl.createDiv({ cls: 'card-navigator-preview-section' });
    
    // 미리보기 카드 생성
    this.previewContainer = previewSectionContainer.createDiv();
    this.createCardPreview(this.previewContainer);
    
    // 설정 컨테이너 생성
    const settingsContainer = this.containerEl.createDiv({ cls: 'card-navigator-component-settings' });
    
    // 헤더 설정 컨테이너
    this.headerSettingsContainer = settingsContainer.createDiv();
    this.headerSettingsContainer.style.display = 'none';
    
    // 바디 설정 컨테이너
    this.bodySettingsContainer = settingsContainer.createDiv();
    this.bodySettingsContainer.style.display = 'none';
    
    // 풋터 설정 컨테이너
    this.footerSettingsContainer = settingsContainer.createDiv();
    this.footerSettingsContainer.style.display = 'none';
    
    // 카드 설정 컨테이너
    this.cardSettingsContainer = settingsContainer.createDiv();
    this.cardSettingsContainer.style.display = 'none';
    
    // 기본적으로 카드 설정 표시
    this.selectComponent('card');
    
    // 설정 컨테이너 생성
    this.createHeaderSettings(this.headerSettingsContainer);
    this.createBodySettings(this.bodySettingsContainer);
    this.createFooterSettings(this.footerSettingsContainer);
    this.createCardSettings(this.cardSettingsContainer);
  }
  
  /**
   * 설정 업데이트
   * @param key 설정 키
   * @param value 설정 값
   */
  private async updateSetting(key: keyof ICardNavigatorSettings, value: any): Promise<void> {
    // 설정 객체 업데이트
    (this.settings as any)[key] = value;
    
    // 설정 서비스를 통해 설정 저장
    await this.settingsService.updateSettings({ [key]: value });
    
    // 미리보기 업데이트
    this.updateCardPreview();
  }
  
  /**
   * 카드 미리보기 생성
   * @param containerEl 컨테이너 요소
   */
  private createCardPreview(containerEl: HTMLElement): void {
    // 미리보기 카드 생성
    this.cardEl = containerEl.createDiv({ cls: 'card-navigator-preview-card card-navigator-clickable' });
    
    // 헤더 생성
    this.headerEl = this.cardEl.createDiv({ cls: 'card-navigator-preview-card-header card-navigator-clickable' });
    this.headerEl.setText('카드 헤더');
    
    // 바디 생성
    this.bodyEl = this.cardEl.createDiv({ cls: 'card-navigator-preview-card-body card-navigator-clickable' });
    this.bodyEl.setText('카드 내용이 여기에 표시됩니다. 이 부분은 노트의 내용을 보여줍니다.');
    
    // 풋터 생성
    this.footerEl = this.cardEl.createDiv({ cls: 'card-navigator-preview-card-footer card-navigator-clickable' });
    this.footerEl.setText('카드 풋터');
    
    // 클릭 이벤트 등록
    this.headerEl.addEventListener('click', (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      this.selectComponent('header');
    });
    this.bodyEl.addEventListener('click', (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      this.selectComponent('body');
    });
    this.footerEl.addEventListener('click', (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      this.selectComponent('footer');
    });
    this.cardEl.addEventListener('click', () => {
      this.selectComponent('card');
    });
    
    // 미리보기 업데이트
    this.updateCardPreview();
  }
  
  /**
   * 헤더 설정 생성
   * @param containerEl 컨테이너 요소
   */
  private createHeaderSettings(containerEl: HTMLElement): void {
    containerEl.empty();
    containerEl.createEl('h4', { text: '헤더 설정' });
    
    // 헤더 표시 설정
    new Setting(containerEl)
      .setName('헤더 표시')
      .setDesc('카드에 헤더를 표시할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settings.showHeader ?? true)
        .onChange(async (value) => {
          await this.updateSetting('showHeader', value);
        })
      );
    
    // 헤더 콘텐츠 설정
    const headerContentSetting = new Setting(containerEl)
      .setName('헤더 콘텐츠')
      .setDesc('카드 헤더에 표시할 콘텐츠를 선택합니다. (다중 선택 가능)');
    
    // 콘텐츠 옵션 컨테이너 생성
    const headerContentContainer = containerEl.createDiv({ cls: 'card-navigator-content-options' });
    
    // 파일명 옵션
    new Setting(headerContentContainer)
      .setName('파일명')
      .addToggle(toggle => {
        const isSelected = this.settings.cardHeaderContentMultiple?.includes('filename') ?? true;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardHeaderContentMultiple || [this.settings.cardHeaderContent || 'filename'];
            
            if (value && !contentTypes.includes('filename')) {
              contentTypes.push('filename');
            } else if (!value && contentTypes.includes('filename')) {
              contentTypes = contentTypes.filter(type => type !== 'filename');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardHeaderContentMultiple', contentTypes);
            await this.updateSetting('cardHeaderContent', contentTypes[0]);
          });
      });
    
    // 첫 번째 헤더 옵션
    new Setting(headerContentContainer)
      .setName('첫 번째 헤더')
      .addToggle(toggle => {
        const isSelected = this.settings.cardHeaderContentMultiple?.includes('firstheader') ?? false;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardHeaderContentMultiple || [this.settings.cardHeaderContent || 'filename'];
            
            if (value && !contentTypes.includes('firstheader')) {
              contentTypes.push('firstheader');
            } else if (!value && contentTypes.includes('firstheader')) {
              contentTypes = contentTypes.filter(type => type !== 'firstheader');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardHeaderContentMultiple', contentTypes);
            await this.updateSetting('cardHeaderContent', contentTypes[0]);
          });
      });
    
    // 프론트매터 옵션
    const frontmatterSetting = new Setting(headerContentContainer)
      .setName('프론트매터 값')
      .addToggle(toggle => {
        const isSelected = this.settings.cardHeaderContentMultiple?.includes('frontmatter') ?? false;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardHeaderContentMultiple || [this.settings.cardHeaderContent || 'filename'];
            
            if (value && !contentTypes.includes('frontmatter')) {
              contentTypes.push('frontmatter');
            } else if (!value && contentTypes.includes('frontmatter')) {
              contentTypes = contentTypes.filter(type => type !== 'frontmatter');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardHeaderContentMultiple', contentTypes);
            await this.updateSetting('cardHeaderContent', contentTypes[0]);
            
            // 프론트매터 키 입력 필드 표시/숨김
            const frontmatterContainer = containerEl.querySelector('.header-frontmatter-container');
            if (frontmatterContainer) {
              (frontmatterContainer as HTMLElement).style.display = value ? 'block' : 'none';
            }
          });
      });
    
    // 프론트매터 키 설정 컨테이너
    const frontmatterContainer = containerEl.createDiv({ cls: 'header-frontmatter-container' });
    frontmatterContainer.style.display = 
      (this.settings.cardHeaderContentMultiple?.includes('frontmatter') || 
       this.settings.cardHeaderContent === 'frontmatter') ? 'block' : 'none';
    
    // 프론트매터 키 설정
    new Setting(frontmatterContainer)
      .setName('프론트매터 키')
      .setDesc('헤더에 표시할 프론트매터 키를 입력합니다.')
      .addText(text => text
        .setPlaceholder('title')
        .setValue(this.settings.cardHeaderFrontmatterKey || '')
        .onChange(async (value) => {
          await this.updateSetting('cardHeaderFrontmatterKey', value);
        })
      );
    
    // 콘텐츠 옵션 컨테이너 스타일 추가
    headerContentContainer.style.marginLeft = '20px';
    headerContentContainer.style.marginBottom = '10px';
    headerContentContainer.style.border = '1px solid var(--background-modifier-border)';
    headerContentContainer.style.borderRadius = '4px';
    headerContentContainer.style.padding = '10px';
    
    // 헤더 스타일 설정 제목
    containerEl.createEl('h5', { text: '헤더 스타일 설정' });
    
    // 헤더 테두리 종류 설정
    new Setting(containerEl)
      .setName('테두리 종류')
      .setDesc('헤더 구분선의 종류를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .addOption('double', '이중선')
        .addOption('groove', '홈선')
        .addOption('ridge', '돌출선')
        .setValue(this.settings.headerBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.updateSetting('headerBorderStyle', value);
        })
      );
    
    // 헤더 테두리 색상 설정
    new Setting(containerEl)
      .setName('테두리 색상')
      .setDesc('헤더 구분선의 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settings.headerBorderColor || '')
        .onChange(async (value) => {
          await this.updateSetting('headerBorderColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('headerBorderColor', '');
        })
      );
    
    // 헤더 테두리 두께 설정
    new Setting(containerEl)
      .setName('테두리 두께')
      .setDesc('헤더 구분선의 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(this.settings.headerBorderWidth || 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('headerBorderWidth', value);
        })
      );
    
    // 헤더 폰트 크기 설정
    new Setting(containerEl)
      .setName('헤더 폰트 크기')
      .setDesc('카드 헤더의 폰트 크기를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(10, 24, 1)
        .setValue(this.settings.headerFontSize || 16)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('headerFontSize', value);
        })
      );
    
    // 헤더 배경색 설정
    new Setting(containerEl)
      .setName('헤더 배경색')
      .setDesc('카드 헤더의 배경색을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.headerBgColor || '')
        .onChange(async (value) => {
          await this.updateSetting('headerBgColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('headerBgColor', '');
        })
      );
  }
  
  /**
   * 바디 설정 생성
   * @param containerEl 컨테이너 요소
   */
  private createBodySettings(containerEl: HTMLElement): void {
    containerEl.empty();
    containerEl.createEl('h4', { text: '바디 설정' });
    
    // 바디 콘텐츠 설정
    const bodyContentSetting = new Setting(containerEl)
      .setName('바디 콘텐츠')
      .setDesc('카드 바디에 표시할 콘텐츠를 선택합니다. (다중 선택 가능)');
    
    // 콘텐츠 옵션 컨테이너 생성
    const bodyContentContainer = containerEl.createDiv({ cls: 'card-navigator-content-options' });
    
    // 노트 내용 옵션
    new Setting(bodyContentContainer)
      .setName('노트 내용')
      .addToggle(toggle => {
        const isSelected = this.settings.cardBodyContentMultiple?.includes('content') ?? true;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardBodyContentMultiple || [this.settings.cardBodyContent || 'content'];
            
            if (value && !contentTypes.includes('content')) {
              contentTypes.push('content');
            } else if (!value && contentTypes.includes('content')) {
              contentTypes = contentTypes.filter(type => type !== 'content');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardBodyContentMultiple', contentTypes);
            await this.updateSetting('cardBodyContent', contentTypes[0]);
          });
      });
    
    // 프론트매터 옵션
    const frontmatterSetting = new Setting(bodyContentContainer)
      .setName('프론트매터 값')
      .addToggle(toggle => {
        const isSelected = this.settings.cardBodyContentMultiple?.includes('frontmatter') ?? false;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardBodyContentMultiple || [this.settings.cardBodyContent || 'content'];
            
            if (value && !contentTypes.includes('frontmatter')) {
              contentTypes.push('frontmatter');
            } else if (!value && contentTypes.includes('frontmatter')) {
              contentTypes = contentTypes.filter(type => type !== 'frontmatter');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardBodyContentMultiple', contentTypes);
            await this.updateSetting('cardBodyContent', contentTypes[0]);
            
            // 프론트매터 키 입력 필드 표시/숨김
            const frontmatterContainer = containerEl.querySelector('.body-frontmatter-container');
            if (frontmatterContainer) {
              (frontmatterContainer as HTMLElement).style.display = value ? 'block' : 'none';
            }
          });
      });
    
    // 프론트매터 키 설정 컨테이너
    const frontmatterContainer = containerEl.createDiv({ cls: 'body-frontmatter-container' });
    frontmatterContainer.style.display = 
      (this.settings.cardBodyContentMultiple?.includes('frontmatter') || 
       this.settings.cardBodyContent === 'frontmatter') ? 'block' : 'none';
    
    // 프론트매터 키 설정
    new Setting(frontmatterContainer)
      .setName('프론트매터 키')
      .setDesc('바디에 표시할 프론트매터 키를 입력합니다.')
      .addText(text => text
        .setPlaceholder('description')
        .setValue(this.settings.cardBodyFrontmatterKey || '')
        .onChange(async (value) => {
          await this.updateSetting('cardBodyFrontmatterKey', value);
        })
      );
    
    // 콘텐츠 옵션 컨테이너 스타일 추가
    bodyContentContainer.style.marginLeft = '20px';
    bodyContentContainer.style.marginBottom = '10px';
    bodyContentContainer.style.border = '1px solid var(--background-modifier-border)';
    bodyContentContainer.style.borderRadius = '4px';
    bodyContentContainer.style.padding = '10px';
    
    // 카드 렌더링 모드 설정
    new Setting(containerEl)
      .setName('렌더링 모드')
      .setDesc('카드 내용의 렌더링 방식을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('text', '텍스트')
        .addOption('markdown', '마크다운')
        .setValue(this.settings.cardRenderingMode || 'text')
        .onChange(async (value: string) => {
          await this.updateSetting('cardRenderingMode', value as any);
        })
      );
    
    // 프론트매터 포함 여부 설정
    new Setting(containerEl)
      .setName('프론트매터 포함')
      .setDesc('본문에 프론트매터를 포함할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settings.includeFrontmatterInContent ?? false)
        .onChange(async (value) => {
          await this.updateSetting('includeFrontmatterInContent', value);
        })
      );
    
    // 첫 번째 헤더 포함 여부 설정
    new Setting(containerEl)
      .setName('첫 번째 헤더 포함')
      .setDesc('본문에 첫 번째 헤더를 포함할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settings.includeFirstHeaderInContent ?? true)
        .onChange(async (value) => {
          await this.updateSetting('includeFirstHeaderInContent', value);
        })
      );
    
    // 내용 길이 제한 설정
    new Setting(containerEl)
      .setName('내용 길이 제한')
      .setDesc('카드 내용의 최대 길이를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(50, 500, 50)
        .setValue(this.settings.bodyMaxLength || 200)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('bodyMaxLength', value);
        })
      );
    
    // 바디 스타일 설정 제목
    containerEl.createEl('h5', { text: '바디 스타일 설정' });
    
    // 바디 테두리 종류 설정
    new Setting(containerEl)
      .setName('테두리 종류')
      .setDesc('바디 구분선의 종류를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .addOption('double', '이중선')
        .addOption('groove', '홈선')
        .addOption('ridge', '돌출선')
        .setValue(this.settings.bodyBorderStyle || 'none')
        .onChange(async (value) => {
          await this.updateSetting('bodyBorderStyle', value);
        })
      );
    
    // 바디 테두리 색상 설정
    new Setting(containerEl)
      .setName('테두리 색상')
      .setDesc('바디 구분선의 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settings.bodyBorderColor || '')
        .onChange(async (value) => {
          await this.updateSetting('bodyBorderColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('bodyBorderColor', '');
        })
      );
    
    // 바디 테두리 두께 설정
    new Setting(containerEl)
      .setName('테두리 두께')
      .setDesc('바디 구분선의 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(this.settings.bodyBorderWidth || 0)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('bodyBorderWidth', value);
        })
      );
    
    // 바디 폰트 크기 설정
    new Setting(containerEl)
      .setName('바디 폰트 크기')
      .setDesc('카드 바디의 폰트 크기를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(10, 20, 1)
        .setValue(this.settings.bodyFontSize || 14)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('bodyFontSize', value);
        })
      );
    
    // 바디 배경색 설정
    new Setting(containerEl)
      .setName('바디 배경색')
      .setDesc('카드 바디의 배경색을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.bodyBgColor || '')
        .onChange(async (value) => {
          await this.updateSetting('bodyBgColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('bodyBgColor', '');
        })
      );
  }
  
  /**
   * 풋터 설정 생성
   * @param containerEl 컨테이너 요소
   */
  private createFooterSettings(containerEl: HTMLElement): void {
    containerEl.empty();
    containerEl.createEl('h4', { text: '풋터 설정' });
    
    // 풋터 표시 설정
    new Setting(containerEl)
      .setName('풋터 표시')
      .setDesc('카드에 풋터를 표시할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settings.showFooter ?? true)
        .onChange(async (value) => {
          await this.updateSetting('showFooter', value);
        })
      );
    
    // 풋터 콘텐츠 설정
    const footerContentSetting = new Setting(containerEl)
      .setName('풋터 콘텐츠')
      .setDesc('카드 풋터에 표시할 콘텐츠를 선택합니다. (다중 선택 가능)');
    
    // 콘텐츠 옵션 컨테이너 생성
    const footerContentContainer = containerEl.createDiv({ cls: 'card-navigator-content-options' });
    
    // 태그 옵션
    new Setting(footerContentContainer)
      .setName('태그')
      .addToggle(toggle => {
        const isSelected = this.settings.cardFooterContentMultiple?.includes('tags') ?? true;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardFooterContentMultiple || [this.settings.cardFooterContent || 'tags'];
            
            if (value && !contentTypes.includes('tags')) {
              contentTypes.push('tags');
            } else if (!value && contentTypes.includes('tags')) {
              contentTypes = contentTypes.filter(type => type !== 'tags');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardFooterContentMultiple', contentTypes);
            await this.updateSetting('cardFooterContent', contentTypes[0]);
          });
      });
    
    // 생성일 옵션
    new Setting(footerContentContainer)
      .setName('생성일')
      .addToggle(toggle => {
        const isSelected = this.settings.cardFooterContentMultiple?.includes('created') ?? false;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardFooterContentMultiple || [this.settings.cardFooterContent || 'tags'];
            
            if (value && !contentTypes.includes('created')) {
              contentTypes.push('created');
            } else if (!value && contentTypes.includes('created')) {
              contentTypes = contentTypes.filter(type => type !== 'created');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardFooterContentMultiple', contentTypes);
            await this.updateSetting('cardFooterContent', contentTypes[0]);
          });
      });
    
    // 수정일 옵션
    new Setting(footerContentContainer)
      .setName('수정일')
      .addToggle(toggle => {
        const isSelected = this.settings.cardFooterContentMultiple?.includes('modified') ?? false;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardFooterContentMultiple || [this.settings.cardFooterContent || 'tags'];
            
            if (value && !contentTypes.includes('modified')) {
              contentTypes.push('modified');
            } else if (!value && contentTypes.includes('modified')) {
              contentTypes = contentTypes.filter(type => type !== 'modified');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardFooterContentMultiple', contentTypes);
            await this.updateSetting('cardFooterContent', contentTypes[0]);
          });
      });
    
    // 프론트매터 옵션
    const frontmatterSetting = new Setting(footerContentContainer)
      .setName('프론트매터 값')
      .addToggle(toggle => {
        const isSelected = this.settings.cardFooterContentMultiple?.includes('frontmatter') ?? false;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardFooterContentMultiple || [this.settings.cardFooterContent || 'tags'];
            
            if (value && !contentTypes.includes('frontmatter')) {
              contentTypes.push('frontmatter');
            } else if (!value && contentTypes.includes('frontmatter')) {
              contentTypes = contentTypes.filter(type => type !== 'frontmatter');
            }
            
            // 선택된 값이 없으면 'none'으로 설정
            if (contentTypes.length === 0) {
              contentTypes = ['none'];
            }
            
            await this.updateSetting('cardFooterContentMultiple', contentTypes);
            await this.updateSetting('cardFooterContent', contentTypes[0]);
            
            // 프론트매터 키 입력 필드 표시/숨김
            const frontmatterContainer = containerEl.querySelector('.footer-frontmatter-container');
            if (frontmatterContainer) {
              (frontmatterContainer as HTMLElement).style.display = value ? 'block' : 'none';
            }
          });
      });
    
    // 프론트매터 키 설정 컨테이너
    const frontmatterContainer = containerEl.createDiv({ cls: 'footer-frontmatter-container' });
    frontmatterContainer.style.display = 
      (this.settings.cardFooterContentMultiple?.includes('frontmatter') || 
       this.settings.cardFooterContent === 'frontmatter') ? 'block' : 'none';
    
    // 프론트매터 키 설정
    new Setting(frontmatterContainer)
      .setName('프론트매터 키')
      .setDesc('풋터에 표시할 프론트매터 키를 입력합니다.')
      .addText(text => text
        .setPlaceholder('status')
        .setValue(this.settings.cardFooterFrontmatterKey || '')
        .onChange(async (value) => {
          await this.updateSetting('cardFooterFrontmatterKey', value);
        })
      );
    
    // 콘텐츠 옵션 컨테이너 스타일 추가
    footerContentContainer.style.marginLeft = '20px';
    footerContentContainer.style.marginBottom = '10px';
    footerContentContainer.style.border = '1px solid var(--background-modifier-border)';
    footerContentContainer.style.borderRadius = '4px';
    footerContentContainer.style.padding = '10px';
    
    // 풋터 스타일 설정 제목
    containerEl.createEl('h5', { text: '풋터 스타일 설정' });
    
    // 풋터 테두리 종류 설정
    new Setting(containerEl)
      .setName('테두리 종류')
      .setDesc('풋터 구분선의 종류를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .addOption('double', '이중선')
        .addOption('groove', '홈선')
        .addOption('ridge', '돌출선')
        .setValue(this.settings.footerBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.updateSetting('footerBorderStyle', value);
        })
      );
    
    // 풋터 테두리 색상 설정
    new Setting(containerEl)
      .setName('테두리 색상')
      .setDesc('풋터 구분선의 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settings.footerBorderColor || '')
        .onChange(async (value) => {
          await this.updateSetting('footerBorderColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('footerBorderColor', '');
        })
      );
    
    // 풋터 테두리 두께 설정
    new Setting(containerEl)
      .setName('테두리 두께')
      .setDesc('풋터 구분선의 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(this.settings.footerBorderWidth || 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('footerBorderWidth', value);
        })
      );
    
    // 풋터 폰트 크기 설정
    new Setting(containerEl)
      .setName('풋터 폰트 크기')
      .setDesc('카드 풋터의 폰트 크기를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(8, 16, 1)
        .setValue(this.settings.footerFontSize || 12)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('footerFontSize', value);
        })
      );
    
    // 풋터 배경색 설정
    new Setting(containerEl)
      .setName('풋터 배경색')
      .setDesc('카드 풋터의 배경색을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.footerBgColor || '')
        .onChange(async (value) => {
          await this.updateSetting('footerBgColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('footerBgColor', '');
        })
      );
  }
  
  /**
   * 카드 기본 설정 생성
   * @param containerEl 컨테이너 요소
   */
  private createCardSettings(containerEl: HTMLElement): void {
    containerEl.empty();
    containerEl.createEl('h4', { text: '카드 기본 설정' });
    
    // 카드 테두리 종류 설정
    new Setting(containerEl)
      .setName('테두리 종류')
      .setDesc('일반 카드의 테두리 종류를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .addOption('double', '이중선')
        .addOption('groove', '홈선')
        .addOption('ridge', '돌출선')
        .setValue(this.settings.normalCardBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.updateSetting('normalCardBorderStyle', value);
        })
      );
    
    // 카드 배경색 설정
    new Setting(containerEl)
      .setName('배경색')
      .setDesc('일반 카드의 배경색을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.normalCardBgColor || '')
        .onChange(async (value) => {
          await this.updateSetting('normalCardBgColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('normalCardBgColor', '');
        })
      );
    
    // 카드 테두리 색상 설정
    new Setting(containerEl)
      .setName('테두리 색상')
      .setDesc('일반 카드의 테두리 색상을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.normalCardBorderColor || '')
        .onChange(async (value) => {
          await this.updateSetting('normalCardBorderColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('normalCardBorderColor', '');
        })
      );
    
    // 카드 테두리 두께 설정
    new Setting(containerEl)
      .setName('테두리 두께')
      .setDesc('일반 카드의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(this.settings.normalCardBorderWidth || 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('normalCardBorderWidth', value);
        })
      );

    // 카드 테두리 반경 설정
    new Setting(containerEl)
    .setName('카드 테두리 반경')
    .setDesc('카드 모서리의 둥근 정도를 설정합니다.')
    .addSlider(slider => slider
      .setLimits(0, 20, 1)
      .setValue(this.settings.borderRadius || 5)
      .setDynamicTooltip()
      .onChange(async (value) => {
        await this.updateSetting('borderRadius', value);
      })
    );
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_CHANGED, (data: any) => {
      // 설정 객체 업데이트
      this.settings = this.settingsService.getSettings();
      this.updateCardPreview();
    });
    
    // 설정 UI 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_UI_CHANGED, (data: any) => {
      // 설정 객체 업데이트
      this.settings = this.settingsService.getSettings();
      this.updateCardPreview();
    });
    
    // 설정 미리보기 업데이트 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_PREVIEW_UPDATE, (data: any) => {
      this.updateCardPreview();
    });
  }
  
  /**
   * 카드 미리보기 업데이트
   */
  private updateCardPreview(): void {
    if (!this.headerEl || !this.bodyEl || !this.footerEl || !this.cardEl) return;
    
    const settings = this.settings;
    
    // 카드 스타일 업데이트
    if (this.cardEl) {
      // 카드 크기 설정
      const layout = settings.layout || {
        fixedCardHeight: false,
        layoutDirectionPreference: 'auto',
        cardThresholdWidth: 200,
        cardThresholdHeight: 150,
        cardGap: 10,
        cardsetPadding: 10,
        cardSizeFactor: 1.0,
        useLayoutTransition: true
      };
      
      // 카드 너비와 높이 계산
      const cardWidth = Math.min(Math.max(layout.cardThresholdWidth, 300), 450);
      const cardHeight = Math.min(Math.max(layout.cardThresholdHeight, 200), 350);
      
      this.cardEl.style.width = `${cardWidth}px`;
      this.cardEl.style.maxWidth = '100%';
      this.cardEl.style.height = `${cardHeight}px`;
      
      // 카드 테두리 설정
      this.cardEl.style.borderStyle = settings.normalCardBorderStyle || 'solid';
      this.cardEl.style.borderColor = settings.normalCardBorderColor || '#cccccc';
      this.cardEl.style.borderWidth = `${settings.normalCardBorderWidth || 1}px`;
      this.cardEl.style.borderRadius = `${settings.borderRadius || 5}px`;
      
      // 카드 배경색 설정
      this.cardEl.style.backgroundColor = settings.normalCardBgColor || '';
    }
    
    // 헤더 스타일 업데이트
    if (this.headerEl) {
      // 헤더 표시 여부
      this.headerEl.style.display = settings.showHeader === false ? 'none' : 'block';
      
      // 헤더 테두리 설정
      this.headerEl.style.borderBottomStyle = settings.headerBorderStyle || 'solid';
      this.headerEl.style.borderBottomColor = settings.headerBorderColor || '#dddddd';
      this.headerEl.style.borderBottomWidth = `${settings.headerBorderWidth || 1}px`;
      
      // 헤더 폰트 크기 설정
      this.headerEl.style.fontSize = `${settings.headerFontSize || 14}px`;
      
      // 헤더 배경색 설정
      this.headerEl.style.backgroundColor = settings.headerBgColor || '';
      
      // 헤더 콘텐츠 설정
      let headerContent = '카드 헤더';
      if (settings.cardHeaderContentMultiple && settings.cardHeaderContentMultiple.length > 0) {
        // 'none'이 아닌 항목만 필터링
        const validContent = settings.cardHeaderContentMultiple.filter(item => item !== 'none');
        if (validContent.length > 0) {
          headerContent = validContent.join(' | ');
        } else {
          headerContent = 'none';
        }
      } else if (settings.cardHeaderContent && settings.cardHeaderContent !== 'none') {
        headerContent = settings.cardHeaderContent;
      } else {
        headerContent = 'none';
      }
      this.headerEl.textContent = headerContent;
    }
    
    // 바디 스타일 업데이트
    if (this.bodyEl) {
      // 바디 테두리 설정
      this.bodyEl.style.borderBottomStyle = settings.bodyBorderStyle || 'none';
      this.bodyEl.style.borderBottomColor = settings.bodyBorderColor || '#dddddd';
      this.bodyEl.style.borderBottomWidth = `${settings.bodyBorderWidth || 0}px`;
      
      // 바디 폰트 크기 설정
      this.bodyEl.style.fontSize = `${settings.bodyFontSize || 12}px`;
      
      // 바디 배경색 설정
      this.bodyEl.style.backgroundColor = settings.bodyBgColor || '';
      
      // 바디 콘텐츠 설정
      let bodyContent = '카드 내용이 여기에 표시됩니다. 이 부분은 노트의 내용을 보여줍니다.';
      if (settings.cardBodyContentMultiple && settings.cardBodyContentMultiple.length > 0) {
        // 'none'이 아닌 항목만 필터링
        const validContent = settings.cardBodyContentMultiple.filter(item => item !== 'none');
        if (validContent.length > 0) {
          bodyContent = validContent.join(' | ');
        } else {
          bodyContent = 'none';
        }
      } else if (settings.cardBodyContent && settings.cardBodyContent !== 'none') {
        bodyContent = settings.cardBodyContent;
      } else {
        bodyContent = 'none';
      }
      this.bodyEl.textContent = bodyContent;
    }
    
    // 풋터 스타일 업데이트
    if (this.footerEl) {
      // 풋터 표시 여부
      this.footerEl.style.display = settings.showFooter === false ? 'none' : 'block';
      
      // 풋터 테두리 설정
      this.footerEl.style.borderTopStyle = settings.footerBorderStyle || 'solid';
      this.footerEl.style.borderTopColor = settings.footerBorderColor || '#dddddd';
      this.footerEl.style.borderTopWidth = `${settings.footerBorderWidth || 1}px`;
      
      // 풋터 폰트 크기 설정
      this.footerEl.style.fontSize = `${settings.footerFontSize || 10}px`;
      
      // 풋터 배경색 설정
      this.footerEl.style.backgroundColor = settings.footerBgColor || '';
      
      // 풋터 콘텐츠 설정
      let footerContent = '카드 풋터';
      if (settings.cardFooterContentMultiple && settings.cardFooterContentMultiple.length > 0) {
        // 'none'이 아닌 항목만 필터링
        const validContent = settings.cardFooterContentMultiple.filter(item => item !== 'none');
        if (validContent.length > 0) {
          footerContent = validContent.join(' | ');
        } else {
          footerContent = 'none';
        }
      } else if (settings.cardFooterContent && settings.cardFooterContent !== 'none') {
        footerContent = settings.cardFooterContent;
      } else {
        footerContent = 'none';
      }
      this.footerEl.textContent = footerContent;
    }
  }
  
  /**
   * 컴포넌트 선택
   * @param component 선택할 컴포넌트
   */
  private selectComponent(component: 'header' | 'body' | 'footer' | 'card'): void {
    // 이전 선택 초기화
    if (this.headerEl) this.headerEl.classList.remove('card-navigator-selected');
    if (this.bodyEl) this.bodyEl.classList.remove('card-navigator-selected');
    if (this.footerEl) this.footerEl.classList.remove('card-navigator-selected');
    if (this.cardEl) this.cardEl.classList.remove('card-navigator-selected');
    
    // 설정 컨테이너 숨기기
    this.headerSettingsContainer.style.display = 'none';
    this.bodySettingsContainer.style.display = 'none';
    this.footerSettingsContainer.style.display = 'none';
    this.cardSettingsContainer.style.display = 'none';
    
    // 선택된 컴포넌트 강조 및 설정 표시
    this.selectedComponent = component;
    
    switch (component) {
      case 'header':
        if (this.headerEl) this.headerEl.classList.add('card-navigator-selected');
        this.headerSettingsContainer.style.display = 'block';
        break;
      case 'body':
        if (this.bodyEl) this.bodyEl.classList.add('card-navigator-selected');
        this.bodySettingsContainer.style.display = 'block';
        break;
      case 'footer':
        if (this.footerEl) this.footerEl.classList.add('card-navigator-selected');
        this.footerSettingsContainer.style.display = 'block';
        break;
      case 'card':
        if (this.cardEl) this.cardEl.classList.add('card-navigator-selected');
        this.cardSettingsContainer.style.display = 'block';
        break;
    }
    
    // 미리보기 업데이트
    this.updateCardPreview();
  }
  
  /**
   * 섹션 언로드
   */
  unload(): void {
    if (!this.eventBus) return;
    
    // 이벤트 리스너 제거
    this.eventBus.off(EventType.SETTINGS_CHANGED, this.updateCardPreview.bind(this));
    this.eventBus.off(EventType.SETTINGS_UI_CHANGED, this.updateCardPreview.bind(this));
    this.eventBus.off(EventType.SETTINGS_PREVIEW_UPDATE, this.updateCardPreview.bind(this));
  }
} 