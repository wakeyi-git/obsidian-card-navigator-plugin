import React from 'react';
import { ISettingsTabProps } from '../types/SettingsTypes';
import SettingItem from '../components/SettingItem';

/**
 * 정렬 설정 탭 컴포넌트
 */
const SortSettings: React.FC<ISettingsTabProps> = ({ settings, onChange }) => {
  const { 
    sortBy = 'filename', 
    sortOrder = 'asc', 
    customSortKey = '' 
  } = settings;
  
  return (
    <div className="card-navigator-setting-group">
      <h3>정렬 설정</h3>
      
      <SettingItem label="정렬 기준">
        <select
          value={sortBy}
          onChange={(e) => onChange('sortBy', e.target.value)}
        >
          <option value="filename">파일 이름</option>
          <option value="modified">수정 날짜</option>
          <option value="created">생성 날짜</option>
          <option value="custom">사용자 지정 (프론트매터)</option>
        </select>
      </SettingItem>
      
      {sortBy === 'custom' && (
        <SettingItem label="사용자 지정 정렬 키">
          <input
            type="text"
            value={customSortKey}
            onChange={(e) => onChange('customSortKey', e.target.value)}
            placeholder="프론트매터 키 (예: priority, order)"
          />
        </SettingItem>
      )}
      
      <SettingItem label="정렬 순서">
        <div className="card-navigator-radio-group">
          <label className="card-navigator-radio">
            <input
              type="radio"
              name="sortOrder"
              value="asc"
              checked={sortOrder === 'asc'}
              onChange={() => onChange('sortOrder', 'asc')}
            />
            <span>오름차순 (A→Z, 과거→현재)</span>
          </label>
          <label className="card-navigator-radio">
            <input
              type="radio"
              name="sortOrder"
              value="desc"
              checked={sortOrder === 'desc'}
              onChange={() => onChange('sortOrder', 'desc')}
            />
            <span>내림차순 (Z→A, 현재→과거)</span>
          </label>
        </div>
      </SettingItem>
    </div>
  );
};

export default SortSettings;