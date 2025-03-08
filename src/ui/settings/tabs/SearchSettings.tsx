import React from 'react';
import { ISettingsTabProps } from '../types/SettingsTypes';
import SettingItem from '../components/SettingItem';

/**
 * 검색 설정 탭 컴포넌트
 */
const SearchSettings: React.FC<ISettingsTabProps> = ({ settings, onChange }) => {
  const { 
    tagModeSearchOptions = ['path', 'date'], 
    folderModeSearchOptions = ['tag', 'date'], 
    frontmatterSearchKey = '',
    defaultSearchScope = 'current'
  } = settings;
  
  const handleTagModeOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange('tagModeSearchOptions', [...tagModeSearchOptions, option]);
    } else {
      onChange('tagModeSearchOptions', tagModeSearchOptions.filter(opt => opt !== option));
    }
  };
  
  const handleFolderModeOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange('folderModeSearchOptions', [...folderModeSearchOptions, option]);
    } else {
      onChange('folderModeSearchOptions', folderModeSearchOptions.filter(opt => opt !== option));
    }
  };
  
  const handleSearchScopeChange = (scope: 'all' | 'current') => {
    onChange('defaultSearchScope', scope);
  };
  
  return (
    <div className="card-navigator-setting-group">
      <h3>검색 설정</h3>
      
      <div className="card-navigator-setting-section">
        <h4>기본 검색 범위</h4>
        
        <SettingItem 
          label="검색 모드 전환 시 기본 검색 범위" 
          description="검색 모드로 전환할 때 기본적으로 적용할 검색 범위를 설정합니다."
        >
          <div className="card-navigator-radio-group">
            <label className="card-navigator-radio">
              <input
                type="radio"
                name="defaultSearchScope"
                checked={defaultSearchScope === 'current'}
                onChange={() => handleSearchScopeChange('current')}
              />
              <span>현재 카드셋 (current)</span>
              <div className="card-navigator-radio-description">
                검색 모드로 전환하기 직전에 표시되던 카드셋 내에서만 검색합니다.
              </div>
            </label>
            <label className="card-navigator-radio">
              <input
                type="radio"
                name="defaultSearchScope"
                checked={defaultSearchScope === 'all'}
                onChange={() => handleSearchScopeChange('all')}
              />
              <span>볼트 전체 (all)</span>
              <div className="card-navigator-radio-description">
                볼트 내의 모든 노트를 대상으로 검색합니다.
              </div>
            </label>
          </div>
        </SettingItem>
      </div>
      
      <div className="card-navigator-setting-section">
        <h4>태그 모드 검색 옵션</h4>
        
        <SettingItem label="검색 가능 항목">
          <div className="card-navigator-checkbox-group">
            <label className="card-navigator-checkbox">
              <input
                type="checkbox"
                checked={tagModeSearchOptions.includes('path')}
                onChange={(e) => handleTagModeOptionChange('path', e.target.checked)}
              />
              <span>경로</span>
            </label>
            <label className="card-navigator-checkbox">
              <input
                type="checkbox"
                checked={tagModeSearchOptions.includes('date')}
                onChange={(e) => handleTagModeOptionChange('date', e.target.checked)}
              />
              <span>날짜</span>
            </label>
            <label className="card-navigator-checkbox">
              <input
                type="checkbox"
                checked={tagModeSearchOptions.includes('frontmatter')}
                onChange={(e) => handleTagModeOptionChange('frontmatter', e.target.checked)}
              />
              <span>프론트매터 값</span>
            </label>
          </div>
        </SettingItem>
      </div>
      
      <div className="card-navigator-setting-section">
        <h4>폴더 모드 검색 옵션</h4>
        
        <SettingItem label="검색 가능 항목">
          <div className="card-navigator-checkbox-group">
            <label className="card-navigator-checkbox">
              <input
                type="checkbox"
                checked={folderModeSearchOptions.includes('tag')}
                onChange={(e) => handleFolderModeOptionChange('tag', e.target.checked)}
              />
              <span>태그</span>
            </label>
            <label className="card-navigator-checkbox">
              <input
                type="checkbox"
                checked={folderModeSearchOptions.includes('date')}
                onChange={(e) => handleFolderModeOptionChange('date', e.target.checked)}
              />
              <span>날짜</span>
            </label>
            <label className="card-navigator-checkbox">
              <input
                type="checkbox"
                checked={folderModeSearchOptions.includes('frontmatter')}
                onChange={(e) => handleFolderModeOptionChange('frontmatter', e.target.checked)}
              />
              <span>프론트매터 값</span>
            </label>
          </div>
        </SettingItem>
      </div>
      
      <div className="card-navigator-setting-section">
        <h4>프론트매터 검색 설정</h4>
        
        <SettingItem 
          label="프론트매터 키" 
          description="검색할 프론트매터 키를 입력하세요. 여러 키는 쉼표로 구분합니다."
        >
          <input
            type="text"
            value={frontmatterSearchKey}
            onChange={(e) => onChange('frontmatterSearchKey', e.target.value)}
            placeholder="검색할 프론트매터 키 (예: status, category)"
          />
        </SettingItem>
      </div>
    </div>
  );
};

export default SearchSettings;