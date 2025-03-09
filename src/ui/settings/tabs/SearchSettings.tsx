import React from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';

/**
 * 검색 설정 탭 컴포넌트
 */
const SearchSettings: React.FC<{ plugin: CardNavigatorPlugin }> = ({ plugin }) => {
  const settings = plugin.settings;
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    // @ts-ignore
    plugin.settings[key] = value;
    await plugin.saveSettings();
  };
  
  return (
    <>
      <SettingItem 
        label="기본 검색 범위" 
        description="검색 시 기본적으로 적용할 검색 범위를 설정합니다."
      >
        <select
          value={settings.defaultSearchScope || 'all'}
          onChange={(e) => onChange('defaultSearchScope', e.target.value)}
        >
          <option value="all">전체</option>
          <option value="current">현재 카드 세트</option>
        </select>
      </SettingItem>
      
      <SettingItem 
        label="검색 대소문자 구분" 
        description="검색 시 대소문자를 구분할지 여부를 설정합니다."
      >
        <input
          type="checkbox"
          checked={settings.searchCaseSensitive || false}
          onChange={(e) => onChange('searchCaseSensitive', e.target.checked)}
        />
      </SettingItem>
      
      <SettingItem 
        label="검색 결과 하이라이트" 
        description="검색 결과에서 검색어를 하이라이트할지 여부를 설정합니다."
      >
        <input
          type="checkbox"
          checked={settings.highlightSearchResults || true}
          onChange={(e) => onChange('highlightSearchResults', e.target.checked)}
        />
      </SettingItem>
      
      <SettingItem 
        label="검색 결과 최대 개수" 
        description="검색 결과로 표시할 최대 카드 개수를 설정합니다."
      >
        <input
          type="number"
          min="10"
          max="1000"
          step="10"
          value={settings.maxSearchResults || 100}
          onChange={(e) => onChange('maxSearchResults', parseInt(e.target.value))}
        />
      </SettingItem>
    </>
  );
};

export default SearchSettings;