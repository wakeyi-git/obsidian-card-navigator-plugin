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
  private readonly services: Map<string, ServiceRegistration<any>>;
  private readonly logger: Console;

  private constructor() {
    this.services = new Map();
    this.logger = console;
  }

  /**
   * Container 인스턴스 가져오기
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * 서비스 등록
   * @param token 서비스 식별자
   * @param factory 서비스 생성 팩토리
   * @param singleton 싱글톤 여부
   */
  public register<T>(
    token: string,
    factory: ServiceFactory<T>,
    singleton: boolean = true
  ): void {
    try {
      if (this.services.has(token)) {
        throw new ContainerError(
          '서비스 등록 실패',
          token,
          'register',
          { reason: '이미 등록된 서비스' }
        );
      }

      this.services.set(token, { factory, singleton });
      this.logger.debug(`서비스 등록: ${token}`);
    } catch (error) {
      throw new ContainerError(
        '서비스 등록 실패',
        token,
        'register',
        { reason: error instanceof Error ? error.message : '알 수 없는 오류' }
      );
    }
  }

  /**
   * 서비스 해제
   * @param token 서비스 식별자
   */
  public unregister(token: string): void {
    try {
      if (!this.services.has(token)) {
        throw new ContainerError(
          '서비스 해제 실패',
          token,
          'unregister',
          { reason: '등록되지 않은 서비스' }
        );
      }

      this.services.delete(token);
      this.logger.debug(`서비스 해제: ${token}`);
    } catch (error) {
      throw new ContainerError(
        '서비스 해제 실패',
        token,
        'unregister',
        { reason: error instanceof Error ? error.message : '알 수 없는 오류' }
      );
    }
  }

  /**
   * 서비스 인스턴스 가져오기
   * @param token 서비스 식별자
   */
  public resolve<T>(token: string): T {
    try {
      const registration = this.services.get(token);
      if (!registration) {
        this.logger.error(`서비스 해결 실패: ${token} (등록되지 않은 서비스)`);
        throw new ContainerError(
          '서비스 해결 실패',
          token,
          'resolve',
          { reason: '등록되지 않은 서비스' }
        );
      }

      if (registration.singleton) {
        if (!registration.instance) {
          this.logger.debug(`싱글톤 서비스 인스턴스 생성: ${token}`);
          try {
            registration.instance = registration.factory();
            this.logger.debug(`싱글톤 서비스 인스턴스 생성 완료: ${token}`);
          } catch (error) {
            this.logger.error(`싱글톤 서비스 인스턴스 생성 실패: ${token}`, error);
            throw error;
          }
        }
        return registration.instance;
      }

      this.logger.debug(`새로운 서비스 인스턴스 생성: ${token}`);
      try {
        const instance = registration.factory();
        this.logger.debug(`새로운 서비스 인스턴스 생성 완료: ${token}`);
        return instance;
      } catch (error) {
        this.logger.error(`새로운 서비스 인스턴스 생성 실패: ${token}`, error);
        throw error;
      }
    } catch (error) {
      this.logger.error(`서비스 해결 실패: ${token}`, error);
      throw new ContainerError(
        '서비스 해결 실패',
        token,
        'resolve',
        { reason: error instanceof Error ? error.message : '알 수 없는 오류' }
      );
    }
  }

  /**
   * 모든 서비스 해제
   */
  public clear(): void {
    try {
      this.services.clear();
      this.logger.debug('모든 서비스 해제');
    } catch (error) {
      throw new ContainerError(
        '서비스 초기화 실패',
        'Container',
        'clear',
        { reason: error instanceof Error ? error.message : '알 수 없는 오류' }
      );
    }
  }

  /**
   * 서비스 등록 여부 확인
   * @param token 서비스 식별자
   */
  public has(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * 등록된 서비스 목록 조회
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
} 