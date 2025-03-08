import { useState, useEffect, useCallback } from 'react';
import { App } from 'obsidian';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ModeType } from '../../domain/mode/Mode';
import { SortDirection, SortType } from '../../domain/sorting/Sort';
import { SearchType } from '../../domain/mode/SearchMode';
import { createCardNavigatorService } from '../utils/serviceFactory';
import { TimerUtil } from '../../infrastructure/TimerUtil';

/**
 * 서비스 초기화 훅 반환 타입
 */
interface UseCardNavigatorServiceReturn {
  service: ICardNavigatorService | null;
  currentMode: ModeType;
  currentCardSet: string | null;
  isCardSetFixed: boolean;
  includeSubfolders: boolean;
  currentSortType: SortType;
  currentSortDirection: SortDirection;
  layout: 'grid' | 'masonry';
  searchType: SearchType;
  caseSensitive: boolean;
  frontmatterKey: string;
  error: string | null;
  
  setCurrentMode: (mode: ModeType) => void;
  setCurrentCardSet: (cardSet: string | null) => void;
  setIsCardSetFixed: (isFixed: boolean) => void;
  setIncludeSubfolders: (include: boolean) => void;
  setCurrentSortType: (type: SortType) => void;
  setCurrentSortDirection: (direction: SortDirection) => void;
  setLayout: (layout: 'grid' | 'masonry') => void;
  setSearchType: (type: SearchType) => void;
  setCaseSensitive: (sensitive: boolean) => void;
  setFrontmatterKey: (key: string) => void;
  setError: (error: string | null) => void;
  
  initializeService: () => Promise<void>;
}

/**
 * 카드 네비게이터 서비스 초기화 및 관리를 위한 커스텀 훅
 * @param app Obsidian App 인스턴스
 * @returns 서비스 초기화 관련 상태와 함수
 */
export const useCardNavigatorService = (app: App): UseCardNavigatorServiceReturn => {
  const [service, setService] = useState<ICardNavigatorService | null>(null);
  const [currentMode, setCurrentMode] = useState<ModeType>('folder');
  const [currentCardSet, setCurrentCardSet] = useState<string | null>(null);
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [currentSortType, setCurrentSortType] = useState<SortType>('filename');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('asc');
  const [layout, setLayout] = useState<'grid' | 'masonry'>('grid');
  const [searchType, setSearchType] = useState<SearchType>('title');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [frontmatterKey, setFrontmatterKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 서비스 초기화 함수
   */
  const initializeService = useCallback(async () => {
    try {
      const timerId = TimerUtil.startTimer('[성능] CardNavigatorService 생성 시간');
      
      // 서비스 생성
      const newService = await createCardNavigatorService(app);
      
      setService(newService);
      
      // 모드 서비스에서 카드 가져오기
      const modeService = newService.getModeService();
      
      // 현재 모드 가져오기
      const currentModeType = modeService.getCurrentModeType();
      setCurrentMode(currentModeType);
      
      // 현재 카드 세트 가져오기
      const currentSet = modeService.getCurrentCardSet();
      setCurrentCardSet(currentSet);
      
      // 카드 세트 고정 여부 가져오기
      const isFixed = modeService.isCardSetFixed();
      setIsCardSetFixed(isFixed);
      
      // 하위 폴더 포함 여부 가져오기
      const includeSubfolders = modeService.getIncludeSubfolders();
      setIncludeSubfolders(includeSubfolders);
      
      // 정렬 설정 가져오기
      const sortService = newService.getSortService();
      const currentSort = sortService.getCurrentSort();
      if (currentSort) {
        setCurrentSortType(currentSort.type);
        setCurrentSortDirection(currentSort.direction);
      }
      
      // 레이아웃 설정 가져오기
      const layoutService = newService.getLayoutService();
      const currentLayout = layoutService.getCurrentLayout();
      if (currentLayout) {
        setLayout(currentLayout.type as 'grid' | 'masonry');
      }
      
      // 검색 설정 가져오기
      const searchService = newService.getSearchService();
      const currentSearch = searchService.getCurrentSearch();
      if (currentSearch) {
        setSearchType(currentSearch.getType() as SearchType);
        setCaseSensitive(currentSearch.isCaseSensitive());
        if (currentSearch.getType() === 'frontmatter') {
          // 프론트매터 검색인 경우 프론트매터 키 설정
          const frontmatterSearch = currentSearch as any;
          if (frontmatterSearch.getKey) {
            setFrontmatterKey(frontmatterSearch.getKey());
          }
        }
      }
      
      console.log('[CardNavigatorView] 서비스 초기화 완료');
      TimerUtil.endTimer(timerId);
    } catch (error: unknown) {
      console.error('[CardNavigatorView] 서비스 초기화 오류:', error);
      setError(`서비스 초기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [app]);
  
  // 컴포넌트 마운트 시 서비스 초기화
  useEffect(() => {
    console.log('[CardNavigatorView] 서비스 초기화 시작');
    
    // 이미 초기화된 서비스가 있는 경우 중복 초기화 방지
    if (service) {
      console.log('[CardNavigatorView] 이미 초기화된 서비스가 있습니다.');
      return;
    }
    
    // 서비스 초기화 - setTimeout을 사용하여 React 렌더링 사이클과 분리
    setTimeout(() => {
      initializeService();
    }, 0);
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('[CardNavigatorView] 컴포넌트 언마운트');
    };
  }, [app, initializeService, service]);
  
  return {
    service,
    currentMode,
    currentCardSet,
    isCardSetFixed,
    includeSubfolders,
    currentSortType,
    currentSortDirection,
    layout,
    searchType,
    caseSensitive,
    frontmatterKey,
    error,
    
    setCurrentMode,
    setCurrentCardSet,
    setIsCardSetFixed,
    setIncludeSubfolders,
    setCurrentSortType,
    setCurrentSortDirection,
    setLayout,
    setSearchType,
    setCaseSensitive,
    setFrontmatterKey,
    setError,
    
    initializeService
  };
}; 