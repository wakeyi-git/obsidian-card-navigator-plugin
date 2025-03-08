/**
 * 검색 옵션과 키워드 쌍 관련 로직을 담당하는 훅
 */
export const useSearchOptionPair = () => {
  /**
   * 검색 옵션과 키워드 쌍 다음에 스페이스키가 입력되었는지 확인하는 함수
   */
  const checkIfAfterSearchOptionPair = (text: string): boolean => {
    // 검색어가 비어있거나 스페이스만 있는 경우 false 반환
    if (!text.trim()) {
      return false;
    }
    
    // 마지막 스페이스 이전의 텍스트 추출 (스페이스로 끝나는 경우 제거)
    const textBeforeSpace = text.trimEnd();
    
    // 검색 옵션 패턴 정의
    const prefixPatterns = [
      'file:', 'content:', 'tag:', 'path:', 'folder:', 
      'fm:', 'frontmatter:', 'create:', 'modify:', 'regex:'
    ];
    
    // 텍스트를 공백으로 분리 (큰따옴표로 묶인 부분은 하나의 단위로 처리)
    const parts: string[] = [];
    let currentPart = '';
    let inQuotes = false;
    
    for (let i = 0; i < textBeforeSpace.length; i++) {
      const char = textBeforeSpace[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        currentPart += char;
      } else if (char === ' ' && !inQuotes) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = '';
        }
      } else {
        currentPart += char;
      }
    }
    
    if (currentPart) {
      parts.push(currentPart);
    }
    
    // 마지막 부분이 검색 옵션과 키워드 쌍인지 확인
    if (parts.length === 0) {
      return false;
    }
    
    const lastPart = parts[parts.length - 1];
    
    // 마지막 부분에 검색 옵션 접두사가 있는지 확인
    for (const prefix of prefixPatterns) {
      if (lastPart.startsWith(prefix)) {
        // 접두사 이후에 내용이 있는지 확인
        const content = lastPart.substring(prefix.length).trim();
        
        // 내용이 없으면 false 반환
        if (content.length === 0) {
          return false;
        }
        
        // 큰따옴표로 묶인 키워드가 있는 경우
        if (content.startsWith('"') && content.endsWith('"')) {
          // 큰따옴표 안에 내용이 있는지 확인
          const quotedContent = content.substring(1, content.length - 1);
          return quotedContent.length > 0;
        }
        
        // 일반 키워드인 경우
        return true;
      }
    }
    
    // 프론트매터 검색 패턴 확인
    const frontmatterMatch = lastPart.match(/\[([^\]]+)\]:(.*)/);
    if (frontmatterMatch) {
      const value = frontmatterMatch[2].trim();
      
      // 큰따옴표로 묶인 값이 있는 경우
      if (value.startsWith('"') && value.endsWith('"')) {
        const quotedValue = value.substring(1, value.length - 1);
        return quotedValue.length > 0;
      }
      
      return value.length > 0;
    }
    
    return false;
  };
  
  return {
    checkIfAfterSearchOptionPair
  };
}; 