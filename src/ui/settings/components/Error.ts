import { log_error } from "./Log";

export class CardNavigatorError extends Error {
    constructor(msg: string, public console_msg?: string) {
        super(msg);
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

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

export function errorWrapperSync<T>(fn: () => T, msg: string): T {
    try {
        return fn();
    } catch (e) {
        const error = e as Error; // 타입 명시
        log_error(new CardNavigatorError(msg, error.message));
        return null as T;
    }
}
