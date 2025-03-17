import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { DomainEventBus } from '../core/events/DomainEventBus';
import { EventType } from '../core/events/EventTypes';
import { DomainErrorBus } from '../core/errors/DomainErrorBus';
import { ErrorCode } from '../core/errors/ErrorTypes';
import { ICardDisplaySettings } from '../domain/card/Card';
import { ICardStyle } from '../domain/card/Card';
import { LayoutOptions } from '../domain/layout/Layout';
import { IPreset, CardNavigatorSettings } from '../domain/settings/Settings';

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
          .addOption('folder', '폴더')
          .addOption('tag', '태그')
          .setValue(this.plugin.settings.defaultMode)
          .onChange(async value => {
            try {
              this.plugin.settings.defaultMode = value as 'folder' | 'tag';
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

    // 카드 표시 설정
    new Setting(containerEl)
      .setName('카드 표시')
      .setDesc('카드에 표시할 내용을 설정합니다.')
      .addTextArea(text => {
        text
          .setValue(this.plugin.settings.cardDisplay.headerContent)
          .onChange(async value => {
            try {
              this.plugin.settings.cardDisplay.headerContent = value;
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

    // 카드 본문 설정
    new Setting(containerEl)
      .setName('카드 본문')
      .setDesc('카드 본문에 표시할 내용을 설정합니다.')
      .addTextArea(text => {
        text
          .setValue(this.plugin.settings.cardDisplay.bodyContent)
          .onChange(async value => {
            try {
              this.plugin.settings.cardDisplay.bodyContent = value;
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

    // 카드 푸터 설정
    new Setting(containerEl)
      .setName('카드 푸터')
      .setDesc('카드 푸터에 표시할 내용을 설정합니다.')
      .addTextArea(text => {
        text
          .setValue(this.plugin.settings.cardDisplay.footerContent)
          .onChange(async value => {
            try {
              this.plugin.settings.cardDisplay.footerContent = value;
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

    // 레이아웃 모드 설정
    new Setting(containerEl)
      .setName('레이아웃 모드')
      .setDesc('레이아웃 모드를 설정합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('grid', '그리드')
          .addOption('masonry', '메이슨리')
          .setValue(this.plugin.settings.layout.mode)
          .onChange(async value => {
            try {
              this.plugin.settings.layout.mode = value as 'grid' | 'masonry';
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
          .setValue(this.plugin.settings.style.card.backgroundColor)
          .onChange(async value => {
            try {
              this.plugin.settings.style.card.backgroundColor = value;
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
          .setValue(this.plugin.settings.style.card.fontSize.toString())
          .onChange(async value => {
            try {
              this.plugin.settings.style.card.fontSize = parseInt(value);
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
} 