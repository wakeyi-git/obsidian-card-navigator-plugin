import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CardRenderManager } from '@/application/manager/CardRenderManager';
import { ICard, IRenderConfig, IRenderState, RenderStatus, RenderType } from '@/domain/models/Card';
import { Container } from '@/infrastructure/di/Container';
import { mockErrorHandler, mockLoggingService, mockPerformanceMonitor, mockAnalyticsService } from './mocks/services';
import { EventBus } from '@/domain/events/EventBus';

describe('카드 렌더링 테스트', () => {
  let cardRenderManager: CardRenderManager;
  let mockCard: ICard;
  let mockRenderConfig: IRenderConfig;
  let eventBus: EventBus;

  beforeEach(() => {
    const container = Container.getInstance();
    container.registerInstance('IErrorHandler', mockErrorHandler);
    container.registerInstance('ILoggingService', mockLoggingService);
    container.registerInstance('IPerformanceMonitor', mockPerformanceMonitor);
    container.registerInstance('IAnalyticsService', mockAnalyticsService);
    eventBus = EventBus.getInstance();
    container.registerInstance('EventBus', eventBus);

    cardRenderManager = CardRenderManager.getInstance();
    cardRenderManager.initialize();

    mockCard = {
      id: 'test-card-1',
      file: null,
      filePath: '/test/path.md',
      title: '테스트 카드',
      fileName: 'test.md',
      firstHeader: '# 테스트 카드',
      content: '테스트 카드 내용',
      tags: ['테스트', '카드'],
      properties: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      validate: () => true,
      preview: () => ({
        id: 'test-card-1',
        file: null,
        filePath: '/test/path.md',
        title: '테스트 카드',
        fileName: 'test.md',
        firstHeader: '# 테스트 카드',
        content: '테스트 카드 내용',
        tags: ['테스트', '카드'],
        properties: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      toString: () => '테스트 카드'
    };

    mockRenderConfig = {
      type: RenderType.TEXT,
      contentLengthLimitEnabled: false,
      contentLengthLimit: 0,
      style: {
        classes: ['card'],
        backgroundColor: '#ffffff',
        fontSize: '14px',
        color: '#000000',
        border: {
          width: '1px',
          color: '#cccccc',
          style: 'solid',
          radius: '4px'
        },
        padding: '10px',
        boxShadow: 'none',
        lineHeight: '1.5',
        fontFamily: 'inherit'
      },
      state: {
        status: RenderStatus.COMPLETED,
        startTime: Date.now(),
        endTime: Date.now(),
        error: null,
        timestamp: Date.now()
      }
    };
  });

  afterEach(() => {
    cardRenderManager.cleanup();
    eventBus.cleanup();
  });

  it('카드 렌더링 매니저 초기화 테스트', () => {
    expect(cardRenderManager.isInitialized()).toBe(true);
  });

  it('카드 렌더링 상태 등록 테스트', () => {
    const renderState: IRenderState = {
      status: RenderStatus.COMPLETED,
      startTime: Date.now(),
      endTime: Date.now(),
      error: null,
      timestamp: Date.now()
    };

    cardRenderManager.registerRenderState(mockCard.id, renderState);
    const state = cardRenderManager.getRenderState(mockCard.id);

    expect(state).toEqual(renderState);
  });

  it('카드 렌더링 테스트', () => {
    const cardElement = cardRenderManager.renderCard(mockCard);
    
    expect(cardElement).toBeDefined();
    expect(cardElement.classList.contains('card-navigator-card')).toBe(true);
    expect(cardElement.querySelector('.card-navigator-card-header')).toBeDefined();
    expect(cardElement.querySelector('.card-navigator-card-body')).toBeDefined();
    expect(cardElement.querySelector('.card-navigator-card-footer')).toBeDefined();
  });

  it('카드 렌더링 이벤트 구독 테스트', () => {
    let eventReceived = false;
    
    cardRenderManager.subscribeToRenderEvents((event) => {
      if (event.type === 'render' && event.cardId === mockCard.id) {
        eventReceived = true;
      }
    });

    cardRenderManager.renderCard(mockCard);
    
    expect(eventReceived).toBe(true);
  });

  it('카드 렌더링 리소스 관리 테스트', () => {
    const testResource = { data: 'test' };
    
    cardRenderManager.registerRenderResource(mockCard.id, testResource);
    const resource = cardRenderManager.getRenderResource(mockCard.id);
    
    expect(resource).toEqual(testResource);
    
    cardRenderManager.unregisterRenderResource(mockCard.id);
    const removedResource = cardRenderManager.getRenderResource(mockCard.id);
    
    expect(removedResource).toBeNull();
  });
}); 