import { log_error } from "./Log";

/**
 * Card Navigator의 에러 처리를 위한 유틸리티 모음입니다.
 */

//#region 에러 클래스
/**
 * Card Navigator 전용 에러 클래스
 * 일반 에러 메시지와 콘솔용 상세 메시지를 함께 처리할 수 있습니다.
 */
export class CardNavigatorError extends Error {
    constructor(msg: string, public console_msg?: string) {
        super(msg);
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
//#endregion

//#region 에러 래퍼 함수
/**
 * 비동기 함수의 에러를 처리하는 래퍼 함수
 * @param fn - 실행할 비동기 함수
 * @param msg - 에러 발생 시 표시할 메시지
 * @returns 함수 실행 결과 또는 에러 발생 시 null
 */
export async function errorWrapper<T>(
    fn: () => Promise<T>,
    msg: string
): Promise<T> {
    try {
        return await fn();
    } catch (e) {
        const error = e as Error; // 타입 명시
        if (!(error instanceof CardNavigatorError)) {
            log_error(new CardNavigatorError(msg, error.message));
        } else {
            log_error(error);
        }
        return null as T;
    }
}

/**
 * 동기 함수의 에러를 처리하는 래퍼 함수
 * @param fn - 실행할 동기 함수
 * @param msg - 에러 발생 시 표시할 메시지
 * @returns 함수 실행 결과 또는 에러 발생 시 null
 */
export function errorWrapperSync<T>(fn: () => T, msg: string): T {
    try {
        return fn();
    } catch (e) {
        const error = e as Error; // 타입 명시
        log_error(new CardNavigatorError(msg, error.message));
        return null as T;
    }
}
//#endregion
