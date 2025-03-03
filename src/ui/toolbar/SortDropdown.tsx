import React, { useState, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SortType, SortDirection } from '../../domain/sorting/Sort';

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
  const [isOpen, setIsOpen] = useState(false);
  const [sortType, setSortType] = useState<SortType>('filename');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [availableSortTypes, setAvailableSortTypes] = useState<SortType[]>([]);

  // 정렬 옵션 로드
  useEffect(() => {
    const loadSortOptions = async () => {
      if (service) {
        const sortService = service.getSortService();
        const currentSort = await sortService.getCurrentSort();
        if (currentSort) {
          setSortType(currentSort.type);
          setSortDirection(currentSort.direction);
        }
        
        setAvailableSortTypes(['filename', 'created', 'modified', 'frontmatter']);
      }
    };

    loadSortOptions();
  }, [service]);

  // 정렬 적용
  const applySort = () => {
    onSortChange(sortType, sortDirection);
    setIsOpen(false);
  };

  // 정렬 방향 토글
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // 정렬 타입 이름 변환
  const getSortTypeName = (type: SortType): string => {
    switch (type) {
      case 'filename':
        return '파일명';
      case 'created':
        return '생성일';
      case 'modified':
        return '수정일';
      case 'frontmatter':
        return '프론트매터';
      default:
        return type;
    }
  };

  return (
    <div className="card-navigator-sort-dropdown">
      <button
        className="card-navigator-sort-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="정렬"
        title="정렬"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
        </svg>
        <span>정렬</span>
      </button>

      {isOpen && (
        <div className="card-navigator-sort-panel">
          <div className="card-navigator-sort-header">
            <h3>정렬</h3>
          </div>

          <div className="card-navigator-sort-content">
            <div className="card-navigator-sort-type">
              <label htmlFor="sortType">정렬 기준</label>
              <select
                id="sortType"
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
              >
                {availableSortTypes.map((type) => (
                  <option key={type} value={type}>
                    {getSortTypeName(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="card-navigator-sort-direction">
              <label>정렬 방향</label>
              <div className="card-navigator-sort-direction-toggle">
                <button
                  className={`card-navigator-sort-direction-button ${sortDirection === 'asc' ? 'active' : ''}`}
                  onClick={() => setSortDirection('asc')}
                  aria-label="오름차순"
                  title="오름차순"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M7 14l5-5 5 5z" />
                  </svg>
                  <span>오름차순</span>
                </button>
                <button
                  className={`card-navigator-sort-direction-button ${sortDirection === 'desc' ? 'active' : ''}`}
                  onClick={() => setSortDirection('desc')}
                  aria-label="내림차순"
                  title="내림차순"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                  <span>내림차순</span>
                </button>
              </div>
            </div>

            {sortType === 'frontmatter' && (
              <div className="card-navigator-sort-frontmatter">
                <label htmlFor="frontmatterKey">프론트매터 키</label>
                <input
                  type="text"
                  id="frontmatterKey"
                  placeholder="정렬할 프론트매터 키 입력"
                />
              </div>
            )}
          </div>

          <div className="card-navigator-sort-footer">
            <button
              className="card-navigator-sort-apply"
              onClick={applySort}
            >
              적용
            </button>
            <button
              className="card-navigator-sort-cancel"
              onClick={() => setIsOpen(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 