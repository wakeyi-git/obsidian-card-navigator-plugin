import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { PresetMappingType } from '@/domain/models/Preset';
import { ServiceContainer } from '@/application/services/SettingsService';
import type { ISettingsService } from '@/application/services/SettingsService';
import type { IFolderPresetMapping, ITagPresetMapping, IDatePresetMapping, IPropertyPresetMapping } from '@/domain/models/PresetConfig';

/**
 * 프리셋 설정 섹션
 */
export class PresetSettingsSection {
  private settingsService: ISettingsService;
  private listeners: (() => void)[] = [];

  constructor(private plugin: CardNavigatorPlugin) {
    // 설정 서비스 가져오기
    this.settingsService = ServiceContainer.getInstance().resolve<ISettingsService>('ISettingsService');
    
    // 설정 변경 감지
    this.listeners.push(
      this.settingsService.onSettingsChanged(() => {
        // 설정이 변경되면 필요한 UI 업데이트 수행 가능
      })
    );
  }

  /**
   * 프리셋 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '프리셋 설정' });

    const settings = this.settingsService.getSettings();

    // 기본 프리셋
    new Setting(containerEl)
      .setName('기본 프리셋')
      .setDesc('카드 내비게이터를 열 때 사용할 기본 프리셋을 선택합니다.')
      .addText(text =>
        text
          .setValue(settings.preset.presetGeneral?.globalPreset || '')
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('preset.presetGeneral.globalPreset', value);
          }));

    // 자동 프리셋 적용
    new Setting(containerEl)
      .setName('자동 프리셋 적용')
      .setDesc('파일을 열 때 자동으로 프리셋을 적용합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.preset.presetGeneral?.autoApplyPreset?.applyGlobalPreset || false)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('preset.presetGeneral.autoApplyPreset.applyGlobalPreset', value);
          }));

    // 우선 순위 태그
    new Setting(containerEl)
      .setName('우선 순위 태그')
      .setDesc('우선 순위가 높은 태그를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(settings.sort.priorityTags?.join(', ') || '')
          .onChange(async (value) => {
            const tags = value.split(',').map(tag => tag.trim());
            await this.settingsService.updateNestedSettings('sort.priorityTags', tags);
          }));

    // 우선 순위 폴더
    new Setting(containerEl)
      .setName('우선 순위 폴더')
      .setDesc('우선 순위가 높은 폴더를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(settings.sort.priorityFolders?.join(', ') || '')
          .onChange(async (value) => {
            const folders = value.split(',').map(folder => folder.trim());
            await this.settingsService.updateNestedSettings('sort.priorityFolders', folders);
          }));

    // 프리셋 매핑 섹션
    containerEl.createEl('h4', { text: '프리셋 매핑' });

    // 폴더 매핑
    new Setting(containerEl)
      .setName('폴더 매핑')
      .setDesc('폴더별 프리셋 매핑을 설정합니다. (폴더 경로:프리셋 이름)')
      .addTextArea(text => {
        const folderMappings = settings.preset.presetGeneral?.folderPresetMappings as IFolderPresetMapping[] || [];
        text
          .setValue(folderMappings.map((m: IFolderPresetMapping) => `${m.folderPath || ''}:${m.presetId || ''}`).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [folder, preset] = line.split(':').map(s => s.trim());
                return { folderPath: folder, presetId: preset, priority: 0 };
              })
              .filter(m => m.folderPath && m.presetId) as IFolderPresetMapping[];
            
            await this.settingsService.updateNestedSettings('preset.presetGeneral.folderPresetMappings', mappings);
          });
        return text;
      });

    // 태그 매핑
    new Setting(containerEl)
      .setName('태그 매핑')
      .setDesc('태그별 프리셋 매핑을 설정합니다. (태그:프리셋 이름)')
      .addTextArea(text => {
        const tagMappings = settings.preset.presetGeneral?.tagPresetMappings as ITagPresetMapping[] || [];
        text
          .setValue(tagMappings.map((m: ITagPresetMapping) => `${m.tag || ''}:${m.presetId || ''}`).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [tag, preset] = line.split(':').map(s => s.trim());
                return { tag, presetId: preset, priority: 0 };
              })
              .filter(m => m.tag && m.presetId) as ITagPresetMapping[];
            
            await this.settingsService.updateNestedSettings('preset.presetGeneral.tagPresetMappings', mappings);
          });
        return text;
      });

    // 날짜 매핑
    new Setting(containerEl)
      .setName('날짜 매핑')
      .setDesc('날짜별 프리셋 매핑을 설정합니다. (시작일-종료일:프리셋 이름)')
      .addTextArea(text => {
        const dateMappings = settings.preset.presetGeneral?.datePresetMappings as IDatePresetMapping[] || [];
        text
          .setValue(dateMappings.map((m: IDatePresetMapping) => `${m.startDate || ''}-${m.endDate || ''}:${m.presetId || ''}`).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [dates, preset] = line.split(':').map(s => s.trim());
                const [startDate, endDate] = dates.split('-').map(d => d.trim());
                return { startDate, endDate, presetId: preset, priority: 0 };
              })
              .filter(m => m.startDate && m.endDate && m.presetId) as IDatePresetMapping[];
            
            await this.settingsService.updateNestedSettings('preset.presetGeneral.datePresetMappings', mappings);
          });
        return text;
      });

    // 속성 매핑
    new Setting(containerEl)
      .setName('속성 매핑')
      .setDesc('속성별 프리셋 매핑을 설정합니다. (속성명=속성값:프리셋 이름)')
      .addTextArea(text => {
        const propertyMappings = settings.preset.presetGeneral?.propertyPresetMappings as IPropertyPresetMapping[] || [];
        text
          .setValue(propertyMappings.map((m: IPropertyPresetMapping) => `${m.property || ''}=${m.value || ''}:${m.presetId || ''}`).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [property, preset] = line.split(':').map(s => s.trim());
                const [name, value] = property.split('=').map(p => p.trim());
                return { property: name, value, presetId: preset, priority: 0 };
              })
              .filter(m => m.property && m.value && m.presetId) as IPropertyPresetMapping[];
            
            await this.settingsService.updateNestedSettings('preset.presetGeneral.propertyPresetMappings', mappings);
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
} 