import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import Toolbar from './toolbar/Toolbar';
import CardContainer from './cards-container/CardContainer';
import { ICardProps } from './cards-container/Card';
import { CardNavigatorService, ICardNavigatorService } from '../application/CardNavigatorService';
import { CardRepositoryImpl } from '../infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from '../infrastructure/ObsidianAdapter';
import { CardFactory } from '../domain/card/CardFactory';
import { ICard } from '../domain/card/Card';
import { IFilter } from '../domain/filter/Filter';
import { SortType, SortDirection } from '../domain/sorting/Sort';
import { LayoutType } from '../domain/layout/Layout';

// 카드 네비게이터 뷰 컴포넌트
const CardNavigatorComponent: React.FC<{ app: App }> = ({ app }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<ICardProps[]>([]);
  const [currentMode, setCurrentMode] = useState<'folder' | 'tag'>('folder');
  const [searchQuery, setSearchQuery] = useState('');
  const [layout, setLayout] = useState<'grid' | 'masonry'>('grid');
  const [service, setService] = useState<ICardNavigatorService | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 서비스 초기화 및 데이터 로딩
    const initializeService = async () => {
      try {
        // 인프라스트럭처 레이어 초기화
        const obsidianAdapter = new ObsidianAdapter(app);
        const cardFactory = new CardFactory();
        const cardRepository = new CardRepositoryImpl(obsidianAdapter, cardFactory);
        
        // 서비스 레이어 초기화
        const navigatorService = new CardNavigatorService(app, cardRepository, 'folder');
        await navigatorService.initialize();
        setService(navigatorService);
        
        // 초기 데이터 로드
        const initialCards = await navigatorService.getCards();
        setCards(mapDomainCardsToProps(initialCards));
        setCurrentMode(navigatorService.getModeService().getCurrentModeType());
        
        // 레이아웃 설정 로드
        const layoutService = navigatorService.getLayoutService();
        const currentLayout = layoutService.getCurrentLayout();
        if (currentLayout) {
          setLayout(currentLayout.type);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('서비스 초기화 중 오류 발생:', error);
        setError('카드 네비게이터를 초기화하는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    initializeService();
  }, [app]);

  // 도메인 카드 객체를 UI 컴포넌트 속성으로 변환
  const mapDomainCardsToProps = (domainCards: ICard[]): ICardProps[] => {
    return domainCards.map((card) => ({
      id: card.id,
      title: card.title,
      content: card.content,
      tags: card.tags,
      path: card.path,
      created: card.created,
      modified: card.modified,
    }));
  };

  // 검색 처리
  const handleSearch = async (query: string) => {
    if (!service) return;
    
    setSearchQuery(query);
    setIsLoading(true);
    
    try {
      const searchService = service.getSearchService();
      await searchService.setSearchQuery(query);
      
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 모드 변경 처리
  const handleModeChange = async (mode: 'folder' | 'tag') => {
    if (!service) return;
    
    setIsLoading(true);
    setCurrentMode(mode);
    
    try {
      await service.changeMode(mode);
      const updatedCards = await service.getCards();
      setCards(mapDomainCardsToProps(updatedCards));
    } catch (error) {
      console.error('모드 변경 중 오류 발생:', error);
      setError('모드를 변경하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카드 세트 선택 처리
  const handleCardSetSelect = async (cardSet: string) => {
    if (!service) return;
    
    setIsLoading(true);
    
    try {
      await service.selectCardSet(cardSet);
      const updatedCards = await service.getCards();
      setCards(mapDomainCardsToProps(updatedCards));
    } catch (error) {
      console.error('카드 세트 선택 중 오류 발생:', error);
      setError('카드 세트를 선택하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 정렬 변경 처리
  const handleSortChange = async (sortType: string, sortDirection: string) => {
    if (!service) return;
    
    try {
      const sortService = service.getSortService();
      await sortService.setSortType(sortType as SortType, sortDirection as SortDirection);
      
      const sortedCards = await service.getCards();
      setCards(mapDomainCardsToProps(sortedCards));
    } catch (error) {
      console.error('정렬 변경 중 오류 발생:', error);
    }
  };

  // 필터 변경 처리
  const handleFilterChange = async (filters: IFilter[]) => {
    if (!service) return;
    
    setIsLoading(true);
    
    try {
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
    } catch (error) {
      console.error('필터링 중 오류 발생:', error);
      setError('필터링 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 레이아웃 변경 처리
  const handleLayoutChange = async (newLayout: 'grid' | 'masonry') => {
    if (!service) return;
    
    setLayout(newLayout);
    
    try {
      await service.changeLayout(newLayout);
    } catch (error) {
      console.error('레이아웃 변경 중 오류 발생:', error);
      setError('레이아웃을 변경하는 중 오류가 발생했습니다.');
    }
  };

  // 프리셋 적용 처리
  const handlePresetApply = async (presetId: string) => {
    if (!service) return;
    
    setIsLoading(true);
    
    try {
      const presetService = service.getPresetService();
      await presetService.applyPreset(presetId);
      
      // 모드 및 레이아웃 상태 업데이트
      const modeService = service.getModeService();
      setCurrentMode(modeService.getCurrentModeType());
      
      const layoutService = service.getLayoutService();
      const currentLayout = layoutService.getCurrentLayout();
      if (currentLayout) {
        setLayout(currentLayout.type);
      }
      
      // 카드 목록 업데이트
      const updatedCards = await service.getCards();
      setCards(mapDomainCardsToProps(updatedCards));
    } catch (error) {
      console.error('프리셋 적용 중 오류 발생:', error);
      setError('프리셋을 적용하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 프리셋 저장 처리
  const handlePresetSave = async () => {
    if (!service) return;
    
    try {
      const presetName = prompt('프리셋 이름을 입력하세요:');
      const presetService = service.getPresetService();
      
      if (presetName) {
        await presetService.saveCurrentAsPreset(presetName);
      }
    } catch (error) {
      console.error('프리셋 저장 중 오류 발생:', error);
    }
  };

  // 프리셋 삭제 처리
  const handlePresetDelete = async (presetId: string) => {
    if (!service) return;
    
    try {
      const presetService = service.getPresetService();
      await presetService.deletePreset(presetId);
    } catch (error) {
      console.error('프리셋 삭제 중 오류 발생:', error);
      setError('프리셋을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 카드 클릭 처리
  const handleCardClick = async (id: string) => {
    if (!service || !app) return;
    
    try {
      const cardService = service.getCardService();
      const card = await cardService.getCardById(id);
      
      if (card && card.path) {
        // Obsidian API를 사용하여 노트 열기
        const file = app.vault.getAbstractFileByPath(card.path);
        if (file) {
          app.workspace.getLeaf().openFile(file as any);
        }
      }
    } catch (error) {
      console.error('카드 열기 중 오류 발생:', error);
    }
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="card-navigator-loading">
        <div className="card-navigator-loading-spinner"></div>
        <p>카드 로딩 중...</p>
      </div>
    );
  }

  // 오류 표시
  if (error) {
    return (
      <div className="card-navigator-error">
        <p>{error}</p>
        <button onClick={() => setError(null)}>닫기</button>
      </div>
    );
  }

  return (
    <div className="card-navigator-container">
      <Toolbar
        onSearch={handleSearch}
        onModeChange={handleModeChange}
        currentMode={currentMode}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onLayoutChange={handleLayoutChange}
        onCardSetSelect={handleCardSetSelect}
        onPresetApply={handlePresetApply}
        onPresetSave={handlePresetSave}
        onPresetDelete={handlePresetDelete}
        currentLayout={layout}
        service={service}
      />
      
      <CardContainer
        cards={cards}
        onCardClick={handleCardClick}
        layout={layout}
      />
    </div>
  );
};

/**
 * Obsidian ItemView를 확장한 CardNavigatorView 클래스
 * React 컴포넌트를 Obsidian 뷰에 마운트하는 역할을 합니다.
 */
export class CardNavigatorView extends ItemView {
  private reactComponent: React.ReactNode;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return 'card-navigator-view';
  }

  getDisplayText(): string {
    return '카드 네비게이터';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('card-navigator-view');

    const rootEl = createDiv();
    container.appendChild(rootEl);

    const root = createRoot(rootEl);
    root.render(<CardNavigatorComponent app={this.app} />);
  }

  async onClose() {
    // 정리 작업
  }
} 