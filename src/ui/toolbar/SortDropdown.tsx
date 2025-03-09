import React, { useEffect, useState } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SortType, SortDirection } from '../../domain/sorting/Sort';
import { Menu } from 'obsidian';

/**
 * 정렬 드롭다운 컴포넌트 속성 인터페이스
 */
export interface ISortDropdownProps {
  service: ICardNavigatorService | null;
  onSortChange: (sortType: SortType, sortDirection: SortDirection) => void;
  currentSortType?: SortType;
  currentSortDirection?: SortDirection;
}

/**
 * 정렬 드롭다운 컴포넌트
 * 카드 정렬을 위한 드롭다운 UI를 제공합니다.
 */
const SortDropdown: React.FC<ISortDropdownProps> = ({
  service,
  onSortChange,
  currentSortType: propSortType,
  currentSortDirection: propSortDirection,
}) => {
  const [currentSortType, setCurrentSortType] = useState<SortType>(propSortType || 'filename');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>(propSortDirection || 'asc');

  // props로 전달된 정렬 상태가 변경되면 로컬 상태 업데이트
  useEffect(() => {
    if (propSortType) {
      setCurrentSortType(propSortType);
    }
    if (propSortDirection) {
      setCurrentSortDirection(propSortDirection);
    }
  }, [propSortType, propSortDirection]);

  // 현재 정렬 상태 로드 (props가 없는 경우에만)
  useEffect(() => {
    if (service && !propSortType && !propSortDirection) {
      const sortService = service.getSortService();
      const currentSort = sortService.getCurrentSort();
      
      if (currentSort) {
        setCurrentSortType(currentSort.type);
        setCurrentSortDirection(currentSort.direction);
      }
    }
  }, [service, propSortType, propSortDirection]);
  
  // 정렬 메뉴 표시
  const showSortMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const menu = new Menu();
    
    // 파일 이름 정렬 옵션
    menu.addItem((item) => {
      const isSelected = currentSortType === 'filename' && currentSortDirection === 'asc';
      item
        .setTitle('파일 이름 (알파벳순)')
        .setChecked(isSelected)
        .onClick(() => {
          onSortChange('filename', 'asc');
          setCurrentSortType('filename');
          setCurrentSortDirection('asc');
        });
    });
    
    menu.addItem((item) => {
      const isSelected = currentSortType === 'filename' && currentSortDirection === 'desc';
      item
        .setTitle('파일 이름 (알파벳 역순)')
        .setChecked(isSelected)
        .onClick(() => {
          onSortChange('filename', 'desc');
          setCurrentSortType('filename');
          setCurrentSortDirection('desc');
        });
    });
    
    // 구분선 추가
    menu.addSeparator();
    
    // 수정일 정렬 옵션
    menu.addItem((item) => {
      const isSelected = currentSortType === 'modified' && currentSortDirection === 'desc';
      item
        .setTitle('업데이트 날짜 (최신순)')
        .setChecked(isSelected)
        .onClick(() => {
          onSortChange('modified', 'desc');
          setCurrentSortType('modified');
          setCurrentSortDirection('desc');
        });
    });
    
    menu.addItem((item) => {
      const isSelected = currentSortType === 'modified' && currentSortDirection === 'asc';
      item
        .setTitle('업데이트 날짜 (오래된 순)')
        .setChecked(isSelected)
        .onClick(() => {
          onSortChange('modified', 'asc');
          setCurrentSortType('modified');
          setCurrentSortDirection('asc');
        });
    });
    
    // 구분선 추가
    menu.addSeparator();
    
    // 생성일 정렬 옵션
    menu.addItem((item) => {
      const isSelected = currentSortType === 'created' && currentSortDirection === 'desc';
      item
        .setTitle('생성일 (최신순)')
        .setChecked(isSelected)
        .onClick(() => {
          onSortChange('created', 'desc');
          setCurrentSortType('created');
          setCurrentSortDirection('desc');
        });
    });
    
    menu.addItem((item) => {
      const isSelected = currentSortType === 'created' && currentSortDirection === 'asc';
      item
        .setTitle('생성일 (오래된 순)')
        .setChecked(isSelected)
        .onClick(() => {
          onSortChange('created', 'asc');
          setCurrentSortType('created');
          setCurrentSortDirection('asc');
        });
    });
    
    // 메뉴 표시
    menu.showAtMouseEvent(e.nativeEvent);
  };

  // 현재 정렬 상태에 따른 아이콘 선택
  const getSortIcon = () => {
    if (currentSortType === 'filename') {
      return currentSortDirection === 'asc' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-a-z">
          <path d="m3 8 4-4 4 4"/>
          <path d="M7 4v16"/>
          <path d="M20 8h-5"/>
          <path d="M15 10V8.5a2.5 2.5 0 0 1 5 0V10"/>
          <path d="M15 14h5l-5 6h5"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-z-a">
          <path d="m3 16 4 4 4-4"/>
          <path d="M7 20V4"/>
          <path d="M15 4h5l-5 6h5"/>
          <path d="M15 20v-3.5a2.5 2.5 0 0 1 5 0V20"/>
          <path d="M20 18h-5"/>
        </svg>
      );
    } else if (currentSortType === 'modified' || currentSortType === 'created') {
      return currentSortDirection === 'desc' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock">
          <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5"/>
          <path d="M16 2v4"/>
          <path d="M8 2v4"/>
          <path d="M3 10h18"/>
          <circle cx="18" cy="18" r="4"/>
          <path d="M18 16.5v1.5h1.5"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-narrow-wide">
          <path d="m3 8 4-4 4 4"/>
          <path d="M7 4v16"/>
          <path d="M11 12h4"/>
          <path d="M11 16h7"/>
          <path d="M11 20h10"/>
        </svg>
      );
    }
  };

  // 현재 정렬 상태에 대한 툴팁 텍스트
  const getSortTooltip = () => {
    if (currentSortType === 'filename') {
      return currentSortDirection === 'asc' ? '파일 이름 (알파벳순)' : '파일 이름 (알파벳 역순)';
    } else if (currentSortType === 'modified') {
      return currentSortDirection === 'desc' ? '업데이트 날짜 (최신순)' : '업데이트 날짜 (오래된 순)';
    } else if (currentSortType === 'created') {
      return currentSortDirection === 'desc' ? '생성일 (최신순)' : '생성일 (오래된 순)';
    } else {
      return '정렬';
    }
  };

  return (
    <div className="card-navigator-sort-dropdown">
      <div
        className="clickable-icon card-navigator-icon card-navigator-sort-button"
        onClick={showSortMenu}
        aria-label={getSortTooltip()}
        title={getSortTooltip()}
      >
        {getSortIcon()}
      </div>
    </div>
  );
};

export default SortDropdown; 