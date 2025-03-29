import { App, Modal, Setting } from 'obsidian';
import { Preset } from '@/domain/models/Preset';
import { ICardRenderConfig } from '@/domain/models/Card';

/**
 * 프리셋 편집 모달
 */
export class PresetEditModal extends Modal {
  private preset: Preset;
  private onSubmit: (preset: Preset) => void;

  constructor(
    app: App,
    preset: Preset,
    onSubmit: (preset: Preset) => void
  ) {
    super(app);
    this.preset = preset;
    this.onSubmit = onSubmit;
  }

  /**
   * 모달 표시
   */
  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // 제목
    contentEl.createEl('h2', { text: '프리셋 편집' });

    // 이름
    new Setting(contentEl)
      .setName('이름')
      .addText(text => {
        text
          .setValue(this.preset.name)
          .onChange(value => {
            this.preset.name = value;
          });
      });

    // 설명
    new Setting(contentEl)
      .setName('설명')
      .addTextArea(text => {
        text
          .setValue(this.preset.description || '')
          .onChange(value => {
            this.preset.description = value;
          });
      });

    // 카드셋 타입
    new Setting(contentEl)
      .setName('카드셋 타입')
      .addDropdown(dropdown => {
        dropdown
          .addOption('folder', '폴더')
          .addOption('tag', '태그')
          .addOption('link', '링크')
          .setValue(this.preset.cardSetType)
          .onChange(value => {
            this.preset.cardSetType = value as 'folder' | 'tag' | 'link';
          });
      });

    // 카드셋 설정
    new Setting(contentEl)
      .setName('카드셋 설정')
      .setHeading();

    if (this.preset.cardSetType === 'folder') {
      new Setting(contentEl)
        .setName('하위 폴더 포함')
        .addToggle(toggle => {
          toggle
            .setValue(this.preset.includeSubfolders)
            .onChange(value => {
              this.preset.includeSubfolders = value;
            });
        });
    }

    if (this.preset.cardSetType === 'link') {
      this._createLinkConfigSection();
    }

    // 카드 설정
    new Setting(contentEl)
      .setName('카드 설정')
      .setHeading();

    this._addCardContentSettings(contentEl);
    this._addCardStyleSettings(contentEl);

    // 정렬 설정
    this._createSortSection();

    // 레이아웃 설정
    new Setting(contentEl)
      .setName('레이아웃 설정')
      .setHeading();

    new Setting(contentEl)
      .setName('고정 높이')
      .addToggle(toggle => {
        toggle
          .setValue(this.preset.fixedHeight)
          .onChange(value => {
            this.preset.fixedHeight = value;
          });
      });

    new Setting(contentEl)
      .setName('카드 너비')
      .addText(text => {
        text
          .setValue(this.preset.cardWidth.toString())
          .onChange(value => {
            this.preset.cardWidth = parseInt(value) || 300;
          });
      });

    new Setting(contentEl)
      .setName('카드 높이')
      .addText(text => {
        text
          .setValue(this.preset.cardHeight.toString())
          .onChange(value => {
            this.preset.cardHeight = parseInt(value) || 200;
          });
      });

    // 버튼
    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText('저장')
          .setCta()
          .onClick(() => {
            this.onSubmit(this.preset);
            this.close();
          });
      })
      .addButton(button => {
        button
          .setButtonText('취소')
          .onClick(() => {
            this.close();
          });
      });
  }

  /**
   * 카드 내용 설정 추가
   */
  private _addCardContentSettings(containerEl: HTMLElement): void {
    const config = this.preset.cardRenderConfig;

    // 헤더 설정
    new Setting(containerEl)
      .setName('헤더 설정')
      .setHeading();

    new Setting(containerEl)
      .setName('파일 이름 표시')
      .addToggle(toggle => {
        toggle
          .setValue(config.header.showFileName)
          .onChange(value => {
            config.header.showFileName = value;
          });
      });

    new Setting(containerEl)
      .setName('첫 번째 헤더 표시')
      .addToggle(toggle => {
        toggle
          .setValue(config.header.showFirstHeader)
          .onChange(value => {
            config.header.showFirstHeader = value;
          });
      });

    // 바디 설정
    new Setting(containerEl)
      .setName('바디 설정')
      .setHeading();

    new Setting(containerEl)
      .setName('내용 표시')
      .addToggle(toggle => {
        toggle
          .setValue(config.body.showContent)
          .onChange(value => {
            config.body.showContent = value;
          });
      });

    new Setting(containerEl)
      .setName('HTML 렌더링')
      .setDesc('내용을 HTML로 렌더링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(config.renderAsHtml)
          .onChange(value => {
            config.renderAsHtml = value;
          });
      });

    // 풋터 설정
    new Setting(containerEl)
      .setName('풋터 설정')
      .setHeading();

    new Setting(containerEl)
      .setName('태그 표시')
      .addToggle(toggle => {
        toggle
          .setValue(config.footer.showTags)
          .onChange(value => {
            config.footer.showTags = value;
          });
      });

    new Setting(containerEl)
      .setName('생성일 표시')
      .addToggle(toggle => {
        toggle
          .setValue(config.footer.showCreatedDate)
          .onChange(value => {
            config.footer.showCreatedDate = value;
          });
      });

    new Setting(containerEl)
      .setName('수정일 표시')
      .addToggle(toggle => {
        toggle
          .setValue(config.footer.showUpdatedDate)
          .onChange(value => {
            config.footer.showUpdatedDate = value;
          });
      });
  }

  /**
   * 카드 스타일 설정 추가
   */
  private _addCardStyleSettings(containerEl: HTMLElement): void {
    const style = this.preset.cardStyle;

    // 일반 카드 스타일
    new Setting(containerEl)
      .setName('일반 카드 스타일')
      .setHeading();

    this._addStyleSettings(containerEl, style.card, 'card');

    // 활성 카드 스타일
    new Setting(containerEl)
      .setName('활성 카드 스타일')
      .setHeading();

    this._addStyleSettings(containerEl, style.activeCard, 'activeCard');

    // 포커스된 카드 스타일
    new Setting(containerEl)
      .setName('포커스된 카드 스타일')
      .setHeading();

    this._addStyleSettings(containerEl, style.focusedCard, 'focusedCard');

    // 헤더 스타일
    new Setting(containerEl)
      .setName('헤더 스타일')
      .setHeading();

    this._addStyleSettings(containerEl, style.header, 'header');

    // 바디 스타일
    new Setting(containerEl)
      .setName('바디 스타일')
      .setHeading();

    this._addStyleSettings(containerEl, style.body, 'body');

    // 풋터 스타일
    new Setting(containerEl)
      .setName('풋터 스타일')
      .setHeading();

    this._addStyleSettings(containerEl, style.footer, 'footer');

    // 카드 스타일
    new Setting(containerEl)
      .setName('카드 스타일')
      .addText(text => {
        text
          .setValue(JSON.stringify(this.preset.cardStyle))
          .onChange(value => {
            try {
              this.preset.cardStyle = JSON.parse(value);
            } catch (e) {
              console.error('Invalid card style JSON:', e);
            }
          });
      });
  }

  /**
   * 스타일 설정 추가
   */
  private _addStyleSettings(
    containerEl: HTMLElement,
    style: any,
    prefix: string
  ): void {
    new Setting(containerEl)
      .setName('배경색')
      .addText(text => {
        text
          .setValue(style.background)
          .onChange(value => {
            style.background = value;
          });
      });

    new Setting(containerEl)
      .setName('글꼴 크기')
      .addText(text => {
        text
          .setValue(style.fontSize)
          .onChange(value => {
            style.fontSize = value;
          });
      });

    new Setting(containerEl)
      .setName('테두리 색상')
      .addText(text => {
        text
          .setValue(style.borderColor)
          .onChange(value => {
            style.borderColor = value;
          });
      });

    new Setting(containerEl)
      .setName('테두리 두께')
      .addText(text => {
        text
          .setValue(style.borderWidth)
          .onChange(value => {
            style.borderWidth = value;
          });
      });
  }

  private _createLinkConfigSection(): void {
    new Setting(this.contentEl)
      .setName('링크 설정')
      .setDesc('링크 관련 설정을 구성합니다.');

    new Setting(this.contentEl)
      .setName('링크 타입')
      .addDropdown(dropdown => {
        dropdown
          .addOption('backlink', '백링크')
          .addOption('outgoing', '아웃고잉 링크')
          .setValue(this.preset.cardSetConfig.linkConfig?.type || 'backlink')
          .onChange(async (value: 'backlink' | 'outgoing') => {
            if (!this.preset.cardSetConfig.linkConfig) {
              this.preset.cardSetConfig.linkConfig = {
                type: value,
                depth: 1
              };
            } else {
              this.preset.cardSetConfig.linkConfig.type = value;
            }
          });
      });

    new Setting(this.contentEl)
      .setName('링크 깊이')
      .setDesc('링크를 추적할 깊이를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 5, 1)
          .setValue(this.preset.cardSetConfig.linkConfig?.depth || 1)
          .setDynamicTooltip()
          .onChange(async (value: number) => {
            if (!this.preset.cardSetConfig.linkConfig) {
              this.preset.cardSetConfig.linkConfig = {
                type: 'backlink',
                depth: value
              };
            } else {
              this.preset.cardSetConfig.linkConfig.depth = value;
            }
          });
      });
  }

  private _createSortSection(): void {
    new Setting(this.contentEl)
      .setName('정렬 설정')
      .setDesc('카드 정렬 방식을 설정합니다.');

    new Setting(this.contentEl)
      .setName('정렬 기준')
      .addDropdown(dropdown => {
        dropdown
          .addOption('fileName', '파일명')
          .addOption('firstHeader', '첫 번째 헤더')
          .addOption('createdAt', '생성일')
          .addOption('updatedAt', '수정일')
          .addOption('custom', '사용자 지정')
          .setValue(this.preset.cardSetConfig.sortBy || 'fileName')
          .onChange(async (value: 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom') => {
            this.preset.cardSetConfig.sortBy = value;
            if (value === 'custom') {
              this._showCustomSortField();
            } else {
              this._hideCustomSortField();
            }
          });
      });

    new Setting(this.contentEl)
      .setName('정렬 순서')
      .addDropdown(dropdown => {
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(this.preset.cardSetConfig.sortOrder || 'asc')
          .onChange(async (value: 'asc' | 'desc') => {
            this.preset.cardSetConfig.sortOrder = value;
          });
      });

    if (this.preset.cardSetConfig.sortBy === 'custom') {
      this._showCustomSortField();
    }
  }

  private _showCustomSortField(): void {
    new Setting(this.contentEl)
      .setName('사용자 지정 정렬 필드')
      .setDesc('frontmatter에서 사용할 필드명을 입력하세요.')
      .addText(text => {
        text
          .setValue(this.preset.cardSetConfig.customSortField || '')
          .onChange(async (value: string) => {
            this.preset.cardSetConfig.customSortField = value || undefined;
          });
      });
  }

  private _hideCustomSortField(): void {
    // Implementation of hiding custom sort field
  }
} 