import { useState, useEffect, RefObject } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';

interface UseSearchHistoryProps {
  cardNavigatorService: ICardNavigatorService | null;
  isVisible: boolean;
}

interface UseSearchHistoryReturn {
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  handleHistoryItemClick: (query: string, callback: (query: string) => void) => void;
}

/**
 * 검색 기록 관련 로직을 처리하는 훅
 */
export const useSearchHistory = (
  props: UseSearchHistoryProps,
  historyRef: RefObject<HTMLDivElement>,
  inputRef: RefObject<HTMLInputElement>,
  setShowSearchHistory: (show: boolean) => void
): UseSearchHistoryReturn => {
  const { cardNavigatorService, isVisible } = props;
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // 검색 기록 로드
  useEffect(() => {
    if (cardNavigatorService) {
      const history = cardNavigatorService.getSearchService().getSearchHistory();
      setSearchHistory(history);
    }
  }, [cardNavigatorService]);
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      try {
        // 검색 기록 외부 클릭 감지
        if (
          isVisible &&
          historyRef.current && 
          !historyRef.current.contains(target) &&
          inputRef.current && 
          !inputRef.current.contains(target)
        ) {
          setShowSearchHistory(false);
        }
      } catch (error) {
        console.error('외부 클릭 처리 중 오류 발생:', error);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, historyRef, inputRef, setShowSearchHistory]);
  
  /**
   * 검색 기록 항목 클릭 핸들러
   */
  const handleHistoryItemClick = (query: string, callback: (query: string) => void) => {
    // 검색 기록 숨기기
    setShowSearchHistory(false);
    
    // 콜백 실행 (검색 실행)
    callback(query);
  };
  
  return {
    searchHistory,
    setSearchHistory,
    handleHistoryItemClick
  };
};

export default useSearchHistory;
