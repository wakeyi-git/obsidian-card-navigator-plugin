import React, { useState } from 'react';

interface DatePickerProps {
  onSelect: (date: string) => void;
  onClose: () => void;
  isRangeMode: boolean;
  dateType: 'start' | 'end';
}

/**
 * 날짜 선택기 컴포넌트
 */
const DatePicker: React.FC<DatePickerProps> = ({ onSelect, onClose, isRangeMode, dateType }) => {
  const [date, setDate] = useState<string>('');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleSelect = () => {
    if (date) {
      onSelect(date);
      onClose();
    }
  };

  return (
    <div className="card-navigator-date-picker">
      <div className="card-navigator-date-picker-header">
        {isRangeMode ? (dateType === 'start' ? '시작일 선택' : '종료일 선택') : '날짜 선택'}
      </div>
      <input
        type="date"
        className="card-navigator-date-input"
        value={date}
        onChange={handleDateChange}
      />
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
          className="card-navigator-date-cancel-button"
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default DatePicker; 