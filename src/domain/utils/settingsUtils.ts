import { IPluginSettings, DEFAULT_PLUGIN_SETTINGS } from '../models/PluginSettings';

/**
 * 객체의 깊은 복사본 생성
 * @param obj 복사할 객체
 * @returns 객체의 깊은 복사본
 */
export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 중첩 객체의 특정 경로에 있는 값을 안전하게 업데이트
 * @param settings 업데이트할 설정 객체
 * @param path 속성 경로 (점으로 구분된 문자열)
 * @param value 설정할 새 값
 * @returns 업데이트된 설정 객체의 복사본
 */
export function updateNestedSettings<T>(
  settings: T,
  path: string,
  value: any
): T {
  // 원본 객체의 복사본 생성
  const result = deepCopy(settings);
  
  // 경로 분할
  const pathParts = path.split('.');
  
  // 중첩 객체 탐색
  let current: any = result;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    
    // 배열 인덱스 처리
    if (part.includes('[') && part.includes(']')) {
      const arrayName = part.substring(0, part.indexOf('['));
      const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));
      
      if (!current[arrayName]) current[arrayName] = [];
      if (!current[arrayName][index]) current[arrayName][index] = {};
      
      current = current[arrayName][index];
    } else {
      if (!current[part]) current[part] = {};
      current = current[part];
    }
  }
  
  // 최종 값 설정
  const lastPart = pathParts[pathParts.length - 1];
  
  // 배열 인덱스 처리
  if (lastPart.includes('[') && lastPart.includes(']')) {
    const arrayName = lastPart.substring(0, lastPart.indexOf('['));
    const index = parseInt(lastPart.substring(lastPart.indexOf('[') + 1, lastPart.indexOf(']')));
    
    if (!current[arrayName]) current[arrayName] = [];
    current[arrayName][index] = value;
  } else {
    current[lastPart] = value;
  }
  
  return result;
}

/**
 * 플러그인 설정 업데이트 유틸리티
 * @param settings 기존 설정
 * @param updater 업데이트 함수
 * @returns 업데이트된 설정
 */
export function updateSettings(
  settings: IPluginSettings,
  updater: (draft: IPluginSettings) => void
): IPluginSettings {
  // 설정 복사본 생성
  const draft = deepCopy(settings);
  
  // 업데이트 함수 적용
  updater(draft);
  
  // 업데이트된 설정 반환
  return draft;
}

/**
 * 설정 유틸리티 클래스
 */
export class SettingsUtils {
  /**
   * 기본 설정 생성
   * @returns 기본 설정
   */
  static createDefaultSettings(): IPluginSettings {
    return deepCopy(DEFAULT_PLUGIN_SETTINGS);
  }

  /**
   * 설정 유효성 검사
   * @param settings 설정
   * @returns 유효성 검사 결과
   */
  static validateSettings(settings: IPluginSettings): boolean {
    return !!(
      settings &&
      settings.card &&
      settings.cardSet &&
      settings.layout &&
      settings.sort &&
      settings.search &&
      settings.preset
    );
  }

  /**
   * 설정 병합
   * @param base 기본 설정
   * @param override 덮어쓸 설정
   * @returns 병합된 설정
   */
  static mergeSettings(base: IPluginSettings, override: Partial<IPluginSettings>): IPluginSettings {
    return {
      ...base,
      ...override,
    };
  }

  public static updateSettings(settings: IPluginSettings, updater: (draft: IPluginSettings) => void): IPluginSettings {
    const draft = { ...settings };
    updater(draft);
    return draft;
  }
}