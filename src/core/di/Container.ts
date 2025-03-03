import { Log } from "../../utils/log/Log";

/**
 * 의존성 주입 컨테이너 클래스
 * 서비스와 컴포넌트의 의존성을 관리합니다.
 */
export class Container {
    private static instance: Container;
    private services: Map<string, any>;
    private factories: Map<string, () => any>;

    private constructor() {
        this.services = new Map();
        this.factories = new Map();
        Log.debug("Container initialized");
    }

    /**
     * 컨테이너 인스턴스를 가져옵니다.
     * @returns Container 인스턴스
     */
    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    /**
     * 서비스를 등록합니다.
     * @param token 서비스 토큰
     * @param instance 서비스 인스턴스
     */
    public register<T>(token: string, instance: T): void {
        try {
            if (this.services.has(token)) {
                Log.warn(`Service already registered: ${token}`);
                return;
            }
            this.services.set(token, instance);
            Log.debug(`Service registered: ${token}`);
        } catch (error) {
            Log.error(`Failed to register service: ${token}`, error);
            throw error;
        }
    }

    /**
     * 서비스 팩토리를 등록합니다.
     * @param token 서비스 토큰
     * @param factory 서비스 생성 팩토리 함수
     */
    public registerFactory<T>(token: string, factory: () => T): void {
        try {
            if (this.factories.has(token)) {
                Log.warn(`Factory already registered: ${token}`);
                return;
            }
            this.factories.set(token, factory);
            Log.debug(`Factory registered: ${token}`);
        } catch (error) {
            Log.error(`Failed to register factory: ${token}`, error);
            throw error;
        }
    }

    /**
     * 서비스를 가져옵니다.
     * @param token 서비스 토큰
     * @returns 서비스 인스턴스
     */
    public resolve<T>(token: string): T {
        try {
            // 먼저 등록된 서비스 인스턴스 확인
            const service = this.services.get(token);
            if (service) {
                return service as T;
            }

            // 팩토리가 등록되어 있다면 새 인스턴스 생성
            const factory = this.factories.get(token);
            if (factory) {
                const instance = factory();
                this.services.set(token, instance);
                return instance as T;
            }

            throw new Error(`No service or factory registered for token: ${token}`);
        } catch (error) {
            Log.error(`Failed to resolve service: ${token}`, error);
            throw error;
        }
    }

    /**
     * 서비스가 등록되어 있는지 확인합니다.
     * @param token 서비스 토큰
     * @returns 등록 여부
     */
    public has(token: string): boolean {
        return this.services.has(token) || this.factories.has(token);
    }

    /**
     * 등록된 서비스를 제거합니다.
     * @param token 서비스 토큰
     */
    public remove(token: string): void {
        try {
            this.services.delete(token);
            this.factories.delete(token);
            Log.debug(`Service removed: ${token}`);
        } catch (error) {
            Log.error(`Failed to remove service: ${token}`, error);
            throw error;
        }
    }

    /**
     * 모든 서비스를 제거합니다.
     */
    public clear(): void {
        try {
            this.services.clear();
            this.factories.clear();
            Log.debug("All services cleared");
        } catch (error) {
            Log.error("Failed to clear services", error);
            throw error;
        }
    }
} 