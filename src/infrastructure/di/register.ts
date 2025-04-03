import { Container } from './Container';
import { ErrorHandler } from '../ErrorHandler';
import { LoggingService } from '../LoggingService';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { AnalyticsService } from '../AnalyticsService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CacheService } from '@/application/services/CacheService';
import { CardService } from '@/application/services/CardService';
import { LayoutService } from '@/application/services/LayoutService';
import { SearchService } from '@/application/services/SearchService';
import { SortService } from '@/application/services/SortService';
import { App } from 'obsidian';
import { CardFactory } from '@/application/factories/CardFactory';

/**
 * 서비스 등록
 * - 인프라스트럭처 서비스
 * - 애플리케이션 서비스
 * - 팩토리
 */
export function registerServices(app: App): void {
  const container = Container.getInstance();

  try {
    // Core Services
    container.register('App', () => app, true);

    // Infrastructure Services
    container.register('ILoggingService', () => LoggingService.getInstance(), true);
    container.register('IErrorHandler', () => ErrorHandler.getInstance(), true);
    container.register('IPerformanceMonitor', () => PerformanceMonitor.getInstance(), true);
    container.register('IAnalyticsService', () => AnalyticsService.getInstance(), true);
    container.register('IEventDispatcher', () => DomainEventDispatcher.getInstance(), true);

    // Application Services
    container.register('ICacheService', () => CacheService.getInstance(), true);
    container.register('ICardService', () => CardService.getInstance(), true);
    container.register('ILayoutService', () => LayoutService.getInstance(), true);
    container.register('ISearchService', () => SearchService.getInstance(), true);
    container.register('ISortService', () => SortService.getInstance(), true);

    // Factories
    container.register('ICardFactory', () => CardFactory.getInstance(), true);

    console.debug('모든 서비스 등록 완료');
  } catch (error) {
    console.error('서비스 등록 실패:', error);
    throw error;
  }
}

/**
 * 서비스 해제
 */
export function unregisterServices(): void {
  const container = Container.getInstance();

  try {
    container.clear();
    console.debug('모든 서비스 해제 완료');
  } catch (error) {
    console.error('서비스 해제 실패:', error);
    throw error;
  }
} 