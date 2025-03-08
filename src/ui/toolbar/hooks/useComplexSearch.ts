import { useState } from 'react';

/**
 * 복합 검색 관련 로직을 담당하는 훅
 */
export const useComplexSearch = () => {
  // 복합 검색 여부 상태
  const [isComplexSearch, setIsComplexSearch] = useState<boolean>(false);
  
  /**
   * 복합 검색 여부를 업데이트하는 함수
   * @param text 검색어
   * @returns 복합 검색 여부
   */
  const updateComplexSearchStatus = (text: string): boolean => {
    try {
      // 검색 접두사 패턴 정의
      const prefixPatterns = [
        'file:', 'content:', 'tag:', 'path:', 'folder:', 
        'fm:', 'frontmatter:', 'create:', 'modify:', 'regex:'
      ];
      
      // 검색어에 포함된 접두사 개수 확인
      let prefixCount = 0;
      for (const prefix of prefixPatterns) {
        let pos = text.indexOf(prefix);
        while (pos !== -1) {
          // 접두사 앞에 공백이 있거나 문자열 시작인 경우에만 유효한 접두사로 간주
          if (pos === 0 || text[pos - 1] === ' ') {
            prefixCount++;
          }
          pos = text.indexOf(prefix, pos + 1);
        }
      }
      
      // 프론트매터 검색 패턴 확인
      const frontmatterMatches = text.match(/\[([^\]]+)\]:/g);
      if (frontmatterMatches) {
        prefixCount += frontmatterMatches.length;
      }
      
      // 접두사가 2개 이상이면 복합 검색으로 간주
      const isComplex = prefixCount >= 2;
      setIsComplexSearch(isComplex);
      
      console.log('복합 검색 여부 업데이트:', { isComplex, prefixCount, text });
      
      return isComplex;
    } catch (error) {
      console.error('복합 검색 여부 업데이트 중 오류 발생:', error);
      return false;
    }
  };
  
  return {
    isComplexSearch,
    setIsComplexSearch,
    updateComplexSearchStatus
  };
}; 