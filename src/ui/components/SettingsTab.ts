import { App, PluginSettingTab, Setting } from 'obsidian';
import { CardSet, CardSetType, ICardSetConfig } from '@/domain/models/CardSet';
import { Layout } from '@/domain/models/Layout';
import { Preset } from '@/domain/models/Preset';
import { ICardRenderConfig } from '@/domain/models/Card';
import { PresetEditModal } from '@/ui/components/modals/PresetEditModal';
import { PresetImportExportModal } from '@/ui/components/modals/PresetImportExportModal';
import { CardSettings } from '@/ui/settings/components/CardSettings';

/**
 * 카드 내비게이터 설정 인터페이스
 */
export interface ICardNavigatorSettings {
  // 카드셋 설정
  defaultCardSetType: CardSetType;
  includeSubfolders: boolean;
  linkLevel: number;

  // 카드 설정
  cardRenderConfig: ICardRenderConfig;
  cardStyle: {
    card: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    activeCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    focusedCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    header: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    body: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    footer: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
  };

  // 정렬 설정
  sortBy: ICardSetConfig['sortBy'];
  sortOrder: ICardSetConfig['sortOrder'];
  customSortField?: string;

  // 레이아웃 설정
  layout: {
    fixedHeight: boolean;
    minCardWidth: number;
    minCardHeight: number;
  };

  // 프리셋 설정
  presets: Preset[];
  folderPresets: Map<string, string>; // 폴더 경로 -> 프리셋 ID
  tagPresets: Map<string, string>; // 태그 -> 프리셋 ID
  presetPriority: string[]; // 프리셋 우선순위 (폴더/태그 ID)
}

/**
 * 카드 내비게이터 설정 탭
 */
export class CardNavigatorSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: any,
    private readonly settings: ICardNavigatorSettings
  ) {
    super(app, plugin);
  }

  /**
   * 설정 표시
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // settings가 없으면 기본값으로 초기화
    if (!this.plugin.settings) {
      this.plugin.settings = {
        defaultCardSetType: 'folder',
        includeSubfolders: true,
        linkLevel: 1,
        cardRenderConfig: {
          header: {
            showFileName: true,
            showFirstHeader: true,
            showTags: true,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            renderMarkdown: true
          },
          body: {
            showFileName: false,
            showFirstHeader: false,
            showContent: true,
            showTags: false,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            contentLength: 200,
            renderMarkdown: true
          },
          footer: {
            showFileName: false,
            showFirstHeader: false,
            showTags: false,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            renderMarkdown: true
          },
          renderAsHtml: true
        },
        cardStyle: {
          card: {
            background: 'var(--background-secondary)',
            fontSize: '14px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          },
          activeCard: {
            background: 'var(--background-modifier-hover)',
            fontSize: '14px',
            borderColor: 'var(--interactive-accent)',
            borderWidth: '2px'
          },
          focusedCard: {
            background: 'var(--background-modifier-hover)',
            fontSize: '14px',
            borderColor: 'var(--interactive-accent)',
            borderWidth: '2px'
          },
          header: {
            background: 'var(--background-secondary)',
            fontSize: '14px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          },
          body: {
            background: 'var(--background-primary)',
            fontSize: '14px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          },
          footer: {
            background: 'var(--background-secondary)',
            fontSize: '12px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          }
        },
        sortBy: 'fileName',
        sortOrder: 'asc',
        layout: {
          fixedHeight: false,
          minCardWidth: 300,
          minCardHeight: 200
        },
        presets: [],
        folderPresets: new Map(),
        tagPresets: new Map(),
        presetPriority: []
      };
      this.plugin.saveData();
    }

    // cardRenderConfig가 없으면 기본값으로 초기화
    if (!this.plugin.settings.cardRenderConfig) {
      this.plugin.settings.cardRenderConfig = {
        header: {
          showFileName: true,
          showFirstHeader: true,
          showTags: true,
          showCreatedDate: false,
          showUpdatedDate: false,
          showProperties: [],
          renderMarkdown: true
        },
        body: {
          showFileName: false,
          showFirstHeader: false,
          showContent: true,
          showTags: false,
          showCreatedDate: false,
          showUpdatedDate: false,
          showProperties: [],
          contentLength: 200,
          renderMarkdown: true
        },
        footer: {
          showFileName: false,
          showFirstHeader: false,
          showTags: false,
          showCreatedDate: false,
          showUpdatedDate: false,
          showProperties: [],
          renderMarkdown: true
        },
        renderAsHtml: true
      };
      this.plugin.saveData();
    }

    // cardStyle이 없으면 기본값으로 초기화
    if (!this.plugin.settings.cardStyle) {
      this.plugin.settings.cardStyle = {
        card: {
          background: 'var(--background-secondary)',
          fontSize: '14px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        },
        activeCard: {
          background: 'var(--background-modifier-hover)',
          fontSize: '14px',
          borderColor: 'var(--interactive-accent)',
          borderWidth: '2px'
        },
        focusedCard: {
          background: 'var(--background-modifier-hover)',
          fontSize: '14px',
          borderColor: 'var(--interactive-accent)',
          borderWidth: '2px'
        },
        header: {
          background: 'var(--background-secondary)',
          fontSize: '14px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        },
        body: {
          background: 'var(--background-primary)',
          fontSize: '14px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        },
        footer: {
          background: 'var(--background-secondary)',
          fontSize: '12px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        }
      };
      this.plugin.saveData();
    }

    // layout이 없으면 기본값으로 초기화
    if (!this.plugin.settings.layout) {
      this.plugin.settings.layout = {
        fixedHeight: false,
        minCardWidth: 300,
        minCardHeight: 200
      };
      this.plugin.saveData();
    }

    // presets이 없으면 빈 배열로 초기화
    if (!this.plugin.settings.presets) {
      this.plugin.settings.presets = [];
      this.plugin.saveData();
    }

    // folderPresets이 없으면 빈 Map으로 초기화
    if (!this.plugin.settings.folderPresets) {
      this.plugin.settings.folderPresets = new Map();
      this.plugin.saveData();
    }

    // tagPresets이 없으면 빈 Map으로 초기화
    if (!this.plugin.settings.tagPresets) {
      this.plugin.settings.tagPresets = new Map();
      this.plugin.saveData();
    }

    // presetPriority가 없으면 빈 배열로 초기화
    if (!this.plugin.settings.presetPriority) {
      this.plugin.settings.presetPriority = [];
      this.plugin.saveData();
    }

    // 카드셋 설정
    new Setting(containerEl)
      .setName('카드셋 설정')
      .setHeading();

    new Setting(containerEl)
      .setName('기본 카드셋 타입')
      .setDesc('새 카드셋을 생성할 때 사용할 기본 타입을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('folder', '폴더')
          .addOption('tag', '태그')
          .addOption('link', '링크')
          .setValue(this.plugin.settings.defaultCardSetType)
          .onChange(value => {
            this.plugin.settings.defaultCardSetType = value as CardSetType;
            this.plugin.saveData();
          });
      });

    new Setting(containerEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 카드셋에서 하위 폴더의 노트도 포함합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.includeSubfolders)
          .onChange(value => {
            this.plugin.settings.includeSubfolders = value;
            this.plugin.saveData();
          });
      });

    new Setting(containerEl)
      .setName('링크 레벨')
      .setDesc('링크 카드셋에서 탐색할 링크의 깊이를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 5, 1)
          .setValue(this.plugin.settings.linkLevel)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.settings.linkLevel = value;
            this.plugin.saveData();
          });
      });

    // 카드 설정
    this._addCardSettings(containerEl);

    // 정렬 설정
    new Setting(containerEl)
      .setName('정렬 설정')
      .setHeading();

    new Setting(containerEl)
      .setName('정렬 기준')
      .addDropdown(dropdown => {
        dropdown
          .addOption('fileName', '파일명')
          .addOption('firstHeader', '첫 번째 헤더')
          .addOption('createdAt', '생성일')
          .addOption('updatedAt', '수정일')
          .addOption('custom', '사용자 지정')
          .setValue(this.plugin.settings.sortBy)
          .onChange(async (value: 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom') => {
            this.plugin.settings.sortBy = value;
            if (value === 'custom') {
              this._showCustomSortField();
            } else {
              this._hideCustomSortField();
            }
            this.plugin.saveData();
          });
      });

    new Setting(containerEl)
      .setName('정렬 순서')
      .addDropdown(dropdown => {
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(this.plugin.settings.sortOrder)
          .onChange(async (value: 'asc' | 'desc') => {
            this.plugin.settings.sortOrder = value;
            this.plugin.saveData();
          });
      });

    if (this.plugin.settings.sortBy === 'custom') {
      this._showCustomSortField();
    }

    // 레이아웃 설정
    new Setting(containerEl)
      .setName('레이아웃 설정')
      .setHeading();

    new Setting(containerEl)
      .setName('카드 높이 고정')
      .setDesc('카드의 높이를 고정하여 그리드 레이아웃을 사용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.layout.fixedHeight)
          .onChange(value => {
            this.plugin.settings.layout.fixedHeight = value;
            this.plugin.saveData();
          });
      });

    new Setting(containerEl)
      .setName('최소 카드 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(200, 800, 50)
          .setValue(this.plugin.settings.layout.minCardWidth)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.settings.layout.minCardWidth = value;
            this.plugin.saveData();
          });
      });

    new Setting(containerEl)
      .setName('최소 카드 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(200, 800, 50)
          .setValue(this.plugin.settings.layout.minCardHeight)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.settings.layout.minCardHeight = value;
            this.plugin.saveData();
          });
      });

    // 프리셋 설정
    new Setting(containerEl)
      .setName('프리셋 설정')
      .setHeading();

    this._addPresetSettings(containerEl);
  }

  /**
   * 카드 설정 추가
   */
  private _addCardSettings(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('카드 설정')
      .setHeading();

    new CardSettings(containerEl, this.plugin);
  }

  /**
   * 프리셋 설정 추가
   */
  private _addPresetSettings(containerEl: HTMLElement): void {
    // 프리셋 목록
    new Setting(containerEl)
      .setName('프리셋 목록')
      .setHeading();

    this.plugin.settings.presets.forEach((preset: Preset) => {
      const setting = new Setting(containerEl)
        .setName(preset.name)
        .setDesc(preset.description || '');

      // 편집 버튼
      setting.addButton(button => {
        button
          .setButtonText('편집')
          .onClick(() => {
            new PresetEditModal(this.app, preset, (updatedPreset) => {
              const index = this.plugin.settings.presets.findIndex((p: Preset) => p.id === preset.id);
              if (index !== -1) {
                this.plugin.settings.presets[index] = updatedPreset;
                this.plugin.saveData();
                this.display();
              }
            }).open();
          });
      });

      // 삭제 버튼
      setting.addButton(button => {
        button
          .setButtonText('삭제')
          .setWarning()
          .onClick(() => {
            if (confirm('이 프리셋을 삭제하시겠습니까?')) {
              const index = this.plugin.settings.presets.findIndex((p: Preset) => p.id === preset.id);
              if (index !== -1) {
                this.plugin.settings.presets.splice(index, 1);
                this.plugin.saveData();
                this.display();
              }
            }
          });
      });
    });

    // 프리셋 생성 버튼
    new Setting(containerEl)
      .addButton(button => {
        button
          .setButtonText('프리셋 생성')
          .onClick(() => {
            this._handleCreatePreset();
          });
      });

    // 프리셋 가져오기/내보내기 버튼
    new Setting(containerEl)
      .addButton(button => {
        button
          .setButtonText('프리셋 가져오기')
          .onClick(() => {
            new PresetImportExportModal(this.app, this.plugin.settings.presets, (presets) => {
              this.plugin.settings.presets.push(...presets);
              this.plugin.saveData();
              this.display();
            }).open();
          });
      })
      .addButton(button => {
        button
          .setButtonText('프리셋 내보내기')
          .onClick(() => {
            new PresetImportExportModal(this.app, this.plugin.settings.presets, () => {}).open();
          });
      });

    // 폴더 프리셋
    new Setting(containerEl)
      .setName('폴더 프리셋')
      .setHeading();

    this.plugin.settings.folderPresets.forEach((presetId: string, folderPath: string) => {
      const preset = this.plugin.settings.presets.find((p: Preset) => p.id === presetId);
      if (!preset) return;

      new Setting(containerEl)
        .setName(folderPath)
        .setDesc(preset.name)
        .addDropdown(dropdown => {
          this.plugin.settings.presets.forEach((p: Preset) => {
            dropdown.addOption(p.id, p.name);
          });
          dropdown.setValue(presetId);
          dropdown.onChange(value => {
            this.plugin.settings.folderPresets.set(folderPath, value);
            this.plugin.saveData();
          });
        });
    });

    // 태그 프리셋
    new Setting(containerEl)
      .setName('태그 프리셋')
      .setHeading();

    this.plugin.settings.tagPresets.forEach((presetId: string, tag: string) => {
      const preset = this.plugin.settings.presets.find((p: Preset) => p.id === presetId);
      if (!preset) return;

      new Setting(containerEl)
        .setName(tag)
        .setDesc(preset.name)
        .addDropdown(dropdown => {
          this.plugin.settings.presets.forEach((p: Preset) => {
            dropdown.addOption(p.id, p.name);
          });
          dropdown.setValue(presetId);
          dropdown.onChange(value => {
            this.plugin.settings.tagPresets.set(tag, value);
            this.plugin.saveData();
          });
        });
    });

    // 프리셋 우선순위
    new Setting(containerEl)
      .setName('프리셋 우선순위')
      .setHeading();

    this.plugin.settings.presetPriority.forEach((id: string, index: number) => {
      const preset = this.plugin.settings.presets.find((p: Preset) => p.id === id);
      if (!preset) return;

      new Setting(containerEl)
        .setName(preset.name)
        .addButton(button => {
          button
            .setButtonText('위로')
            .setDisabled(index === 0)
            .onClick(() => {
              const temp = this.plugin.settings.presetPriority[index];
              this.plugin.settings.presetPriority[index] = this.plugin.settings.presetPriority[index - 1];
              this.plugin.settings.presetPriority[index - 1] = temp;
              this.plugin.saveData();
              this.display();
            });
        })
        .addButton(button => {
          button
            .setButtonText('아래로')
            .setDisabled(index === this.plugin.settings.presetPriority.length - 1)
            .onClick(() => {
              const temp = this.plugin.settings.presetPriority[index];
              this.plugin.settings.presetPriority[index] = this.plugin.settings.presetPriority[index + 1];
              this.plugin.settings.presetPriority[index + 1] = temp;
              this.plugin.saveData();
              this.display();
            });
        });
    });
  }

  private _handleCreatePreset(): void {
    const preset = new Preset(
      crypto.randomUUID(),
      {
        name: '새 프리셋',
        description: '',
        cardSetConfig: {
          type: 'folder',
          value: '',
          includeSubfolders: true,
          sortBy: this.plugin.settings.sortBy || 'fileName',
          sortOrder: this.plugin.settings.sortOrder || 'asc'
        },
        layoutConfig: {
          type: 'grid',
          cardWidth: 300,
          cardHeight: 200,
          gap: 10,
          padding: 20,
          viewportWidth: 800,
          viewportHeight: 600
        },
        cardRenderConfig: {
          header: {
            showFileName: true,
            showFirstHeader: true,
            showTags: true,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            renderMarkdown: true
          },
          body: {
            showFileName: false,
            showFirstHeader: false,
            showContent: true,
            showTags: false,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            contentLength: 200,
            renderMarkdown: true
          },
          footer: {
            showFileName: false,
            showFirstHeader: false,
            showTags: false,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            renderMarkdown: true
          },
          renderAsHtml: true
        },
        mappings: []
      }
    );

    this.plugin.settings.presets.push(preset);
    this.plugin.saveData();
    this.display();
  }

  /**
   * 프리셋 목록 새로고침
   */
  private _refreshPresetList(): void {
    this.display();
  }

  private _showCustomSortField(): void {
    new Setting(this.containerEl)
      .setName('사용자 지정 정렬 필드')
      .setDesc('frontmatter에서 사용할 필드명을 입력하세요.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.customSortField || '')
          .onChange(async (value: string) => {
            this.plugin.settings.customSortField = value || undefined;
            this.plugin.saveData();
          });
      });
  }

  private _hideCustomSortField(): void {
    // 사용자 지정 정렬 필드 설정을 숨깁니다.
    const customSortFieldSetting = this.containerEl.querySelector('.setting-item:has(input[type="text"])');
    if (customSortFieldSetting) {
      customSortFieldSetting.remove();
    }
  }
} 