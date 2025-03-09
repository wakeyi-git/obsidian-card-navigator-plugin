import React, { useState, useEffect } from 'react';

interface DatePickerProps {
  onSelect: (date: string) => void;
  type: 'start' | 'end';
  isRangeMode: boolean;
  onRangeModeToggle: () => void;
}

/**
 * 날짜 선택기 컴포넌트
 */
const DatePicker: React.FC<DatePickerProps> = ({ 
  onSelect, 
  type, 
  isRangeMode, 
  onRangeModeToggle 
}) => {
  const [date, setDate] = useState<string>('');
  const [showQuickOptions, setShowQuickOptions] = useState<boolean>(true);

  // 컴포넌트 마운트 시 오늘 날짜로 초기화
  useEffect(() => {
    const today = new Date();
    const formattedDate = formatDate(today);
    setDate(formattedDate);
  }, []);

  // 날짜 포맷 함수 (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleSelect = () => {
    if (date) {
      onSelect(date);
    }
  };

  // 빠른 날짜 선택 옵션 핸들러
  const handleQuickOption = (option: string) => {
    const today = new Date();
    let selectedDate: Date;

    switch (option) {
      case 'today':
        selectedDate = today;
        break;
      case 'yesterday':
        selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() - 1);
        break;
      case 'lastWeek':
        selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() - 7);
        break;
      case 'lastMonth':
        selectedDate = new Date(today);
        selectedDate.setMonth(today.getMonth() - 1);
        break;
      case 'lastYear':
        selectedDate = new Date(today);
        selectedDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        selectedDate = today;
    }

    const formattedDate = formatDate(selectedDate);
    setDate(formattedDate);
    
    // 빠른 옵션 선택 시 바로 적용
    onSelect(formattedDate);
  };

  return (
    <div className="card-navigator-date-picker">
      <div className="card-navigator-date-picker-header">
        {isRangeMode ? (type === 'start' ? '시작일 선택' : '종료일 선택') : '날짜 선택'}
      </div>
      
      {showQuickOptions && (
        <div className="card-navigator-date-quick-options">
          <div className="card-navigator-date-quick-options-title">빠른 선택</div>
          <div className="card-navigator-date-quick-options-buttons">
            <button 
              type="button" 
              className="card-navigator-date-quick-option-button"
              onClick={() => handleQuickOption('today')}
            >
              오늘
            </button>
            <button 
              type="button" 
              className="card-navigator-date-quick-option-button"
              onClick={() => handleQuickOption('yesterday')}
            >
              어제
            </button>
            <button 
              type="button" 
              className="card-navigator-date-quick-option-button"
              onClick={() => handleQuickOption('lastWeek')}
            >
              지난주
            </button>
            <button 
              type="button" 
              className="card-navigator-date-quick-option-button"
              onClick={() => handleQuickOption('lastMonth')}
            >
              지난달
            </button>
            <button 
              type="button" 
              className="card-navigator-date-quick-option-button"
              onClick={() => handleQuickOption('lastYear')}
            >
              작년
            </button>
          </div>
        </div>
      )}
      
      <div className="card-navigator-date-picker-custom">
        <div className="card-navigator-date-picker-custom-title">
          직접 선택
        </div>
        <input
          type="date"
          className="card-navigator-date-input"
          value={date}
          onChange={handleDateChange}
        />
      </div>
      
      <div className="card-navigator-date-picker-buttons">
        <button
          type="button"
          className="card-navigator-date-select-button"
          onClick={handleSelect}
        >
          선택
        </button>
        <button
          type="button"
          className="card-navigator-date-toggle-range-button"
          onClick={onRangeModeToggle}
        >
          {isRangeMode ? '단일 날짜 모드' : '날짜 범위 모드'}
        </button>
        <button
          type="button"
          className="card-navigator-date-toggle-button"
          onClick={() => setShowQuickOptions(!showQuickOptions)}
        >
          {showQuickOptions ? '빠른 선택 숨기기' : '빠른 선택 보기'}
        </button>
      </div>
    </div>
  );
};

export default DatePicker; 