import { ICardInteractionService, ContextMenuActionType, DragDropTargetType, IDragDropTarget } from '../../domain/services/ICardInteractionService';
import { TFile, App } from 'obsidian';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/interfaces/events/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';

/**
 * 카드 상호작용 서비스 구현체
 */
export class CardInteractionService implements ICardInteractionService {
  private static instance: CardInteractionService;
  private app: App;
  private inlineEditingFile: TFile | null = null;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {
    const container = Container.getInstance();
    this.app = container.resolve('App');
  }

  static getInstance(): CardInteractionService {
    if (!CardInteractionService.instance) {
      const container = Container.getInstance();
      CardInteractionService.instance = new CardInteractionService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return CardInteractionService.instance;
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    // 초기화 로직
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.inlineEditingFile = null;
  }

  /**
   * 파일 열기
   * @param file 파일
   */
  openFile(file: TFile): void {
    this.app.workspace.openLinkText(file.path, '', true);
  }

  /**
   * 컨텍스트 메뉴 액션 실행
   * @param file 파일
   * @param action 액션 타입
   */
  executeContextMenuAction(file: TFile, action: ContextMenuActionType): void {
    switch (action) {
      case ContextMenuActionType.COPY_LINK:
        // 링크 복사 로직
        const linkText = `[[${file.basename}]]`;
        navigator.clipboard.writeText(linkText);
        break;
      case ContextMenuActionType.COPY_CONTENT:
        // 내용 복사 로직
        this.app.vault.read(file).then(content => {
          navigator.clipboard.writeText(content);
        });
        break;
    }
  }

  /**
   * 드래그 앤 드롭 처리
   * @param sourceFile 소스 파일
   * @param target 드래그 앤 드롭 타겟
   */
  handleDragDrop(sourceFile: TFile, target: IDragDropTarget): void {
    switch (target.type) {
      case DragDropTargetType.EDITOR:
        // 편집기에 드롭 로직
        const linkText = `[[${sourceFile.basename}]]`;
        // 현재 활성화된 편집기에 링크 삽입
        break;
      case DragDropTargetType.CARD:
        const targetFile = target.file;
        if (targetFile instanceof TFile) {
          // 카드에 드롭 로직
          const linkText = `[[${sourceFile.basename}]]`;
          // 대상 파일에 링크 삽입
          this.app.vault.read(targetFile).then(content => {
            const newContent = content + '\n' + linkText;
            this.app.vault.modify(targetFile, newContent);
          });
        }
        break;
    }
  }

  /**
   * 인라인 편집 시작
   * @param file 파일
   */
  startInlineEdit(file: TFile): void {
    this.inlineEditingFile = file;
    // 인라인 편집 UI 표시
  }

  /**
   * 인라인 편집 종료
   */
  endInlineEdit(): void {
    this.inlineEditingFile = null;
    // 인라인 편집 UI 숨김
  }

  /**
   * UI 업데이트
   */
  updateUI(): void {
    // UI 업데이트 로직
  }
} 