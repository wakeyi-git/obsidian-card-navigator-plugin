import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { DomainEventBus } from '../core/events/DomainEventBus';
import { EventType } from '../core/events/EventTypes';
import { DomainErrorBus } from '../core/errors/DomainErrorBus';
import { ErrorCode } from '../core/errors/ErrorTypes';
import { ICardDisplaySettings, IDateFormatSettings, IFrontmatterFormatSettings } from '../domain/card/Card';
import { ICardStyle } from '../domain/card/Card';
import { LayoutOptions } from '../domain/layout/Layout';
import { IPreset, CardNavigatorSettings } from '../domain/settings/Settings';
import { TemplateModal } from './TemplateModal';
import { CardSetSourceMode } from '../domain/cardset/CardSet';

/**
 * 카드 네비게이터 설정 탭
 * 플러그인의 설정을 관리하는 탭입니다.
 */
export class CardNavigatorSettingTab extends PluginSettingTab {
  private plugin: CardNavigatorPlugin;
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;

  constructor(app: App, plugin: CardNavigatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.eventBus = DomainEventBus.getInstance();
    this.errorBus = DomainErrorBus.getInstance();
  }

  /**
   * 설정 표시
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 기본 모드 설정
    new Setting(containerEl)
      .setName('기본 모드')
      .setDesc('카드 네비게이터의 기본 모드를 설정합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption(CardSetSourceMode.FOLDER, '폴더')
          .addOption(CardSetSourceMode.TAG, '태그')
          .addOption(CardSetSourceMode.SEARCH, '검색')
          .addOption(CardSetSourceMode.STARRED, '즐겨찾기')
          .setValue(this.plugin.settings.defaultMode)
          .onChange(async value => {
            try {
              this.plugin.settings.defaultMode = value as CardSetSourceMode;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
              throw error;
            }
          });
      });

    // 마크다운 렌더링 설정
    containerEl.createEl('h3', { text: '마크다운 렌더링 설정' });

    // 코드 하이라이팅
    new Setting(containerEl)
      .setName('코드 하이라이팅')
      .setDesc('코드 블록의 구문 강조를 활성화합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.markdown.renderOptions.highlightCode ?? false)
          .onChange(async value => {
            try {
              this.plugin.settings.markdown.renderOptions.highlightCode = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 이미지 렌더링
    new Setting(containerEl)
      .setName('이미지 렌더링')
      .setDesc('마크다운 이미지를 렌더링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.markdown.renderOptions.renderImages ?? false)
          .onChange(async value => {
            try {
              this.plugin.settings.markdown.renderOptions.renderImages = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 수학 수식 렌더링
    new Setting(containerEl)
      .setName('수학 수식 렌더링')
      .setDesc('LaTeX 수학 수식을 렌더링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.markdown.renderOptions.renderMath ?? false)
          .onChange(async value => {
            try {
              this.plugin.settings.markdown.renderOptions.renderMath = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 링크 렌더링
    new Setting(containerEl)
      .setName('링크 렌더링')
      .setDesc('마크다운 링크를 클릭 가능한 링크로 렌더링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.markdown.renderOptions.renderLinks ?? false)
          .onChange(async value => {
            try {
              this.plugin.settings.markdown.renderOptions.renderLinks = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 콜아웃 렌더링
    new Setting(containerEl)
      .setName('콜아웃 렌더링')
      .setDesc('마크다운 콜아웃을 렌더링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.markdown.renderOptions.renderCallouts ?? false)
          .onChange(async value => {
            try {
              this.plugin.settings.markdown.renderOptions.renderCallouts = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 카드 표시 설정
    containerEl.createEl('h3', { text: '카드 표시 설정' });

    // 헤더 콘텐츠 선택
    new Setting(containerEl)
      .setName('헤더 콘텐츠')
      .setDesc('카드 헤더에 표시할 내용을 선택하거나 템플릿을 입력합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('title', '제목')
          .addOption('filename', '파일명')
          .addOption('firstheader', '첫 번째 헤더')
          .addOption('path', '경로')
          .addOption('custom', '커스텀 템플릿')
          .setValue(this.plugin.settings.cardDisplay.headerContent ?? 'title')
          .onChange(async value => {
            try {
              if (value === 'custom') {
                const template = await this.promptForTemplate('헤더');
                if (template) {
                  this.plugin.settings.cardDisplay.headerContent = template;
                }
              } else {
                this.plugin.settings.cardDisplay.headerContent = value;
              }
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 본문 콘텐츠 선택
    new Setting(containerEl)
      .setName('본문 콘텐츠')
      .setDesc('카드 본문에 표시할 내용을 선택하거나 템플릿을 입력합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('content', '전체 내용')
          .addOption('firstheader', '첫 번째 헤더')
          .addOption('frontmatter', '프론트매터')
          .addOption('custom', '커스텀 템플릿')
          .setValue(this.plugin.settings.cardDisplay.bodyContent ?? 'content')
          .onChange(async value => {
            try {
              if (value === 'custom') {
                const template = await this.promptForTemplate('본문');
                if (template) {
                  this.plugin.settings.cardDisplay.bodyContent = template;
                }
              } else {
                this.plugin.settings.cardDisplay.bodyContent = value;
              }
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 푸터 콘텐츠 선택
    new Setting(containerEl)
      .setName('푸터 콘텐츠')
      .setDesc('카드 푸터에 표시할 내용을 선택하거나 템플릿을 입력합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('tags', '태그')
          .addOption('created', '생성일')
          .addOption('modified', '수정일')
          .addOption('path', '경로')
          .addOption('custom', '커스텀 템플릿')
          .setValue(this.plugin.settings.cardDisplay.footerContent ?? 'tags')
          .onChange(async value => {
            try {
              if (value === 'custom') {
                const template = await this.promptForTemplate('푸터');
                if (template) {
                  this.plugin.settings.cardDisplay.footerContent = template;
                }
              } else {
                this.plugin.settings.cardDisplay.footerContent = value;
              }
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 날짜 형식 설정
    containerEl.createEl('h4', { text: '날짜 형식 설정' });

    // 상대적 시간 표시
    new Setting(containerEl)
      .setName('상대적 시간 표시')
      .setDesc('날짜를 "n일 전"과 같은 형식으로 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.cardDisplay.dateFormat?.useRelativeTime ?? false)
          .onChange(async value => {
            try {
              if (!this.plugin.settings.cardDisplay.dateFormat) {
                this.plugin.settings.cardDisplay.dateFormat = {
                  format: 'YYYY-MM-DD HH:mm:ss',
                  locale: 'ko-KR',
                  useRelativeTime: false
                };
              }
              this.plugin.settings.cardDisplay.dateFormat.useRelativeTime = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 프론트매터 형식 설정
    containerEl.createEl('h4', { text: '프론트매터 형식 설정' });

    // 프론트매터 표시 형식
    new Setting(containerEl)
      .setName('프론트매터 표시 형식')
      .setDesc('프론트매터를 표시할 형식을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('list', '목록')
          .addOption('table', '테이블')
          .addOption('inline', '인라인')
          .setValue(this.plugin.settings.cardDisplay.frontmatterFormat?.format ?? 'list')
          .onChange(async value => {
            try {
              if (!this.plugin.settings.cardDisplay.frontmatterFormat) {
                this.plugin.settings.cardDisplay.frontmatterFormat = {
                  fields: [],
                  labels: {},
                  separator: ' | ',
                  format: 'list'
                };
              }
              this.plugin.settings.cardDisplay.frontmatterFormat.format = value as 'list' | 'table' | 'inline';
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 프론트매터 구분자
    new Setting(containerEl)
      .setName('프론트매터 구분자')
      .setDesc('인라인 형식에서 사용할 구분자를 입력합니다.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.cardDisplay.frontmatterFormat?.separator ?? ' | ')
          .onChange(async value => {
            try {
              if (!this.plugin.settings.cardDisplay.frontmatterFormat) {
                this.plugin.settings.cardDisplay.frontmatterFormat = {
                  fields: [],
                  labels: {},
                  separator: ' | ',
                  format: 'list'
                };
              }
              this.plugin.settings.cardDisplay.frontmatterFormat.separator = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
            }
          });
      });

    // 레이아웃 모드 설정
    new Setting(containerEl)
      .setName('레이아웃 모드')
      .setDesc('레이아웃 모드를 설정합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('grid', '그리드')
          .addOption('masonry', '메이슨리')
          .setValue(this.plugin.settings.layout.type)
          .onChange(async value => {
            try {
              this.plugin.settings.layout.type = value as 'grid' | 'masonry';
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
              throw error;
            }
          });
      });

    // 카드 너비 설정
    new Setting(containerEl)
      .setName('카드 너비')
      .setDesc('카드의 너비를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.layout.cardWidth.toString())
          .onChange(async value => {
            try {
              this.plugin.settings.layout.cardWidth = parseInt(value);
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
              throw error;
            }
          });
      });

    // 카드 높이 설정
    new Setting(containerEl)
      .setName('카드 높이')
      .setDesc('카드의 높이를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.layout.cardHeight.toString())
          .onChange(async value => {
            try {
              this.plugin.settings.layout.cardHeight = parseInt(value);
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
              throw error;
            }
          });
      });

    // 카드 배경색 설정
    new Setting(containerEl)
      .setName('카드 배경색')
      .setDesc('카드의 배경색을 설정합니다.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.style.card.normal.background)
          .onChange(async value => {
            try {
              this.plugin.settings.style.card.normal.background = value;
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
              throw error;
            }
          });
      });

    // 카드 글꼴 크기 설정
    new Setting(containerEl)
      .setName('카드 글꼴 크기')
      .setDesc('카드의 글꼴 크기를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.style.card.normal.fontSize.toString())
          .onChange(async value => {
            try {
              this.plugin.settings.style.card.normal.fontSize = parseInt(value);
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.SETTINGS_UPDATED, {
                settings: this.plugin.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.SETTINGS_SAVE_FAILED, {
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
              throw error;
            }
          });
      });

    // 프리셋 저장 버튼
    new Setting(containerEl)
      .setName('프리셋 저장')
      .setDesc('현재 설정을 프리셋으로 저장합니다.')
      .addButton(button => {
        button
          .setButtonText('프리셋 저장')
          .onClick(async () => {
            try {
              const preset: IPreset = {
                id: Date.now().toString(),
                name: '현재 설정',
                description: '현재 설정을 저장한 프리셋입니다.',
                settings: {
                  defaultMode: this.plugin.settings.defaultMode,
                  cardDisplay: this.plugin.settings.cardDisplay,
                  layout: this.plugin.settings.layout,
                  style: {
                    card: this.plugin.settings.style.card
                  }
                }
              };
              this.plugin.settings.presets.push(preset);
              await this.plugin.saveSettings();
              this.eventBus.publish(EventType.PRESET_SAVED, {
                preset: preset.name,
                settings: preset.settings
              }, 'SettingTab');
            } catch (error) {
              this.errorBus.publish(ErrorCode.PRESET_SAVE_FAILED, {
                preset: '현재 설정',
                settings: this.plugin.settings,
                cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
              });
              throw error;
            }
          });
      });

    // 프리셋 목록
    this.plugin.settings.presets.forEach((preset: IPreset) => {
      new Setting(containerEl)
        .setName(preset.name)
        .setDesc('프리셋을 적용하거나 삭제합니다.')
        .addButton(button => {
          button
            .setButtonText('적용')
            .onClick(async () => {
              try {
                const newSettings = new CardNavigatorSettings();
                newSettings.defaultMode = preset.settings.defaultMode;
                newSettings.cardDisplay = preset.settings.cardDisplay;
                newSettings.layout = preset.settings.layout;
                newSettings.style = preset.settings.style;
                newSettings.presets = this.plugin.settings.presets;
                this.plugin.settings = newSettings;
                await this.plugin.saveSettings();
                this.eventBus.publish(EventType.PRESET_APPLIED, {
                  preset: preset.name,
                  settings: preset.settings
                }, 'SettingTab');
                this.display();
              } catch (error) {
                this.errorBus.publish(ErrorCode.PRESET_APPLY_FAILED, {
                  preset: preset.name,
                  settings: preset.settings,
                  cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
                });
                throw error;
              }
            });
        })
        .addButton(button => {
          button
            .setButtonText('삭제')
            .onClick(async () => {
              try {
                this.plugin.settings.presets = this.plugin.settings.presets.filter((p: IPreset) => p.name !== preset.name);
                await this.plugin.saveSettings();
                this.eventBus.publish(EventType.PRESET_DELETED, {
                  preset: preset.name
                }, 'SettingTab');
                this.display();
              } catch (error) {
                this.errorBus.publish(ErrorCode.PRESET_DELETE_FAILED, {
                  preset: preset.name,
                  cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
                });
                throw error;
              }
            });
        });
    });
  }

  /**
   * 템플릿 입력을 위한 프롬프트를 표시합니다.
   */
  private async promptForTemplate(section: string): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new TemplateModal(
        this.app,
        '',
        (template) => {
          resolve(template);
        }
      );
      modal.open();
    });
  }
} 