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
}

/**
 * 정렬 드롭다운 컴포넌트
 * 카드 정렬을 위한 드롭다운 UI를 제공합니다.
 */
const SortDropdown: React.FC<ISortDropdownProps> = ({
  service,
  onSortChange,
}) => {
  const [currentSortType, setCurrentSortType] = useState<SortType>('filename');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('asc');

  // 현재 정렬 상태 로드
  useEffect(() => {
    if (service) {
      const sortService = service.getSortService();
      const currentSort = sortService.getCurrentSort();
      
      if (currentSort) {
        setCurrentSortType(currentSort.type);
        setCurrentSortDirection(currentSort.direction);
      }
    }
  }, [service]);
  
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

  return (
    <div className="card-navigator-sort-dropdown">
      <div
        className="clickable-icon card-navigator-icon card-navigator-sort-button"
        onClick={showSortMenu}
        aria-label="정렬"
        title="정렬"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-narrow-wide">
          <path d="m3 8 4-4 4 4"/>
          <path d="M7 4v16"/>
          <path d="M11 12h4"/>
          <path d="M11 16h7"/>
          <path d="M11 20h10"/>
        </svg>
      </div>
    </div>
  );
};

export default SortDropdown; 