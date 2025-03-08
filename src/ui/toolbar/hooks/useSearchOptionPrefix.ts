import type { SearchOption } from '../components/SearchOptionSuggest';

/**
 * 검색 옵션 접두사 관련 로직을 담당하는 훅
 */
export const useSearchOptionPrefix = (searchOptions: SearchOption[]) => {
  /**
   * 검색 옵션 접두사로 검색 옵션 찾기
   */
  const getSearchOptionByPrefix = (text: string): SearchOption | null => {
    try {
      if (!text || text.trim() === '') {
        return null;
      }
      
      // 검색어에서 파이프로 구분된 부분이 있는 경우 마지막 부분만 고려
      const parts = text.split('|');
      const lastPart = parts[parts.length - 1].trim();
      
      // 검색 옵션 접두사 찾기 - 마지막 부분 우선 확인
      for (const option of searchOptions) {
        // 파이프 접두사는 건너뛰기
        if (option.prefix === '|') continue;
        
        // 마지막 부분이 검색 옵션 접두사로 시작하는지 확인
        if (lastPart.startsWith(option.prefix)) {
          console.log(`검색 옵션 접두사 찾음 (마지막 부분): ${option.type}, ${option.prefix}`);
          return option;
        }
      }
      
      // 전체 텍스트가 검색 옵션 접두사로 시작하는지 확인
      for (const option of searchOptions) {
        // 파이프 접두사는 건너뛰기
        if (option.prefix === '|') continue;
        
        if (text.startsWith(option.prefix)) {
          console.log(`검색 옵션 접두사 찾음 (전체 텍스트): ${option.type}, ${option.prefix}`);
          return option;
        }
      }
      
      // 복합 검색에서 각 부분별로 검색 옵션 확인
      if (parts.length > 1) {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          
          for (const option of searchOptions) {
            // 파이프 접두사는 건너뛰기
            if (option.prefix === '|') continue;
            
            if (part.startsWith(option.prefix)) {
              console.log(`검색 옵션 접두사 찾음 (복합 검색): ${option.type}, ${option.prefix}`);
              return option;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('검색 옵션 접두사 찾기 중 오류 발생:', error);
      return null;
    }
  };
  
  return {
    getSearchOptionByPrefix
  };
}; 