import { Setting, ToggleComponent, ColorComponent } from 'obsidian';
import CardNavigatorPlugin from '@/main';
import { ICardRenderConfig, ICardStyle } from '@/domain/models/Card';

/**
 * 카드 설정 컴포넌트
 */
export class CardSettings {
  private containerEl: HTMLElement;

  constructor(containerEl: HTMLElement, private plugin: CardNavigatorPlugin) {
    this.containerEl = containerEl;
  }

  /**
   * 카드 설정 표시
   */
  display(): void {
    // 카드 설정
    new Setting(this.containerEl)
      .setName('카드 설정')
      .setHeading();

    // 카드 렌더링 설정
    new Setting(this.containerEl)
      .setName('카드 렌더링 설정')
      .setHeading();

    // 헤더 설정
    new Setting(this.containerEl)
      .setName('헤더 설정')
      .setHeading();

    new Setting(this.containerEl)
      .setName('파일명 표시')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.header.showFileName'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.header.showFileName', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('첫 번째 헤더 표시')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.header.showFirstHeader'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.header.showFirstHeader', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('태그 표시')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.header.showTags'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.header.showTags', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('생성일 표시')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.header.showCreatedDate'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.header.showCreatedDate', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('수정일 표시')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.header.showUpdatedDate'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.header.showUpdatedDate', value);
            this.plugin.saveSettings();
          });
      });

    // 본문 설정
    new Setting(this.containerEl)
      .setName('본문 설정')
      .setHeading();

    new Setting(this.containerEl)
      .setName('본문 내용 표시')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.body.showContent'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.body.showContent', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('본문 길이')
      .setDesc('본문에 표시할 최대 문자 수를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(50, 500, 50)
          .setValue(this.plugin.getSetting('cardRenderConfig.body.contentLength') || 200)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.body.contentLength', value);
            this.plugin.saveSettings();
          });
      });

    // 푸터 설정
    new Setting(this.containerEl)
      .setName('푸터 설정')
      .setHeading();

    new Setting(this.containerEl)
      .setName('푸터 표시')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.footer.showFileName'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.footer.showFileName', value);
            this.plugin.saveSettings();
          });
      });

    // HTML 렌더링
    new Setting(this.containerEl)
      .setName('HTML 렌더링')
      .setDesc('마크다운을 HTML로 렌더링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('cardRenderConfig.renderAsHtml'))
          .onChange(value => {
            this.plugin.setSetting('cardRenderConfig.renderAsHtml', value);
            this.plugin.saveSettings();
          });
      });

    // 카드 스타일 설정
    new Setting(this.containerEl)
      .setName('카드 스타일 설정')
      .setHeading();

    // 카드 기본 스타일
    new Setting(this.containerEl)
      .setName('카드 기본 스타일')
      .setHeading();

    new Setting(this.containerEl)
      .setName('배경색')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.card.background'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.card.background', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('글꼴 크기')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.card.fontSize'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.card.fontSize', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('테두리 색상')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.card.borderColor'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.card.borderColor', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('테두리 두께')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.card.borderWidth'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.card.borderWidth', value);
            this.plugin.saveSettings();
          });
      });

    // 활성 카드 스타일
    new Setting(this.containerEl)
      .setName('활성 카드 스타일')
      .setHeading();

    new Setting(this.containerEl)
      .setName('배경색')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.activeCard.background'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.activeCard.background', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('글꼴 크기')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.activeCard.fontSize'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.activeCard.fontSize', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('테두리 색상')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.activeCard.borderColor'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.activeCard.borderColor', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('테두리 두께')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.activeCard.borderWidth'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.activeCard.borderWidth', value);
            this.plugin.saveSettings();
          });
      });

    // 포커스 카드 스타일
    new Setting(this.containerEl)
      .setName('포커스 카드 스타일')
      .setHeading();

    new Setting(this.containerEl)
      .setName('배경색')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.focusedCard.background'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.focusedCard.background', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('글꼴 크기')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.focusedCard.fontSize'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.focusedCard.fontSize', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('테두리 색상')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.focusedCard.borderColor'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.focusedCard.borderColor', value);
            this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName('테두리 두께')
      .addText(text => {
        text
          .setValue(this.plugin.getSetting('cardStyle.focusedCard.borderWidth'))
          .onChange(value => {
            this.plugin.setSetting('cardStyle.focusedCard.borderWidth', value);
            this.plugin.saveSettings();
          });
      });
  }
} 