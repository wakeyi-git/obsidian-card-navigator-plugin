import { useState, useEffect, RefObject } from 'react';

interface UseDatePickerProps {
  isVisible: boolean;
  isRangeMode: boolean;
  dateType: 'start' | 'end';
}

interface UseDatePickerReturn {
  date: string;
  setDate: (date: string) => void;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelect: (callback: (date: string) => void) => void;
}

/**
 * 날짜 선택기 관련 로직을 처리하는 훅
 */
export const useDatePicker = (
  props: UseDatePickerProps,
  datePickerRef: RefObject<HTMLDivElement>,
  inputRef: RefObject<HTMLInputElement>,
  setShowDatePicker: (show: boolean) => void
): UseDatePickerReturn => {
  const { isVisible, isRangeMode, dateType } = props;
  const [date, setDate] = useState<string>('');
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      try {
        // 날짜 선택기 외부 클릭 감지
        if (
          isVisible &&
          datePickerRef.current && 
          !datePickerRef.current.contains(target) &&
          inputRef.current && 
          !inputRef.current.contains(target)
        ) {
          setShowDatePicker(false);
        }
      } catch (error) {
        console.error('외부 클릭 처리 중 오류 발생:', error);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, datePickerRef, inputRef, setShowDatePicker]);
  
  /**
   * 날짜 변경 핸들러
   */
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };
  
  /**
   * 날짜 선택 핸들러
   */
  const handleSelect = (callback: (date: string) => void) => {
    if (date) {
      callback(date);
      setShowDatePicker(false);
    }
  };
  
  return {
    date,
    setDate,
    handleDateChange,
    handleSelect
  };
};

export default useDatePicker;
