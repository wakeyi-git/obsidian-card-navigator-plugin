import { ICardInteractionService, ContextMenuActionType, DragDropTargetType, IDragDropTarget } from '@/domain/services/domain/ICardInteractionService';
import { TFile, App } from 'obsidian';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { ICard } from '@/domain/models/Card';
import { CardLinkCreatedEvent } from '@/domain/events/CardInteractionEvents';

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

  /**
   * 두 카드 간의 링크를 생성합니다.
   * @param sourceCard 소스 카드
   * @param targetCard 타겟 카드
   */
  async createLink(sourceCard: ICard, targetCard: ICard): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardInteractionService.createLink');
    try {
      this.loggingService.debug('카드 간 링크 생성 시작', { 
        sourceCardId: sourceCard.id, 
        targetCardId: targetCard.id 
      });

      // 카드 객체에서 직접 파일 객체 사용
      const sourceFile = sourceCard.file;
      const targetFile = targetCard.file;

      if (!sourceFile || !targetFile) {
        throw new Error('카드에 유효한 파일 정보가 없습니다.');
      }

      // 소스 파일에 타겟 파일 링크 추가
      const sourceContent = await this.app.vault.read(sourceFile);
      const linkText = `[[${targetCard.fileName}]]`;
      
      if (!sourceContent.includes(linkText)) {
        const newContent = sourceContent + '\n\n' + linkText;
        await this.app.vault.modify(sourceFile, newContent);
      }

      this.eventDispatcher.dispatch(new CardLinkCreatedEvent(sourceCard));
      
      this.loggingService.info('카드 간 링크 생성 완료', {
        sourceCardId: sourceCard.id,
        targetCardId: targetCard.id
      });
    } catch (error) {
      this.loggingService.error('카드 간 링크 생성 실패', {
        error,
        sourceCardId: sourceCard.id,
        targetCardId: targetCard.id
      });
      this.errorHandler.handleError(error as Error, 'CardInteractionService.createLink');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 