import { useCallback } from 'react';
import { App, TFile } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ModeType } from '../../domain/mode/Mode';
import { SortDirection, SortType } from '../../domain/sorting/Sort';
import { SearchType } from '../../domain/search/Search';

/**
 * 카드 이벤트 핸들러 훅 반환 타입
 */
interface UseCardEventsReturn {
  handleModeChange: (mode: ModeType) => Promise<void>;
  handleCardSetSelect: (cardSet: string, isFixed: boolean) => Promise<void>;
  handleIncludeSubfoldersChange: (include: boolean) => Promise<void>;
  handleSortChange: (sortType: SortType, sortDirection: SortDirection) => Promise<void>;
  handleLayoutChange: (layoutType: 'grid' | 'masonry') => Promise<void>;
  handleSearch: (query: string, type?: string) => Promise<void>;
  handleSearchTypeChange: (type: SearchType) => void;
  handleCaseSensitiveChange: (sensitive: boolean) => void;
  handleFrontmatterKeyChange: (key: string) => void;
  handleCardClick: (cardId: string) => void;
  handleCardContextMenu: (cardId: string, event: React.MouseEvent) => void;
  handleCardDragStart: (cardId: string, event: React.DragEvent) => void;
  handleCardDragEnd: (cardId: string, event: React.DragEvent) => void;
  handleCardDrop: (cardId: string, event: React.DragEvent) => void;
  handleCardDragOver: (cardId: string, event: React.DragEvent) => void;
  handleCardDragEnter: (cardId: string, event: React.DragEvent) => void;
  handleCardDragLeave: (cardId: string, event: React.DragEvent) => void;
}

/**
 * 카드 이벤트 핸들러 관련 로직을 관리하는 커스텀 훅
 * @param service 카드 네비게이터 서비스
 * @param loadCards 카드 로드 함수
 * @param setCurrentMode 현재 모드 설정 함수
 * @param setCurrentCardSet 현재 카드 세트 설정 함수
 * @param setIsCardSetFixed 카드 세트 고정 여부 설정 함수
 * @param setIncludeSubfolders 하위 폴더 포함 여부 설정 함수
 * @param setCurrentSortType 현재 정렬 타입 설정 함수
 * @param setCurrentSortDirection 현재 정렬 방향 설정 함수
 * @param setLayout 레이아웃 설정 함수
 * @param setSearchType 검색 타입 설정 함수
 * @param setCaseSensitive 대소문자 구분 여부 설정 함수
 * @param setFrontmatterKey 프론트매터 키 설정 함수
 * @returns 카드 이벤트 핸들러 관련 함수
 */
export const useCardEvents = (
  service: ICardNavigatorService | null,
  loadCards: () => Promise<void>,
  setCurrentMode: (mode: ModeType) => void,
  setCurrentCardSet: (cardSet: string | null) => void,
  setIsCardSetFixed: (isFixed: boolean) => void,
  setIncludeSubfolders: (include: boolean) => void,
  setCurrentSortType: (type: SortType) => void,
  setCurrentSortDirection: (direction: SortDirection) => void,
  setLayout: (layout: 'grid' | 'masonry') => void,
  setSearchType: (type: SearchType) => void,
  setCaseSensitive: (sensitive: boolean) => void,
  setFrontmatterKey: (key: string) => void
): UseCardEventsReturn => {
  /**
   * 모드 변경 핸들러
   */
  const handleModeChange = useCallback(async (mode: ModeType) => {
    if (!service) return;
    
    try {
      await service.changeMode(mode);
      setCurrentMode(mode);
      
      // 모드 서비스에서 현재 카드 세트 가져오기
      const modeService = service.getModeService();
      const currentSet = modeService.getCurrentCardSet();
      setCurrentCardSet(currentSet);
      
      // 카드 세트 고정 여부 가져오기
      const isFixed = modeService.isCardSetFixed();
      setIsCardSetFixed(isFixed);
      
      // 카드 다시 로드
      await loadCards();
    } catch (error) {
      console.error('[CardNavigatorView] 모드 변경 중 오류 발생:', error);
    }
  }, [service, setCurrentMode, setCurrentCardSet, setIsCardSetFixed, loadCards]);
  
  /**
   * 카드 세트 선택 핸들러
   */
  const handleCardSetSelect = useCallback(async (cardSet: string, isFixed: boolean) => {
    if (!service) return;
    
    try {
      // 모드 서비스에서 카드 세트 선택
      const modeService = service.getModeService();
      await modeService.selectCardSet(cardSet, isFixed);
      
      // 현재 카드 세트 업데이트
      setCurrentCardSet(cardSet);
      
      // 카드 세트 고정 여부 업데이트
      const newIsFixed = modeService.isCardSetFixed();
      
      // 이전과 동일한 고정 상태인 경우 상태 업데이트를 건너뛰기
      if (newIsFixed !== isFixed) {
        console.log(`[CardNavigatorView] 이전과 동일한 고정 상태(${isFixed})이므로 상태 업데이트를 건너뜁니다.`);
      } else {
        setIsCardSetFixed(newIsFixed);
      }
      
      console.log(`[CardNavigatorView] 현재 카드 세트 업데이트: ${cardSet}, 고정 여부: ${newIsFixed}`);
      
      // 카드 세트가 변경되었으므로 카드 다시 로드
      console.log('[CardNavigatorView] 카드 세트가 변경되어 카드 목록을 다시 로드합니다.');
      await loadCards();
    } catch (error) {
      console.error('[CardNavigatorView] 카드 세트 선택 중 오류 발생:', error);
    }
  }, [service, setCurrentCardSet, setIsCardSetFixed, loadCards]);
  
  /**
   * 하위 폴더 포함 여부 변경 핸들러
   */
  const handleIncludeSubfoldersChange = useCallback(async (include: boolean) => {
    if (!service) return;
    
    try {
      // 모드 서비스에서 하위 폴더 포함 여부 설정
      const modeService = service.getModeService();
      modeService.setIncludeSubfolders(include);
      
      // 하위 폴더 포함 여부 업데이트
      setIncludeSubfolders(include);
      
      // 카드 다시 로드
      await loadCards();
    } catch (error) {
      console.error('[CardNavigatorView] 하위 폴더 포함 여부 변경 중 오류 발생:', error);
    }
  }, [service, setIncludeSubfolders, loadCards]);
  
  /**
   * 정렬 변경 핸들러
   */
  const handleSortChange = useCallback(async (sortType: SortType, sortDirection: SortDirection) => {
    if (!service) return;
    
    try {
      // 정렬 서비스에서 정렬 변경
      const sortService = service.getSortService();
      sortService.setSortType(sortType, sortDirection);
      
      // 정렬 타입과 방향 업데이트
      setCurrentSortType(sortType);
      setCurrentSortDirection(sortDirection);
      
      // 카드 다시 로드
      await loadCards();
    } catch (error) {
      console.error('[CardNavigatorView] 정렬 변경 중 오류 발생:', error);
    }
  }, [service, setCurrentSortType, setCurrentSortDirection, loadCards]);
  
  /**
   * 레이아웃 변경 핸들러
   */
  const handleLayoutChange = useCallback(async (layoutType: 'grid' | 'masonry') => {
    if (!service) return;
    
    // 레이아웃 서비스에서 레이아웃 변경
    const layoutService = service.getLayoutService();
    layoutService.changeLayoutType(layoutType);
    
    // 레이아웃 업데이트
    setLayout(layoutType);
  }, [service, setLayout]);
  
  /**
   * 검색 핸들러
   */
  const handleSearch = useCallback(async (query: string, type = 'filename') => {
    if (!service) return;
    
    try {
      // 검색 서비스에서 검색 수행
      const searchType = type as SearchType;
      await service.search(query, searchType, false);
      
      // 카드 다시 로드
      await loadCards();
    } catch (error) {
      console.error('[CardNavigatorView] 검색 중 오류 발생:', error);
    }
  }, [service, loadCards]);
  
  /**
   * 검색 타입 변경 핸들러
   */
  const handleSearchTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
  }, [setSearchType]);
  
  /**
   * 대소문자 구분 여부 변경 핸들러
   */
  const handleCaseSensitiveChange = useCallback((sensitive: boolean) => {
    setCaseSensitive(sensitive);
  }, [setCaseSensitive]);
  
  /**
   * 프론트매터 키 변경 핸들러
   */
  const handleFrontmatterKeyChange = useCallback((key: string) => {
    setFrontmatterKey(key);
  }, [setFrontmatterKey]);
  
  /**
   * 카드 클릭 핸들러
   */
  const handleCardClick = useCallback((cardId: string) => {
    if (!service) return;
    
    // 카드 ID로 파일 열기
    try {
      // 카드 ID는 파일 경로이므로 해당 파일을 찾아서 엽니다
      const file = service.getApp().vault.getAbstractFileByPath(cardId);
      if (file && file instanceof TFile) {
        service.getApp().workspace.getLeaf().openFile(file);
      } else {
        console.error(`[CardNavigatorView] 파일을 찾을 수 없습니다: ${cardId}`);
      }
    } catch (error) {
      console.error(`[CardNavigatorView] 카드 열기 중 오류 발생:`, error);
    }
  }, [service]);
  
  /**
   * 카드 컨텍스트 메뉴 핸들러
   */
  const handleCardContextMenu = useCallback((cardId: string, event: React.MouseEvent) => {
    if (!service) return;
    
    // 컨텍스트 메뉴 처리는 Obsidian API에서 직접 지원하지 않으므로 
    // 필요한 경우 여기에 구현하거나 생략할 수 있습니다
    console.log(`[CardNavigatorView] 카드 컨텍스트 메뉴: ${cardId}`);
  }, [service]);
  
  /**
   * 카드 드래그 시작 핸들러
   */
  const handleCardDragStart = useCallback((cardId: string, event: React.DragEvent) => {
    if (!service) return;
    
    // 드래그 시작 처리
    try {
      // 드래그 데이터 설정
      event.dataTransfer.setData('text/plain', cardId);
      console.log(`[CardNavigatorView] 카드 드래그 시작: ${cardId}`);
    } catch (error) {
      console.error(`[CardNavigatorView] 카드 드래그 시작 중 오류 발생:`, error);
    }
  }, [service]);
  
  /**
   * 카드 드래그 종료 핸들러
   */
  const handleCardDragEnd = useCallback((cardId: string, event: React.DragEvent) => {
    // 드래그 종료 처리
    console.log(`[CardNavigatorView] 카드 드래그 종료: ${cardId}`);
  }, []);
  
  /**
   * 카드 드롭 핸들러
   */
  const handleCardDrop = useCallback((cardId: string, event: React.DragEvent) => {
    if (!service) return;
    
    // 드롭 처리
    try {
      const draggedCardId = event.dataTransfer.getData('text/plain');
      console.log(`[CardNavigatorView] 카드 드롭: ${draggedCardId} -> ${cardId}`);
      
      // 여기에 드롭 처리 로직 구현
    } catch (error) {
      console.error(`[CardNavigatorView] 카드 드롭 중 오류 발생:`, error);
    }
  }, [service]);
  
  /**
   * 카드 드래그 오버 핸들러
   */
  const handleCardDragOver = useCallback((cardId: string, event: React.DragEvent) => {
    // 기본 동작 방지 (드롭 허용)
    event.preventDefault();
  }, []);
  
  /**
   * 카드 드래그 엔터 핸들러
   */
  const handleCardDragEnter = useCallback((cardId: string, event: React.DragEvent) => {
    if (!service) return;
    
    // 드래그 엔터 처리
    console.log(`[CardNavigatorView] 카드 드래그 엔터: ${cardId}`);
  }, [service]);
  
  /**
   * 카드 드래그 리브 핸들러
   */
  const handleCardDragLeave = useCallback((cardId: string, event: React.DragEvent) => {
    // 필요한 경우 구현
  }, []);
  
  return {
    handleModeChange,
    handleCardSetSelect,
    handleIncludeSubfoldersChange,
    handleSortChange,
    handleLayoutChange,
    handleSearch,
    handleSearchTypeChange,
    handleCaseSensitiveChange,
    handleFrontmatterKeyChange,
    handleCardClick,
    handleCardContextMenu,
    handleCardDragStart,
    handleCardDragEnd,
    handleCardDrop,
    handleCardDragOver,
    handleCardDragEnter,
    handleCardDragLeave
  };
}; 