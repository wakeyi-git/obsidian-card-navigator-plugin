import { Setting } from 'obsidian';
import { CardContentType } from '../../domain/card/Card';
import { BaseSettingSection } from './BaseSettingSection';
import { CardPreview } from '../components/CardPreview';
import { EventType } from '../../domain/events/EventTypes';
import CardNavigatorPlugin from '../../main';
import { SettingSection } from './SettingSection';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ICardNavigatorSettings } from '../../domain/settings/SettingsInterfaces';

/**
 * 카드 미리보기 섹션
 * 카드 미리보기를 표시하는 섹션입니다.
 */
export class CardPreviewSection implements SettingSection {
  private plugin: CardNavigatorPlugin;
  private eventBus: DomainEventBus;
  private settingsService: ISettingsService;
  private settings: ICardNavigatorSettings;
  
  // 컨테이너 요소
  public containerEl: HTMLElement;
  
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
   * @param plugin 플러그인 인스턴스
   */
  constructor(plugin: CardNavigatorPlugin) {
    this.plugin = plugin;
    this.eventBus = plugin.eventBus;
    this.settingsService = plugin.settingsService;
    this.settings = this.settingsService.getSettings();
    this.containerEl = document.createElement('div');
    this.containerEl.addClass('card-navigator-preview-section-container');
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
   * 섹션 표시
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 스타일 추가
    this.addStyles();

    // 카드 미리보기 섹션 생성
    const previewSection = containerEl.createDiv({ cls: 'card-navigator-preview-section' });
    
    // 도움말 텍스트 추가
    const helpText = previewSection.createDiv({ cls: 'card-navigator-component-help-text' });
    helpText.setText('카드 구성요소를 클릭하여 해당 설정을 변경하세요.');

    // 카드 미리보기 생성
    this.createCardPreview(previewSection);

    // 개별 설정 컨테이너 생성
    this.headerSettingsContainer = containerEl.createDiv({ cls: 'card-navigator-component-settings' });
    this.headerSettingsContainer.style.display = 'none';
    
    this.bodySettingsContainer = containerEl.createDiv({ cls: 'card-navigator-component-settings' });
    this.bodySettingsContainer.style.display = 'none';
    
    this.footerSettingsContainer = containerEl.createDiv({ cls: 'card-navigator-component-settings' });
    this.footerSettingsContainer.style.display = 'none';
    
    this.cardSettingsContainer = containerEl.createDiv({ cls: 'card-navigator-component-settings' });
    
    // 각 설정 섹션 생성
    this.createHeaderSettings(this.headerSettingsContainer);
    this.createBodySettings(this.bodySettingsContainer);
    this.createFooterSettings(this.footerSettingsContainer);
    this.createCardSettings(this.cardSettingsContainer);
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 기본적으로 카드 설정 표시
    this.selectComponent('card');
  }
  
  /**
   * 스타일 추가
   */
  private addStyles(): void {
    // 이 메서드는 더 이상 스타일을 직접 추가하지 않습니다.
    // 스타일은 CardPreviewSection.css 파일에서 관리됩니다.
    // 필요한 경우 동적으로 추가해야 하는 스타일만 여기서 처리합니다.
    
    // 이미 동적 스타일이 추가되어 있는지 확인
    if (document.getElementById('card-navigator-dynamic-styles')) {
      return;
    }
    
    // 동적 스타일 요소 생성 (필요한 경우)
    const styleEl = document.createElement('style');
    styleEl.id = 'card-navigator-dynamic-styles';
    
    // 동적으로 생성해야 하는 스타일만 추가
    styleEl.textContent = `
      /* 동적으로 생성해야 하는 스타일만 여기에 추가 */
    `;
    
    // 문서에 스타일 추가
    document.head.appendChild(styleEl);
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
    
    // 날짜 옵션
    new Setting(footerContentContainer)
      .setName('날짜')
      .addToggle(toggle => {
        const isSelected = this.settings.cardFooterContentMultiple?.includes('date') ?? false;
        toggle
          .setValue(isSelected)
          .onChange(async (value) => {
            let contentTypes = this.settings.cardFooterContentMultiple || [this.settings.cardFooterContent || 'tags'];
            
            if (value && !contentTypes.includes('date')) {
              contentTypes.push('date');
            } else if (!value && contentTypes.includes('date')) {
              contentTypes = contentTypes.filter(type => type !== 'date');
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
    
    // 카드 너비 설정
    new Setting(containerEl)
      .setName('카드 너비')
      .setDesc('카드의 너비를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(200, 800, 50)
        .setValue(this.settings.cardWidth || 400)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('cardWidth', value);
        })
      );
    
    // 카드 높이 설정
    new Setting(containerEl)
      .setName('카드 높이')
      .setDesc('카드의 높이를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 500, 50)
        .setValue(this.settings.cardHeight || 150)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('cardHeight', value);
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
    
    // 일반 카드 스타일 설정
    containerEl.createEl('h5', { text: '일반 카드 스타일' });
    
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
    
    // 활성 카드 스타일 설정
    containerEl.createEl('h5', { text: '활성 카드 스타일' });
    
    // 활성 카드 테두리 종류 설정
    new Setting(containerEl)
      .setName('테두리 종류')
      .setDesc('활성 카드의 테두리 종류를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .addOption('double', '이중선')
        .addOption('groove', '홈선')
        .addOption('ridge', '돌출선')
        .setValue(this.settings.activeCardBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.updateSetting('activeCardBorderStyle', value);
        })
      );
    
    // 활성 카드 배경색 설정
    new Setting(containerEl)
      .setName('배경색')
      .setDesc('활성 카드의 배경색을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.activeCardBgColor || '')
        .onChange(async (value) => {
          await this.updateSetting('activeCardBgColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('activeCardBgColor', '');
        })
      );
    
    // 활성 카드 테두리 색상 설정
    new Setting(containerEl)
      .setName('테두리 색상')
      .setDesc('활성 카드의 테두리 색상을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.activeCardBorderColor || '')
        .onChange(async (value) => {
          await this.updateSetting('activeCardBorderColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('activeCardBorderColor', '');
        })
      );
    
    // 활성 카드 테두리 두께 설정
    new Setting(containerEl)
      .setName('테두리 두께')
      .setDesc('활성 카드의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(this.settings.activeCardBorderWidth || 2)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('activeCardBorderWidth', value);
        })
      );
    
    // 포커스 카드 스타일 설정
    containerEl.createEl('h5', { text: '포커스 카드 스타일' });
    
    // 포커스 카드 테두리 종류 설정
    new Setting(containerEl)
      .setName('테두리 종류')
      .setDesc('포커스 카드의 테두리 종류를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .addOption('double', '이중선')
        .addOption('groove', '홈선')
        .addOption('ridge', '돌출선')
        .setValue(this.settings.focusedCardBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.updateSetting('focusedCardBorderStyle', value);
        })
      );
    
    // 포커스 카드 배경색 설정
    new Setting(containerEl)
      .setName('배경색')
      .setDesc('포커스 카드의 배경색을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.focusedCardBgColor || '')
        .onChange(async (value) => {
          await this.updateSetting('focusedCardBgColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('focusedCardBgColor', '');
        })
      );
    
    // 포커스 카드 테두리 색상 설정
    new Setting(containerEl)
      .setName('테두리 색상')
      .setDesc('포커스 카드의 테두리 색상을 설정합니다. 라이트/다크 테마에 따라 다른 색상을 설정할 수 있습니다.')
      .addColorPicker(color => color
        .setValue(this.settings.focusedCardBorderColor || '')
        .onChange(async (value) => {
          await this.updateSetting('focusedCardBorderColor', value);
        })
      )
      .addExtraButton(button => button
        .setIcon('reset')
        .setTooltip('기본값으로 되돌리기')
        .onClick(async () => {
          await this.updateSetting('focusedCardBorderColor', '');
        })
      );
    
    // 포커스 카드 테두리 두께 설정
    new Setting(containerEl)
      .setName('테두리 두께')
      .setDesc('포커스 카드의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 5, 1)
        .setValue(this.settings.focusedCardBorderWidth || 3)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.updateSetting('focusedCardBorderWidth', value);
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
    if (!this.cardEl || !this.headerEl || !this.bodyEl || !this.footerEl) return;
    
    const settings = this.settings;
    
    // 카드 스타일 업데이트
    this.cardEl.style.width = `${settings.cardWidth || 400}px`;
    this.cardEl.style.height = `${settings.cardHeight || 150}px`;
    this.cardEl.style.borderRadius = `${settings.borderRadius || 5}px`;
    
    // 선택된 컴포넌트에 따라 스타일 적용
    if (this.selectedComponent === 'card') {
      // 활성 카드 스타일 적용
      if (settings.activeCardBgColor) {
        this.cardEl.style.backgroundColor = settings.activeCardBgColor;
      } else {
        // 기본 카드 배경색 설정
        this.cardEl.style.backgroundColor = settings.normalCardBgColor || '';
      }
      
      // 활성 카드 테두리 설정
      if (settings.activeCardBorderColor) {
        this.cardEl.style.borderColor = settings.activeCardBorderColor;
      } else {
        this.cardEl.style.borderColor = settings.normalCardBorderColor || '';
      }
      
      if (settings.activeCardBorderWidth !== undefined) {
        this.cardEl.style.borderWidth = `${settings.activeCardBorderWidth}px`;
      } else {
        this.cardEl.style.borderWidth = `${settings.normalCardBorderWidth || 1}px`;
      }
      
      // 활성 카드 테두리 스타일 설정
      if (settings.activeCardBorderStyle) {
        this.cardEl.style.borderStyle = settings.activeCardBorderStyle;
      } else {
        this.cardEl.style.borderStyle = settings.normalCardBorderStyle || 'solid';
      }
    } else {
      // 일반 카드 스타일 적용
      // 카드 배경색 설정
      if (settings.normalCardBgColor) {
        this.cardEl.style.backgroundColor = settings.normalCardBgColor;
      } else {
        this.cardEl.style.backgroundColor = '';
      }
      
      // 카드 테두리 설정
      if (settings.normalCardBorderColor) {
        this.cardEl.style.borderColor = settings.normalCardBorderColor;
      } else {
        this.cardEl.style.borderColor = '';
      }
      
      if (settings.normalCardBorderWidth !== undefined) {
        this.cardEl.style.borderWidth = `${settings.normalCardBorderWidth}px`;
      } else {
        this.cardEl.style.borderWidth = '1px';
      }
      
      // 일반 카드 테두리 스타일 설정
      if (settings.normalCardBorderStyle) {
        this.cardEl.style.borderStyle = settings.normalCardBorderStyle;
      } else {
        this.cardEl.style.borderStyle = 'solid';
      }
    }
    
    // 선택된 컴포넌트에 포커스 스타일 적용
    if (this.selectedComponent === 'header') {
      // 헤더에 포커스 스타일 적용
      if (settings.focusedCardBgColor) {
        this.headerEl.style.backgroundColor = settings.focusedCardBgColor;
      }
      
      if (settings.focusedCardBorderColor) {
        this.headerEl.style.borderColor = settings.focusedCardBorderColor;
        this.headerEl.style.boxShadow = `inset 0 0 0 ${settings.focusedCardBorderWidth || 3}px ${settings.focusedCardBorderColor}`;
      }
      
      // 포커스 테두리 스타일 적용
      if (settings.focusedCardBorderStyle) {
        this.headerEl.style.borderStyle = settings.focusedCardBorderStyle;
      }
    } else {
      // 헤더 기본 스타일 적용
      if (settings.headerBgColor) {
        this.headerEl.style.backgroundColor = settings.headerBgColor;
      } else {
        this.headerEl.style.backgroundColor = '';
      }
      
      this.headerEl.style.boxShadow = '';
      
      // 헤더 테두리 스타일 적용
      if (settings.headerBorderStyle && settings.headerBorderStyle !== 'none') {
        this.headerEl.style.borderBottom = `${settings.headerBorderWidth || 1}px ${settings.headerBorderStyle} ${settings.headerBorderColor || 'var(--background-modifier-border)'}`;
      } else {
        this.headerEl.style.borderBottom = '';
      }
    }
    
    if (this.selectedComponent === 'body') {
      // 바디에 포커스 스타일 적용
      if (settings.focusedCardBgColor) {
        this.bodyEl.style.backgroundColor = settings.focusedCardBgColor;
      }
      
      if (settings.focusedCardBorderColor) {
        this.bodyEl.style.borderColor = settings.focusedCardBorderColor;
        this.bodyEl.style.boxShadow = `inset 0 0 0 ${settings.focusedCardBorderWidth || 3}px ${settings.focusedCardBorderColor}`;
      }
      
      // 포커스 테두리 스타일 적용
      if (settings.focusedCardBorderStyle) {
        this.bodyEl.style.borderStyle = settings.focusedCardBorderStyle;
      }
    } else {
      // 바디 기본 스타일 적용
      if (settings.bodyBgColor) {
        this.bodyEl.style.backgroundColor = settings.bodyBgColor;
      } else {
        this.bodyEl.style.backgroundColor = '';
      }
      
      this.bodyEl.style.boxShadow = '';
      
      // 바디 테두리 스타일 적용
      if (settings.bodyBorderStyle && settings.bodyBorderStyle !== 'none') {
        this.bodyEl.style.borderTop = `${settings.bodyBorderWidth || 0}px ${settings.bodyBorderStyle} ${settings.bodyBorderColor || 'var(--background-modifier-border)'}`;
        this.bodyEl.style.borderBottom = `${settings.bodyBorderWidth || 0}px ${settings.bodyBorderStyle} ${settings.bodyBorderColor || 'var(--background-modifier-border)'}`;
      } else {
        this.bodyEl.style.borderTop = '';
        this.bodyEl.style.borderBottom = '';
      }
    }
    
    if (this.selectedComponent === 'footer') {
      // 풋터에 포커스 스타일 적용
      if (settings.focusedCardBgColor) {
        this.footerEl.style.backgroundColor = settings.focusedCardBgColor;
      }
      
      if (settings.focusedCardBorderColor) {
        this.footerEl.style.borderColor = settings.focusedCardBorderColor;
        this.footerEl.style.boxShadow = `inset 0 0 0 ${settings.focusedCardBorderWidth || 3}px ${settings.focusedCardBorderColor}`;
      }
      
      // 포커스 테두리 스타일 적용
      if (settings.focusedCardBorderStyle) {
        this.footerEl.style.borderStyle = settings.focusedCardBorderStyle;
      }
    } else {
      // 풋터 기본 스타일 적용
      if (settings.footerBgColor) {
        this.footerEl.style.backgroundColor = settings.footerBgColor;
      } else {
        this.footerEl.style.backgroundColor = '';
      }
      
      this.footerEl.style.boxShadow = '';
      
      // 풋터 테두리 스타일 적용
      if (settings.footerBorderStyle && settings.footerBorderStyle !== 'none') {
        this.footerEl.style.borderTop = `${settings.footerBorderWidth || 1}px ${settings.footerBorderStyle} ${settings.footerBorderColor || 'var(--background-modifier-border)'}`;
      } else {
        this.footerEl.style.borderTop = '';
      }
    }
    
    // 헤더 표시/숨김
    this.headerEl.style.display = (settings.showHeader ?? true) ? 'block' : 'none';
    
    // 헤더 스타일 설정
    if (settings.headerFontSize) {
      this.headerEl.style.fontSize = `${settings.headerFontSize}px`;
    }
    
    // 헤더 콘텐츠 설정 (다중 선택)
    let headerContent = '';
    const headerContentTypes = settings.cardHeaderContentMultiple || [settings.cardHeaderContent || 'filename'];
    
    if (headerContentTypes.includes('none') || headerContentTypes.length === 0) {
      headerContent = '';
    } else {
      const headerParts: string[] = [];
      
      if (headerContentTypes.includes('filename')) {
        headerParts.push('샘플 노트 제목.md');
      }
      
      if (headerContentTypes.includes('firstheader')) {
        headerParts.push('# 샘플 노트 제목');
      }
      
      if (headerContentTypes.includes('frontmatter')) {
        const key = settings.cardHeaderFrontmatterKey || 'title';
        headerParts.push(`${key}: 샘플 노트 제목`);
      }
      
      headerContent = headerParts.join(' | ');
    }
    
    this.headerEl.setText(headerContent);
    
    // 바디 스타일 설정
    if (settings.bodyFontSize) {
      this.bodyEl.style.fontSize = `${settings.bodyFontSize}px`;
    }
    
    // 바디 콘텐츠 설정 (다중 선택)
    let bodyContent = '';
    const bodyContentTypes = settings.cardBodyContentMultiple || [settings.cardBodyContent || 'content'];
    
    if (bodyContentTypes.includes('none') || bodyContentTypes.length === 0) {
      bodyContent = '';
    } else {
      const bodyParts: string[] = [];
      
      if (bodyContentTypes.includes('content')) {
        let contentPart = '이것은 샘플 노트 내용입니다. 설정에 따라 카드 모양이 변경됩니다.';
        
        // 프론트매터 포함 설정
        if (settings.includeFrontmatterInContent) {
          contentPart = '---\ntitle: 샘플 노트 제목\ntags: [샘플, 테스트]\n---\n' + contentPart;
        }
        
        // 첫 번째 헤더 포함 설정
        if (settings.includeFirstHeaderInContent) {
          contentPart = '# 샘플 노트 제목\n\n' + contentPart;
        }
        
        bodyParts.push(contentPart);
      }
      
      if (bodyContentTypes.includes('frontmatter')) {
        const key = settings.cardBodyFrontmatterKey || 'description';
        bodyParts.push(`${key}: 이것은 샘플 노트에 대한 설명입니다.`);
      }
      
      bodyContent = bodyParts.join('\n\n');
    }
    
    // 바디 내용 길이 제한
    if (bodyContent.length > (settings.bodyMaxLength || 200)) {
      bodyContent = bodyContent.substring(0, settings.bodyMaxLength || 200) + '...';
    }
    
    this.bodyEl.setText(bodyContent);
    
    // 풋터 표시/숨김
    this.footerEl.style.display = (settings.showFooter ?? true) ? 'block' : 'none';
    
    // 풋터 스타일 설정
    if (settings.footerFontSize) {
      this.footerEl.style.fontSize = `${settings.footerFontSize}px`;
    }
    
    // 풋터 콘텐츠 설정 (다중 선택)
    let footerContent = '';
    const footerContentTypes = settings.cardFooterContentMultiple || [settings.cardFooterContent || 'tags'];
    
    if (footerContentTypes.includes('none') || footerContentTypes.length === 0) {
      footerContent = '';
    } else {
      const footerParts: string[] = [];
      
      if (footerContentTypes.includes('tags')) {
        footerParts.push('#샘플 #테스트 #카드');
      }
      
      if (footerContentTypes.includes('date')) {
        const now = new Date();
        footerParts.push(`생성: ${now.toLocaleDateString()}`);
      }
      
      if (footerContentTypes.includes('frontmatter')) {
        const key = settings.cardFooterFrontmatterKey || 'status';
        footerParts.push(`${key}: 완료`);
      }
      
      footerContent = footerParts.join(' | ');
    }
    
    this.footerEl.setText(footerContent);
  }
  
  /**
   * 구성요소 선택
   * @param component 선택할 구성요소
   */
  private selectComponent(component: 'header' | 'body' | 'footer' | 'card'): void {
    // 모든 구성요소의 선택 상태 제거
    this.headerEl?.removeClass('card-navigator-selected');
    this.bodyEl?.removeClass('card-navigator-selected');
    this.footerEl?.removeClass('card-navigator-selected');
    this.cardEl?.removeClass('card-navigator-selected');
    
    // 모든 설정 컨테이너 숨기기
    if (this.headerSettingsContainer) this.headerSettingsContainer.style.display = 'none';
    if (this.bodySettingsContainer) this.bodySettingsContainer.style.display = 'none';
    if (this.footerSettingsContainer) this.footerSettingsContainer.style.display = 'none';
    if (this.cardSettingsContainer) this.cardSettingsContainer.style.display = 'none';
    
    // 선택된 컴포넌트 저장
    this.selectedComponent = component;
    
    // 선택된 구성요소 강조 표시 및 해당 설정 표시
    switch (component) {
      case 'header':
        this.headerEl?.addClass('card-navigator-selected');
        if (this.headerSettingsContainer) this.headerSettingsContainer.style.display = 'block';
        break;
      case 'body':
        this.bodyEl?.addClass('card-navigator-selected');
        if (this.bodySettingsContainer) this.bodySettingsContainer.style.display = 'block';
        break;
      case 'footer':
        this.footerEl?.addClass('card-navigator-selected');
        if (this.footerSettingsContainer) this.footerSettingsContainer.style.display = 'block';
        break;
      case 'card':
        this.cardEl?.addClass('card-navigator-selected');
        if (this.cardSettingsContainer) this.cardSettingsContainer.style.display = 'block';
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