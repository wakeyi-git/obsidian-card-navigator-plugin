# Card Navigator

Card Navigator는 노트를 시각화하고 탐색하는 독특한 방법을 제공하는 Obsidian 플러그인입니다. 노트를 가로 또는 세로로 스크롤 가능한 카드 형태로 표시하여 콘텐츠를 더 쉽게 탐색하고 관리할 수 있습니다.

## 기능

### 1. 기본 기능
- 사용자 지정 가능한 정보(파일 이름, 첫 번째 헤더, 내용)로 노트를 카드로 표시
- 가로 또는 세로 스크롤 뷰
- 뷰당 카드 수 사용자 지정 가능
- 균일한 모양을 위한 카드 높이 정렬
- 사용자 지정 가능한 카드 외관(글꼴 크기, 내용 길이 등)
- 다양한 기준(이름, 생성 날짜, 수정 날짜)으로 카드 정렬
- 현재 폴더 내 검색 기능
- 쉬운 노트 연결을 위한 드래그 앤 드롭 지원
- 특정 폴더의 카드 보기를 위한 폴더 선택
- 카드 내용을 HTML로 렌더링하는 옵션

### 2. 프리셋
Card Navigator는 이제 프리셋을 지원하여 다양한 설정을 저장하고 빠르게 전환할 수 있습니다. 이 기능은 노트를 보고 상호작용하는 방식에 유연성을 제공하여 워크플로우를 향상시킵니다.

- 사용자 정의 프리셋 생성: 현재 Card Navigator 설정을 이름이 지정된 프리셋으로 저장하여 나중에 사용할 수 있습니다.
- 전역 프리셋: 모든 폴더에 적용되는 기본 프리셋을 설정할 수 있습니다(폴더별 설정으로 재정의되지 않는 한).
- 폴더별 프리셋: 특정 폴더에 다른 프리셋을 할당하여 폴더 구조에 따라 맞춤형 뷰를 제공합니다.
- 프리셋 자동 적용: 폴더 간 이동 시 적절한 프리셋을 자동으로 적용합니다.
- 프리셋 가져오기/내보내기: 프리셋 파일을 가져오거나 내보내 프리셋을 공유하거나 설정을 백업할 수 있습니다.
- 프리셋 관리: 설정 패널에서 직접 기존 프리셋을 편집, 복제 또는 삭제할 수 있습니다.

### 3. 키보드 내비게이션
Card Navigator는 포괄적인 키보드 내비게이션 지원을 제공하여 마우스를 사용하지 않고도 효율적으로 노트를 탐색하고 상호 작용할 수 있습니다.

- Card Navigator 포커싱:
  - 할당된 단축키를 사용하여 Card Navigator에 포커스(Obsidian의 단축키 설정에서 구성 가능).
  - 포커스되면 현재 카드가 강조 표시됩니다.

- 카드 간 이동:
  - 화살표 키를 사용하여 카드 간 이동:
  - 왼쪽/오른쪽: 카드 간 수평 이동
  - 위/아래: 카드 간 수직 이동
  - PageUp/PageDown: 한 페이지의 카드를 위 또는 아래로 스크롤
  - Home: 첫 번째 카드로 이동
  - End: 마지막 카드로 이동

- 카드와 상호 작용:
  - Enter: Obsidian에서 포커스된 카드 열기
  - 컨텍스트 메뉴 키 또는 사용자 지정 단축키: 포커스된 카드의 컨텍스트 메뉴 열기

- 컨텍스트 메뉴 작업:
  - 컨텍스트 메뉴가 열려 있을 때, 화살표 키를 사용하여 메뉴 항목 탐색
  - Enter: 강조 표시된 메뉴 항목 선택

- Card Navigator 포커스 종료:
  - Tab을 누르거나 Card Navigator 외부를 클릭하여 포커스 모드 종료
  - 키보드 내비게이션은 모든 레이아웃 옵션(자동, 리스트, 그리드, 메이슨리)과 원활하게 작동하며, 현재 레이아웃에 따라 동작을 조정합니다.

### 4. 다양한 레이아웃 옵션: 자동, 리스트, 그리드, 메이슨리
Card Navigator는 이제 사용자의 선호도에 맞는 다양한 레이아웃 옵션을 제공합니다:

- 자동: 사용 가능한 공간에 따라 리스트와 그리드 레이아웃 사이를 자동으로 조정
- 리스트: 카드를 단일 열로 표시, 세로 또는 가로로 표시 가능
- 그리드: 카드를 고정 열 그리드 레이아웃으로 배열
- 메이슨리: 카드의 높이가 다양할 수 있는 동적 그리드 생성

레이아웃을 변경하려면:
- Card Navigator 설정 열기
- "레이아웃 설정" 섹션으로 이동
- "기본 레이아웃" 드롭다운에서 원하는 레이아웃 선택
- 각 레이아웃 유형에 특정한 추가 설정 조정(예: 그리드 및 메이슨리 레이아웃의 열 수)

### 5. 영어와 한국어 다국어 지원
Card Navigator는 이제 다음 언어를 지원합니다:
- 영어
- 한국어

플러그인은 지원되는 경우 자동으로 Obsidian 인터페이스 언어를 사용합니다.

## 설치

1. Obsidian을 열고 설정으로 이동합니다.
2. 커뮤니티 플러그인으로 이동하여 안전 모드를 비활성화합니다.
3. 커뮤니티 플러그인 탐색에서 "card navigator"를 검색하여 설치합니다.
4. 플러그인을 활성화합니다.

## 사용법

### 1. 설치 후, 다음과 같은 방법으로 Card Navigator 뷰를 열 수 있습니다:
- 왼쪽 사이드바의 Card Navigator 아이콘 클릭
- 명령 팔레트를 사용하여 "Open Card Navigator" 검색

### 2. 기본 탐색
- 스크롤 휠이나 트랙패드를 사용하여 카드 간 이동
- 카드를 클릭하여 해당 노트 열기
- 툴바의 검색 바를 사용하여 카드 필터링

### 3. 사용자 지정
- Card Navigator 툴바의 설정 아이콘 클릭
- 뷰당 카드 수, 카드 외관, 표시 옵션 등의 설정 조정
- 빠른 설정 전환을 위한 프리셋 생성 및 관리

### 4. 키보드 단축키
Card Navigator는 다양한 탐색 키보드 단축키를 지원합니다:
- Card Navigator 플러그인 열기
- Card Navigator로 포커스 이동(포커스 이동 후 아래의 키로 탐색)
  - 위/아래 화살표: 카드 간 수직 이동
  - 왼쪽/오른쪽 화살표: 카드 간 수평 이동
  - Enter: 포커스된 카드 열기
- 컨텍스트 메뉴 키 또는 Cmd/Ctrl + E: 포커스된 카드의 컨텍스트 메뉴 열기

Obsidian의 단축키 설정에서 이러한 단축키를 사용자 지정할 수 있습니다. 이 작업에 대한 단축키를 설정하려면:
- 설정 → 단축키로 이동
- "Card Navigator" 검색
- 각 작업에 원하는 키 조합 할당

### 5. 설정
Card Navigator는 다양한 사용자 지정 옵션을 제공합니다:
- 프리셋: 다양한 구성 저장 및 불러오기
- 컨테이너 설정: 소프 폴더, 카드 정렬 방법 선택
- 레이아웃: 자동, 리스트, 그리드, 메이슨리 레이아웃 중 선택
- 카드 내용 설정: 카드에 표시되는 정보 사용자 지정(파일 이름, 첫 번째 헤더, 내용)
- 카드 스타일 설정: 다양한 카드 요소의 글꼴 크기 설정

## 개발

### 요구사항
- Node.js 16 이상
- npm 7 이상

### 설치
```bash
# 저장소 클론
git clone https://github.com/wakeyi/obsidian-card-navigator-plugin.git

# 디렉토리로 이동
cd obsidian-card-navigator-plugin

# 의존성 설치
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

## 라이선스
MIT License

## 설정 구조 설명 (data.json)

카드 내비게이터 플러그인의 설정은 `data.json` 파일에 저장되며, 다음과 같은 구조로 구성됩니다:

### 카드 표시 설정

- `cardTitleDisplayType`: 카드 제목 표시 방식 (`"filename"` 또는 `"first_header"`)
- `cardRenderType`: 카드 렌더링 방식 (`"text"` 또는 `"html"`)
- `renderMarkdown`: 마크다운 렌더링 여부 (불리언)

### 카드셋 설정

- `defaultCardSetType`: 기본 카드셋 타입 (`"folder"`, `"tag"`, 또는 `"link"`)
- `defaultCardSetCriteria`: 기본 카드셋 기준 (경로 또는 태그)
- `includeSubfolders`: 하위 폴더 포함 여부 (불리언)

### 링크 설정

- `linkType`: 링크 타입 (`"backlink"` 또는 `"outgoing"`)
- `linkLevel`: 링크 레벨 (숫자)
- `includeBacklinks`: 백링크 포함 여부 (불리언)
- `includeOutgoingLinks`: 아웃고잉 링크 포함 여부 (불리언)
- `includePatterns`: 포함할 패턴 (문자열 배열)
- `excludePatterns`: 제외할 패턴 (문자열 배열)

### 레이아웃 설정

- `layoutType`: 레이아웃 타입 (`"masonry"` 또는 `"grid"`)
- `layoutDirection`: 레이아웃 방향 (`"horizontal"` 또는 `"vertical"`)
- `cardHeightFixed`: 카드 높이 고정 여부 (불리언) - 그리드와 메이슨리 레이아웃 결정
- `cardMinWidth`: 카드 최소 너비 (픽셀)
- `cardMinHeight`: 카드 최소 높이 (픽셀)
- `cardGap`: 카드 간격 (픽셀)
- `cardPadding`: 카드 패딩 (픽셀)

### 프리셋 설정

- `defaultPreset`: 기본 프리셋 이름
- `autoApplyPreset`: 프리셋 자동 적용 여부 (불리언)
- `presetType`: 프리셋 타입 (`"GLOBAL"`, `"FOLDER"`, `"TAG"` 등)
- `folderPresetMappings`: 폴더-프리셋 매핑 배열
- `tagPresetMappings`: 태그-프리셋 매핑 배열
- `datePresetMappings`: 날짜-프리셋 매핑 배열
- `propertyPresetMappings`: 속성-프리셋 매핑 배열

### 검색 설정

- `searchScope`: 검색 범위 (`"all"` 또는 `"current"`)
- `searchFilename`: 파일명 검색 여부 (불리언)
- `searchContent`: 내용 검색 여부 (불리언)
- `searchTags`: 태그 검색 여부 (불리언)
- `caseSensitive`: 대소문자 구분 여부 (불리언)
- `useRegex`: 정규식 사용 여부 (불리언)

### 정렬 설정

- `sortField`: 정렬 기준 (`"name"`, `"created"`, `"updated"` 등)
- `sortOrder`: 정렬 순서 (`"asc"` 또는 `"desc"`)
- `priorityTags`: 우선 순위 태그 배열
- `priorityFolders`: 우선 순위 폴더 배열

### 스타일 설정

#### 카드 스타일 (`cardStyle`)

카드 종류별 및 구성 요소별 스타일 설정:

- `card`: 일반 카드 스타일
- `activeCard`: 활성 카드 스타일
- `focusedCard`: 포커스된 카드 스타일
- `header`: 헤더 스타일
- `body`: 본문 스타일
- `footer`: 푸터 스타일

각 스타일은 다음 속성을 가집니다:
- `backgroundColor`: 배경색 (CSS 색상)
- `fontSize`: 글자 크기 (CSS 단위)
- `borderColor`: 테두리 색상 (CSS 색상)
- `borderWidth`: 테두리 두께 (CSS 단위)

#### 카드 렌더링 설정 (`cardRenderConfig`)

- `type`: 렌더링 타입 (`"text"` 또는 `"html"`)
- `showHeader`: 헤더 표시 여부 (불리언)
- `showBody`: 본문 표시 여부 (불리언)
- `showFooter`: 푸터 표시 여부 (불리언)
- `renderMarkdown`: 마크다운 렌더링 여부 (불리언)
- `contentLengthLimitEnabled`: 내용 길이 제한 여부 (불리언)
- `contentLengthLimit`: 내용 길이 제한 (숫자)
- `titleDisplayType`: 제목 표시 방식 (`"filename"` 또는 `"first_header"`)

카드 섹션별 표시 항목 설정:
- `headerDisplay`: 헤더 표시 항목
- `bodyDisplay`: 본문 표시 항목
- `footerDisplay`: 푸터 표시 항목

각 섹션은 다음 표시 옵션을 가집니다:
- `showFileName`: 파일명 표시 여부 (불리언)
- `showFirstHeader`: 첫 번째 헤더 표시 여부 (불리언)
- `showContent`: 내용 표시 여부 (불리언)
- `showTags`: 태그 표시 여부 (불리언)
- `showCreatedDate`: 생성일 표시 여부 (불리언)
- `showUpdatedDate`: 수정일 표시 여부 (불리언)
- `showProperties`: 표시할 속성 배열

렌더링 기능 설정:
- `showImages`: 이미지 표시 여부 (불리언)
- `highlightCode`: 코드 하이라이팅 여부 (불리언)
- `supportCallouts`: 콜아웃 지원 여부 (불리언)
- `supportMath`: 수식 지원 여부 (불리언)

## 레이아웃 개념

- **카드 높이 고정 여부**: `cardHeightFixed` 설정에 따라 그리드(true) 또는 메이슨리(false) 레이아웃이 적용됩니다.

1. **메이슨리 레이아웃** (`cardHeightFixed: false`)
   - 세로 방향으로만 적용되며, 카드의 높이는 컨텐츠 양에 따라 자동으로 결정됩니다.
   - 뷰포트 너비와 카드 최소 너비를 기준으로 열 수가 결정됩니다.
   - 모든 열이 뷰포트 안에 들어오도록 카드 너비가 균등하게 분배됩니다.
   - 세로 방향으로 스크롤하여 카드를 탐색합니다.

2. **그리드 레이아웃** (`cardHeightFixed: true`)
   - 뷰포트 비율에 따라 가로 또는 세로 방향이 자동으로 결정됩니다.
   
   a. **가로 레이아웃** (뷰포트 가로 > 세로)
      - 뷰포트 높이와 카드 최소 높이를 기준으로 행 수가 결정됩니다.
      - 모든 행이 뷰포트 안에 들어오도록 카드 높이가 균등하게 분배됩니다.
      - 카드 너비는 최소 너비로 고정됩니다.
      - 가로 방향으로 스크롤하여 카드를 탐색합니다.
   
   b. **세로 레이아웃** (뷰포트 세로 > 가로)
      - 뷰포트 너비와 카드 최소 너비를 기준으로 열 수가 결정됩니다.
      - 모든 열이 뷰포트 안에 들어오도록 카드 너비가 균등하게 분배됩니다.
      - 카드 높이는 최소 높이로 고정됩니다.
      - 세로 방향으로 스크롤하여 카드를 탐색합니다.
