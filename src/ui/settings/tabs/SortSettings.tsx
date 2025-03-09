import React, { useState, useEffect } from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';
import { SortType, SortDirection } from '../../../domain/sorting/Sort';

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
    
    // 설정 변경 후 서비스에 적용
    const service = plugin.getCardNavigatorService();
    if (service) {
      if (key === 'sortBy' || key === 'sortOrder' || key === 'customSortKey') {
        const sortService = service.getSortService();
        if (key === 'sortBy') {
          // 정렬 타입 변경
          // UI에서는 'custom'을 사용하지만 내부적으로는 'frontmatter'로 변환
          const sortType: SortType = value === 'custom' ? 'frontmatter' : value as SortType;
          const sortDirection = plugin.settings.sortOrder as SortDirection || 'asc';
          const customKey = value === 'custom' ? plugin.settings.customSortKey : undefined;
          sortService.setSortType(sortType, sortDirection, customKey);
        } else if (key === 'sortOrder') {
          // 정렬 방향 변경
          // UI에서는 'custom'을 사용하지만 내부적으로는 'frontmatter'로 변환
          const uiSortType = plugin.settings.sortBy || 'filename';
          const sortType: SortType = uiSortType === 'custom' ? 'frontmatter' : uiSortType as SortType;
          const sortDirection = value as SortDirection;
          const customKey = uiSortType === 'custom' ? plugin.settings.customSortKey : undefined;
          sortService.setSortType(sortType, sortDirection, customKey);
        } else if (key === 'customSortKey') {
          // 커스텀 정렬 키 변경
          const uiSortType = plugin.settings.sortBy || 'filename';
          if (uiSortType === 'custom') {
            const sortDirection = plugin.settings.sortOrder as SortDirection || 'asc';
            // 'custom' 타입은 내부적으로 'frontmatter' 타입으로 처리
            sortService.setSortType('frontmatter', sortDirection, value);
          }
        }
      } else if (key === 'priorityTags') {
        const sortService = service.getSortService();
        sortService.setPriorityTags(value);
      } else if (key === 'priorityFolders') {
        const sortService = service.getSortService();
        sortService.setPriorityFolders(value);
      }
    }
  };
  
  // sortBy 변경 시 커스텀 정렬 키 표시 여부 업데이트
  useEffect(() => {
    setShowCustomSortKey(settings.sortBy === 'custom');
  }, [settings.sortBy]);
  
  return (
    <div className="card-navigator-settings-section">    
      <div className="card-navigator-settings-subsection">
        <h4>기본 정렬 설정</h4>
        
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
      </div>
      
      <div className="card-navigator-settings-subsection">
        <h4>우선 순위 설정</h4>
        <p className="setting-item-description">
          특정 태그나 폴더를 가진 노트를 다른 노트보다 먼저 표시하도록 설정합니다.
          이 설정은 일반 정렬 기준보다 우선 적용됩니다.
        </p>
        
        <SettingItem 
          label="우선 순위 태그" 
          description="쉼표로 구분된 태그 목록입니다. 이 태그들이 포함된 노트가 정렬 시 우선적으로 표시됩니다."
        >
          <input
            type="text"
            value={(settings.priorityTags || []).join(', ')}
            onChange={(e) => onChange('priorityTags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
            placeholder="태그1, 태그2, 태그3"
          />
        </SettingItem>
        
        <SettingItem 
          label="우선 순위 폴더" 
          description="쉼표로 구분된 폴더 경로 목록입니다. 이 폴더에 있는 노트가 정렬 시 우선적으로 표시됩니다."
        >
          <input
            type="text"
            value={(settings.priorityFolders || []).join(', ')}
            onChange={(e) => onChange('priorityFolders', e.target.value.split(',').map(folder => folder.trim()).filter(folder => folder))}
            placeholder="/폴더1, /폴더2, /폴더3"
          />
        </SettingItem>
      </div>
      
      <div className="card-navigator-settings-subsection">
        <h4>카드 세트별 정렬 설정</h4>
        
        <SettingItem 
          label="태그 정렬 기준" 
          description="태그 카드 세트에서 태그를 정렬할 기준을 선택합니다."
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
          description="폴더 카드 세트에서 폴더를 정렬할 기준을 선택합니다."
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
      </div>
      
      <style>
        {`
          .card-navigator-settings-section {
            margin-bottom: 24px;
          }
          
          .card-navigator-settings-subsection {
            margin-top: 16px;
            margin-bottom: 24px;
            padding-left: 16px;
            border-left: 2px solid var(--background-modifier-border);
          }
          
          .card-navigator-settings-subsection h4 {
            margin-top: 0;
            margin-bottom: 8px;
          }
        `}
      </style>
    </div>
  );
};

export default SortSettings;