/**
 * 번역 시스템
 * 플러그인의 다국어 지원을 위한 번역 유틸리티 및 인터페이스를 제공합니다.
 */

/**
 * 번역 키 타입
 * 번역 가능한 모든 문자열 키를 정의합니다.
 */
export type TranslationKey =
  // 일반
  | 'plugin_name'
  | 'plugin_description'
  
  // 설정
  | 'settings'
  | 'settings_general'
  | 'settings_card_content'
  | 'settings_card_style'
  | 'settings_layout'
  | 'settings_presets'
  | 'settings_keyboard'
  | 'settings_advanced'
  
  // 카드 내용
  | 'card_content_show_filename'
  | 'card_content_show_first_header'
  | 'card_content_show_content'
  | 'card_content_content_length'
  | 'card_content_show_tags'
  | 'card_content_show_date'
  | 'card_content_date_format'
  
  // 카드 스타일
  | 'card_style_font_size'
  | 'card_style_title_font_size'
  | 'card_style_content_font_size'
  | 'card_style_tag_font_size'
  | 'card_style_padding'
  | 'card_style_border'
  | 'card_style_border_radius'
  | 'card_style_shadow'
  | 'card_style_background'
  
  // 레이아웃
  | 'layout_card_width'
  | 'layout_card_height'
  | 'layout_align_height'
  | 'layout_direction'
  | 'layout_spacing'
  | 'layout_cards_per_view'
  
  // 프리셋
  | 'preset_create'
  | 'preset_edit'
  | 'preset_delete'
  | 'preset_import'
  | 'preset_export'
  | 'preset_apply'
  | 'preset_folder_specific'
  
  // 검색
  | 'search_placeholder'
  | 'search_no_results'
  | 'search_options'
  | 'search_in_title'
  | 'search_in_content'
  | 'search_in_tags'
  
  // 카드셋
  | 'cardset_mode'
  | 'cardset_active_folder'
  | 'cardset_selected_folder'
  | 'cardset_vault'
  | 'cardset_search_results'
  
  // 툴바
  | 'toolbar_sort'
  | 'toolbar_filter'
  | 'toolbar_view'
  | 'toolbar_preset'
  | 'toolbar_refresh'
  
  // 정렬
  | 'sort_by_filename'
  | 'sort_by_created'
  | 'sort_by_modified'
  | 'sort_by_size'
  | 'sort_ascending'
  | 'sort_descending'
  
  // 언어 설정
  | 'language_settings'
  | 'language_use_system'
  | 'language_use_system_desc'
  | 'language_select'
  | 'language_select_desc'
  
  // 오류 메시지
  | 'error_generic'
  | 'error_file_not_found'
  | 'error_preset_not_found'
  | 'error_layout_update'
  
  // 기타
  | 'confirm'
  | 'cancel'
  | 'save'
  | 'delete'
  | 'edit'
  | 'create'
  | 'import'
  | 'export'
  | 'reset'
  | 'apply';

/**
 * 번역 인터페이스
 * 특정 언어의 모든 번역을 포함합니다.
 */
export interface Translation {
  locale: string;
  name: string;
  translations: Record<TranslationKey, string>;
}

/**
 * 번역 서비스 클래스
 * 플러그인의 다국어 지원을 관리합니다.
 */
export class TranslationService {
  private static instance: TranslationService;
  private translations: Map<string, Translation> = new Map();
  private currentLocale: string = 'en';
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }
  
  /**
   * 번역 추가
   * @param translation 번역 객체
   */
  public addTranslation(translation: Translation): void {
    this.translations.set(translation.locale, translation);
  }
  
  /**
   * 현재 로케일 설정
   * @param locale 로케일 코드
   */
  public setLocale(locale: string): void {
    if (this.translations.has(locale)) {
      this.currentLocale = locale;
    } else if (this.translations.has('en')) {
      // 요청된 로케일이 없으면 영어로 폴백
      this.currentLocale = 'en';
    } else {
      // 영어도 없으면 첫 번째 사용 가능한 로케일 사용
      const firstLocale = this.translations.keys().next().value;
      this.currentLocale = firstLocale || 'en';
    }
  }
  
  /**
   * 현재 로케일 가져오기
   */
  public getLocale(): string {
    return this.currentLocale;
  }
  
  /**
   * 사용 가능한 모든 로케일 가져오기
   */
  public getAvailableLocales(): string[] {
    return Array.from(this.translations.keys());
  }
  
  /**
   * 번역 가져오기
   * @param key 번역 키
   * @param params 번역 매개변수
   */
  public t(key: TranslationKey, params?: Record<string, string>): string {
    const translation = this.translations.get(this.currentLocale);
    
    if (!translation) {
      return key;
    }
    
    let text = translation.translations[key] || key;
    
    // 매개변수 적용
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
      });
    }
    
    return text;
  }
}

/**
 * 번역 서비스 인스턴스
 */
export const t = TranslationService.getInstance();

/**
 * 번역 함수
 * @param key 번역 키
 * @param params 번역 매개변수
 */
export function translate(key: TranslationKey, params?: Record<string, string>): string {
  return t.t(key, params);
} 