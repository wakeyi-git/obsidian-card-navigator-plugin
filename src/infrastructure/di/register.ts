import { Container } from './Container';
import { ErrorHandler } from '../ErrorHandler';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { AnalyticsService } from '../AnalyticsService';
import { LoggingService } from '../LoggingService';
import { SettingsService } from '../../application/services/application/SettingsService';
import { CardService } from '../../application/services/domain/CardService';
import { CardSetService } from '../../application/services/domain/CardSetService';
import { CardInteractionService } from '../../application/services/domain/CardInteractionService';
import { SearchService } from '../../application/services/application/SearchService';
import { SortService } from '../../application/services/application/SortService';
import { LayoutService } from '../../application/services/application/LayoutService';
import { ScrollService } from '../../application/services/application/ScrollService';
import { FileService } from '../../application/services/application/FileService';
import { ClipboardService } from '../../application/services/application/ClipboardService';
import { ActiveFileWatcher } from '../../application/services/application/ActiveFileWatcher';
import { FocusManager } from '../../application/manager/FocusManager';
import { CardDisplayManager } from '../../application/manager/CardDisplayManager';
import { CardFactory } from '../../application/factories/CardFactory';
import { PresetManager } from '../../application/manager/PresetManager';
import { PresetService } from '../../application/services/application/PresetService';
import { ToolbarService } from '../../application/services/application/ToolbarService';
import { CardRenderManager } from '../../application/manager/CardRenderManager';
import { CardManager } from '../../application/manager/CardManager';
import { CardSelectionService } from '../../application/services/domain/CardSelectionService';
import { CardFocusService } from '../../application/services/application/CardFocusService';
import { DomainEventDispatcher } from '../../domain/events/DomainEventDispatcher';
import { CardNavigatorService } from '../../application/services/application/CardNavigatorService';
import { EventBus } from '../../domain/events/EventBus';

/**
 * 서비스 등록
 * - 인프라스트럭처 서비스
 * - 애플리케이션 서비스
 * - 팩토리
 */
export function registerServices(container: Container): void {
  // 인프라스트럭처 서비스 등록 (순서 중요)
  container.register('IErrorHandler', () => ErrorHandler.getInstance(), true);
  container.register('ILoggingService', () => LoggingService.getInstance(), true);
  container.register('IPerformanceMonitor', () => PerformanceMonitor.getInstance(), true);
  container.register('IAnalyticsService', () => AnalyticsService.getInstance(), true);
  container.register('IEventDispatcher', () => EventBus.getInstance(), true);

  // 애플리케이션 서비스 등록
  container.register('ISettingsService', () => SettingsService.getInstance(), true);
  container.register('ICardService', () => CardService.getInstance(), true);
  container.register('ICardSetService', () => CardSetService.getInstance(), true);
  container.register('ICardInteractionService', () => CardInteractionService.getInstance(), true);
  container.register('ISearchService', () => SearchService.getInstance(), true);
  container.register('ISortService', () => SortService.getInstance(), true);
  container.register('ILayoutService', () => LayoutService.getInstance(), true);
  container.register('IScrollService', () => ScrollService.getInstance(), true);
  container.register('IFileService', () => FileService.getInstance(), true);
  container.register('IClipboardService', () => ClipboardService.getInstance(), true);
  container.register('IActiveFileWatcher', () => ActiveFileWatcher.getInstance(), true);
  container.register('IFocusManager', () => FocusManager.getInstance(), true);
  container.register('ICardDisplayManager', () => CardDisplayManager.getInstance(), true);
  container.register('ICardFactory', () => CardFactory.getInstance(), true);
  container.register('IPresetManager', () => PresetManager.getInstance(), true);
  container.register('IPresetService', () => PresetService.getInstance(), true);
  container.register('IToolbarService', () => ToolbarService.getInstance(), true);
  container.register('ICardRenderManager', () => CardRenderManager.getInstance(), true);
  container.register('ICardManager', () => CardManager.getInstance(), true);
  container.register('ICardSelectionService', () => CardSelectionService.getInstance(), true);
  container.register('ICardFocusService', () => CardFocusService.getInstance(), true);
  container.register('ICardNavigatorService', () => CardNavigatorService.getInstance(), true);
}

/**
 * 서비스 해제
 */
export function clearServices(container: Container): void {
  container.clear();
} 