import React, { useState, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { IFilter } from '../../domain/filter/Filter';

/**
 * 필터 드롭다운 컴포넌트 속성 인터페이스
 */
export interface IFilterDropdownProps {
  service: ICardNavigatorService | null;
  onFilterChange: (filters: IFilter[]) => void;
}

/**
 * 필터 드롭다운 컴포넌트
 * 카드 필터링을 위한 드롭다운 UI를 제공합니다.
 */
const FilterDropdown: React.FC<IFilterDropdownProps> = ({
  service,
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    tags: string[];
    folders: string[];
    frontmatterKeys: string[];
    frontmatterValues: Record<string, string[]>;
  }>({
    tags: [],
    folders: [],
    frontmatterKeys: [],
    frontmatterValues: {}
  });
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [activeFilterType, setActiveFilterType] = useState<'tag' | 'folder' | 'frontmatter'>('tag');

  // 필터 옵션 로드
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (service) {
        const filterService = service.getFilterService();
        const options = await filterService.getFilterOptions();
        setFilterOptions(options);
      }
    };

    if (isOpen) {
      loadFilterOptions();
    }
  }, [isOpen, service]);

  // 필터 적용
  const applyFilters = async () => {
    if (!service) return;

    const filterService = service.getFilterService();
    await filterService.clearFilters();

    // 태그 필터 적용
    if (selectedFilters.tags && selectedFilters.tags.length > 0) {
      for (const tag of selectedFilters.tags) {
        await filterService.addTagFilter(tag);
      }
    }

    // 폴더 필터 적용
    if (selectedFilters.folders && selectedFilters.folders.length > 0) {
      for (const folder of selectedFilters.folders) {
        await filterService.addFolderFilter(folder);
      }
    }

    // 프론트매터 필터 적용
    if (selectedFilters.frontmatter) {
      for (const key in selectedFilters.frontmatter) {
        if (Object.prototype.hasOwnProperty.call(selectedFilters.frontmatter, key)) {
          const values = selectedFilters.frontmatter[key];
          for (const value of values) {
            await filterService.addFrontmatterFilter(key, value);
          }
        }
      }
    }

    const filters = await filterService.getFilters();
    onFilterChange(filters);
    setIsOpen(false);
  };

  // 필터 토글
  const toggleFilter = (type: string, value: string) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };
      
      if (!newFilters[type]) {
        newFilters[type] = [];
      }
      
      const index = newFilters[type].indexOf(value);
      if (index === -1) {
        newFilters[type] = [...newFilters[type], value];
      } else {
        newFilters[type] = newFilters[type].filter((v) => v !== value);
      }
      
      return newFilters;
    });
  };

  // 필터 초기화
  const resetFilters = () => {
    setSelectedFilters({});
  };

  return (
    <div className="card-navigator-filter-dropdown">
      <button
        className="card-navigator-filter-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="필터"
        title="필터"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
        </svg>
        <span>필터</span>
      </button>

      {isOpen && (
        <div className="card-navigator-filter-panel">
          <div className="card-navigator-filter-header">
            <h3>필터</h3>
            <button
              className="card-navigator-filter-reset"
              onClick={resetFilters}
              aria-label="필터 초기화"
              title="필터 초기화"
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            </button>
          </div>

          <div className="card-navigator-filter-tabs">
            <button
              className={`card-navigator-filter-tab ${activeFilterType === 'tag' ? 'active' : ''}`}
              onClick={() => setActiveFilterType('tag')}
            >
              태그
            </button>
            <button
              className={`card-navigator-filter-tab ${activeFilterType === 'folder' ? 'active' : ''}`}
              onClick={() => setActiveFilterType('folder')}
            >
              폴더
            </button>
            <button
              className={`card-navigator-filter-tab ${activeFilterType === 'frontmatter' ? 'active' : ''}`}
              onClick={() => setActiveFilterType('frontmatter')}
            >
              프론트매터
            </button>
          </div>

          <div className="card-navigator-filter-content">
            {activeFilterType === 'tag' && (
              <div className="card-navigator-filter-list">
                {filterOptions.tags && filterOptions.tags.length > 0 ? (
                  filterOptions.tags.map((tag) => (
                    <label key={tag} className="card-navigator-filter-item">
                      <input
                        type="checkbox"
                        checked={selectedFilters.tags?.includes(tag) || false}
                        onChange={() => toggleFilter('tags', tag)}
                      />
                      <span>{tag}</span>
                    </label>
                  ))
                ) : (
                  <div className="card-navigator-filter-empty">
                    사용 가능한 태그가 없습니다.
                  </div>
                )}
              </div>
            )}

            {activeFilterType === 'folder' && (
              <div className="card-navigator-filter-list">
                {filterOptions.folders && filterOptions.folders.length > 0 ? (
                  filterOptions.folders.map((folder) => (
                    <label key={folder} className="card-navigator-filter-item">
                      <input
                        type="checkbox"
                        checked={selectedFilters.folders?.includes(folder) || false}
                        onChange={() => toggleFilter('folders', folder)}
                      />
                      <span>{folder}</span>
                    </label>
                  ))
                ) : (
                  <div className="card-navigator-filter-empty">
                    사용 가능한 폴더가 없습니다.
                  </div>
                )}
              </div>
            )}

            {activeFilterType === 'frontmatter' && (
              <div className="card-navigator-filter-frontmatter">
                {filterOptions.frontmatterKeys && filterOptions.frontmatterKeys.length > 0 ? (
                  <div>
                    <select
                      className="card-navigator-frontmatter-select"
                      onChange={(e) => {
                        const key = e.target.value;
                        if (key && filterOptions.frontmatterValues && filterOptions.frontmatterValues[key]) {
                          // 프론트매터 키 선택 시 처리
                        }
                      }}
                    >
                      <option value="">프론트매터 키 선택</option>
                      {filterOptions.frontmatterKeys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                    
                    {/* 선택된 키에 대한 값 목록 표시 */}
                  </div>
                ) : (
                  <div className="card-navigator-filter-empty">
                    사용 가능한 프론트매터가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card-navigator-filter-footer">
            <button
              className="card-navigator-filter-apply"
              onClick={applyFilters}
            >
              적용
            </button>
            <button
              className="card-navigator-filter-cancel"
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

export default FilterDropdown; 