import React from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';
import ToggleSwitch from '../components/ToggleSwitch';

/**
 * 모드 설정 탭 컴포넌트
 */
const ModeSettings: React.FC<{ plugin: CardNavigatorPlugin }> = ({ plugin }) => {
  const settings = plugin.settings;
  const { 
    defaultMode, 
    defaultCardSet, 
    isCardSetFixed, 
    includeSubfolders, 
    priorityTags, 
    priorityFolders,
    tagCaseSensitive 
  } = settings;
  const [cardSets, setCardSets] = React.useState<string[]>([]);
  const [folderSets, setFolderSets] = React.useState<string[]>([]);
  const [tagSets, setTagSets] = React.useState<string[]>([]);
  const [selectedCardSetType, setSelectedCardSetType] = React.useState<'active' | 'fixed'>(isCardSetFixed ? 'fixed' : 'active');
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    // @ts-ignore
    plugin.settings[key] = value;
    await plugin.saveSettings();
  };
  
  // 카드 세트 목록 로드
  React.useEffect(() => {
    const loadCardSets = async () => {
      const service = plugin.getCardNavigatorService();
      if (service) {
        const modeService = service.getModeService();
        
        // 현재 모드 저장
        const currentMode = modeService.getCurrentModeType();
        
        // 폴더 모드로 변경하여 폴더 목록 가져오기
        await service.changeMode('folder');
        const folders = await modeService.getCardSets();
        setFolderSets(folders);
        
        // 태그 모드로 변경하여 태그 목록 가져오기
        await service.changeMode('tag');
        const tags = await modeService.getCardSets();
        setTagSets(tags);
        
        // 원래 모드로 복원
        await service.changeMode(currentMode);
        
        // 현재 모드에 맞는 카드 세트 설정
        if (currentMode === 'folder') {
          setCardSets(folders);
        } else if (currentMode === 'tag') {
          setCardSets(tags);
        }
      }
    };
    
    loadCardSets();
  }, [plugin]);
  
  // 모드 변경 시 카드 세트 목록 업데이트
  React.useEffect(() => {
    if (defaultMode === 'folder') {
      setCardSets(folderSets);
    } else if (defaultMode === 'tag') {
      setCardSets(tagSets);
    }
  }, [defaultMode, folderSets, tagSets]);
  
  // 카드 세트 타입 변경 처리
  const handleCardSetTypeChange = (type: 'active' | 'fixed') => {
    setSelectedCardSetType(type);
    onChange('isCardSetFixed', type === 'fixed');
  };
  
  return (
    <>
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
      
      <SettingItem label={defaultMode === 'folder' ? "폴더 선택 방식" : "태그 선택 방식"}>
        <div className="card-navigator-mode-toggle">
          <button 
            className={`card-navigator-mode-button ${selectedCardSetType === 'active' ? 'active' : ''}`}
            onClick={() => handleCardSetTypeChange('active')}
          >
            <span>{defaultMode === 'folder' ? "활성 폴더" : "활성 파일 태그"}</span>
          </button>
          <button 
            className={`card-navigator-mode-button ${selectedCardSetType === 'fixed' ? 'active' : ''}`}
            onClick={() => handleCardSetTypeChange('fixed')}
          >
            <span>{defaultMode === 'folder' ? "지정 폴더" : "지정 태그"}</span>
          </button>
        </div>
      </SettingItem>
      
      {selectedCardSetType === 'fixed' && (
        <SettingItem label={defaultMode === 'folder' ? "지정 폴더 선택" : "지정 태그 선택"}>
          <select
            value={defaultCardSet}
            onChange={(e) => onChange('defaultCardSet', e.target.value)}
          >
            <option value="">선택하세요</option>
            {cardSets.map((set) => (
              <option key={set} value={set}>
                {set}
              </option>
            ))}
          </select>
        </SettingItem>
      )}
      
      {defaultMode === 'folder' && (
        <SettingItem label="하위 폴더 포함">
          <ToggleSwitch
            id="includeSubfolders"
            checked={includeSubfolders || false}
            onChange={(checked) => onChange('includeSubfolders', checked)}
          />
        </SettingItem>
      )}
      
      {defaultMode === 'tag' && (
        <SettingItem 
          label="태그 대소문자 구분" 
          description="태그 모드에서 태그 검색 시 대소문자를 구분합니다."
        >
          <ToggleSwitch
            id="tagCaseSensitive"
            checked={tagCaseSensitive || false}
            onChange={(checked) => {
              onChange('tagCaseSensitive', checked);
              const service = plugin.getCardNavigatorService();
              if (service) {
                const modeService = service.getModeService();
                modeService.setTagCaseSensitive(checked);
              }
            }}
          />
        </SettingItem>
      )}
      
      <h4>우선 순위 설정</h4>
      
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
    </>
  );
};

export default ModeSettings; 