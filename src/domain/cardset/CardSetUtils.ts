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
 * 두 카드셋 ID가 동일한지 확인합니다.
 * @param id1 첫 번째 카드셋 ID
 * @param id2 두 번째 카드셋 ID
 * @param debug 디버그 모드 활성화 여부 (기본값: false)
 * @returns 두 ID가 동일한지 여부
 */
export function isSameCardSetId(id1: string | undefined, id2: string | undefined, debug: boolean = false): boolean {
  // 둘 다 undefined인 경우 동일하다고 간주
  if (id1 === undefined && id2 === undefined) {
    if (debug) console.log('isSameCardSetId: 둘 다 undefined, 동일함');
    return true;
  }
  
  // 하나만 undefined인 경우 다름
  if (id1 === undefined || id2 === undefined) {
    if (debug) console.log('isSameCardSetId: 하나만 undefined, 다름');
    return false;
  }
  
  // ID가 정확히 일치하는 경우
  if (id1 === id2) {
    if (debug) console.log('isSameCardSetId: ID 정확히 일치');
    return true;
  }
  
  // 소스 타입 추출
  const sourceType1 = extractSourceTypeFromCardSetId(id1);
  const sourceType2 = extractSourceTypeFromCardSetId(id2);
  
  // 소스 타입이 다른 경우
  if (sourceType1 !== sourceType2) {
    if (debug) console.log(`isSameCardSetId: 소스 타입 다름 (${sourceType1} vs ${sourceType2})`);
    return false;
  }
  
  // 소스 추출
  const source1 = extractSourceFromCardSetId(id1);
  const source2 = extractSourceFromCardSetId(id2);
  
  // 소스가 다른 경우
  if (source1 !== source2) {
    if (debug) console.log(`isSameCardSetId: 소스 다름 (${source1} vs ${source2})`);
    return false;
  }
  
  // 모든 조건을 통과하면 동일함
  if (debug) console.log('isSameCardSetId: 모든 조건 통과, 동일함');
  return true;
} 