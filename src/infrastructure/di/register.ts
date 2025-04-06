import { Container } from './Container';
import { ErrorHandler } from '../ErrorHandler';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { AnalyticsService } from '../AnalyticsService';
import { EventDispatcher } from '../events/EventDispatcher';
import { LoggingService } from '../LoggingService';
import { SettingsService } from '../../application/services/SettingsService';
import { CardService } from '../../application/services/CardService';
import { CardSetService } from '../../application/services/CardSetService';
import { CardInteractionService } from '../../application/services/CardInteractionService';
import { SearchService } from '../../application/services/SearchService';
import { SortService } from '../../application/services/SortService';
import { LayoutService } from '../../application/services/LayoutService';
import { ScrollService } from '../../application/services/ScrollService';
import { FileService } from '../../application/services/FileService';
import { ClipboardService } from '../../application/services/ClipboardService';
import { ActiveFileWatcher } from '../../application/services/ActiveFileWatcher';
import { FocusManager } from '../../application/manager/FocusManager';
import { CardDisplayManager } from '../../application/manager/CardDisplayManager';
import { CardFactory } from '../../application/factories/CardFactory';
import { PresetManager } from '../../application/manager/PresetManager';
import { PresetService } from '../../application/services/PresetService';
import { ToolbarService } from '../../application/services/ToolbarService';
import { CardRenderManager } from '../../application/manager/CardRenderManager';

/**
 * 서비스 등록
 * - 인프라스트럭처 서비스
 * - 애플리케이션 서비스
 * - 팩토리
 */
export function registerServices(container: Container): void {
  // 기본 서비스 등록
  container.register('IErrorHandler', () => ErrorHandler.getInstance(), true);
  container.register('IPerformanceMonitor', () => PerformanceMonitor.getInstance(), true);
  container.register('IAnalyticsService', () => AnalyticsService.getInstance(), true);
  container.register('IEventDispatcher', () => EventDispatcher.getInstance(), true);
  container.register('ILoggingService', () => LoggingService.getInstance(), true);
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
  container.register('ICardRenderer', () => CardRenderManager.getInstance(), true);
  container.register('IRenderManager', () => CardRenderManager.getInstance(), true);
}

/**
 * 서비스 해제
 */
export function clearServices(container: Container): void {
  container.clear();
} 