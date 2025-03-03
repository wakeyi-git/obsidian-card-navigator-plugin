import { Translation, TranslationKey } from './translations';

/**
 * 영어 번역
 */
const en: Translation = {
  locale: 'en',
  name: 'English',
  translations: {
    // 일반
    plugin_name: 'Card Navigator',
    plugin_description: 'Navigate your notes as cards in a flexible layout.',
    
    // 설정
    settings: 'Settings',
    settings_general: 'General',
    settings_card_content: 'Card Content',
    settings_card_style: 'Card Style',
    settings_layout: 'Layout',
    settings_presets: 'Presets',
    settings_keyboard: 'Keyboard',
    settings_advanced: 'Advanced',
    
    // 카드 내용
    card_content_show_filename: 'Show filename',
    card_content_show_first_header: 'Show first header',
    card_content_show_content: 'Show content',
    card_content_content_length: 'Content length',
    card_content_show_tags: 'Show tags',
    card_content_show_date: 'Show date',
    card_content_date_format: 'Date format',
    
    // 카드 스타일
    card_style_font_size: 'Font size',
    card_style_title_font_size: 'Title font size',
    card_style_content_font_size: 'Content font size',
    card_style_tag_font_size: 'Tag font size',
    card_style_padding: 'Padding',
    card_style_border: 'Border',
    card_style_border_radius: 'Border radius',
    card_style_shadow: 'Shadow',
    card_style_background: 'Background',
    
    // 레이아웃
    layout_card_width: 'Card width',
    layout_card_height: 'Card height',
    layout_align_height: 'Align card heights',
    layout_direction: 'Layout direction',
    layout_spacing: 'Card spacing',
    layout_cards_per_view: 'Cards per view',
    
    // 프리셋
    preset_create: 'Create preset',
    preset_edit: 'Edit preset',
    preset_delete: 'Delete preset',
    preset_import: 'Import presets',
    preset_export: 'Export presets',
    preset_apply: 'Apply preset',
    preset_folder_specific: 'Folder-specific presets',
    
    // 검색
    search_placeholder: 'Search notes...',
    search_no_results: 'No results found',
    search_options: 'Search options',
    search_in_title: 'Search in title',
    search_in_content: 'Search in content',
    search_in_tags: 'Search in tags',
    
    // 카드셋
    cardset_mode: 'Card set mode',
    cardset_active_folder: 'Active folder',
    cardset_selected_folder: 'Selected folder',
    cardset_vault: 'Entire vault',
    cardset_search_results: 'Search results',
    
    // 툴바
    toolbar_sort: 'Sort',
    toolbar_filter: 'Filter',
    toolbar_view: 'View',
    toolbar_preset: 'Preset',
    toolbar_refresh: 'Refresh',
    
    // 정렬
    sort_by_filename: 'Sort by filename',
    sort_by_created: 'Sort by creation date',
    sort_by_modified: 'Sort by modification date',
    sort_by_size: 'Sort by size',
    sort_ascending: 'Ascending',
    sort_descending: 'Descending',
    
    // 언어 설정
    language_settings: 'Language',
    language_use_system: 'Use system language',
    language_use_system_desc: 'Follow Obsidian language settings',
    language_select: 'Select language',
    language_select_desc: 'Choose the language for Card Navigator',
    
    // 오류 메시지
    error_generic: 'An error occurred',
    error_file_not_found: 'File not found: {path}',
    error_preset_not_found: 'Preset not found: {name}',
    error_layout_update: 'Failed to update layout: {message}',
    
    // 기타
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    import: 'Import',
    export: 'Export',
    reset: 'Reset',
    apply: 'Apply'
  } as Record<TranslationKey, string>
};

export default en; 