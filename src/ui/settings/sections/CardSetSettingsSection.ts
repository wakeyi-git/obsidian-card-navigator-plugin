import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardSetType } from '@/domain/models/CardSet';
import { FolderSuggestModal } from '@/ui/modals/FolderSuggestModal';
import { TagSuggestModal } from '@/ui/modals/TagSuggestModal';
import { Container } from '@/infrastructure/di/Container';
import { CardNavigatorViewModel } from '@/ui/viewModels/CardNavigatorViewModel';
import { ServiceContainer } from '@/application/services/SettingsService';
import type { ISettingsService } from '@/application/services/SettingsService';

/**
 * 카드셋 설정 섹션
 */
export class CardSetSettingsSection {
  private viewModel: CardNavigatorViewModel;
  private settingsService: ISettingsService;
  private refreshTimerId: number | null = null;
  private readonly DEBOUNCE_TIMEOUT = 300; // 300ms 디바운싱
  private listeners: (() => void)[] = [];

  constructor(private plugin: CardNavigatorPlugin) {
    // 카드 내비게이터 뷰모델 가져오기
    this.viewModel = Container.getInstance().resolve<CardNavigatorViewModel>('ICardNavigatorViewModel');
    
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
   * 카드셋 설정이 변경되었을 때 현재 활성화된 카드셋 갱신 (디바운싱 적용)
   */
  private async refreshCurrentCardSet(): Promise<void> {
    try {
      // 기존 타이머가 있으면 취소
      if (this.refreshTimerId !== null) {
        window.clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      
      // 디바운싱 적용된 갱신 함수 호출
      this.refreshTimerId = window.setTimeout(async () => {
        try {
          const settings = this.settingsService.getSettings();
          const cardSetType = settings.defaultCardSetType as CardSetType;
          let criteria = '';

          // 카드셋 타입에 따라 기준 설정
          if (cardSetType === CardSetType.FOLDER) {
            const folderSetMode = settings.folderSetMode || 'active';
            if (folderSetMode === 'fixed') {
              criteria = settings.fixedFolderPath || '/';
            } else {
              // 활성 파일 폴더 모드일 경우 현재 활성화된 카드셋의 기준 재사용
              const currentCardSet = this.viewModel.getCurrentCardSet();
              if (currentCardSet && currentCardSet.type === CardSetType.FOLDER) {
                criteria = currentCardSet.criteria;
              }
            }
          } else if (cardSetType === CardSetType.TAG) {
            const tagSetMode = settings.tagSetMode || 'active';
            if (tagSetMode === 'fixed') {
              criteria = settings.fixedTag || '';
            } else {
              // 활성 태그 모드일 경우 현재 활성화된 카드셋의 기준 재사용
              const currentCardSet = this.viewModel.getCurrentCardSet();
              if (currentCardSet && currentCardSet.type === CardSetType.TAG) {
                criteria = currentCardSet.criteria;
              }
            }
          } else if (cardSetType === CardSetType.LINK) {
            // 링크 타입일 경우 현재 활성화된 카드셋의 기준 재사용
            const currentCardSet = this.viewModel.getCurrentCardSet();
            if (currentCardSet && currentCardSet.type === CardSetType.LINK) {
              criteria = currentCardSet.criteria;
            }
          }

          // 기준이 제대로 설정된 경우에만 카드셋 갱신
          if (criteria) {
            await this.viewModel.createCardSet(cardSetType, criteria);
          }
          
          // 타이머 초기화
          this.refreshTimerId = null;
        } catch (error) {
          console.error('카드셋 갱신 실패:', error);
          this.refreshTimerId = null;
        }
      }, this.DEBOUNCE_TIMEOUT);
    } catch (error) {
      console.error('카드셋 갱신 디바운싱 설정 실패:', error);
    }
  }

  /**
   * 카드셋 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '카드셋 설정' });

    // CSS 스타일 추가
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .card-navigator-folder-settings,
      .card-navigator-tag-settings,
      .card-navigator-link-settings {
        display: none;
        margin-left: 0.5em;
        border-left: 1px solid var(--background-modifier-border);
        padding-left: 1em;
      }
      
      .card-navigator-folder-settings.is-visible,
      .card-navigator-tag-settings.is-visible,
      .card-navigator-link-settings.is-visible {
        display: block;
      }
      
      .card-navigator-browse-button {
        margin-left: 0.5em;
        font-size: 0.9em;
        padding: 3px 6px;
      }
    `;
    containerEl.appendChild(styleEl);

    const settings = this.settingsService.getSettings();

    // 기본 카드셋 타입 선택
    new Setting(containerEl)
      .setName('기본 카드셋 타입')
      .setDesc('카드 내비게이터를 열 때 사용할 기본 카드셋 타입을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(CardSetType.FOLDER, '폴더')
          .addOption(CardSetType.TAG, '태그')
          .addOption(CardSetType.LINK, '링크')
          .setValue(settings.defaultCardSetType || CardSetType.FOLDER)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsService.updateCardSetType(value as CardSetType);
            
            // 카드셋 타입에 따라 관련 설정 영역 표시/숨김
            this.updateCardSetVisibility(containerEl, value as CardSetType);
            
            // 설정 변경 시 카드셋 즉시 갱신 (디바운싱 적용)
            await this.refreshCurrentCardSet();
          }));

    // 폴더 카드셋 설정 섹션
    const folderSettingsEl = containerEl.createDiv({ cls: 'card-navigator-folder-settings' });
    folderSettingsEl.createEl('h4', { text: '폴더 카드셋 설정' });

    // 폴더 카드셋 모드
    new Setting(folderSettingsEl)
      .setName('폴더 카드셋 모드')
      .setDesc('폴더 카드셋의 동작 방식을 선택합니다.')
      .addDropdown(dropdown => 
        dropdown
          .addOption('active', '활성 폴더 (활성 파일의 폴더)')
          .addOption('fixed', '고정 폴더 (지정한 폴더)')
          .setValue(settings.folderSetMode || 'active')
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsService.updateNestedSettings('folderSetMode', value as 'active' | 'fixed');
            
            // 고정 폴더 입력 필드 표시/숨김
            const fixedFolderSetting = folderSettingsEl.querySelector('.card-navigator-fixed-folder-setting');
            if (fixedFolderSetting) {
              (fixedFolderSetting as any).style.display = value === 'fixed' ? 'block' : 'none';
            }
            
            // 폴더 카드셋이 현재 활성화된 경우에만 즉시 갱신
            if (settings.defaultCardSetType === CardSetType.FOLDER) {
              await this.refreshCurrentCardSet();
            }
          }));
    
    // 고정 폴더 경로 설정
    const fixedFolderSetting = new Setting(folderSettingsEl)
      .setClass('card-navigator-fixed-folder-setting')
      .setName('고정 폴더 경로')
      .setDesc('카드를 표시할 고정 폴더의 경로를 지정합니다.')
      .addText(text => {
        text.setValue(settings.fixedFolderPath || '')
            .setPlaceholder('예: 폴더/하위폴더')
            .onChange(async (value) => {
              // 설정 업데이트
              await this.settingsService.updateNestedSettings('fixedFolderPath', value);
              
              // 폴더 카드셋이 현재 활성화되고, 고정 폴더 모드인 경우에만 즉시 갱신
              const currentSettings = this.settingsService.getSettings();
              if (currentSettings.defaultCardSetType === CardSetType.FOLDER &&
                  currentSettings.folderSetMode === 'fixed') {
                await this.refreshCurrentCardSet();
              }
            });
        
        // 폴더 선택 버튼 추가
        text.inputEl.style.width = 'calc(100% - 40px)';
        const browseButton = createEl('button', {
          text: '찾기',
          cls: 'card-navigator-browse-button'
        });
        
        browseButton.addEventListener('click', () => {
          const modal = new FolderSuggestModal(this.plugin.app);
          
          // 선택 이벤트 처리
          modal.onChoose = async (folder: string) => {
            // 텍스트 필드 업데이트
            text.setValue(folder);
            
            // 설정 업데이트
            await this.settingsService.updateNestedSettings('fixedFolderPath', folder);
            
            // 폴더 선택 시 즉시 카드셋 갱신
            const currentSettings = this.settingsService.getSettings();
            if (currentSettings.defaultCardSetType === CardSetType.FOLDER &&
                currentSettings.folderSetMode === 'fixed') {
              await this.refreshCurrentCardSet();
            }
          };
          
          modal.open();
        });
        
        // TextComponent의 containerEl에 접근
        const parentEl = text.inputEl.parentElement;
        if (parentEl) {
          parentEl.appendChild(browseButton);
        }
        
        return text;
      });
    
    // 고정 폴더 설정 초기 표시 여부
    fixedFolderSetting.settingEl.style.display = 
      (settings.folderSetMode === 'fixed') ? 'block' : 'none';

    // 하위 폴더 포함 설정
    new Setting(folderSettingsEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 카드셋에서 하위 폴더의 노트도 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.includeSubfolders !== undefined ? settings.includeSubfolders : true)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsService.updateNestedSettings('includeSubfolders', value);
            
            // 폴더 카드셋이 현재 활성화된 경우에만 즉시 갱신
            const currentSettings = this.settingsService.getSettings();
            if (currentSettings.defaultCardSetType === CardSetType.FOLDER) {
              await this.refreshCurrentCardSet();
            }
          }));
    
    // 태그 카드셋 설정 섹션
    const tagSettingsEl = containerEl.createDiv({ cls: 'card-navigator-tag-settings' });
    tagSettingsEl.createEl('h4', { text: '태그 카드셋 설정' });
    
    // 태그 카드셋 모드
    new Setting(tagSettingsEl)
      .setName('태그 카드셋 모드')
      .setDesc('태그 카드셋의 동작 방식을 선택합니다.')
      .addDropdown(dropdown => 
        dropdown
          .addOption('active', '활성 태그 (활성 파일의 태그)')
          .addOption('fixed', '고정 태그 (지정한 태그)')
          .setValue(settings.tagSetMode || 'active')
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsService.updateNestedSettings('tagSetMode', value as 'active' | 'fixed');
            
            // 고정 태그 입력 필드 표시/숨김
            const fixedTagSetting = tagSettingsEl.querySelector('.card-navigator-fixed-tag-setting');
            if (fixedTagSetting) {
              (fixedTagSetting as any).style.display = value === 'fixed' ? 'block' : 'none';
            }
            
            // 태그 카드셋이 현재 활성화된 경우에만 즉시 갱신
            const currentSettings = this.settingsService.getSettings();
            if (currentSettings.defaultCardSetType === CardSetType.TAG) {
              await this.refreshCurrentCardSet();
            }
          }));
    
    // 고정 태그 설정
    const fixedTagSetting = new Setting(tagSettingsEl)
      .setClass('card-navigator-fixed-tag-setting')
      .setName('고정 태그')
      .setDesc('카드를 표시할 고정 태그를 지정합니다.')
      .addText(text => {
        text.setValue(settings.fixedTag || '')
            .setPlaceholder('예: #태그명')
            .onChange(async (value) => {
              // 설정 업데이트
              await this.settingsService.updateNestedSettings('fixedTag', value);
              
              // 태그 카드셋이 현재 활성화되고, 고정 태그 모드인 경우에만 즉시 갱신
              const currentSettings = this.settingsService.getSettings();
              if (currentSettings.defaultCardSetType === CardSetType.TAG &&
                  currentSettings.tagSetMode === 'fixed') {
                await this.refreshCurrentCardSet();
              }
            });
        
        // 태그 선택 버튼 추가
        text.inputEl.style.width = 'calc(100% - 40px)';
        const browseButton = createEl('button', {
          text: '찾기',
          cls: 'card-navigator-browse-button'
        });
        
        browseButton.addEventListener('click', () => {
          const modal = new TagSuggestModal(this.plugin.app);
          
          // 선택 이벤트 처리
          modal.onChoose = async (tag: string) => {
            // 텍스트 필드 업데이트
            text.setValue(tag);
            
            // 설정 업데이트
            await this.settingsService.updateNestedSettings('fixedTag', tag);
            
            // 태그 선택 시 즉시 카드셋 갱신
            const currentSettings = this.settingsService.getSettings();
            if (currentSettings.defaultCardSetType === CardSetType.TAG &&
                currentSettings.tagSetMode === 'fixed') {
              await this.refreshCurrentCardSet();
            }
          };
          
          modal.open();
        });
        
        // TextComponent의 containerEl에 접근
        const parentEl = text.inputEl.parentElement;
        if (parentEl) {
          parentEl.appendChild(browseButton);
        }
        
        return text;
      });
    
    // 고정 태그 설정 초기 표시 여부
    fixedTagSetting.settingEl.style.display = 
      (settings.tagSetMode === 'fixed') ? 'block' : 'none';
    
    // 링크 카드셋 설정 섹션
    const linkSettingsEl = containerEl.createDiv({ cls: 'card-navigator-link-settings' });
    linkSettingsEl.createEl('h4', { text: '링크 카드셋 설정' });

    // 백링크 포함
    new Setting(linkSettingsEl)
      .setName('백링크 포함')
      .setDesc('링크 카드셋에서 현재 노트를 참조하는 다른 노트(백링크)를 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.includeBacklinks !== undefined ? settings.includeBacklinks : true)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsService.updateNestedSettings('includeBacklinks', value);
            
            // 링크 카드셋이 현재 활성화된 경우에만 즉시 갱신
            const currentSettings = this.settingsService.getSettings();
            if (currentSettings.defaultCardSetType === CardSetType.LINK) {
              await this.refreshCurrentCardSet();
            }
          }));

    // 아웃고잉 링크 포함
    new Setting(linkSettingsEl)
      .setName('아웃고잉 링크 포함')
      .setDesc('링크 카드셋에서 현재 노트가 참조하는 다른 노트(아웃고잉 링크)를 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.includeOutgoingLinks !== undefined ? settings.includeOutgoingLinks : false)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsService.updateNestedSettings('includeOutgoingLinks', value);
            
            // 링크 카드셋이 현재 활성화된 경우에만 즉시 갱신
            const currentSettings = this.settingsService.getSettings();
            if (currentSettings.defaultCardSetType === CardSetType.LINK) {
              await this.refreshCurrentCardSet();
            }
          }));

    // 링크 레벨
    new Setting(linkSettingsEl)
    .setName('링크 레벨')
    .setDesc('링크 카드셋에서 표시할 링크의 깊이를 설정합니다 (1: 직접 링크, 2: 2단계 링크, ...)')
    .addSlider(slider =>
      slider
        .setLimits(1, 5, 1)
        .setValue(settings.linkLevel || 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          // 설정 업데이트
          await this.settingsService.updateNestedSettings('linkLevel', value);
          
          // 링크 카드셋이 현재 활성화된 경우에만 즉시 갱신
          const currentSettings = this.settingsService.getSettings();
          if (currentSettings.defaultCardSetType === CardSetType.LINK) {
            await this.refreshCurrentCardSet();
          }
        }));

    // 초기 상태에서 현재 선택된 카드셋 타입에 따른 설정 영역 표시
    this.updateCardSetVisibility(containerEl, settings.defaultCardSetType || CardSetType.FOLDER);
  }

  /**
   * 카드셋 타입에 따른 설정 영역 표시/숨김 처리
   */
  private updateCardSetVisibility(containerEl: HTMLElement, cardSetType: CardSetType): void {
    const folderSettings = containerEl.querySelector('.card-navigator-folder-settings');
    const tagSettings = containerEl.querySelector('.card-navigator-tag-settings');
    const linkSettings = containerEl.querySelector('.card-navigator-link-settings');
    
    if (folderSettings) {
      if (cardSetType === CardSetType.FOLDER) {
        folderSettings.classList.add('is-visible');
      } else {
        folderSettings.classList.remove('is-visible');
      }
    }
    
    if (tagSettings) {
      if (cardSetType === CardSetType.TAG) {
        tagSettings.classList.add('is-visible');
      } else {
        tagSettings.classList.remove('is-visible');
      }
    }
    
    if (linkSettings) {
      if (cardSetType === CardSetType.LINK) {
        linkSettings.classList.add('is-visible');
      } else {
        linkSettings.classList.remove('is-visible');
      }
    }
  }
  
  /**
   * 컴포넌트 정리
   */
  destroy(): void {
    // 이벤트 리스너 정리
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
    
    // 타이머 정리
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }
}