import { useState, useRef } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';

interface UseDateSearchProps {
  cardNavigatorService: ICardNavigatorService | null;
  searchText: string;
  setSearchText: (text: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

interface UseDateSearchReturn {
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  isDateRangeCardSetSource: boolean;
  setIsDateRangeCardSetSource: (isRange: boolean) => void;
  datePickerType: 'start' | 'end';
  setDatePickerType: (type: 'start' | 'end') => void;
  datePickerPosition: { top: number; left: number };
  setDatePickerPosition: (position: { top: number; left: number }) => void;
  datePickerRef: React.RefObject<HTMLDivElement>;
  handleDateSelect: (date: string) => void;
  checkForDateSearch: (text: string) => boolean;
}

/**
 * 날짜 검색 관련 로직을 처리하는 훅
 */
export const useDateSearch = (props: UseDateSearchProps): UseDateSearchReturn => {
  const { cardNavigatorService, searchText, setSearchText, inputRef } = props;
  
  // 상태
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isDateRangeCardSetSource, setIsDateRangeCardSetSource] = useState<boolean>(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
  
  // 참조
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  /**
   * 날짜 선택 핸들러
   * @param date 선택된 날짜
   */
  const handleDateSelect = (date: string) => {
    if (!inputRef.current) return;
    
    const _cursorPos = inputRef.current.selectionStart || 0;
    const text = searchText;
    
    // 날짜 검색 타입 확인
    const isCreateDate = text.includes('create:');
    const isModifyDate = text.includes('modify:');
    
    if (!isCreateDate && !isModifyDate) {
      return;
    }
    
    let newText = '';
    
    // 날짜 범위 검색인 경우
    if (isDateRangeCardSetSource) {
      if (datePickerType === 'start') {
        // 시작일 선택 후 종료일 선택으로 전환
        if (isCreateDate) {
          newText = text.replace(/create:(\s*\d{4}-\d{2}-\d{2})?/, `create:${date}`);
        } else {
          newText = text.replace(/modify:(\s*\d{4}-\d{2}-\d{2})?/, `modify:${date}`);
        }
        
        // 종료일 선택 모드로 전환
        setDatePickerType('end');
        
        // 종료일 입력 필드 추가
        if (!newText.includes('~')) {
          newText += ' ~ ';
        }
      } else {
        // 종료일 선택
        if (isCreateDate) {
          newText = text.replace(/(\s*~\s*)(\d{4}-\d{2}-\d{2})?$/, `$1${date}`);
        } else {
          newText = text.replace(/(\s*~\s*)(\d{4}-\d{2}-\d{2})?$/, `$1${date}`);
        }
        
        // 날짜 선택 완료
        setShowDatePicker(false);
      }
    } else {
      // 단일 날짜 검색
      if (isCreateDate) {
        newText = text.replace(/create:(\s*\d{4}-\d{2}-\d{2})?/, `create:${date}`);
      } else {
        newText = text.replace(/modify:(\s*\d{4}-\d{2}-\d{2})?/, `modify:${date}`);
      }
      
      // 날짜 선택 완료
      setShowDatePicker(false);
    }
    
    // 검색어 업데이트
    setSearchText(newText);
    
    // 입력 필드에 포커스
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newText.length, newText.length);
      }
    }, 0);
  };
  
  /**
   * 날짜 검색 여부 확인
   * @param text 검색어
   * @returns 날짜 검색 여부
   */
  const checkForDateSearch = (text: string): boolean => {
    // 날짜 검색 패턴 확인
    const createDatePattern = /create:(\s*\d{4}-\d{2}-\d{2})?/;
    const modifyDatePattern = /modify:(\s*\d{4}-\d{2}-\d{2})?/;
    
    // 날짜 검색 타입 확인
    const isCreateDate = createDatePattern.test(text);
    const isModifyDate = modifyDatePattern.test(text);
    
    // 날짜 검색인 경우 날짜 선택기 표시
    if (isCreateDate || isModifyDate) {
      // 날짜 범위 검색 여부 확인
      setIsDateRangeCardSetSource(text.includes('~'));
      
      // 날짜 선택 타입 설정
      if (isDateRangeCardSetSource) {
        // 시작일이 이미 입력되어 있는지 확인
        const hasStartDate = /create:\s*\d{4}-\d{2}-\d{2}/.test(text) || 
                            /modify:\s*\d{4}-\d{2}-\d{2}/.test(text);
        
        setDatePickerType(hasStartDate ? 'end' : 'start');
      } else {
        setDatePickerType('start');
      }
      
      // 날짜 선택기 위치 설정
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDatePickerPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
      
      return true;
    }
    
    return false;
  };
  
  return {
    showDatePicker,
    setShowDatePicker,
    isDateRangeCardSetSource,
    setIsDateRangeCardSetSource,
    datePickerType,
    setDatePickerType,
    datePickerPosition,
    setDatePickerPosition,
    datePickerRef,
    handleDateSelect,
    checkForDateSearch
  };
}; 