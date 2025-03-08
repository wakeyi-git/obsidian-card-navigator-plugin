import { useState, useEffect, useRef } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';

interface UseSearchHistoryProps {
  cardNavigatorService: ICardNavigatorService | null;
  searchText: string;
  setSearchText: (text: string) => void;
  onSearch: (query: string, type?: string) => void;
}

interface UseSearchHistoryReturn {
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  showSearchHistory: boolean;
  setShowSearchHistory: (show: boolean) => void;
  searchHistoryRef: React.RefObject<HTMLDivElement>;
  handleHistoryItemClick: (query: string) => void;
  toggleSearchHistory: () => void;
  clearSearchHistory: () => void;
}

/**
 * 검색 히스토리 관련 로직을 처리하는 훅
 */
export const useSearchHistory = (props: UseSearchHistoryProps): UseSearchHistoryReturn => {
  const { cardNavigatorService, searchText, setSearchText, onSearch } = props;
  
  // 상태
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);
  
  // 참조
  const searchHistoryRef = useRef<HTMLDivElement>(null);
  
  // 검색 기록 로드
  useEffect(() => {
    if (cardNavigatorService) {
      const history = cardNavigatorService.getSearchService().getSearchHistory();
      setSearchHistory(history);
    }
  }, [cardNavigatorService]);
  
  /**
   * 검색 기록 항목 클릭 핸들러
   * @param query 검색어
   */
  const handleHistoryItemClick = (query: string) => {
    // 검색어 설정
    setSearchText(query);
    
    // 검색 실행
    onSearch(query);
    
    // 검색 기록 숨기기
    setShowSearchHistory(false);
  };
  
  /**
   * 검색 기록 토글
   */
  const toggleSearchHistory = () => {
    setShowSearchHistory(!showSearchHistory);
  };
  
  /**
   * 검색 기록 삭제
   */
  const clearSearchHistory = () => {
    if (cardNavigatorService) {
      // 검색 서비스에서 기록 삭제
      const searchService = cardNavigatorService.getSearchService();
      
      // 검색 기록 초기화 메서드가 없는 경우 대체 방법 사용
      if (typeof searchService.clearSearchHistory === 'function') {
        searchService.clearSearchHistory();
      } else {
        // 검색 기록을 빈 배열로 설정하는 방법 (임시)
        for (let i = 0; i < searchHistory.length; i++) {
          searchService.saveSearchHistory('');
        }
      }
      
      // 상태 업데이트
      setSearchHistory([]);
      
      // 알림 표시
      console.log('검색 기록이 삭제되었습니다.');
    }
  };
  
  return {
    searchHistory,
    setSearchHistory,
    showSearchHistory,
    setShowSearchHistory,
    searchHistoryRef,
    handleHistoryItemClick,
    toggleSearchHistory,
    clearSearchHistory
  };
};

export default useSearchHistory;
