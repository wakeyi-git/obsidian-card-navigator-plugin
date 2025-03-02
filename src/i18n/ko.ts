import { Translation, TranslationKey } from './translations';

/**
 * 한국어 번역
 */
const ko: Translation = {
  locale: 'ko',
  name: '한국어',
  translations: {
    // 일반
    plugin_name: '카드 네비게이터',
    plugin_description: '유연한 레이아웃으로 노트를 카드 형태로 탐색합니다.',
    
    // 설정
    settings: '설정',
    settings_general: '일반',
    settings_card_content: '카드 내용',
    settings_card_style: '카드 스타일',
    settings_layout: '레이아웃',
    settings_presets: '프리셋',
    settings_keyboard: '키보드',
    settings_advanced: '고급',
    
    // 카드 내용
    card_content_show_filename: '파일명 표시',
    card_content_show_first_header: '첫 번째 헤더 표시',
    card_content_show_content: '내용 표시',
    card_content_content_length: '내용 길이',
    card_content_show_tags: '태그 표시',
    card_content_show_date: '날짜 표시',
    card_content_date_format: '날짜 형식',
    
    // 카드 스타일
    card_style_font_size: '글꼴 크기',
    card_style_title_font_size: '제목 글꼴 크기',
    card_style_content_font_size: '내용 글꼴 크기',
    card_style_tag_font_size: '태그 글꼴 크기',
    card_style_padding: '패딩',
    card_style_border: '테두리',
    card_style_border_radius: '테두리 둥글기',
    card_style_shadow: '그림자',
    card_style_background: '배경',
    
    // 레이아웃
    layout_card_width: '카드 너비',
    layout_card_height: '카드 높이',
    layout_align_height: '카드 높이 정렬',
    layout_direction: '레이아웃 방향',
    layout_spacing: '카드 간격',
    layout_cards_per_view: '뷰당 카드 수',
    
    // 프리셋
    preset_create: '프리셋 생성',
    preset_edit: '프리셋 편집',
    preset_delete: '프리셋 삭제',
    preset_import: '프리셋 가져오기',
    preset_export: '프리셋 내보내기',
    preset_apply: '프리셋 적용',
    preset_folder_specific: '폴더별 프리셋',
    
    // 검색
    search_placeholder: '노트 검색...',
    search_no_results: '검색 결과가 없습니다',
    search_options: '검색 옵션',
    search_in_title: '제목에서 검색',
    search_in_content: '내용에서 검색',
    search_in_tags: '태그에서 검색',
    
    // 카드셋
    cardset_mode: '카드셋 모드',
    cardset_active_folder: '활성 폴더',
    cardset_selected_folder: '선택된 폴더',
    cardset_vault: '전체 볼트',
    cardset_search_results: '검색 결과',
    
    // 툴바
    toolbar_sort: '정렬',
    toolbar_filter: '필터',
    toolbar_view: '보기',
    toolbar_preset: '프리셋',
    toolbar_refresh: '새로고침',
    
    // 정렬
    sort_by_filename: '파일명으로 정렬',
    sort_by_created: '생성일로 정렬',
    sort_by_modified: '수정일로 정렬',
    sort_by_size: '크기로 정렬',
    sort_ascending: '오름차순',
    sort_descending: '내림차순',
    
    // 언어 설정
    language_settings: '언어',
    language_use_system: '시스템 언어 사용',
    language_use_system_desc: 'Obsidian 언어 설정을 따릅니다',
    language_select: '언어 선택',
    language_select_desc: '카드 네비게이터에서 사용할 언어를 선택합니다',
    
    // 오류 메시지
    error_generic: '오류가 발생했습니다',
    error_file_not_found: '파일을 찾을 수 없습니다: {path}',
    error_preset_not_found: '프리셋을 찾을 수 없습니다: {name}',
    error_layout_update: '레이아웃 업데이트 실패: {message}',
    
    // 기타
    confirm: '확인',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    edit: '편집',
    create: '생성',
    import: '가져오기',
    export: '내보내기',
    reset: '초기화',
    apply: '적용'
  } as Record<TranslationKey, string>
};

export default ko; 