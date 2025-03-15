import { CardSetSourceType, CardSetType } from './CardSet';

/**
 * 카드셋 ID 생성 유틸리티
 * 카드셋 ID를 일관되게 생성하기 위한 유틸리티 함수들입니다.
 */

/**
 * 폴더 카드셋 ID 생성
 * @param folderPath 폴더 경로
 * @returns 카드셋 ID
 */
export function createFolderCardSetId(folderPath: string): string {
  return `folder:${folderPath}`;
}

/**
 * 태그 카드셋 ID 생성
 * @param tag 태그
 * @returns 카드셋 ID
 */
export function createTagCardSetId(tag: string): string {
  return `tag:${tag}`;
}

/**
 * 검색 카드셋 ID 생성
 * @param query 검색 쿼리
 * @returns 카드셋 ID
 */
export function createSearchCardSetId(query: string): string {
  return `search:${query}`;
}

/**
 * 카드셋 ID 생성
 * @param sourceType 소스 타입
 * @param source 소스 (폴더 경로, 태그, 검색 쿼리 등)
 * @returns 카드셋 ID
 */
export function createCardSetId(sourceType: CardSetSourceType, source: string): string {
  switch (sourceType) {
    case 'folder':
      return createFolderCardSetId(source);
    case 'tag':
      return createTagCardSetId(source);
    case 'search':
      return createSearchCardSetId(source);
    default:
      return `${sourceType}:${source}`;
  }
}

/**
 * 빈 카드셋 ID 생성
 * @param sourceType 소스 타입
 * @returns 빈 카드셋 ID
 */
export function createEmptyCardSetId(sourceType: CardSetSourceType): string {
  return `empty-${sourceType}`;
}

/**
 * 카드셋 ID에서 소스 타입 추출
 * @param cardSetId 카드셋 ID
 * @returns 소스 타입
 */
export function extractSourceTypeFromCardSetId(cardSetId: string | undefined): CardSetSourceType | null {
  if (!cardSetId) return null;
  
  if (cardSetId.startsWith('folder:')) {
    return 'folder';
  } else if (cardSetId.startsWith('tag:')) {
    return 'tag';
  } else if (cardSetId.startsWith('search:')) {
    return 'search';
  } else if (cardSetId.startsWith('empty-')) {
    const parts = cardSetId.split('-');
    if (parts.length > 1) {
      return parts[1] as CardSetSourceType;
    }
  }
  return null;
}

/**
 * 카드셋 ID에서 소스 추출
 * @param cardSetId 카드셋 ID
 * @returns 소스
 */
export function extractSourceFromCardSetId(cardSetId: string | undefined): string | null {
  if (!cardSetId) return null;
  
  if (cardSetId.startsWith('folder:') || cardSetId.startsWith('tag:') || cardSetId.startsWith('search:')) {
    const parts = cardSetId.split(':');
    if (parts.length > 1) {
      return parts.slice(1).join(':'); // 콜론이 여러 개 있을 경우를 대비해 나머지 부분을 모두 합침
    }
  }
  return null;
}

/**
 * 두 카드셋 ID가 동일한지 비교
 * @param id1 첫 번째 카드셋 ID
 * @param id2 두 번째 카드셋 ID
 * @returns 동일 여부
 */
export function isSameCardSetId(id1: string | undefined, id2: string | undefined): boolean {
  console.log('카드셋 ID 비교:', { id1, id2 });
  
  // 둘 다 undefined인 경우 동일하다고 간주
  if (id1 === undefined && id2 === undefined) {
    console.log('둘 다 undefined, 동일하다고 간주');
    return true;
  }
  
  // 하나만 undefined인 경우 다른 것으로 간주
  if (id1 === undefined || id2 === undefined) {
    console.log('하나만 undefined, 다른 것으로 간주');
    return false;
  }
  
  // 두 ID가 정확히 같으면 동일
  if (id1 === id2) {
    console.log('두 ID가 정확히 같음, 동일하다고 간주');
    return true;
  }
  
  // 소스 타입 추출
  const sourceType1 = extractSourceTypeFromCardSetId(id1);
  const sourceType2 = extractSourceTypeFromCardSetId(id2);
  console.log('소스 타입 추출:', { sourceType1, sourceType2 });
  
  // 소스 타입이 다르면 다른 카드셋
  if (sourceType1 !== sourceType2) {
    console.log('소스 타입이 다름, 다른 카드셋으로 간주');
    return false;
  }
  
  // 소스 추출
  const source1 = extractSourceFromCardSetId(id1);
  const source2 = extractSourceFromCardSetId(id2);
  console.log('소스 추출:', { source1, source2 });
  
  // 소스가 같으면 동일한 카드셋
  const result = source1 === source2;
  console.log('소스 비교 결과:', result);
  
  // 활성 파일 폴더와 소스 비교 (디버깅용)
  try {
    // @ts-ignore - 전역 app 객체 접근 (Obsidian API)
    const activeFile = app?.workspace?.getActiveFile?.();
    const activeFolder = activeFile?.parent?.path;
    console.log('활성 파일 폴더와 소스 비교:', {
      활성폴더: activeFolder,
      소스1: source1,
      소스2: source2,
      소스1일치: activeFolder === source1,
      소스2일치: activeFolder === source2
    });
  } catch (e) {
    // 오류 무시
  }
  
  return result;
} 