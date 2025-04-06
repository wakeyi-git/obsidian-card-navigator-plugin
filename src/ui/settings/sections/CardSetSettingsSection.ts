import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardSetType } from '@/domain/models/CardSetConfig';
import { FolderSuggestModal } from '@/ui/modals/FolderSuggestModal';
import { TagSuggestModal } from '@/ui/modals/TagSuggestModal';
import { Container } from '@/infrastructure/di/Container';
import { CardNavigatorViewModel } from '@/ui/viewModels/CardNavigatorViewModel';
import type { ISettingsService } from '@/domain/services/ISettingsService';
import { CreateCardSetUseCase, CreateCardSetInput } from '@/application/useCases/CreateCardSetUseCase';
import { ApplyLayoutUseCase, ApplyLayoutInput } from '@/application/useCases/ApplyLayoutUseCase';
import { IPluginSettings } from '@/domain/models/DefaultValues';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { ICardSetConfig } from '@/domain/models/CardSetConfig';

/**
 * 카드셋 설정 섹션
 */
export class CardSetSettingsSection {
  private viewModel: CardNavigatorViewModel;
  private settingsService: ISettingsService;
  private refreshTimerId: number | null = null;
  private readonly DEBOUNCE_TIMEOUT = 300; // 300ms 디바운싱
  private listeners: (() => void)[] = [];
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 카드 내비게이터 뷰모델 가져오기
    this.viewModel = Container.getInstance().resolve<CardNavigatorViewModel>('ICardNavigatorViewModel');
    
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    
    // 설정 변경 감지
    this.listeners.push(
      this.settingsService.onSettingsChanged(({ oldSettings, newSettings }: {oldSettings: IPluginSettings, newSettings: IPluginSettings}) => {
        // 설정이 변경되면 필요한 UI 업데이트 수행 가능
      })
    );

    this.eventDispatcher = eventDispatcher;
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
          const settings = await this.settingsService.loadSettings();
          const cardSetConfig = settings.cardSetConfig;
          const cardSetType = cardSetConfig.type;
          let criteria = '';

          // 카드셋 타입에 따라 기준 설정
          if (cardSetType === CardSetType.FOLDER) {
            const folderConfig = cardSetConfig.folder;
            if (folderConfig) {
              criteria = folderConfig.path;
            }
          } else if (cardSetType === CardSetType.TAG) {
            const tagConfig = cardSetConfig.tag;
            if (tagConfig && tagConfig.tags.length > 0) {
              criteria = tagConfig.tags[0];
            }
          } else if (cardSetType === CardSetType.LINK) {
            const linkConfig = cardSetConfig.link;
            if (linkConfig) {
              criteria = linkConfig.level.toString();
            }
          }

          // 기준이 제대로 설정된 경우에만 카드셋 갱신
          if (criteria) {
            // 컨테이너 크기 정보 가져오기
            const containerDimensions = this.viewModel.getContainerDimensions();
            
            // 카드셋 생성 요청 준비
            const input: CreateCardSetInput = {
              type: cardSetType,
              criteria: criteria,
              containerWidth: containerDimensions.width,
              containerHeight: containerDimensions.height,
              transactionId: `settings-change-${Date.now()}`
            };
            
            // 링크 타입일 경우 추가 설정
            if (cardSetType === CardSetType.LINK && cardSetConfig.link) {
              input.linkLevel = cardSetConfig.link.level;
              input.includeBacklinks = cardSetConfig.link.includeBacklinks;
              input.includeOutgoingLinks = cardSetConfig.link.includeOutgoingLinks;
            }
            
            try {
              // CreateCardSetUseCase 및 ApplyLayoutUseCase 인스턴스 가져오기
              const createCardSetUseCase = CreateCardSetUseCase.getInstance();
              const applyLayoutUseCase = ApplyLayoutUseCase.getInstance();
              
              // 카드셋 생성
              const cardSet = await createCardSetUseCase.execute(input);
              
              // 레이아웃 적용
              if (cardSet) {
                await applyLayoutUseCase.execute({
                  cardSet: cardSet,
                  layout: this.plugin.settings.layoutConfig || {},
                  containerWidth: containerDimensions.width,
                  containerHeight: containerDimensions.height
                } as ApplyLayoutInput);
              }
            } catch (error) {
              console.error('카드셋 갱신 실패:', error);
            }
          }
          
          // 타이머 초기화
          this.refreshTimerId = null;
        } catch (error) {
          console.error('카드셋 갱신 디바운싱 설정 실패:', error);
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

    // 카드셋 타입 선택
    const cardSetTypeSelect = containerEl.createEl('select', {
      cls: 'dropdown',
      attr: {
        'aria-label': '카드셋 타입 선택'
      }
    });
    
    // 현재 설정 가져오기
    const folderSettings = this.settingsService.getCardSetConfig(CardSetType.FOLDER);

    // 카드셋 타입 변경 시 설정 업데이트
    cardSetTypeSelect.addEventListener('change', async (e) => {
      const value = (e.target as HTMLSelectElement).value as CardSetType;
      await this.settingsService.updateCardSetConfig(value, {
        ...this.settingsService.getCardSetConfig(value),
        type: value
      });
      await this.refreshCurrentCardSet();
    });

    // 폴더 카드셋 설정 섹션
    const folderSettingsEl = containerEl.createDiv({ cls: 'card-navigator-folder-settings' });
    folderSettingsEl.createEl('h4', { text: '폴더 카드셋 설정' });

    // 폴더 카드셋 모드
    const folderCardSetModeSelect = containerEl.createEl('select', {
      cls: 'dropdown',
      attr: {
        'aria-label': '폴더 카드셋 모드 선택'
      }
    });
    
    // 현재 설정 가져오기
    const folderModeSettings = this.settingsService.getCardSetConfig(CardSetType.FOLDER);

    // 폴더 카드셋 모드 변경 시 설정 업데이트
    folderCardSetModeSelect.addEventListener('change', async (e) => {
      const value = (e.target as HTMLSelectElement).value as 'active' | 'fixed';
      const currentConfig = this.settingsService.getCardSetConfig(CardSetType.FOLDER);
      await this.settingsService.updateCardSetConfig(CardSetType.FOLDER, {
        ...currentConfig,
        folder: {
          path: '/',
          includeSubfolders: currentConfig.folder?.includeSubfolders || true
        }
      });
      await this.refreshCurrentCardSet();
    });

    // 폴더 카드셋 모드 옵션 추가
    folderCardSetModeSelect.appendChild(new Option('활성 폴더 (활성 파일의 폴더)', 'active'));
    folderCardSetModeSelect.appendChild(new Option('고정 폴더 (지정한 폴더)', 'fixed'));

    // 폴더 경로 입력
    const folderPathInput = containerEl.createEl('input', {
      type: 'text',
      cls: 'text-input',
      attr: {
        'aria-label': '폴더 경로 입력'
      }
    });

    // 폴더 찾아보기 버튼
    const browseButton = containerEl.createEl('button', {
      text: '찾아보기',
      cls: 'card-navigator-browse-button'
    });

    browseButton.addEventListener('click', () => {
      const modal = new FolderSuggestModal(this.plugin.app);
      modal.onChoose = (folderPath: string) => {
        folderPathInput.value = folderPath;
        const currentConfig = this.settingsService.getCardSetConfig(CardSetType.FOLDER);
        this.settingsService.updateCardSetConfig(CardSetType.FOLDER, {
          ...currentConfig,
          folder: {
            path: folderPath,
            includeSubfolders: currentConfig.folder?.includeSubfolders || true
          }
        });
        this.refreshCurrentCardSet();
      };
      modal.open();
    });

    // 하위 폴더 포함 설정
    new Setting(folderSettingsEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 카드셋에서 하위 폴더의 노트도 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.cardSetConfig.folder?.includeSubfolders || false)
          .onChange(async (value) => {
            const currentConfig = this.settingsService.getCardSetConfig(CardSetType.FOLDER);
            await this.settingsService.updateCardSetConfig(CardSetType.FOLDER, {
              ...currentConfig,
              folder: {
                path: currentConfig.folder?.path || '/',
                includeSubfolders: value
              }
            });
            
            // 폴더 카드셋이 현재 활성화된 경우에만 즉시 갱신
            if (currentConfig.type === CardSetType.FOLDER) {
              await this.refreshCurrentCardSet();
            }
          }));
    
    // 태그 카드셋 설정 섹션
    const tagSettingsEl = containerEl.createDiv({ cls: 'card-navigator-tag-settings' });
    tagSettingsEl.createEl('h4', { text: '태그 카드셋 설정' });
    
    // 태그 카드셋 모드
    const tagCardSetModeSelect = containerEl.createEl('select', {
      cls: 'dropdown',
      attr: {
        'aria-label': '태그 카드셋 모드 선택'
      }
    });
    
    // 현재 설정 가져오기
    const tagSettings = this.settingsService.getCardSetConfig(CardSetType.TAG);

    // 태그 카드셋 모드 변경 시 설정 업데이트
    tagCardSetModeSelect.addEventListener('change', async (e) => {
      const value = (e.target as HTMLSelectElement).value as 'active' | 'fixed';
      const currentConfig = this.settingsService.getCardSetConfig(CardSetType.TAG);
      await this.settingsService.updateCardSetConfig(CardSetType.TAG, {
        ...currentConfig,
        tag: {
          tags: [],
          caseSensitive: currentConfig.tag?.caseSensitive || false,
          includeNestedTags: currentConfig.tag?.includeNestedTags || true
        }
      });
      await this.refreshCurrentCardSet();
    });

    // 태그 카드셋 모드 옵션 추가
    tagCardSetModeSelect.appendChild(new Option('활성 태그 (활성 파일의 태그)', 'active'));
    tagCardSetModeSelect.appendChild(new Option('고정 태그 (지정한 태그)', 'fixed'));

    // 태그 입력
    const tagInput = containerEl.createEl('input', {
      type: 'text',
      cls: 'text-input',
      attr: {
        'aria-label': '태그 입력'
      }
    });

    // 태그 찾아보기 버튼
    const tagBrowseButton = containerEl.createEl('button', {
      text: '찾아보기',
      cls: 'card-navigator-browse-button'
    });

    tagBrowseButton.addEventListener('click', () => {
      const modal = new TagSuggestModal(this.plugin.app);
      modal.onChoose = (tag: string) => {
        tagInput.value = tag;
        const currentConfig = this.settingsService.getCardSetConfig(CardSetType.TAG);
        this.settingsService.updateCardSetConfig(CardSetType.TAG, {
          ...currentConfig,
          tag: {
            tags: [tag],
            caseSensitive: currentConfig.tag?.caseSensitive || false,
            includeNestedTags: currentConfig.tag?.includeNestedTags || true
          }
        });
        this.refreshCurrentCardSet();
      };
      modal.open();
    });

    // 링크 카드셋 설정 섹션
    const linkSettingsEl = containerEl.createDiv({ cls: 'card-navigator-link-settings' });
    linkSettingsEl.createEl('h4', { text: '링크 카드셋 설정' });

    // 백링크 포함 설정
    new Setting(linkSettingsEl)
      .setName('백링크 포함')
      .setDesc('링크 카드셋에서 현재 노트를 참조하는 다른 노트(백링크)를 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.cardSetConfig.link?.includeBacklinks || false)
          .onChange(async (value) => {
            const currentConfig = this.settingsService.getCardSetConfig(CardSetType.LINK);
            await this.settingsService.updateCardSetConfig(CardSetType.LINK, {
              ...currentConfig,
              link: {
                level: currentConfig.link?.level || 1,
                includeOutgoingLinks: currentConfig.link?.includeOutgoingLinks || true,
                includeBacklinks: value
              }
            });
            
            // 링크 카드셋이 현재 활성화된 경우에만 즉시 갱신
            if (currentConfig.type === CardSetType.LINK) {
              await this.refreshCurrentCardSet();
            }
          }));

    // 아웃고잉 링크 포함 설정
    new Setting(linkSettingsEl)
      .setName('아웃고잉 링크 포함')
      .setDesc('링크 카드셋에서 현재 노트가 참조하는 다른 노트(아웃고잉 링크)를 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.cardSetConfig.link?.includeOutgoingLinks || false)
          .onChange(async (value) => {
            const currentConfig = this.settingsService.getCardSetConfig(CardSetType.LINK);
            await this.settingsService.updateCardSetConfig(CardSetType.LINK, {
              ...currentConfig,
              link: {
                level: currentConfig.link?.level || 1,
                includeOutgoingLinks: value,
                includeBacklinks: currentConfig.link?.includeBacklinks || true
              }
            });
            
            // 링크 카드셋이 현재 활성화된 경우에만 즉시 갱신
            if (currentConfig.type === CardSetType.LINK) {
              await this.refreshCurrentCardSet();
            }
          }));

    // 링크 레벨 설정
    new Setting(linkSettingsEl)
      .setName('링크 레벨')
      .setDesc('링크 카드셋에서 표시할 링크의 깊이를 설정합니다 (1: 직접 링크, 2: 2단계 링크, ...)')
      .addSlider(slider =>
        slider
          .setLimits(1, 5, 1)
          .setValue(settings.cardSetConfig.link?.level || 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            const currentConfig = this.settingsService.getCardSetConfig(CardSetType.LINK);
            await this.settingsService.updateCardSetConfig(CardSetType.LINK, {
              ...currentConfig,
              link: {
                level: Math.max(1, Math.min(5, parseInt(value.toString()))),
                includeOutgoingLinks: currentConfig.link?.includeOutgoingLinks || true,
                includeBacklinks: currentConfig.link?.includeBacklinks || true
              }
            });
            
            // 링크 카드셋이 현재 활성화된 경우에만 즉시 갱신
            if (currentConfig.type === CardSetType.LINK) {
              await this.refreshCurrentCardSet();
            }
          }));

    // 초기 상태에서 현재 선택된 카드셋 타입에 따른 설정 영역 표시
    this.updateCardSetVisibility(containerEl, settings.cardSetConfig.type);
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

  updateCardSetConfig(oldConfig: ICardSetConfig, newConfig: ICardSetConfig): void {
    this.eventDispatcher.dispatch(
      new DomainEvent(DomainEventType.CARD_SET_SETTINGS_SECTION_CHANGED, {
        oldConfig,
        newConfig
      })
    );
  }
}