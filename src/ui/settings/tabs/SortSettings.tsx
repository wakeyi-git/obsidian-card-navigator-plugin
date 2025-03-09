import React, { useState, useEffect } from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';

/**
 * 정렬 설정 탭 컴포넌트
 */
const SortSettings: React.FC<{ plugin: CardNavigatorPlugin }> = ({ plugin }) => {
  const settings = plugin.settings;
  const [showCustomSortKey, setShowCustomSortKey] = useState<boolean>(settings.sortBy === 'custom');
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    // @ts-ignore
    plugin.settings[key] = value;
    await plugin.saveSettings();
  };
  
  // sortBy 변경 시 커스텀 정렬 키 표시 여부 업데이트
  useEffect(() => {
    setShowCustomSortKey(settings.sortBy === 'custom');
  }, [settings.sortBy]);
  
  return (
    <>
      <SettingItem 
        label="정렬 기준" 
        description="카드를 정렬할 기준을 선택합니다."
      >
        <select
          value={settings.sortBy || 'filename'}
          onChange={(e) => onChange('sortBy', e.target.value)}
        >
          <option value="filename">파일 이름</option>
          <option value="modified">수정 날짜</option>
          <option value="created">생성 날짜</option>
          <option value="custom">사용자 지정 (프론트매터)</option>
        </select>
      </SettingItem>
      
      {showCustomSortKey && (
        <SettingItem 
          label="사용자 지정 정렬 키" 
          description="프론트매터에서 사용할 정렬 키를 입력합니다."
        >
          <input
            type="text"
            value={settings.customSortKey || ''}
            onChange={(e) => onChange('customSortKey', e.target.value)}
            placeholder="프론트매터 키 (예: order, priority)"
          />
        </SettingItem>
      )}
      
      <SettingItem 
        label="정렬 순서" 
        description="카드 정렬 순서를 선택합니다."
      >
        <select
          value={settings.sortOrder || 'asc'}
          onChange={(e) => onChange('sortOrder', e.target.value)}
        >
          <option value="asc">오름차순 (A→Z, 과거→현재)</option>
          <option value="desc">내림차순 (Z→A, 현재→과거)</option>
        </select>
      </SettingItem>
      
      <SettingItem 
        label="태그 정렬 기준" 
        description="태그 모드에서 태그를 정렬할 기준을 선택합니다."
      >
        <select
          value={settings.tagSortBy || 'name'}
          onChange={(e) => onChange('tagSortBy', e.target.value)}
        >
          <option value="name">이름</option>
          <option value="count">카드 개수</option>
        </select>
      </SettingItem>
      
      <SettingItem 
        label="폴더 정렬 기준" 
        description="폴더 모드에서 폴더를 정렬할 기준을 선택합니다."
      >
        <select
          value={settings.folderSortBy || 'name'}
          onChange={(e) => onChange('folderSortBy', e.target.value)}
        >
          <option value="name">이름</option>
          <option value="count">카드 개수</option>
          <option value="path">경로</option>
        </select>
      </SettingItem>
    </>
  );
};

export default SortSettings;