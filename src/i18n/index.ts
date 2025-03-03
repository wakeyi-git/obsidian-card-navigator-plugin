import { TranslationService, translate, t } from './translations';
import en from './en';
import ko from './ko';

/**
 * 번역 시스템 초기화
 * 사용 가능한 모든 번역을 등록하고 기본 로케일을 설정합니다.
 * @param locale 기본 로케일 (기본값: 'en')
 */
export function initializeTranslations(locale: string = 'en'): void {
  // 번역 등록
  t.addTranslation(en);
  t.addTranslation(ko);
  
  // 기본 로케일 설정
  t.setLocale(locale);
}

export { translate, t };
export type { TranslationKey } from './translations'; 