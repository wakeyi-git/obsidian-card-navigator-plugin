import { vi } from 'vitest';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';

export const mockErrorHandler: IErrorHandler = {
  handleError: vi.fn()
};

export const mockLoggingService: ILoggingService = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

export const mockPerformanceMonitor: IPerformanceMonitor = {
  startTimer: vi.fn().mockReturnValue({ stop: vi.fn() }),
  measure: vi.fn(),
  measureAsync: vi.fn(),
  getMeasurement: vi.fn().mockReturnValue({
    count: 0,
    average: 0,
    min: 0,
    max: 0,
    total: 0
  }),
  getAllMeasurements: vi.fn().mockReturnValue({}),
  clearMeasurement: vi.fn(),
  clearAllMeasurements: vi.fn(),
  logMemoryUsage: vi.fn(),
  clearMetrics: vi.fn()
};

export const mockAnalyticsService: IAnalyticsService = {
  trackEvent: vi.fn(),
  getEvents: vi.fn().mockReturnValue([]),
  getEventCount: vi.fn().mockReturnValue(0),
  reset: vi.fn(),
  exportData: vi.fn().mockReturnValue('{}')
}; 