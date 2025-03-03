/**
 * 날짜 처리 헬퍼 함수 모음
 * 날짜 포맷팅, 변환, 계산 등에 사용되는 유틸리티 함수들입니다.
 */

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 포맷팅합니다.
 * @param date 포맷팅할 날짜
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 YYYY-MM-DD HH:MM:SS 형식의 문자열로 포맷팅합니다.
 * @param date 포맷팅할 날짜
 * @returns YYYY-MM-DD HH:MM:SS 형식의 문자열
 */
export function formatDateTimeYYYYMMDDHHMMSS(date: Date): string {
  const dateStr = formatDateYYYYMMDD(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * 날짜를 사용자 정의 형식의 문자열로 포맷팅합니다.
 * @param date 포맷팅할 날짜
 * @param format 포맷 문자열 (YYYY: 연도, MM: 월, DD: 일, HH: 시간, mm: 분, ss: 초)
 * @returns 포맷팅된 문자열
 */
export function formatDate(date: Date, format: string): string {
  const tokens: Record<string, string> = {
    'YYYY': String(date.getFullYear()),
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'DD': String(date.getDate()).padStart(2, '0'),
    'HH': String(date.getHours()).padStart(2, '0'),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'ss': String(date.getSeconds()).padStart(2, '0'),
    'M': String(date.getMonth() + 1),
    'D': String(date.getDate()),
    'H': String(date.getHours()),
    'm': String(date.getMinutes()),
    's': String(date.getSeconds())
  };
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss|M|D|H|m|s/g, match => tokens[match]);
}

/**
 * Unix 타임스탬프를 Date 객체로 변환합니다.
 * @param timestamp Unix 타임스탬프 (밀리초)
 * @returns Date 객체
 */
export function fromUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Date 객체를 Unix 타임스탬프로 변환합니다.
 * @param date Date 객체
 * @returns Unix 타임스탬프 (밀리초)
 */
export function toUnixTimestamp(date: Date): number {
  return date.getTime();
}

/**
 * 현재 날짜와 시간을 반환합니다.
 * @returns 현재 날짜와 시간을 나타내는 Date 객체
 */
export function now(): Date {
  return new Date();
}

/**
 * 현재 날짜를 반환합니다. (시간은 00:00:00으로 설정)
 * @returns 현재 날짜를 나타내는 Date 객체
 */
export function today(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  
  return date;
}

/**
 * 내일 날짜를 반환합니다. (시간은 00:00:00으로 설정)
 * @returns 내일 날짜를 나타내는 Date 객체
 */
export function tomorrow(): Date {
  const date = today();
  date.setDate(date.getDate() + 1);
  
  return date;
}

/**
 * 어제 날짜를 반환합니다. (시간은 00:00:00으로 설정)
 * @returns 어제 날짜를 나타내는 Date 객체
 */
export function yesterday(): Date {
  const date = today();
  date.setDate(date.getDate() - 1);
  
  return date;
}

/**
 * 주어진 날짜에 일수를 더합니다.
 * @param date 기준 날짜
 * @param days 더할 일수 (음수도 가능)
 * @returns 계산된 날짜
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  
  return result;
}

/**
 * 주어진 날짜에 월수를 더합니다.
 * @param date 기준 날짜
 * @param months 더할 월수 (음수도 가능)
 * @returns 계산된 날짜
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  
  return result;
}

/**
 * 주어진 날짜에 연수를 더합니다.
 * @param date 기준 날짜
 * @param years 더할 연수 (음수도 가능)
 * @returns 계산된 날짜
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  
  return result;
}

/**
 * 두 날짜 사이의 일수 차이를 계산합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 일수 차이 (date1 - date2)
 */
export function daysDifference(date1: Date, date2: Date): number {
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
  return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

/**
 * 두 날짜 사이의 월수 차이를 계산합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 월수 차이 (date1 - date2)
 */
export function monthsDifference(date1: Date, date2: Date): number {
  const months1 = date1.getFullYear() * 12 + date1.getMonth();
  const months2 = date2.getFullYear() * 12 + date2.getMonth();
  
  return months1 - months2;
}

/**
 * 두 날짜 사이의 연수 차이를 계산합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 연수 차이 (date1 - date2)
 */
export function yearsDifference(date1: Date, date2: Date): number {
  return date1.getFullYear() - date2.getFullYear();
}

/**
 * 날짜가 유효한지 확인합니다.
 * @param date 확인할 날짜
 * @returns 유효한 날짜인지 여부
 */
export function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

/**
 * 두 날짜가 같은 날인지 확인합니다. (시간은 무시)
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 같은 날인지 여부
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 두 날짜가 같은 월인지 확인합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 같은 월인지 여부
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

/**
 * 두 날짜가 같은 연도인지 확인합니다.
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 같은 연도인지 여부
 */
export function isSameYear(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear();
}

/**
 * 날짜가 오늘인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 오늘인지 여부
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 날짜가 어제인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 어제인지 여부
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return isSameDay(date, yesterday);
}

/**
 * 날짜가 내일인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 내일인지 여부
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return isSameDay(date, tomorrow);
}

/**
 * 날짜가 주말인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 주말인지 여부
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  
  return day === 0 || day === 6; // 0: 일요일, 6: 토요일
}

/**
 * 날짜가 평일인지 확인합니다.
 * @param date 확인할 날짜
 * @returns 평일인지 여부
 */
export function isWeekday(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * 날짜의 시간을 00:00:00으로 설정합니다.
 * @param date 설정할 날짜
 * @returns 시간이 00:00:00으로 설정된 날짜
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  
  return result;
}

/**
 * 날짜의 시간을 23:59:59.999로 설정합니다.
 * @param date 설정할 날짜
 * @returns 시간이 23:59:59.999로 설정된 날짜
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  
  return result;
}

/**
 * 날짜가 속한 월의 첫 날을 반환합니다.
 * @param date 기준 날짜
 * @returns 월의 첫 날
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  
  return result;
}

/**
 * 날짜가 속한 월의 마지막 날을 반환합니다.
 * @param date 기준 날짜
 * @returns 월의 마지막 날
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  
  return result;
}

/**
 * 날짜가 속한 연도의 첫 날을 반환합니다.
 * @param date 기준 날짜
 * @returns 연도의 첫 날
 */
export function startOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  
  return result;
}

/**
 * 날짜가 속한 연도의 마지막 날을 반환합니다.
 * @param date 기준 날짜
 * @returns 연도의 마지막 날
 */
export function endOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(11, 31);
  result.setHours(23, 59, 59, 999);
  
  return result;
}

/**
 * 상대적인 시간 표현을 반환합니다. (예: "방금 전", "1시간 전", "어제" 등)
 * @param date 기준 날짜
 * @param baseDate 비교 기준 날짜 (기본값: 현재 시간)
 * @returns 상대적인 시간 표현
 */
export function getRelativeTimeString(date: Date, baseDate: Date = new Date()): string {
  const diffMs = baseDate.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) {
    return '방금 전';
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay === 1) {
    return '어제';
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else if (diffDay < 30) {
    return `${Math.floor(diffDay / 7)}주 전`;
  } else if (diffDay < 365) {
    return `${Math.floor(diffDay / 30)}개월 전`;
  } else {
    return `${Math.floor(diffDay / 365)}년 전`;
  }
} 