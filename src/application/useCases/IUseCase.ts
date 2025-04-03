/**
 * 유즈케이스 인터페이스
 * 모든 유즈케이스는 이 인터페이스를 구현해야 합니다.
 */
export interface IUseCase<TInput = void, TOutput = void> {
  /**
   * 유즈케이스를 실행합니다.
   * @param input 유즈케이스 실행에 필요한 입력 데이터
   * @returns 유즈케이스 실행 결과
   */
  execute(input: TInput): Promise<TOutput>;
} 