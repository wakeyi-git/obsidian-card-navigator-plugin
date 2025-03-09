import React, { useState, useEffect } from 'react';
import CardNavigatorPlugin from '../../../main';
import CardPreview from '../components/CardPreview';
import CardSectionSettings from '../components/CardSectionSettings';
import './CardSettings.css';

interface ICardSettingsProps {
  plugin: CardNavigatorPlugin;
}

/**
 * 카드 설정 탭 컴포넌트
 * 카드의 모양과 내용을 설정할 수 있는 UI를 제공합니다.
 */
const CardSettings: React.FC<ICardSettingsProps> = ({ plugin }) => {
  const { settings } = plugin;
  
  // 카드 내용 설정 상태
  const [selectedHeaderContent, setSelectedHeaderContent] = useState<string[]>([]);
  const [selectedBodyContent, setSelectedBodyContent] = useState<string[]>([]);
  const [selectedFooterContent, setSelectedFooterContent] = useState<string[]>([]);
  
  // 프론트매터 키 입력 필드 표시 여부
  const [showHeaderFrontmatterKey, setShowHeaderFrontmatterKey] = useState(false);
  const [showBodyFrontmatterKey, setShowBodyFrontmatterKey] = useState(false);
  const [showFooterFrontmatterKey, setShowFooterFrontmatterKey] = useState(false);
  
  // 본문 길이 제한 상태
  const [limitContentLength, setLimitContentLength] = useState(
    settings.limitContentLength !== undefined ? settings.limitContentLength : true
  );
  
  // 본문 최대 길이 상태
  const [contentMaxLength, setContentMaxLength] = useState(
    settings.contentMaxLength || 200
  );
  
  // 선택된 카드 섹션 상태
  const [selectedSection, setSelectedSection] = useState<'card' | 'content' | 'header' | 'body' | 'footer' | null>(null);
  
  // 카드 섹션 선택 핸들러
  const handleSelectSection = (section: 'card' | 'content' | 'header' | 'body' | 'footer' | null) => {
    setSelectedSection(section);
  };
  
  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    // 카드 내용 설정 초기화
    const headerContent = Array.isArray(settings.cardHeaderContent) 
      ? settings.cardHeaderContent 
      : settings.cardHeaderContent ? [settings.cardHeaderContent] : ['filename'];
    
    const bodyContent = Array.isArray(settings.cardBodyContent) 
      ? settings.cardBodyContent 
      : settings.cardBodyContent ? [settings.cardBodyContent] : ['content'];
    
    const footerContent = Array.isArray(settings.cardFooterContent) 
      ? settings.cardFooterContent 
      : settings.cardFooterContent ? [settings.cardFooterContent] : ['tags'];
    
    setSelectedHeaderContent(headerContent);
    setSelectedBodyContent(bodyContent);
    setSelectedFooterContent(footerContent);
    
    // 프론트매터 키 표시 여부 설정
    setShowHeaderFrontmatterKey(headerContent.includes('frontmatter'));
    setShowBodyFrontmatterKey(bodyContent.includes('frontmatter'));
    setShowFooterFrontmatterKey(footerContent.includes('frontmatter'));
    
    // 본문 길이 제한 설정
    setLimitContentLength(settings.limitContentLength !== undefined ? settings.limitContentLength : true);
    setContentMaxLength(settings.contentMaxLength || 200);
  }, [settings]);
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    // 설정 업데이트
    (plugin.settings as any)[key] = value;
    
    // 상태 업데이트 (토글 버튼의 상태가 즉시 적용되도록)
    if (key === 'limitContentLength') {
      setLimitContentLength(value);
    } else if (key === 'contentMaxLength') {
      setContentMaxLength(value);
    }
    
    // 설정 저장 및 즉시 적용
    await plugin.saveSettings();
    
    // 설정 변경 후 필요한 경우 설정 다시 로드
    if (['renderingCardSetSource', 'titleSource', 'includeFrontmatterInContent', 'includeFirstHeaderInContent'].includes(key)) {
      await plugin.loadSettings();
      
      // 설정이 변경된 후 상태 업데이트
      const { settings } = plugin;
      
      // 카드 내용 설정 초기화
      const headerContent = Array.isArray(settings.cardHeaderContent) 
        ? settings.cardHeaderContent 
        : settings.cardHeaderContent ? [settings.cardHeaderContent] : ['filename'];
      
      const bodyContent = Array.isArray(settings.cardBodyContent) 
        ? settings.cardBodyContent 
        : settings.cardBodyContent ? [settings.cardBodyContent] : ['content'];
      
      const footerContent = Array.isArray(settings.cardFooterContent) 
        ? settings.cardFooterContent 
        : settings.cardFooterContent ? [settings.cardFooterContent] : ['tags'];
      
      setSelectedHeaderContent(headerContent);
      setSelectedBodyContent(bodyContent);
      setSelectedFooterContent(footerContent);
      
      // 프론트매터 키 표시 여부 설정
      setShowHeaderFrontmatterKey(headerContent.includes('frontmatter'));
      setShowBodyFrontmatterKey(bodyContent.includes('frontmatter'));
      setShowFooterFrontmatterKey(footerContent.includes('frontmatter'));
      
      // 본문 길이 제한 설정
      setLimitContentLength(settings.limitContentLength !== undefined ? settings.limitContentLength : true);
      setContentMaxLength(settings.contentMaxLength || 200);
    }
  };
  
  // 카드 내용 변경 핸들러
  const handleContentChange = async (
    type: 'header' | 'body' | 'footer',
    value: string,
    checked: boolean
  ) => {
    let updatedContent: string[] = [];
    
    // 선택된 내용 업데이트
    if (type === 'header') {
      updatedContent = checked
        ? [...selectedHeaderContent, value]
        : selectedHeaderContent.filter(item => item !== value);
      setSelectedHeaderContent(updatedContent);
      setShowHeaderFrontmatterKey(updatedContent.includes('frontmatter'));
    } else if (type === 'body') {
      updatedContent = checked
        ? [...selectedBodyContent, value]
        : selectedBodyContent.filter(item => item !== value);
      setSelectedBodyContent(updatedContent);
      setShowBodyFrontmatterKey(updatedContent.includes('frontmatter'));
    } else if (type === 'footer') {
      updatedContent = checked
        ? [...selectedFooterContent, value]
        : selectedFooterContent.filter(item => item !== value);
      setSelectedFooterContent(updatedContent);
      setShowFooterFrontmatterKey(updatedContent.includes('frontmatter'));
    }
    
    // 설정 업데이트 및 즉시 저장
    const settingKey = `card${type.charAt(0).toUpperCase() + type.slice(1)}Content`;
    (plugin.settings as any)[settingKey] = updatedContent;
    await plugin.saveSettings();
    
    // 설정 변경 후 필요한 경우 설정 다시 로드하여 즉시 적용
    await plugin.loadSettings();
  };
  
  // 제목 소스 변경 핸들러
  const handleTitleSourceChange = async (value: 'filename' | 'firstheader') => {
    await onChange('titleSource', value);
  };
  
  // 프론트매터 포함 변경 핸들러
  const handleIncludeFrontmatterChange = async (checked: boolean) => {
    await onChange('includeFrontmatterInContent', checked);
  };
  
  // 첫 번째 헤더 포함 변경 핸들러
  const handleIncludeFirstHeaderChange = async (checked: boolean) => {
    await onChange('includeFirstHeaderInContent', checked);
  };
  
  // 본문 길이 제한 변경 핸들러
  const handleLimitContentLengthChange = async (checked: boolean) => {
    setLimitContentLength(checked);
    await onChange('limitContentLength', checked);
  };
  
  // 본문 최대 길이 변경 핸들러
  const handleContentMaxLengthChange = async (value: number) => {
    setContentMaxLength(value);
    await onChange('contentMaxLength', value);
  };
  
  // 카드 내용 옵션
  const contentOptions = [
    { value: 'filename', label: '파일명' },
    { value: 'path', label: '경로' },
    { value: 'content', label: '내용' },
    { value: 'tags', label: '태그' },
    { value: 'created', label: '생성일' },
    { value: 'modified', label: '수정일' },
    { value: 'frontmatter', label: '프론트매터' },
    { value: 'firstheader', label: '첫 번째 헤더' }
  ];
  
  return (
    <div className="card-navigator-tab-content">
      <div className="card-settings-full-layout">
        {/* 왼쪽: 카드 미리보기 영역 */}
        <div className="card-settings-preview-area">
          <div className="card-preview-container">
            <h3 className="card-preview-title">카드 미리보기</h3>
            <CardPreview 
              settings={settings}
              onSelectSection={handleSelectSection}
            />
          </div>
          
          {/* 간단한 도움말 */}
          {!selectedSection && (
            <div className="card-navigator-preview-help">
              <p>카드의 각 부분을 클릭하여 설정하세요</p>
              <ul className="card-preview-help-list">
                <li><strong>카드 배경</strong>: 빈 공간을 클릭하여 배경 및 테두리 설정</li>
                <li><strong>헤더 영역</strong>: 헤더 내용 및 스타일 설정</li>
                <li><strong>본문 영역</strong>: 본문 내용 및 스타일 설정</li>
                <li><strong>푸터 영역</strong>: 푸터 내용 및 스타일 설정</li>
                <li><strong>내용 아이콘</strong>: 전체 내용 표시 설정</li>
              </ul>
            </div>
          )}
        </div>
        
        {/* 오른쪽: 설정 영역 */}
        <div className="card-settings-content-area">
          {/* 선택된 섹션 설정 */}
          {selectedSection ? (
            <CardSectionSettings
              section={selectedSection}
              settings={settings}
              onChange={onChange}
              contentOptions={contentOptions}
              selectedHeaderContent={selectedHeaderContent}
              selectedBodyContent={selectedBodyContent}
              selectedFooterContent={selectedFooterContent}
              onContentChange={handleContentChange}
              onSelectSection={handleSelectSection}
            />
          ) : (
            <div className="card-navigator-section-settings">
              <div className="card-navigator-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                카드 설정 도움말
              </div>
              <div className="card-navigator-section-content">
                <p>카드 설정을 통해 카드의 모양과 내용을 사용자 정의할 수 있습니다:</p>
                <div className="card-settings-help-grid">
                  <div className="card-settings-help-item">
                    <h4>카드 배경 및 테두리</h4>
                    <p>배경색, 테두리 스타일, 카드 크기 등의 설정</p>
                  </div>
                  <div className="card-settings-help-item">
                    <h4>카드 내용</h4>
                    <p>렌더링 방식, 제목 소스, 프론트매터 포함 여부 등의 설정</p>
                  </div>
                  <div className="card-settings-help-item">
                    <h4>헤더 설정</h4>
                    <p>헤더에 표시할 내용과 스타일</p>
                  </div>
                  <div className="card-settings-help-item">
                    <h4>본문 설정</h4>
                    <p>본문에 표시할 내용과 스타일, 길이 제한</p>
                  </div>
                  <div className="card-settings-help-item">
                    <h4>푸터 설정</h4>
                    <p>푸터에 표시할 내용과 스타일</p>
                  </div>
                </div>
                
                <div className="card-navigator-help-examples">
                  <h4>카드 설정 팁</h4>
                  <ul>
                    <li>헤더에는 파일명이나 첫 번째 헤더를 표시하여 카드를 쉽게 식별할 수 있게 합니다.</li>
                    <li>본문에는 내용의 일부를 표시하여 카드의 주요 내용을 미리 볼 수 있게 합니다.</li>
                    <li>푸터에는 태그나 생성일/수정일을 표시하여 카드의 메타데이터를 확인할 수 있게 합니다.</li>
                    <li>카드의 크기와 스타일을 조정하여 화면에 더 많은 카드를 표시하거나 더 자세한 내용을 볼 수 있게 합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardSettings;