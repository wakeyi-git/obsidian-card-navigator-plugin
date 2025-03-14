import { Setting } from 'obsidian';
import { SettingSection } from './SettingSection';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { NavigationMode } from '../../domain/navigation';

/**
 * 카드 상호작용 설정 섹션
 * 카드 상호작용 관련 설정을 관리합니다.
 */
export class CardInteractionSection extends SettingSection {
  /**
   * 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    containerEl: HTMLElement,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    super(containerEl, settingsService, eventBus);
  }

  /**
   * 설정 UI 표시
   */
  displayContent(): void {
    const { containerEl } = this;
    const settings = this.settingsService.getSettings();

    containerEl.empty();
    
    // 섹션 제목
    containerEl.createEl('h3', { text: '상호작용 설정' });
    containerEl.createEl('p', { 
      text: '상호작용 관련 설정을 구성합니다. 네비게이션 모드, 선택 모드, 드래그 모드 등을 설정할 수 있습니다.',
      cls: 'setting-item-description'
    });
    
    // 네비게이션 모드 설정
    new Setting(containerEl)
      .setName('네비게이션 모드')
      .setDesc('카드 네비게이션 모드를 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('grid', '그리드 모드')
        .addOption('linear', '리스트 모드')
        .setValue(settings.navigationMode || 'grid')
        .onChange(async (value: string) => {
          await this.settingsService.updateSettings({ 
            navigationMode: value as NavigationMode 
          });
        })
      );
    
    // 선택 모드 설정
    new Setting(containerEl)
      .setName('선택 모드')
      .setDesc('카드 선택 모드를 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('single', '단일 선택')
        .addOption('multiple', '다중 선택')
        .setValue(settings.selectionMode || 'single')
        .onChange(async (value: string) => {
          await this.settingsService.updateSettings({ 
            selectionMode: value as 'single' | 'multiple' 
          });
        })
      );
    
    // 드래그 모드 설정
    new Setting(containerEl)
      .setName('드래그 모드')
      .setDesc('카드 드래그 모드를 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('move', '이동')
        .addOption('copy', '복사')
        .setValue(settings.dragMode || 'none')
        .onChange(async (value: string) => {
          await this.settingsService.updateSettings({ 
            dragMode: value as 'none' | 'move' | 'copy' 
          });
        })
      );
    
    // 클릭 액션 설정
    new Setting(containerEl)
      .setName('클릭 액션')
      .setDesc('카드 클릭 시 동작을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('select', '선택')
        .addOption('open', '열기')
        .addOption('preview', '미리보기')
        .setValue(settings.clickAction || 'select')
        .onChange(async (value: string) => {
          await this.settingsService.updateSettings({ 
            clickAction: value as 'select' | 'open' | 'preview' 
          });
        })
      );
    
    // 더블 클릭 액션 설정
    new Setting(containerEl)
      .setName('더블 클릭 액션')
      .setDesc('카드 더블 클릭 시 동작을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('open', '열기')
        .addOption('preview', '미리보기')
        .addOption('none', '없음')
        .setValue(settings.doubleClickAction || 'open')
        .onChange(async (value: string) => {
          await this.settingsService.updateSettings({ 
            doubleClickAction: value as 'open' | 'preview' | 'none' 
          });
        })
      );
    
    // 우클릭 액션 설정
    new Setting(containerEl)
      .setName('우클릭 액션')
      .setDesc('카드 우클릭 시 동작을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('menu', '메뉴')
        .addOption('select', '선택')
        .addOption('none', '없음')
        .setValue(settings.rightClickAction || 'menu')
        .onChange(async (value: string) => {
          await this.settingsService.updateSettings({ 
            rightClickAction: value as 'menu' | 'select' | 'none' 
          });
        })
      );
    
    // 호버 효과 설정
    new Setting(containerEl)
      .setName('호버 효과')
      .setDesc('카드 호버 시 효과를 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('highlight', '하이라이트')
        .addOption('zoom', '확대')
        .addOption('none', '없음')
        .setValue(settings.hoverEffect || 'highlight')
        .onChange(async (value: string) => {
          await this.settingsService.updateSettings({ 
            hoverEffect: value as 'highlight' | 'zoom' | 'none' 
          });
        })
      );
    
    // 키보드 네비게이션 설정
    new Setting(containerEl)
      .setName('키보드 네비게이션')
      .setDesc('키보드로 카드 네비게이션을 활성화합니다.')
      .addToggle(toggle => toggle
        .setValue(settings.enableKeyboardNavigation !== false)
        .onChange(async (value: boolean) => {
          await this.settingsService.updateSettings({ enableKeyboardNavigation: value });
        })
      );
    
    // 자동 포커스 설정
    new Setting(containerEl)
      .setName('자동 포커스')
      .setDesc('카드 세트 로드 시 첫 번째 카드에 자동으로 포커스합니다.')
      .addToggle(toggle => toggle
        .setValue(settings.autoFocus !== false)
        .onChange(async (value: boolean) => {
          await this.settingsService.updateSettings({ autoFocus: value });
        })
      );
  }
} 