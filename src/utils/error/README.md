# 카드 네비게이터 오류 처리 시스템

이 문서는 카드 네비게이터 플러그인의 오류 처리 시스템에 대한 설명과 사용 방법을 제공합니다.

## 개요

카드 네비게이터 오류 처리 시스템은 플러그인 내에서 발생하는 다양한 오류를 일관되게 처리하고, 사용자에게 적절한 피드백을 제공하기 위해 설계되었습니다. 이 시스템은 다음과 같은 구성 요소로 이루어져 있습니다:

- **ErrorHandler**: 오류 처리를 담당하는 정적 클래스
- **CardNavigatorError**: 플러그인 전용 오류 클래스
- **오류 상수**: 오류 코드, 메시지, 심각도 등을 정의하는 상수

## 주요 기능

- 오류 코드 기반 오류 처리
- 오류 심각도에 따른 차별화된 처리
- 오류 그룹화를 통한 관련 오류 관리
- 비동기 함수의 오류 캡처 및 처리
- 사용자에게 적절한 알림 제공
- 상세한 오류 로깅

## 사용 방법

### 기본 오류 처리

```typescript
try {
  // 코드 실행
  throw new Error('일반 오류 발생');
} catch (error) {
  ErrorHandler.handleError('오류 발생', error);
}
```

### 오류 코드를 사용한 오류 처리

```typescript
try {
  // 파일을 찾을 수 없는 상황
  throw new Error('파일을 찾을 수 없음');
} catch (error) {
  ErrorHandler.handleErrorWithCode('FILE_NOT_FOUND', {
    path: '/path/to/file.md'
  });
}
```

### CardNavigatorError 사용

```typescript
try {
  // CardNavigatorError 생성 및 발생
  throw new CardNavigatorError('프리셋을 찾을 수 없습니다.', 'PRESET_NOT_FOUND', {
    presetId: 'my-preset'
  });
} catch (error) {
  if (error instanceof CardNavigatorError) {
    // 오류 정보 로깅
    Log.error(error.toString());
    
    // 오류 그룹 확인
    if (error.isInGroup(ErrorGroup.PRESET)) {
      Log.info('프리셋 관련 오류 발생');
    }
  }
}
```

### 오류 캡처 메서드 사용

비동기 함수의 오류 캡처:

```typescript
const result = await ErrorHandler.captureError(
  async () => {
    // 비동기 작업
    await someAsyncFunction();
    return 'success';
  },
  'OPERATION_FAILED',
  { message: '작업 중 오류 발생' }
);

if (result === undefined) {
  // 오류가 발생한 경우
}
```

동기 함수의 오류 캡처:

```typescript
const result = ErrorHandler.captureErrorSync(
  () => {
    // 동기 작업
    return someSyncFunction();
  },
  'OPERATION_FAILED',
  { message: '작업 중 오류 발생' }
);

if (result === undefined) {
  // 오류가 발생한 경우
}
```

### 그룹별 오류 처리

```typescript
try {
  // 레이아웃 관련 작업
  performLayoutOperation();
} catch (error) {
  ErrorHandler.handleErrorByGroup(ErrorGroup.LAYOUT, error, {
    message: '레이아웃 작업 중 오류 발생'
  });
}
```

## 오류 코드 및 그룹

오류 코드는 `ErrorCode` 타입으로 정의되며, 다음과 같은 그룹으로 분류됩니다:

- **GENERAL**: 일반 오류 (UNKNOWN_ERROR, INITIALIZATION_ERROR 등)
- **FILE**: 파일 관련 오류 (FILE_NOT_FOUND, INVALID_FILE_PATH 등)
- **SETTINGS**: 설정 관련 오류 (SETTINGS_LOAD_ERROR, INVALID_SETTINGS 등)
- **PRESET**: 프리셋 관련 오류 (PRESET_NOT_FOUND, PRESET_SAVE_ERROR 등)
- **CARDSET**: 카드셋 관련 오류 (CARDSET_LOAD_ERROR, INVALID_CARDSET_MODE 등)
- **LAYOUT**: 레이아웃 관련 오류 (LAYOUT_INITIALIZATION_ERROR 등)
- **SEARCH**: 검색 관련 오류 (SEARCH_ERROR, INVALID_SEARCH_QUERY 등)
- **RENDER**: 렌더링 관련 오류 (RENDER_ERROR, MARKDOWN_RENDER_ERROR 등)
- **API**: API 관련 오류 (API_ERROR, OBSIDIAN_API_ERROR 등)

## 오류 심각도

오류는 다음과 같은 심각도 수준으로 분류됩니다:

- **INFO**: 정보성 메시지 (알림 지속 시간: 3초)
- **WARNING**: 경고 메시지 (알림 지속 시간: 5초)
- **ERROR**: 오류 메시지 (알림 지속 시간: 8초)
- **CRITICAL**: 심각한 오류 메시지 (알림 지속 시간: 10초)

## 예제 코드

더 많은 예제는 `ErrorHandlerExample.ts` 파일을 참조하세요. 