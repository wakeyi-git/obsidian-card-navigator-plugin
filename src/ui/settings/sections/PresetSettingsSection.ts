import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/ISettingsService';
import { IPreset, IPresetMapping, PresetMappingType } from '@/domain/models/Preset';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 프리셋 설정 섹션
 */
export class PresetSettingsSection {
  private settingsService: ISettingsService;
  private listeners: (() => void)[] = [];
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    
    // 설정 변경 감지
    this.listeners.push(
      this.settingsService.onSettingsChanged(() => {
        // 설정이 변경되면 필요한 UI 업데이트 수행 가능
      })
    );

    this.eventDispatcher = eventDispatcher;
  }

  /**
   * 프리셋 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '프리셋 설정' });

    const settings = this.settingsService.getSettings();
    const preset = settings.presetConfig as unknown as IPreset;

    // 기본 프리셋
    new Setting(containerEl)
      .setName('기본 프리셋')
      .setDesc('카드 내비게이터를 열 때 사용할 기본 프리셋을 선택합니다.')
      .addText(text =>
        text
          .setValue(preset.mappings.find(m => m.type === PresetMappingType.GLOBAL)?.value || '')
          .onChange(async (value) => {
            const globalMapping = preset.mappings.find(m => m.type === PresetMappingType.GLOBAL);
            if (globalMapping) {
              await this.settingsService.updateNestedSettings('presetConfig.mappings', [
                ...preset.mappings.filter(m => m.type !== PresetMappingType.GLOBAL),
                { ...globalMapping, value }
              ]);
            } else {
              await this.settingsService.updateNestedSettings('presetConfig.mappings', [
                ...preset.mappings,
                {
                  id: `global-${Date.now()}`,
                  type: PresetMappingType.GLOBAL,
                  value,
                  priority: 0
                }
              ]);
            }
          }));

    // 자동 프리셋 적용
    new Setting(containerEl)
      .setName('자동 프리셋 적용')
      .setDesc('파일을 열 때 자동으로 프리셋을 적용합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(preset.mappings.some(m => m.type === PresetMappingType.GLOBAL))
          .onChange(async (value) => {
            if (value) {
              const globalMapping = preset.mappings.find(m => m.type === PresetMappingType.GLOBAL);
              if (!globalMapping) {
                await this.settingsService.updateNestedSettings('presetConfig.mappings', [
                  ...preset.mappings,
                  {
                    id: `global-${Date.now()}`,
                    type: PresetMappingType.GLOBAL,
                    value: '',
                    priority: 0
                  }
                ]);
              }
            } else {
              await this.settingsService.updateNestedSettings('presetConfig.mappings', 
                preset.mappings.filter(m => m.type !== PresetMappingType.GLOBAL)
              );
            }
          }));

    // 우선 순위 태그
    new Setting(containerEl)
      .setName('우선 순위 태그')
      .setDesc('우선 순위가 높은 태그를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(settings.cardSetConfig.filterConfig.priorityTags?.join(', ') || '')
          .onChange(async (value) => {
            const tags = value.split(',').map(tag => tag.trim());
            await this.settingsService.updateNestedSettings('cardSetConfig.filterConfig.priorityTags', tags);
          }));

    // 우선 순위 폴더
    new Setting(containerEl)
      .setName('우선 순위 폴더')
      .setDesc('우선 순위가 높은 폴더를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(settings.cardSetConfig.filterConfig.priorityFolders?.join(', ') || '')
          .onChange(async (value) => {
            const folders = value.split(',').map(folder => folder.trim());
            await this.settingsService.updateNestedSettings('cardSetConfig.filterConfig.priorityFolders', folders);
          }));

    // 프리셋 매핑 섹션
    containerEl.createEl('h4', { text: '프리셋 매핑' });

    // 폴더 매핑
    new Setting(containerEl)
      .setName('폴더 매핑')
      .setDesc('폴더별 프리셋 매핑을 설정합니다. (폴더 경로:프리셋 이름)')
      .addTextArea(text => {
        const folderMappings = preset.mappings.filter(m => m.type === PresetMappingType.FOLDER);
        text
          .setValue(folderMappings.map(m => `${m.value}:${m.options?.includeSubfolders || false}`).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [path, includeSubfolders] = line.split(':').map(s => s.trim());
                return {
                  id: `folder-${Date.now()}`,
                  type: PresetMappingType.FOLDER,
                  value: path,
                  priority: 0,
                  options: {
                    includeSubfolders: includeSubfolders === 'true'
                  }
                } as IPresetMapping;
              })
              .filter(m => m.value);
            
            await this.settingsService.updateNestedSettings('presetConfig.mappings', [
              ...preset.mappings.filter(m => m.type !== PresetMappingType.FOLDER),
              ...mappings
            ]);
          });
        return text;
      });

    // 태그 매핑
    new Setting(containerEl)
      .setName('태그 매핑')
      .setDesc('태그별 프리셋 매핑을 설정합니다. (태그:프리셋 이름)')
      .addTextArea(text => {
        const tagMappings = preset.mappings.filter(m => m.type === PresetMappingType.TAG);
        text
          .setValue(tagMappings.map(m => m.value).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(tag => ({
                id: `tag-${Date.now()}`,
                type: PresetMappingType.TAG,
                value: tag.trim(),
                priority: 0
              } as IPresetMapping))
              .filter(m => m.value);
            
            await this.settingsService.updateNestedSettings('presetConfig.mappings', [
              ...preset.mappings.filter(m => m.type !== PresetMappingType.TAG),
              ...mappings
            ]);
          });
        return text;
      });

    // 날짜 매핑
    new Setting(containerEl)
      .setName('날짜 매핑')
      .setDesc('날짜별 프리셋 매핑을 설정합니다. (시작일-종료일:프리셋 이름)')
      .addTextArea(text => {
        const dateMappings = preset.mappings.filter(m => m.type === PresetMappingType.DATE);
        text
          .setValue(dateMappings.map(m => 
            `${m.options?.dateRange?.start.toISOString()}-${m.options?.dateRange?.end.toISOString()}`
          ).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [start, end] = line.split('-').map(d => d.trim());
                return {
                  id: `date-${Date.now()}`,
                  type: PresetMappingType.DATE,
                  value: '',
                  priority: 0,
                  options: {
                    dateRange: {
                      start: new Date(start),
                      end: new Date(end)
                    }
                  }
                } as IPresetMapping;
              })
              .filter(m => m.options?.dateRange?.start && m.options?.dateRange?.end);
            
            await this.settingsService.updateNestedSettings('presetConfig.mappings', [
              ...preset.mappings.filter(m => m.type !== PresetMappingType.DATE),
              ...mappings
            ]);
          });
        return text;
      });

    // 속성 매핑
    new Setting(containerEl)
      .setName('속성 매핑')
      .setDesc('속성별 프리셋 매핑을 설정합니다. (속성명=속성값:프리셋 이름)')
      .addTextArea(text => {
        const propertyMappings = preset.mappings.filter(m => m.type === PresetMappingType.PROPERTY);
        text
          .setValue(propertyMappings.map(m => 
            `${m.options?.property?.name}=${m.options?.property?.value}`
          ).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [name, value] = line.split('=').map(p => p.trim());
                return {
                  id: `property-${Date.now()}`,
                  type: PresetMappingType.PROPERTY,
                  value: '',
                  priority: 0,
                  options: {
                    property: {
                      name,
                      value
                    }
                  }
                } as IPresetMapping;
              })
              .filter(m => m.options?.property?.name && m.options?.property?.value);
            
            await this.settingsService.updateNestedSettings('presetConfig.mappings', [
              ...preset.mappings.filter(m => m.type !== PresetMappingType.PROPERTY),
              ...mappings
            ]);
          });
        return text;
      });
  }
  
  /**
   * 컴포넌트 정리
   */
  destroy(): void {
    // 이벤트 리스너 정리
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }

  updatePreset(oldPreset: IPreset | null, newPreset: IPreset | null): void {
    this.eventDispatcher.dispatch(
      new DomainEvent(DomainEventType.PRESET_SETTINGS_SECTION_CHANGED, {
        oldPreset,
        newPreset
      })
    );
  }
} 