import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import ModeToggle from './ModeToggle';
import FilterDropdown from './FilterDropdown';
import SortDropdown from './SortDropdown';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { IFilter } from '../../domain/filter/Filter';
import { SortType, SortDirection } from '../../domain/sorting/Sort';
import LayoutToggle from '../layout/LayoutToggle';
import PresetSelector from '../presets/PresetSelector';
import SettingsModal from '../settings/SettingsModal';

/**
 * 툴바 컴포넌트 속성 인터페이스
 */
export interface IToolbarProps {
  onSearch: (query: string) => void;
  onModeChange: (mode: 'folder' | 'tag') => void;
  currentMode: 'folder' | 'tag';
  onSortChange?: (sortType: SortType, sortDirection: SortDirection) => void;
  onFilterChange?: (filters: IFilter[]) => void;
  onLayoutChange?: (layout: 'grid' | 'masonry') => void;
  onCardSetSelect?: (cardSet: string) => void;
  onPresetApply?: (presetId: string) => void;
  onPresetSave?: () => void;
  onPresetDelete?: (presetId: string) => void;
  currentLayout: 'grid' | 'masonry';
  service: ICardNavigatorService | null;
}

/**
 * 툴바 컴포넌트
 * 검색, 모드 전환, 정렬, 필터링, 레이아웃 변경 등의 컨트롤을 제공합니다.
 */
const Toolbar: React.FC<IToolbarProps> = ({
  onSearch,
  onModeChange,
  currentMode,
  onSortChange = () => {},
  onFilterChange = () => {},
  onLayoutChange = () => {},
  onCardSetSelect = () => {},
  onPresetApply = () => {},
  onPresetSave = () => {},
  onPresetDelete = () => {},
  currentLayout = 'grid',
  service,
}) => {
  const [cardSets, setCardSets] = useState<string[]>([]);
  const [selectedCardSet, setSelectedCardSet] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 카드 세트 로드
  useEffect(() => {
    const loadCardSets = async () => {
      if (service) {
        try {
          const modeService = service.getModeService();
          const sets = await modeService.getCardSets();
          setCardSets(sets);
          
          // 현재 선택된 카드 세트 가져오기
          const currentSet = await modeService.getCurrentCardSet();
          if (currentSet) {
            setSelectedCardSet(currentSet);
          }
        } catch (error) {
          console.error('카드 세트 로드 중 오류 발생:', error);
        }
      }
    };

    loadCardSets();
  }, [service, currentMode]);

  // 카드 세트 선택 처리
  const handleCardSetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cardSet = e.target.value;
    setSelectedCardSet(cardSet);
    onCardSetSelect(cardSet);
  };

  // 설정 버튼 클릭 처리
  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  return (
    <div className="card-navigator-toolbar">
      <div className="card-navigator-toolbar-left">
        <ModeToggle currentMode={currentMode} onModeChange={onModeChange} />
        
        <div className="card-navigator-card-set-selector">
          <select
            value={selectedCardSet}
            onChange={handleCardSetSelect}
            className="card-navigator-card-set-select"
          >
            <option value="" disabled>
              {currentMode === 'folder' ? '폴더 선택' : '태그 선택'}
            </option>
            {cardSets.map((set) => (
              <option key={set} value={set}>
                {set}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-navigator-toolbar-center">
        <SearchBar onSearch={onSearch} />
      </div>

      <div className="card-navigator-toolbar-right">
        <FilterDropdown
          service={service}
          onFilterChange={onFilterChange}
        />
        
        <SortDropdown
          service={service}
          onSortChange={onSortChange}
        />
        
        <LayoutToggle
          currentLayout={currentLayout}
          onLayoutChange={onLayoutChange}
        />
        
        <PresetSelector
          service={service}
          onPresetApply={onPresetApply}
          onPresetSave={onPresetSave}
          onPresetDelete={onPresetDelete}
        />
        
        <button
          className="card-navigator-settings-button"
          onClick={handleSettingsClick}
          aria-label="설정"
          title="설정"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        service={service}
      />
    </div>
  );
};

export default Toolbar; 