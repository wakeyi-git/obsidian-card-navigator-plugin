import { ContainerError } from '@/domain/errors/ContainerError';

/**
 * 서비스 팩토리 타입
 */
type ServiceFactory<T> = () => T;

/**
 * 서비스 등록 정보
 */
interface ServiceRegistration<T> {
  factory: ServiceFactory<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * 의존성 주입 컨테이너
 * - 서비스 등록 및 해제
 * - 싱글톤 서비스 관리
 * - 서비스 인스턴스 생성
 */
export class Container {
  private static instance: Container;
  private services: Map<string, () => any> = new Map();
  private instances: Map<string, any> = new Map();
  private readonly logger: Console;

  private constructor() {
    this.logger = console;
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * 서비스 등록
   * @param key 서비스 이름
   * @param factory 서비스 팩토리 함수
   * @param singleton 싱글톤 여부
   */
  public register<T>(key: string, factory: () => T, singleton: boolean = false): void {
    if (singleton) {
      this.services.set(key, () => {
        if (!this.instances.has(key)) {
          this.instances.set(key, factory());
        }
        return this.instances.get(key);
      });
    } else {
      this.services.set(key, factory);
    }
  }

  /**
   * 서비스 인스턴스 직접 등록
   * @param key 서비스 이름
   * @param instance 서비스 인스턴스
   */
  public registerInstance<T>(key: string, instance: T): void {
    this.services.set(key, () => instance);
    this.instances.set(key, instance);
  }

  /**
   * 서비스 조회
   * @param key 서비스 이름
   * @returns 서비스 인스턴스
   */
  public resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`서비스를 찾을 수 없음: ${key}`);
    }
    return factory() as T;
  }

  /**
   * 서비스 조회 (optional)
   * @param key 서비스 이름
   * @returns 서비스 인스턴스 또는 null
   */
  public resolveOptional<T>(key: string): T | null {
    try {
      return this.resolve<T>(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * 서비스 해제
   */
  public dispose(): void {
    this.clear();
  }

  /**
   * 서비스 등록 여부 확인
   * @param key 서비스 이름
   */
  public has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 등록된 서비스 목록 조회
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 서비스 해제
   */
  public clear(): void {
    this.services.clear();
    this.instances.clear();
  }
} 