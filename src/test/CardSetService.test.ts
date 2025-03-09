import { CardSetService } from '../application/CardSetService';
import { MockUtils } from './TestUtils';
import { CardSetSourceType } from '../domain/cardset/CardSet';
import { EventType } from '../domain/events/EventTypes';

describe('CardSetService', () => {
  // 모킹된 의존성
  const mockApp = {} as any;
  const mockCardService = MockUtils.createMockCardService();
  
  // 테스트 대상
  let cardSetService: CardSetService;
  
  beforeEach(() => {
    // 각 테스트 전에 서비스 초기화
    cardSetService = new CardSetService(mockApp, mockCardService, 'folder');
  });
  
  describe('getCurrentSourceType', () => {
    it('기본 소스 타입을 반환해야 함', () => {
      // 기본 소스 타입은 'folder'로 설정됨
      expect(cardSetService.getCurrentSourceType()).toBe('folder');
    });
  });
  
  describe('changeSource', () => {
    it('소스 타입을 변경하고 이벤트를 발생시켜야 함', async () => {
      // 이벤트 리스너 모킹
      const mockListener = jest.fn();
      cardSetService.on(EventType.SOURCE_CHANGED, mockListener);
      
      // 소스 타입 변경
      await cardSetService.changeSource('tag');
      
      // 소스 타입이 변경되었는지 확인
      expect(cardSetService.getCurrentSourceType()).toBe('tag');
      
      // 이벤트가 발생했는지 확인
      expect(mockListener).toHaveBeenCalledWith({
        previousSourceType: 'folder',
        newSourceType: 'tag'
      });
    });
    
    it('같은 소스 타입으로 변경 시 이벤트를 발생시키지 않아야 함', async () => {
      // 이벤트 리스너 모킹
      const mockListener = jest.fn();
      cardSetService.on(EventType.SOURCE_CHANGED, mockListener);
      
      // 같은 소스 타입으로 변경
      await cardSetService.changeSource('folder');
      
      // 소스 타입이 변경되지 않았는지 확인
      expect(cardSetService.getCurrentSourceType()).toBe('folder');
      
      // 이벤트가 발생하지 않았는지 확인
      expect(mockListener).not.toHaveBeenCalled();
    });
  });
  
  describe('selectCardSet', () => {
    it('카드셋을 선택하고 이벤트를 발생시켜야 함', async () => {
      // 이벤트 리스너 모킹
      const mockListener = jest.fn();
      cardSetService.on(EventType.CARD_SET_CHANGED, mockListener);
      
      // 카드셋 선택
      await cardSetService.selectCardSet('test-folder');
      
      // 카드셋이 선택되었는지 확인
      expect(cardSetService.getCurrentCardSet()).toBe('test-folder');
      
      // 이벤트가 발생했는지 확인
      expect(mockListener).toHaveBeenCalledWith({
        cardSet: 'test-folder',
        sourceType: 'folder',
        isFixed: false
      });
    });
    
    it('카드셋을 고정 모드로 선택할 수 있어야 함', async () => {
      // 카드셋 고정 모드로 선택
      await cardSetService.selectCardSet('test-folder', true);
      
      // 카드셋이 선택되었는지 확인
      expect(cardSetService.getCurrentCardSet()).toBe('test-folder');
      
      // 카드셋이 고정되었는지 확인
      expect(cardSetService.isCardSetFixed()).toBe(true);
    });
    
    it('null 카드셋을 선택하면 선택 해제해야 함', async () => {
      // 먼저 카드셋 선택
      await cardSetService.selectCardSet('test-folder');
      
      // 카드셋이 선택되었는지 확인
      expect(cardSetService.getCurrentCardSet()).toBe('test-folder');
      
      // 카드셋 선택 해제
      await cardSetService.selectCardSet(null);
      
      // 카드셋이 선택 해제되었는지 확인
      expect(cardSetService.getCurrentCardSet()).toBeNull();
    });
  });
  
  describe('setIncludeSubfolders', () => {
    it('하위 폴더 포함 여부를 설정하고 이벤트를 발생시켜야 함', () => {
      // 이벤트 리스너 모킹
      const mockListener = jest.fn();
      cardSetService.on(EventType.INCLUDE_SUBFOLDERS_CHANGED, mockListener);
      
      // 하위 폴더 포함 여부 설정
      cardSetService.setIncludeSubfolders(true);
      
      // 하위 폴더 포함 여부가 설정되었는지 확인
      expect(cardSetService.getIncludeSubfolders()).toBe(true);
      
      // 이벤트가 발생했는지 확인
      expect(mockListener).toHaveBeenCalledWith(true);
    });
  });
  
  describe('reset', () => {
    it('설정을 초기화해야 함', () => {
      // 먼저 설정 변경
      cardSetService.setIncludeSubfolders(true);
      cardSetService.selectCardSet('test-folder', true);
      
      // 설정이 변경되었는지 확인
      expect(cardSetService.getIncludeSubfolders()).toBe(true);
      expect(cardSetService.getCurrentCardSet()).toBe('test-folder');
      expect(cardSetService.isCardSetFixed()).toBe(true);
      
      // 설정 초기화
      cardSetService.reset();
      
      // 설정이 초기화되었는지 확인
      expect(cardSetService.getIncludeSubfolders()).toBe(false);
      expect(cardSetService.getCurrentCardSet()).toBeNull();
      expect(cardSetService.isCardSetFixed()).toBe(false);
    });
  });
}); 