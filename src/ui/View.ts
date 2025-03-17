import { ItemView, WorkspaceLeaf, TFile, App } from 'obsidian';
import CardNavigatorPlugin from '../main';
import { CardContainer } from './components/CardContainer';
import { LayoutService } from '../application/layout/LayoutService';
import { ICardDisplaySettings, ICardStyle, ICardElementStyle } from '../domain/card/Card';
import { Card } from '../domain/card/Card';
import { ILayoutSettings } from '../domain/settings/Settings';
import { ObsidianLayoutAdapter } from '../infrastructure/adapters/ObsidianLayoutAdapter';
import { GridLayout } from '../application/layout/GridLayout';
import { DomainEventBus } from '../core/events/DomainEventBus';
import { EventType } from '../core/events/EventTypes';
import { DomainErrorBus } from '../core/errors/DomainErrorBus';
import { ErrorCode } from '../core/errors/ErrorTypes';

export const VIEW_TYPE_CARD_NAVIGATOR = 'card-navigator-view';

export class CardNavigatorView extends ItemView {
  private container!: HTMLElement;
  private cardContainer!: CardContainer;
  private plugin: CardNavigatorPlugin;
  private layoutService: LayoutService;
  private layout: GridLayout;
  private displaySettings: ICardDisplaySettings;
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;

  constructor(
    leaf: WorkspaceLeaf,
    plugin: CardNavigatorPlugin
  ) {
    super(leaf);
    this.plugin = plugin;
    this.layout = new GridLayout(plugin.settings.layout);
    this.layoutService = new LayoutService(
      new ObsidianLayoutAdapter(plugin.app),
      plugin.settings.layout
    );
    this.displaySettings = {
      headerContent: 'filename',
      bodyContent: 'firstheader',
      footerContent: 'tags'
    };
    this.eventBus = DomainEventBus.getInstance();
    this.errorBus = DomainErrorBus.getInstance();
  }

  getViewType(): string {
    return VIEW_TYPE_CARD_NAVIGATOR;
  }

  getDisplayText(): string {
    return '카드 내비게이터';
  }

  getIcon(): string {
    return 'layers';
  }

  async onOpen(): Promise<void> {
    try {
      // 컨테이너 생성
      this.container = this.containerEl.children[1] as HTMLElement;
      this.container.empty();
      
      // 카드 컨테이너 초기화
      const elementStyle: ICardElementStyle = {
        backgroundColor: '#ffffff',
        fontSize: 14,
        borderStyle: 'solid',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 5
      };

      const style: ICardStyle = {
        focused: elementStyle,
        header: elementStyle,
        body: elementStyle,
        footer: elementStyle
      };

      this.cardContainer = new CardContainer(
        'card-navigator-container',
        this.layout,
        this.displaySettings,
        style
      );
      
      // 컨테이너 요소를 DOM에 추가
      this.container.appendChild(this.cardContainer.getElement());

      // 리사이즈 이벤트 처리
      this.registerResizeHandler();

      // 초기 카드 로드
      await this.loadCards();

      // 파일 변경 이벤트 처리
      this.registerEventHandlers();

      this.eventBus.publish(EventType.VIEW_OPENED, {
        viewId: this.getViewType()
      });
    } catch (error) {
      this.errorBus.publish(ErrorCode.CONTAINER_INITIALIZATION_FAILED, {
        containerId: 'card-navigator-container',
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  private registerResizeHandler(): void {
    const resizeObserver = new ResizeObserver(() => {
      try {
        this.cardContainer.updateLayout();
        this.eventBus.publish(EventType.LAYOUT_RESIZED, {
          layout: this.layout.getId()
        });
      } catch (error) {
        this.errorBus.publish(ErrorCode.LAYOUT_UPDATE_FAILED, {
          layout: this.layout.getId(),
          updates: {},
          cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
        });
      }
    });

    resizeObserver.observe(this.container);
  }

  private registerEventHandlers(): void {
    // 파일 변경 이벤트
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          this.updateCard(file);
        }
      })
    );
    
    // 파일 생성 이벤트
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile) {
          this.addCard(file);
        }
      })
    );
    
    // 파일 삭제 이벤트
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) {
          this.removeCard(file.path);
        }
      })
    );
  }

  private async loadCards(): Promise<void> {
    try {
      const files = this.app.vault.getMarkdownFiles();
      const cards = await Promise.all(
        files.map(async file => {
          try {
            const content = await this.app.vault.read(file);
            const firstHeader = this.extractFirstHeader(content);
            const tags = this.extractTags(content);
            const metadata = this.extractMetadata(content);
            
            return new Card(
              file.path,
              file.basename,
              content,
              tags,
              metadata,
              firstHeader,
              this.displaySettings,
              undefined,
              new Date(file.stat.ctime).getTime(),
              new Date(file.stat.mtime).getTime()
            );
          } catch (error) {
            this.errorBus.publish(ErrorCode.CARD_ERROR, {
              cardId: file.path,
              cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
            });
            return null;
          }
        })
      );
      
      const validCards = cards.filter((card): card is Card => card !== null);
      validCards.forEach(card => {
        this.cardContainer.addCard(card);
      });

      this.eventBus.publish(EventType.CARDS_LOADED, {
        viewId: this.getViewType(),
        cardCount: validCards.length
      });
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_ERROR, {
        cardId: 'unknown',
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  private extractFirstHeader(content: string): string {
    try {
      const match = content.match(/^#\s+(.+)$/m);
      return match ? match[1] : '';
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_INVALID_FORMAT, {
        cardId: 'unknown',
        format: 'header',
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      return '';
    }
  }

  private extractTags(content: string): string[] {
    try {
      const matches = content.match(/#[\w-]+/g) || [];
      return matches.map(tag => tag.slice(1));
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_INVALID_FORMAT, {
        cardId: 'unknown',
        format: 'tags',
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      return [];
    }
  }

  private extractMetadata(content: string): Record<string, any> {
    try {
      const metadata: Record<string, any> = {};
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const lines = frontmatter.split('\n');
        
        lines.forEach(line => {
          const [key, ...values] = line.split(':').map(s => s.trim());
          if (key && values.length > 0) {
            metadata[key] = values.join(':');
          }
        });
      }
      
      return metadata;
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_INVALID_FORMAT, {
        cardId: 'unknown',
        format: 'metadata',
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      return {};
    }
  }

  private async updateCard(file: TFile): Promise<void> {
    try {
      const content = await this.app.vault.read(file);
      const firstHeader = this.extractFirstHeader(content);
      const tags = this.extractTags(content);
      const metadata = this.extractMetadata(content);
      
      const card = new Card(
        file.path,
        file.basename,
        content,
        tags,
        metadata,
        firstHeader,
        this.displaySettings,
        undefined,
        new Date(file.stat.ctime).getTime(),
        new Date(file.stat.mtime).getTime()
      );
      
      this.cardContainer.updateCard(card);
      this.eventBus.publish(EventType.CARD_UPDATED, {
        card: card.getId()
      });
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_UPDATE_FAILED, {
        cardId: file.path,
        updates: {},
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
    }
  }

  private async addCard(file: TFile): Promise<void> {
    try {
      const content = await this.app.vault.read(file);
      const firstHeader = this.extractFirstHeader(content);
      const tags = this.extractTags(content);
      const metadata = this.extractMetadata(content);
      
      const card = new Card(
        file.path,
        file.basename,
        content,
        tags,
        metadata,
        firstHeader,
        this.displaySettings,
        undefined,
        new Date(file.stat.ctime).getTime(),
        new Date(file.stat.mtime).getTime()
      );
      
      this.cardContainer.addCard(card);
      this.eventBus.publish(EventType.CARD_ADDED, {
        layout: this.layout.getId(),
        card: card.getId()
      });
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_CREATION_FAILED, {
        cardData: {},
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
    }
  }

  private removeCard(filePath: string): void {
    try {
      this.cardContainer.removeCard(filePath);
      this.eventBus.publish(EventType.CARD_REMOVED, {
        layout: this.layout.getId(),
        card: filePath
      });
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_DELETION_FAILED, {
        cardId: filePath,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
    }
  }

  async onClose(): Promise<void> {
    try {
      this.cardContainer.clear();
      this.eventBus.publish(EventType.VIEW_CLOSED, {
        viewId: this.getViewType()
      });
    } catch (error) {
      this.errorBus.publish(ErrorCode.INITIALIZATION_ERROR, {
        component: this.getViewType(),
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }
}