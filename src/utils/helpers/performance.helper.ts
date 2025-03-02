import { Log } from '../log/Log';

/**
 * 성능 측정 헬퍼 함수 모음
 * 코드 실행 시간 측정, 성능 최적화 등에 사용되는 유틸리티 함수들입니다.
 */

/**
 * 성능 측정 결과 인터페이스
 */
export interface PerformanceResult {
  /** 측정 이름 */
  name: string;
  /** 시작 시간 (밀리초) */
  startTime: number;
  /** 종료 시간 (밀리초) */
  endTime: number;
  /** 소요 시간 (밀리초) */
  duration: number;
}

/**
 * 활성 성능 측정 맵
 * 키: 측정 이름, 값: 시작 시간
 */
const activePerformanceMeasurements: Map<string, number> = new Map();

/**
 * 완료된 성능 측정 결과 배열
 */
const completedPerformanceMeasurements: PerformanceResult[] = [];

/**
 * 성능 측정 시작
 * @param name 측정 이름
 * @param logStart 시작 로깅 여부
 * @returns 시작 시간 (밀리초)
 */
export function startPerformanceMeasurement(name: string, logStart: boolean = false): number {
  const startTime = performance.now();
  activePerformanceMeasurements.set(name, startTime);
  
  if (logStart) {
    Log.debug(`성능 측정 시작: ${name}`);
  }
  
  return startTime;
}

/**
 * 성능 측정 종료
 * @param name 측정 이름
 * @param logResult 결과 로깅 여부
 * @returns 성능 측정 결과 또는 undefined (측정이 시작되지 않은 경우)
 */
export function endPerformanceMeasurement(name: string, logResult: boolean = true): PerformanceResult | undefined {
  const startTime = activePerformanceMeasurements.get(name);
  
  if (startTime === undefined) {
    Log.warn(`성능 측정 종료 실패: ${name} (시작되지 않음)`);
    return undefined;
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // 활성 측정에서 제거
  activePerformanceMeasurements.delete(name);
  
  // 결과 생성
  const result: PerformanceResult = {
    name,
    startTime,
    endTime,
    duration
  };
  
  // 완료된 측정에 추가
  completedPerformanceMeasurements.push(result);
  
  // 결과 로깅
  if (logResult) {
    Log.debug(`성능 측정 완료: ${name} (${duration.toFixed(2)}ms)`);
  }
  
  return result;
}

/**
 * 함수 실행 성능 측정
 * 함수 실행 시간을 측정하고 결과를 반환합니다.
 * @param name 측정 이름
 * @param fn 측정할 함수
 * @param logResult 결과 로깅 여부
 * @returns 함수 실행 결과
 */
export function measurePerformance<T>(name: string, fn: () => T, logResult: boolean = true): T {
  startPerformanceMeasurement(name, false);
  const result = fn();
  endPerformanceMeasurement(name, logResult);
  return result;
}

/**
 * 비동기 성능 측정 함수 래퍼
 * 비동기 함수 실행 시간을 측정합니다.
 * @param name 측정 이름
 * @param fn 측정할 비동기 함수
 * @param logResult 결과 로깅 여부
 * @returns 비동기 함수 실행 결과를 포함한 Promise
 */
export async function measurePerformanceAsync<T>(name: string, fn: () => Promise<T>, logResult: boolean = true): Promise<T> {
  startPerformanceMeasurement(name, false);
  const result = await fn();
  endPerformanceMeasurement(name, logResult);
  return result;
}

/**
 * 모든 활성 성능 측정 종료
 * @param logResults 결과 로깅 여부
 * @returns 종료된 성능 측정 결과 배열
 */
export function endAllPerformanceMeasurements(logResults: boolean = true): PerformanceResult[] {
  const results: PerformanceResult[] = [];
  
  for (const [name] of activePerformanceMeasurements) {
    const result = endPerformanceMeasurement(name, logResults);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}

/**
 * 완료된 성능 측정 결과 가져오기
 * @returns 완료된 성능 측정 결과 배열
 */
export function getCompletedPerformanceMeasurements(): PerformanceResult[] {
  return [...completedPerformanceMeasurements];
}

/**
 * 완료된 성능 측정 결과 지우기
 */
export function clearCompletedPerformanceMeasurements(): void {
  completedPerformanceMeasurements.length = 0;
}

/**
 * 성능 측정 결과 요약 생성
 * @returns 성능 측정 결과 요약 문자열
 */
export function getPerformanceSummary(): string {
  if (completedPerformanceMeasurements.length === 0) {
    return '성능 측정 결과 없음';
  }
  
  // 이름별로 그룹화
  const groupedByName = completedPerformanceMeasurements.reduce((acc, result) => {
    if (!acc[result.name]) {
      acc[result.name] = [];
    }
    acc[result.name].push(result.duration);
    return acc;
  }, {} as Record<string, number[]>);
  
  // 요약 생성
  const summaryLines = Object.entries(groupedByName).map(([name, durations]) => {
    const count = durations.length;
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    const avg = total / count;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return `${name}: ${count}회 호출, 평균 ${avg.toFixed(2)}ms, 최소 ${min.toFixed(2)}ms, 최대 ${max.toFixed(2)}ms, 총 ${total.toFixed(2)}ms`;
  });
  
  return summaryLines.join('\n');
}

/**
 * 디바운스 함수
 * 연속적으로 발생하는 이벤트를 그룹화하여 마지막 이벤트만 처리합니다.
 * @param func 실행할 함수
 * @param wait 대기 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * 스로틀 함수
 * 연속적으로 발생하는 이벤트를 일정 시간 간격으로 처리합니다.
 * @param func 실행할 함수
 * @param limit 제한 시간 (밀리초)
 * @returns 스로틀된 함수
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: NodeJS.Timeout | null = null;
  let lastRan = 0;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      if (lastFunc !== null) {
        clearTimeout(lastFunc);
      }
      
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * 함수 실행 성능 측정 데코레이터
 * 함수를 래핑하여 실행 시간을 측정하고 결과를 로깅합니다.
 * @param func 원본 함수
 * @param label 측정 라벨
 * @returns 원본 함수와 동일한 결과를 반환하는 래핑된 함수
 */
export function measurePerformanceDecorator<T extends (...args: any[]) => any>(
  func: T,
  label: string
): (...args: Parameters<T>) => ReturnType<T> {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    const duration = end - start;
    
    Log.debug(`성능 측정 [${label}]: ${duration.toFixed(2)}ms`);
    
    return result;
  };
}

/**
 * 메모이제이션 함수
 * 동일한 인수로 호출 시 이전 결과를 재사용합니다.
 * @param fn 메모이제이션할 함수
 * @returns 메모이제이션된 함수
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    // 인수를 문자열로 변환하여 캐시 키로 사용
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * 비동기 메모이제이션 함수
 * 동일한 인수로 호출 시 이전 결과를 재사용합니다.
 * @param fn 메모이제이션할 비동기 함수
 * @returns 메모이제이션된 비동기 함수
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  const cache = new Map<string, Promise<Awaited<ReturnType<T>>>>();
  
  return function(this: any, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    // 인수를 문자열로 변환하여 캐시 키로 사용
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
} 