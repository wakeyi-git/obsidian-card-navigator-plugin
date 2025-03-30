import { App, Setting, Modal, SuggestModal, TFile } from 'obsidian';
import { Preset, IPreset, IPresetConfig, IPresetMapping, PresetType } from '@/domain/models/Preset';
import { IPresetService } from '@/domain/services/IPresetService';
import { PresetEditModal } from '@/ui/components/modals/PresetEditModal';
import { PresetImportExportModal } from '@/ui/components/modals/PresetImportExportModal';
import { LayoutType, LayoutDirection } from '@/domain/models/Layout';
import { IPluginWithSettings } from '@/ui/settings/SettingsTab';

/**
 * 프리셋 설정 컴포넌트
 */
export class PresetSettings {
  private presets: IPreset[] = [];
  private selectedPreset: IPreset | null = null;

  constructor(
    private readonly containerEl: HTMLElement,
    private readonly app: App,
    private readonly plugin: IPluginWithSettings,
    private readonly presetService: IPresetService
  ) {}

  /**
   * 설정 UI 표시
   */
  async display(): Promise<void> {
    await this.render();
  }

  /**
   * 설정 UI 렌더링
   */
  async render(): Promise<void> {
    this.containerEl.empty();
    await this.loadPresets();

    // 프리셋 설정
    new Setting(this.containerEl)
    .setName('프리셋 설정')
    .setHeading();

    // 프리셋 목록
    new Setting(this.containerEl)
      .setName('프리셋 목록')
      .setDesc('프리셋을 선택하여 설정을 관리합니다.')
      .addDropdown(dropdown => {
        this.presets.forEach(preset => {
          dropdown.addOption(preset.id, preset.name);
        });

        dropdown.onChange(async (value) => {
          this.selectedPreset = this.presets.find(p => p.id === value) || null;
          await this.renderPresetSettings();
        });
      });

    // 프리셋 관리 버튼
    new Setting(this.containerEl)
      .setName('프리셋 관리')
      .setDesc('프리셋을 생성, 수정, 삭제합니다.')
      .addButton(button => {
        button
          .setButtonText('새 프리셋')
          .onClick(async () => {
            const newPreset = new Preset(
              crypto.randomUUID(),
              '새 프리셋',
              '',
              {
                type: 'folder',
                value: '',
                includeSubfolders: true,
                sortBy: 'fileName',
                sortOrder: 'asc'
              },
              {
                type: LayoutType.GRID,
                direction: LayoutDirection.VERTICAL,
                fixedHeight: true,
                minCardWidth: 200,
                minCardHeight: 150,
                cardWidth: 200,
                cardHeight: 150,
                gap: 16,
                padding: 16,
                viewportWidth: 800,
                viewportHeight: 600
              },
              {
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
              []
            );
            const modal = new PresetEditModal(this.app, newPreset, async (config: IPresetConfig) => {
              await this.presetService.createPreset(
                config.name,
                config.description || '',
                config.cardSetConfig,
                config.layoutConfig,
                config.cardRenderConfig
              );
              await this.render();
            });
            modal.open();
          });
      })
      .addButton(button => {
        const btn = button
          .setButtonText('수정')
          .setDisabled(!this.selectedPreset)
          .onClick(async () => {
            if (!this.selectedPreset) return;
            const preset = new Preset(
              this.selectedPreset.id,
              this.selectedPreset.name,
              this.selectedPreset.description,
              this.selectedPreset.cardSetConfig,
              this.selectedPreset.layoutConfig,
              this.selectedPreset.cardRenderConfig,
              this.selectedPreset.mappings
            );
            const modal = new PresetEditModal(this.app, preset, async (config: IPresetConfig) => {
              const updatedPreset = new Preset(
                this.selectedPreset!.id,
                config.name,
                config.description,
                config.cardSetConfig,
                config.layoutConfig,
                config.cardRenderConfig,
                config.mappings
              );
              await this.presetService.updatePreset(updatedPreset);
              await this.render();
            });
            modal.open();
          });
      })
      .addButton(button => {
        const btn = button
          .setButtonText('복제')
          .setDisabled(!this.selectedPreset)
          .onClick(async () => {
            if (!this.selectedPreset) return;
            const config = {
              name: `${this.selectedPreset.name} (복사본)`,
              description: this.selectedPreset.description,
              cardSetConfig: this.selectedPreset.cardSetConfig,
              layoutConfig: this.selectedPreset.layoutConfig,
              cardRenderConfig: this.selectedPreset.cardRenderConfig,
              mappings: this.selectedPreset.mappings
            };
            await this.presetService.createPreset(
              config.name,
              config.description || '',
              config.cardSetConfig,
              config.layoutConfig,
              config.cardRenderConfig
            );
            await this.render();
          });
      })
      .addButton(button => {
        const btn = button
          .setButtonText('삭제')
          .setDisabled(!this.selectedPreset)
          .onClick(async () => {
            if (!this.selectedPreset) return;
            await this.presetService.deletePreset(this.selectedPreset.id);
            await this.render();
          });
      });

    // 프리셋 가져오기/내보내기
    new Setting(this.containerEl)
      .setName('프리셋 가져오기/내보내기')
      .setDesc('프리셋을 JSON 파일로 가져오거나 내보냅니다.')
      .addButton(button => {
        button
          .setButtonText('가져오기/내보내기')
          .onClick(async () => {
            const presets = await this.presetService.getAllPresets();
            const modal = new PresetImportExportModal(
              this.app,
              presets,
              async (presets: IPreset[]) => {
                for (const preset of presets) {
                  await this.presetService.createPreset(
                    preset.name,
                    preset.description || '',
                    preset.cardSetConfig,
                    preset.layoutConfig,
                    preset.cardRenderConfig
                  );
                }
                await this.render();
              }
            );
            modal.open();
          });
      });

    // 선택된 프리셋 설정
    if (this.selectedPreset) {
      await this.renderPresetSettings();
    }
  }

  /**
   * 프리셋 설정 UI 렌더링
   */
  private async renderPresetSettings(): Promise<void> {
    if (!this.selectedPreset) return;

    // 폴더 매핑
    new Setting(this.containerEl)
      .setName('폴더 매핑')
      .setDesc('폴더별 프리셋 매핑을 관리합니다.')
      .addButton(button => {
        button
          .setButtonText('폴더 추가')
          .onClick(async () => {
            const modal = new FolderSuggestModal(this.app, async (folder: string) => {
              const mapping: IPresetMapping = {
                id: crypto.randomUUID(),
                type: PresetType.FOLDER,
                value: folder,
                includeSubfolders: true
              };
              await this.presetService.addFolderMapping(folder, this.selectedPreset!.id, true);
              await this.renderPresetSettings();
            });
            modal.open();
          });
      });

    const folderMappings = this.selectedPreset.mappings.filter(m => m.type === PresetType.FOLDER);
    folderMappings.forEach((mapping: IPresetMapping) => {
      new Setting(this.containerEl)
        .setName(mapping.value)
        .setDesc('하위 폴더 포함')
        .addToggle(toggle => {
          toggle
            .setValue(mapping.includeSubfolders || false)
            .onChange(async (value) => {
              await this.presetService.updateFolderMapping(mapping.value, this.selectedPreset!.id, value);
            });
        })
        .addButton(button => {
          button
            .setButtonText('삭제')
            .onClick(async () => {
              const preset = new Preset(
                this.selectedPreset!.id,
                this.selectedPreset!.name,
                this.selectedPreset!.description,
                this.selectedPreset!.cardSetConfig,
                this.selectedPreset!.layoutConfig,
                this.selectedPreset!.cardRenderConfig,
                this.selectedPreset!.mappings.filter(m => m.id !== mapping.id)
              );
              await this.presetService.updatePreset(preset);
              await this.renderPresetSettings();
            });
        });
    });

    // 태그 매핑
    new Setting(this.containerEl)
      .setName('태그 매핑')
      .setDesc('태그별 프리셋 매핑을 관리합니다.')
      .addButton(button => {
        button
          .setButtonText('태그 추가')
          .onClick(async () => {
            const modal = new TagSuggestModal(this.app, async (tag: string) => {
              await this.presetService.addTagMapping(tag, this.selectedPreset!.id);
              await this.renderPresetSettings();
            });
            modal.open();
          });
      });

    const tagMappings = this.selectedPreset.mappings.filter(m => m.type === PresetType.TAG);
    tagMappings.forEach((mapping: IPresetMapping) => {
      new Setting(this.containerEl)
        .setName(mapping.value)
        .addButton(button => {
          button
            .setButtonText('삭제')
            .onClick(async () => {
              const preset = new Preset(
                this.selectedPreset!.id,
                this.selectedPreset!.name,
                this.selectedPreset!.description,
                this.selectedPreset!.cardSetConfig,
                this.selectedPreset!.layoutConfig,
                this.selectedPreset!.cardRenderConfig,
                this.selectedPreset!.mappings.filter(m => m.id !== mapping.id)
              );
              await this.presetService.updatePreset(preset);
              await this.renderPresetSettings();
            });
        });
    });

    // 날짜 매핑
    new Setting(this.containerEl)
      .setName('날짜 매핑')
      .setDesc('날짜별 프리셋 매핑을 관리합니다.')
      .addButton(button => {
        button
          .setButtonText('날짜 범위 추가')
          .onClick(async () => {
            const modal = new DateRangeModal(this.app, async (range: { start: Date; end: Date }) => {
              const mapping: IPresetMapping = {
                id: crypto.randomUUID(),
                type: PresetType.DATE,
                value: JSON.stringify(range)
              };
              const preset = new Preset(
                this.selectedPreset!.id,
                this.selectedPreset!.name,
                this.selectedPreset!.description,
                this.selectedPreset!.cardSetConfig,
                this.selectedPreset!.layoutConfig,
                this.selectedPreset!.cardRenderConfig,
                [...this.selectedPreset!.mappings, mapping]
              );
              await this.presetService.updatePreset(preset);
              await this.renderPresetSettings();
            });
            modal.open();
          });
      });

    const dateMappings = this.selectedPreset.mappings.filter(m => m.type === PresetType.DATE);
    dateMappings.forEach((mapping: IPresetMapping) => {
      if (mapping.dateRange) {
        new Setting(this.containerEl)
          .setName(`${mapping.dateRange.start.toLocaleDateString()} - ${mapping.dateRange.end.toLocaleDateString()}`)
          .addButton(button => {
            button
              .setButtonText('삭제')
              .onClick(async () => {
                const preset = new Preset(
                  this.selectedPreset!.id,
                  this.selectedPreset!.name,
                  this.selectedPreset!.description,
                  this.selectedPreset!.cardSetConfig,
                  this.selectedPreset!.layoutConfig,
                  this.selectedPreset!.cardRenderConfig,
                  this.selectedPreset!.mappings.filter(m => m.id !== mapping.id)
                );
                await this.presetService.updatePreset(preset);
                await this.renderPresetSettings();
              });
          });
      }
    });

    // 속성 매핑
    new Setting(this.containerEl)
      .setName('속성 매핑')
      .setDesc('속성별 프리셋 매핑을 관리합니다.')
      .addButton(button => {
        button
          .setButtonText('속성 추가')
          .onClick(async () => {
            const modal = new PropertyMappingModal(this.app, async (property: { name: string; value: string }) => {
              const mapping: IPresetMapping = {
                id: crypto.randomUUID(),
                type: PresetType.PROPERTY,
                value: JSON.stringify(property)
              };
              const preset = new Preset(
                this.selectedPreset!.id,
                this.selectedPreset!.name,
                this.selectedPreset!.description,
                this.selectedPreset!.cardSetConfig,
                this.selectedPreset!.layoutConfig,
                this.selectedPreset!.cardRenderConfig,
                [...this.selectedPreset!.mappings, mapping]
              );
              await this.presetService.updatePreset(preset);
              await this.renderPresetSettings();
            });
            modal.open();
          });
      });

    const propertyMappings = this.selectedPreset.mappings.filter(m => m.type === PresetType.PROPERTY);
    propertyMappings.forEach((mapping: IPresetMapping) => {
      if (mapping.property) {
        new Setting(this.containerEl)
          .setName(`${mapping.property.name} = ${mapping.property.value}`)
          .addButton(button => {
            button
              .setButtonText('삭제')
              .onClick(async () => {
                const preset = new Preset(
                  this.selectedPreset!.id,
                  this.selectedPreset!.name,
                  this.selectedPreset!.description,
                  this.selectedPreset!.cardSetConfig,
                  this.selectedPreset!.layoutConfig,
                  this.selectedPreset!.cardRenderConfig,
                  this.selectedPreset!.mappings.filter(m => m.id !== mapping.id)
                );
                await this.presetService.updatePreset(preset);
                await this.renderPresetSettings();
              });
          });
      }
    });

    // 매핑 우선순위
    new Setting(this.containerEl)
      .setName('매핑 우선순위')
      .setDesc('매핑의 우선순위를 조정합니다.')
      .addButton(button => {
        button
          .setButtonText('우선순위 정렬')
          .onClick(async () => {
            const mappings = this.selectedPreset!.mappings.map(m => ({
              type: m.type === PresetType.FOLDER ? 'folder' as const : 'tag' as const,
              key: m.value,
              priority: m.priority || 0
            }));
            await this.presetService.updateMappingPriority(mappings);
            await this.renderPresetSettings();
          });
      });
  }

  /**
   * 프리셋 목록 로드
   */
  private async loadPresets(): Promise<void> {
    this.presets = await this.presetService.getAllPresets();
  }

  private async _refreshFolderMappingList(): Promise<void> {
    const container = this.containerEl.querySelector('.preset-mappings') as HTMLElement;
    container.empty();

    const presets = await this.presetService.getAllPresets();
    for (const preset of presets) {
      const folderMappings = preset.mappings.filter(m => m.type === PresetType.FOLDER);
      if (folderMappings.length > 0) {
        const presetEl = container.createDiv('preset-mappings');
        presetEl.createEl('h4', { text: preset.name });

        for (const mapping of folderMappings) {
          const mappingEl = presetEl.createDiv('mapping-item');
          mappingEl.createSpan({ text: `${mapping.value} (하위 폴더 포함: ${mapping.includeSubfolders ? '예' : '아니오'})` });
          
          // 매핑 제거 버튼
          mappingEl.createEl('button', { text: '제거' })
            .addEventListener('click', async () => {
              await this.presetService.removeFolderMapping(mapping.value);
              await this._refreshFolderMappingList();
            });
        }
      }
    }
  }

  private async _refreshTagMappingList(): Promise<void> {
    const container = this.containerEl.querySelector('.preset-mappings') as HTMLElement;
    container.empty();

    const presets = await this.presetService.getAllPresets();
    for (const preset of presets) {
      const tagMappings = preset.mappings.filter(m => m.type === PresetType.TAG);
      if (tagMappings.length > 0) {
        const presetEl = container.createDiv('preset-mappings');
        presetEl.createEl('h4', { text: preset.name });

        for (const mapping of tagMappings) {
          const mappingEl = presetEl.createDiv('mapping-item');
          mappingEl.createSpan({ text: mapping.value });
          
          // 매핑 제거 버튼
          mappingEl.createEl('button', { text: '제거' })
            .addEventListener('click', async () => {
              await this.presetService.removeTagMapping(mapping.value);
              await this._refreshTagMappingList();
            });
        }
      }
    }
  }

  private async _updateMappingPriority(): Promise<void> {
    const folderMappings = this.containerEl.querySelectorAll('.mapping-item');
    const tagMappings = this.containerEl.querySelectorAll('.mapping-item');
    
    const mappings = [
      ...Array.from(folderMappings).map((el, index) => ({
        type: 'folder' as const,
        key: el.querySelector('span')?.textContent?.split(' ')[0] || '',
        priority: index
      })),
      ...Array.from(tagMappings).map((el, index) => ({
        type: 'tag' as const,
        key: el.querySelector('span')?.textContent || '',
        priority: index
      }))
    ];

    await this.presetService.updateMappingPriority(mappings);
  }
}

/**
 * 폴더 선택 모달
 */
class FolderSuggestModal extends SuggestModal<string> {
  private onSubmit: (value: string) => void;

  constructor(app: App, onSubmit: (value: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  getSuggestions(query: string): string[] {
    const folders = this.app.vault.getAllLoadedFiles()
      .filter(file => file.path.endsWith('/'))
      .map(file => file.path);
    return folders.filter(folder => 
      folder.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(folder: string, el: HTMLElement): void {
    el.createEl('div', { text: folder });
  }

  onChooseItem(folder: string): void {
    this.onSubmit(folder);
  }

  onChooseSuggestion(folder: string): void {
    this.onSubmit(folder);
  }
}

/**
 * 태그 선택 모달
 */
class TagSuggestModal extends SuggestModal<string> {
  private onSubmit: (value: string) => void;

  constructor(app: App, onSubmit: (value: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  async getSuggestions(query: string): Promise<string[]> {
    const tags = new Set<string>();
    const files = this.app.vault.getAllLoadedFiles();
    for (const file of files) {
      const content = this.app.vault.getAbstractFileByPath(file.path);
      if (content instanceof TFile) {
        const fileContent = await this.app.vault.read(content);
        const matches = fileContent.match(/#[\w-]+/g) || [];
        matches.forEach((tag: string) => tags.add(tag));
      }
    }
    return Array.from(tags)
      .filter(tag => tag.toLowerCase().includes(query.toLowerCase()));
  }

  renderSuggestion(tag: string, el: HTMLElement): void {
    el.createEl('div', { text: tag });
  }

  onChooseItem(tag: string): void {
    this.onSubmit(tag);
  }

  onChooseSuggestion(tag: string): void {
    this.onSubmit(tag);
  }
}

/**
 * 날짜 범위 선택 모달
 */
class DateRangeModal extends Modal {
  private onSubmit: (range: { start: Date; end: Date }) => void;
  private startDate: string = '';
  private endDate: string = '';

  constructor(app: App, onSubmit: (range: { start: Date; end: Date }) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl)
      .setName('시작일')
      .addText(text => {
        text.inputEl.type = 'date';
        text.onChange(value => this.startDate = value);
      });

    new Setting(contentEl)
      .setName('종료일')
      .addText(text => {
        text.inputEl.type = 'date';
        text.onChange(value => this.endDate = value);
      });

    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText('확인')
          .onClick(() => {
            if (this.startDate && this.endDate) {
              this.onSubmit({
                start: new Date(this.startDate),
                end: new Date(this.endDate)
              });
              this.close();
            }
          });
      });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

/**
 * 속성 매핑 모달
 */
class PropertyMappingModal extends Modal {
  private onSubmit: (property: { name: string; value: string }) => void;
  private propertyName: string = '';
  private propertyValue: string = '';

  constructor(app: App, onSubmit: (property: { name: string; value: string }) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl)
      .setName('속성 이름')
      .addText(text => {
        text.onChange(value => this.propertyName = value);
      });

    new Setting(contentEl)
      .setName('속성 값')
      .addText(text => {
        text.onChange(value => this.propertyValue = value);
      });

    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText('확인')
          .onClick(() => {
            if (this.propertyName && this.propertyValue) {
              this.onSubmit({
                name: this.propertyName,
                value: this.propertyValue
              });
              this.close();
            }
          });
      });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
} 