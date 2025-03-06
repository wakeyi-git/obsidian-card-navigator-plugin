import React from 'react';
import { ISettingsTabProps } from '../types/SettingsTypes';
import SettingItem from '../components/SettingItem';
import ToggleSwitch from '../components/ToggleSwitch';

/**
 * 일반 설정 탭 컴포넌트
 */
const GeneralSettings: React.FC<ISettingsTabProps> = ({ settings, onChange, service }) => {
  const { defaultMode, defaultCardSet, isCardSetFixed, includeSubfolders, priorityTags, priorityFolders } = settings;
  const [cardSets, setCardSets] = React.useState<string[]>([]);
  
  // 카드 세트 목록 로드
  React.useEffect(() => {
    const loadCardSets = async () => {
      if (service) {
        const modeService = service.getModeService();
        const sets = await modeService.getCardSets();
        setCardSets(sets);
      }
    };
    
    loadCardSets();
  }, [service]);
  
  return (
    <div className="card-navigator-setting-group">
      <h3>기본 설정</h3>
      
      <SettingItem label="모드 선택">
        <div className="card-navigator-mode-toggle">
          <button 
            className={`card-navigator-mode-button ${defaultMode === 'folder' ? 'active' : ''}`}
            onClick={() => onChange('defaultMode', 'folder')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>폴더 모드</span>
          </button>
          <button 
            className={`card-navigator-mode-button ${defaultMode === 'tag' ? 'active' : ''}`}
            onClick={() => onChange('defaultMode', 'tag')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <span>태그 모드</span>
          </button>
        </div>
      </SettingItem>
      
      <SettingItem label="기본 카드 세트">
        <select
          value={defaultCardSet}
          onChange={(e) => onChange('defaultCardSet', e.target.value)}
        >
          {cardSets.map((set) => (
            <option key={set} value={set}>
              {set}
            </option>
          ))}
        </select>
      </SettingItem>
      
      <SettingItem label="카드 세트 고정">
        <ToggleSwitch
          id="isCardSetFixed"
          checked={isCardSetFixed || false}
          onChange={(checked) => onChange('isCardSetFixed', checked)}
        />
      </SettingItem>
      
      <SettingItem label="하위 폴더 포함">
        <ToggleSwitch
          id="includeSubfolders"
          checked={includeSubfolders || false}
          onChange={(checked) => onChange('includeSubfolders', checked)}
        />
      </SettingItem>
      
      <h3>우선 순위 설정</h3>
      
      <SettingItem 
        label="우선 순위 태그" 
        description="쉼표로 구분된 태그 목록입니다. 이 태그들은 카드 정렬 시 우선적으로 표시됩니다."
      >
        <input
          type="text"
          value={(priorityTags || []).join(', ')}
          onChange={(e) => onChange('priorityTags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
          placeholder="태그1, 태그2, 태그3"
        />
      </SettingItem>
      
      <SettingItem 
        label="우선 순위 폴더" 
        description="쉼표로 구분된 폴더 경로 목록입니다. 이 폴더들은 카드 정렬 시 우선적으로 표시됩니다."
      >
        <input
          type="text"
          value={(priorityFolders || []).join(', ')}
          onChange={(e) => onChange('priorityFolders', e.target.value.split(',').map(folder => folder.trim()).filter(folder => folder))}
          placeholder="/폴더1, /폴더2, /폴더3"
        />
      </SettingItem>
    </div>
  );
};

export default GeneralSettings;